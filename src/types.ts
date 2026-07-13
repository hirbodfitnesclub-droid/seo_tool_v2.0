/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// شناسه‌های مجاز برای مدل‌های هوش مصنوعی
export type ModelId = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3-flash-preview';

// ساختار صفحه بر اساس فیلدهای دیتابیس
export interface Page {
  id?: number;
  title: string;                         // عنوان_H1 (کلید یکتا)
  continent?: string;                    // قاره_یا_منطقه
  country?: string;                      // کشور_مقصد
  direction?: string;                    // جهت_در_منطقه
  city?: string;                         // شهر_یا_جزیره_مقصد
  origin?: string;                       // شهر_یا_استان_مبدا
  tourType?: string;                     // نوع_تور
  season?: string;                       // فصل_برگزاری
  month?: string;                        // ماه_تقویمی_برگزاری
  holiday?: string;                      // تعطیلات_خاص_تقویمی
  occasion?: string;                     // رویداد_یا_مناسبت_خاص
  theme?: string;                        // تم_یا_هدف_سفر
  vehicle?: string;                      // نوع_وسیله_نقلیه
  hotelName?: string;                    // نام_دقیق_هتل
  hotelStars?: string;                   // تعداد_ستاره_هتل
  classLabel?: string;                   // برچسب_کلاسی_تور
  audiencePersona?: string;              // پرسونای_مخاطب
  visaStatus?: string;                   // وضعیت_ویزا
  travelType?: string;                   // نوع_سفر
  url?: string;                          // آدرس صفحه
  impression?: number;                   // مقدار ایمپرشن (فقط نمایش متباین)
  embedding_text?: string;               // متن تولید شده برای امبدینگ
  created_at?: string;                   // زمان ایجاد
}

// یک تگ مشترک میان صفحه مبدأ و کاندیدا (پایه تولید دلیل رتبه بدون هوش مصنوعی)
export interface SharedTag {
  key: string;                           // شناسه فیلد (مثلا city, theme)
  label: string;                         // برچسب فارسی برای نمایش (مثلا «شهر مقصد»)
  value: string;                         // مقدار مشترک
  weight: number;                        // وزن این تگ در امتیاز ساختاری
}

// ساختار نتایج جستجوی شباهت برداری ترکیبی
export interface MatchResult {
  id: number;
  title: string;
  continent?: string;
  country?: string;
  direction?: string;
  city?: string;
  origin?: string;
  tourType?: string;
  season?: string;
  month?: string;
  holiday?: string;
  occasion?: string;
  theme?: string;
  vehicle?: string;
  hotelName?: string;
  hotelStars?: string;
  classLabel?: string;
  audiencePersona?: string;
  travelType?: string;
  url?: string;
  impression?: number;
  similarity: number;                    // شباهت برداری معنایی خام (۰ تا ۱)
  structureScore: number;                // امتیاز سیگنال‌های ساختاری تگ‌های مشترک
  relevance: number;                     // امتیاز نهایی ترکیبی (مبنای رتبه‌بندی)
  sharedTags: SharedTag[];               // فهرست تگ‌های مشترک با صفحه مبدأ
  reason: string;                        // دلیل رتبه به زبان طبیعی (برگرفته از امبدینگ + تگ‌ها)
}

// ساختار نتایج بازرتبه‌بندی Edge Function
export interface RerankResult {
  id: number;
  rank: number;
  seo_reason: string;
}

// سطر ایمپرشن برای پردازش آپلود اختیاری
export interface ImpressionRow {
  url: string;
  title: string;
  impression: number;
}

// ساختار نهایی خروجی کاندیداها برای جدول و فایل CSV
export interface FinalLink {
  page_title: string;                    // عنوان صفحه هدف
  anchor_text: string;                   // متن لنگر پیشنهادی (معمولا عنوان یا ترکیب آن)
  seo_reason: string;                    // دلیل سئویی لینک داخلی
  similarity: number;                    // درصد شباهت اولیه
  rank?: number;                         // رتبه نهایی بازرتبه‌بندی شده توسط AI (در صورت اعمال)
}
