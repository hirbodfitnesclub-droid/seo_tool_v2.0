/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  impression?: number;                   // مقدار ایمپرشن
  embedding_text?: string;               // متن تولید شده برای امبدینگ
  created_at?: string;                   // زمان ایجاد
}

// خروجی get_page_links — تنها ساختار پیشنهاد در فاز ۳
export interface MatchResult {
  id: number;
  title: string;
  country?: string;
  city?: string;
  season?: string;
  theme?: string;
  url?: string;
  similarity: number;       // کسینوس ۰..۱
  final_score: number;      // امتیاز هیبریدی نهایی ۰..۱
  rank: number;             // ۱..۳۰
  shared_attrs: string[];   // کلیدهای تگ مشترک
  reason: string;           // دلیل فارسی آماده
}

// فاز جریان خودکار
export type AppPhase = 'idle' | 'embedding' | 'ranking' | 'done' | 'error';

// سطر ایمپرشن برای پردازش آپلود اختیاری
export interface ImpressionRow {
  url: string;
  title: string;
  impression: number;
}

// ساختار نهایی خروجی کاندیداها برای فایل CSV (فاز ۳)
export interface FinalLink {
  page_title: string;        // عنوان صفحه هدف
  similarity: number;        // کسینوس ۰..۱
  final_score: number;       // امتیاز نهایی هیبریدی ۰..۱
  rank: number;              // رتبه ۱..۳۰
  reason: string;            // دلیل فارسی
}
