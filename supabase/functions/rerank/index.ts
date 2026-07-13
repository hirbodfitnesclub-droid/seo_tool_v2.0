/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidChatModel } from '../_shared/models.ts';

// سرآیندهای CORS برای مجاز کردن درخواست‌های مروگر
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // پاسخ سریع به درخواست‌های OPTIONS برای CORS (Pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sourcePage, candidates, model } = await req.json();

    if (!sourcePage || !candidates || !Array.isArray(candidates) || !model) {
      return new Response(JSON.stringify({ error: 'بدنه درخواست نامعتبر است. مبدأ، کاندیداها و مدل الزامی هستند.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ۱. اعتبارسنجی مدل ارسال شده در برابر رجیستری مشترک مجاز
    if (!isValidChatModel(model)) {
      return new Response(JSON.stringify({ error: `مدل انتخابی "${model}" مجاز یا معتبر نیست.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'کلید API جمینی روی سرور تنظیم نشده است.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ۲. تولید پرامپت فارسی حرفه‌ای و متمرکز بر سئو و لینک‌های داخلی
    const prompt = `
شما یک متخصص ارشد و استراتژیست سئو (SEO Link Building Specialist) هستید.
وظیفه شما بازرتبه‌بندی (Re-rank) دقیق کاندیداهای پیشنهادی برای پیوند داخلی (Internal Link) از لندینگ‌پیج مبدأ به لندینگ‌پیج‌های هدف است تا بهترین ساختار معماری لینک و توزیع اعتبار (PageRank Flow) شکل بگیرد.

مشخصات لندینگ‌پیج مبدأ (Source Page):
${JSON.stringify(sourcePage, null, 2)}

لیست کاندیداهای پیشنهادی برای لینک داخلی (Target Candidates) شامل شناسه (id)، عنوان و تگ‌ها:
${JSON.stringify(candidates, null, 2)}

قوانین بسیار سخت‌گیرانه برای رتبه‌بندی:
۱. تمام کاندیداهای ارائه شده را دقیقاً با همان شناسه‌های (id) واقعی‌شان بازرتبه‌بندی کنید. هیچ کاندیدایی نباید حذف شود و هیچ کاندیدای جدیدی نباید به صورت خودسرانه اضافه شود.
۲. برای تک‌تک کاندیداها، یک "دلیل سئویی" کوتاه، کاملاً تخصصی، جذاب و منطقی به زبان فارسی (حداکثر یک جمله روان در فیلد seo_reason) تولید کنید. مثلاً توضیح دهید که ارتباط فصلی، اشتراک تم سفر (طبیعت، خرید، لوکس)، تشابه یا هم‌پوشانی مقصدها چگونه به خزنده گوگل و کاربر برای درک بهتر کمک می‌کند.
۳. فیلد rank یک عدد صحیح یکتا از ۱ (بهترین و مرتبط‌ترین لینک مکمل) تا انتهای تعداد کاندیداها (کمترین ارتباط) است. رتبه‌ها را بدون فاصله و تکرار تخصیص دهید.
۴. زبان خروجی فیلد seo_reason حتماً باید فارسی روان و بدون اشتباهات املایی باشد.
`;

    // ۳. فراخوانی مدل چت با تنظیمات ساختاریافته (generationConfig + responseSchema)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    
    const requestPayload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'INTEGER', description: 'شناسه کاندیدای هدف' },
              rank: { type: 'INTEGER', description: 'رتبه بازچیده شده جدید (از ۱ به بعد)' },
              seo_reason: { type: 'STRING', description: 'دلیل سئویی کوتاه و تخصصی به فارسی' }
            },
            required: ['id', 'rank', 'seo_reason']
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`خطا در فراخوانی مدل چت جمینی: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('مدل جمینی پاسخی تولید نکرده است.');
    }

    // ۴. پارس کردن خروجی به شکل مستقیم به عنوان پاسخ نهایی با CORS معتبر
    const rerankedList = JSON.parse(rawText);

    return new Response(JSON.stringify(rerankedList), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'خطای داخلی در پردازش تابع بازرتبه‌بندی.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
