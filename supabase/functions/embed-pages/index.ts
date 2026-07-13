/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildEmbeddingText } from '../_shared/embedding-text.ts';

// سرآیندهای CORS برای فراهم کردن ارتباط امن میان مبدأیی
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// تابع نرمال‌سازی بردار با استفاده از الگوریتم L2 (برای تضمین صحت فواصل کسینوسی)
function l2Normalize(vector: number[]): number[] {
  const sumOfSquares = vector.reduce((sum, val) => sum + val * val, 0);
  const magnitude = Math.sqrt(sumOfSquares);
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

// ارسال درخواست دسته‌ای (Batch) به جمینی برای دریافت امبدینگ‌ها
async function fetchEmbeddingsBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${apiKey}`;
  const requests = texts.map(text => ({
    model: 'models/gemini-embedding-2',
    content: {
      parts: [{ text }]
    },
    outputDimensionality: 768
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Batch Error: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  if (!data.embeddings || !Array.isArray(data.embeddings)) {
    throw new Error('ساختار پاسخ دریافتی از ای‌پی‌آی امبدینگ جمینی معتبر نیست.');
  }

  return data.embeddings.map((emb: any) => emb.values);
}

// دریافت بردارها با قابلیت بازگشت به درخواست انفرادی (Resilient Flow) در صورت خطای دسته
async function getEmbeddingsResilient(texts: string[], apiKey: string): Promise<{ embeddings: (number[] | null)[]; errors: string[] }> {
  try {
    // تلاش اول: بهینه‌ترین حالت با ارسال یکباره کوئری دسته‌ای
    const batchResult = await fetchEmbeddingsBatch(texts, apiKey);
    return {
      embeddings: batchResult,
      errors: []
    };
  } catch (batchError: any) {
    console.warn('تلاش دسته ناموفق بود. مهاجرت به حالت ایمن تک‌به‌تک ترتیبی:', batchError.message);
    
    const embeddings: (number[] | null)[] = [];
    const errors: string[] = [];
    
    // تلاش دوم: ارسال تک‌به‌تک درخواست‌ها به صورت ترتیبی با تأخیر ۲۵۰ میلی‌ثانیه‌ای برای پیشگیری از Rate Limit
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text) {
        embeddings.push(null);
        continue;
      }

      // اعمال تأخیر ۲۵۰ میلی‌ثانیه‌ای بین درخواست‌ها بجز اولین درخواست
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/gemini-embedding-2',
            content: { parts: [{ text }] },
            outputDimensionality: 768
          })
        });
        if (!resp.ok) {
          throw new Error(`خطای وضعیت ${resp.status}`);
        }
        const data = await resp.json();
        if (data?.embedding?.values) {
          embeddings.push(data.embedding.values as number[]);
        } else {
          throw new Error('ساختار پاسخ معتبر نیست');
        }
      } catch (err: any) {
        errors.push(`خطا در امبدینگ ردیف ${i}: ${err.message}`);
        embeddings.push(null);
      }
    }

    return {
      embeddings,
      errors
    };
  }
}

Deno.serve(async (req) => {
  // پاسخ سریع به درخواست‌های OPTIONS برای CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pages } = await req.json();
    if (!pages || !Array.isArray(pages)) {
      return new Response(JSON.stringify({ error: 'آرایه‌ای از صفحات در بدنه درخواست یافت نشد.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!geminiApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'متغیرهای محیطی حیاتی روی سرور ست نشده‌اند.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ۱. تولید متون امبدینگ برای هر صفحه
    const embeddingTexts = pages.map(p => buildEmbeddingText(p));

    // ۲. فراخوانی جمینی با ساختار مقاوم در برابر خطا
    const { embeddings, errors } = await getEmbeddingsResilient(embeddingTexts, geminiApiKey);

    // ۳. تبدیل داده‌ها به قالب پایگاه داده به همراه اعمال نرمال‌سازی L2 بردارها
    const dbRows = [];
    let insertedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const rawVector = embeddings[i];
      
      if (rawVector) {
        const normalizedVector = l2Normalize(rawVector);
        dbRows.push({
          title: page.title,
          continent: page.continent || null,
          country: page.country || null,
          direction: page.direction || null,
          city: page.city || null,
          origin: page.origin || null,
          tour_type: page.tourType || page.tour_type || null,
          season: page.season || null,
          month: page.month || null,
          holiday: page.holiday || null,
          occasion: page.occasion || null,
          theme: page.theme || null,
          vehicle: page.vehicle || null,
          hotel_name: page.hotelName || page.hotel_name || null,
          hotel_stars: page.hotelStars || page.hotel_stars || null,
          class_label: page.classLabel || page.class_label || null,
          audience_persona: page.audiencePersona || page.audience_persona || null,
          visa_status: page.visaStatus || page.visa_status || null,
          travel_type: page.travelType || page.travel_type || null,
          url: page.url || null,
          impression: page.impression !== undefined ? Number(page.impression) : null,
          embedding_text: embeddingTexts[i],
          embedding: normalizedVector
        });
        insertedCount++;
      } else {
        failedCount++;
      }
    }

    // ۴. ثبت نهایی در دیتابیس Supabase با دسترسی service_role (دور زدن RLS و انجام upsert)
    if (dbRows.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { error: upsertError } = await supabase
        .from('pages')
        .upsert(dbRows, { onConflict: 'title' });

      if (upsertError) {
        throw new Error(`خطا در اجرای فرآیند Upsert دیتابیس: ${upsertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        inserted: insertedCount,
        failed: failedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'خطای ناخواسته در سرور امبدینگ لندینگ‌پیج‌ها.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
