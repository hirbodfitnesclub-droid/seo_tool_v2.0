/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Page {
  id: number;
  title: string;                         // عنوان_H1
  continent: string;                     // قاره_یا_منطقه
  country: string;                       // کشور_مقصد
  direction: string;                     // جهت_در_منطقه
  city: string;                          // شهر_یا_جزیره_مقصد
  origin: string;                        // شهر_یا_استان_مبدا
  tourType: string;                      // نوع_تور
  season: string;                        // فصل_برگزاری
  month: string;                         // ماه_تقویمی_برگزاری
  holiday: string;                       // تعطیلات_خاص_تقویمی
  occasion: string;                      // رویداد_یا_مناسبت_خاص
  theme: string;                         // تم_یا_هدف_سفر
  vehicle: string;                       // نوع_وسیله_نقلیه
  hotelName: string;                     // نام_دقیق_هتل
  hotelStars: string;                    // تعداد_ستاره_هتل
  classLabel: string;                    // برچسب_کلاسی_تور
  audiencePersona: string;               // پرسونای_مخاطب
  visaStatus: string;                    // وضعیت_ویزا
  travelType: string;                    // نوع_سفر
  
  url?: string;                          // آدرس صفحه (در صورت موجود بودن)
  impression?: number;                   // مقدار ایمپرشن
  features?: PageFeatures;
}

export interface PageFeatures {
  city: string | null;
  country: string | null;
  region: string | null;
  subRegion: string | null;             // جهت_در_منطقه (مثلاً جنوب، جهت شمال و...)
  origin: string | null;                 // شهر مبدأ
  season: string | null;
  month: string | null;
  occasion: string | null;               // تعطیلات یا رویداد خاص
  hotel: string | null;
  star: number | null;                   // تعداد ستاره هتل (عددی)
  durationNights: number | null;         // مدت سفر به شب
  pricePole: 'budget' | 'premium' | null; // قطبیت قیمت
  starPole: 'budget' | 'premium' | null;  // قطبیت ستاره هتل
  durPole: 'budget' | 'premium' | null;   // قطبیت مدت سفر
  themeBuckets: Set<string>;             // سطل‌های تم: beach | culture | nature | shopping | religious
  timeTrack: 'solar' | 'lunar' | null;   // نوع تقویم
  isHubCity: boolean;                    // آیا شهر هاب است؟
  isHubCountry: boolean;                 // آیا کشور هاب است؟
  isContinentHub: boolean;               // آیا قاره هاب است؟
  isAggregate: boolean;                  // آیا صفحه تجمیعی/عام است؟
  isDomestic: boolean;                   // آیا تور داخلی است؟
  intentAxis: string;                    // محور نیت: CONTINENT | COMBO | HUB | PRICE | ORIGIN | MONTH | SEASON | HOTEL | OCCASION | GENERIC
}

export interface Candidate {
  page_id: number;
  title: string;                         // عنوان واقعی H1
  anchor: string;                        // متن انکر تمیزشده
  reason: string;                        // دلیل سئویی
  ring: number;                          // 0 | 1 | 2 | 3 | 3.5 | 4 | 4.5
  relation_tag: string;                  // HUB_CITY | TIME | TWIN | CROSSSELL | ...
  impressionWeight: number;              // وزن ایمپرشن بین 1.0 تا 2.0
}

export interface ImpressionRow {
  url: string;                           // آدرس صفحه
  title: string;                         // عنوان H1
  impression: number;                    // مقدار ایمپرشن
}

export interface FinalLink {
  page_title: string;                    // عنوان صفحه کاندیدا
  anchor_text: string;                   // متن انکر نهایی
  seo_reason: string;                    // دلیل سئویی نهایی
  ring?: number;                         // حلقه
  relation_tag?: string;                 // برچسب رابطه
}
