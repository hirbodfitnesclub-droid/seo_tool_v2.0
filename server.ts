/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // میدلور خواندن فرمت‌های JSON
  app.use(express.json({ limit: '10mb' }));

  // ۱. مسیر امن API جهت ارسال درخواست‌ها به هوش مصنوعی جمینی
  app.post('/api/gemini/polish', async (req, res) => {
    const { customApiKey, sourceTitle, candidates } = req.body;
    
    // استفاده از کلید درون متغیرهای محیطی سیستم به عنوان فالبک اولیه
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        error: 'کلید API جمینی یافت نشد. لطفا در تنظیمات برنامه کلید معتبری را در وارد کنید.'
      });
    }

    try {
      // مقداردهی اولیه SDK بر اساس راهنمای رسمی
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // تعریف پرامپت متمرکز و بومی‌سازی شده به زبان فارسی
      const prompt = `اصلاح نگارشی انکر تکست‌ها و دلایل سئویی در سیستم لینک‌سازی داخلی.
صفحه مبدا: "${sourceTitle}"

صفحات کاندیدا:
${JSON.stringify(candidates, null, 2)}

وظایف شما:
۱. متن انکر پیشنهادی (anchor_text) را پولیش کنید؛ روان، روان‌ساز و ترغیب‌کننده برای کلیک کاربر باشد (بدون درج کاراکترهای اضافه یا جملات خبری).
۲. دلیل سئویی (seo_reason) را ویرایش و بهینه‌سازی کنید تا با لحنی کاملاً علمی، شیوا، معتبر و کوتاه بازنویسی شود.
۳. فیلد page_title را بدون هیچ تغییری به عنوان شناسه بازگردانید.
۴. ترتیب کاندیداها را عینا حفظ کنید و کاندیدایی را به میل خود حذف نکنید.`;

      // فراخوانی متود با اسکیما ثابت JSON طبق مهارت جمینی
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'شما کارشناس با تجربه سئو و ادبیات فارسی هستید. خروجی باید حتماً آرایه‌ای از اشیا معادل اسکیما ارائه‌شده با فرمت معتبر JSON بدون تگ مارک‌داون باشد.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                page_title: {
                  type: Type.STRING,
                  description: 'عنوان دقیق صفحه کاندیدا ورودی'
                },
                anchor_text: {
                  type: Type.STRING,
                  description: 'انکر تکست تصحیح شده و پولیش‌یافته فارسی'
                },
                seo_reason: {
                  type: Type.STRING,
                  description: 'دلیل سئویی بازنویسی شده‌ی فارسی به صورت شیوا و کوتاه'
                }
              },
              required: ['page_title', 'anchor_text', 'seo_reason']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('پاسخی خالی از مدل دریافت شد.');
      }

      const polishedData = JSON.parse(responseText.trim());
      res.json({ success: true, results: polishedData });

    } catch (err: any) {
      console.error('خطا در پردازش درگاه جمینی:', err);
      res.status(500).json({
        error: err?.message || 'خطا در ارتباط با سرور توسعه برای پردازش هوش مصنوعی.'
      });
    }
  });

  // ۲. مدیریت وب‌پک و اجرای Vite در زمان توسعه برنامه‌نویس
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // خدمت‌رسانی به فایل‌های کامپایل شده نهایی در زمان اجرا
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LinkMesh Server] سامانه روی پورت ${PORT} اجرا شد.`);
  });
}

startServer();
