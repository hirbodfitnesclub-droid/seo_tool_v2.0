/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// تابع نرمال‌سازی متون فارسی (رفع ی/ک عربی و فضاهای اضافی)
export function normalizeFarsiText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/\u064a/g, '\u06cc') // ي -> ی
    .replace(/\u0643/g, '\u06a9') // ك -> ک
    .replace(/\s+/g, ' ')         // فضاهای سفید متوالی -> تک اسپیس
    .trim();
}

export interface PartialPage {
  title?: string;
  title_h1?: string;
  country?: string;
  country_destination?: string;
  city?: string;
  city_destination?: string;
  continent?: string;
  continent_region?: string;
  direction?: string;
  direction_in_region?: string;
  origin?: string;
  origin_city?: string;
  tourType?: string;
  tour_type?: string;
  travelType?: string;
  travel_type?: string;
  season?: string;
  season_held?: string;
  month?: string;
  month_held?: string;
  occasion?: string;
  holiday?: string;
  theme?: string;
  vehicle?: string;
  hotelName?: string;
  hotel_name?: string;
  hotelStars?: string;
  hotel_stars?: string;
  classLabel?: string;
  class_label?: string;
  audiencePersona?: string;
  audience_persona?: string;
}

// ساخت متن نهایی جهت امبدینگ بر اساس مشخصات و تگ‌های موجود در ردیف
//
// استراتژی عمق‌بخشی به امبدینگ (بدون هوش مصنوعی):
//   ۱. تولید یک «جملهٔ طبیعی» که مثل توضیح یک متخصص سئو کل هویت تور را روایت می‌کند.
//   ۲. تکرار کنترل‌شدهٔ سیگنال‌های پرارزش (مقصد، تم، فصل، نوع تور) تا وزن معنایی‌شان
//      در بردار بالاتر برود و شباهت واقعی بین صفحاتِ هم‌موضوع تقویت شود.
//   ۳. افزودن یک بلوک ساختاریافتهٔ برچسب‌ها برای حفظ دقت روی مقادیر دقیق.
export function buildEmbeddingText(page: PartialPage): string {
  // نرمال‌سازی همهٔ فیلدها
  const title = normalizeFarsiText(page.title || page.title_h1);
  const country = normalizeFarsiText(page.country || page.country_destination);
  const city = normalizeFarsiText(page.city || page.city_destination);
  const continent = normalizeFarsiText(page.continent || page.continent_region);
  const direction = normalizeFarsiText(page.direction || page.direction_in_region);
  const origin = normalizeFarsiText(page.origin || page.origin_city);
  const tourType = normalizeFarsiText(page.tourType || page.tour_type);
  const travelType = normalizeFarsiText(page.travelType || page.travel_type);
  const season = normalizeFarsiText(page.season || page.season_held);
  const month = normalizeFarsiText(page.month || page.month_held);
  const occasion = normalizeFarsiText(page.occasion);
  const holiday = normalizeFarsiText(page.holiday);
  const theme = normalizeFarsiText(page.theme);
  const vehicle = normalizeFarsiText(page.vehicle);
  const hotelName = normalizeFarsiText(page.hotelName || page.hotel_name);
  const hotelStars = normalizeFarsiText(page.hotelStars || page.hotel_stars);
  const classLabel = normalizeFarsiText(page.classLabel || page.class_label);
  const audiencePersona = normalizeFarsiText(page.audiencePersona || page.audience_persona);

  const blocks: string[] = [];

  // ۱. روایت طبیعی: یک جملهٔ منسجم که هویت تور را توصیف می‌کند
  const sentence: string[] = [];
  if (title) sentence.push(title);

  const destination = [city, country, continent].filter(Boolean).join(' ');
  if (destination) {
    sentence.push(`این یک تور گردشگری به مقصد ${destination} است`);
  }
  if (origin) sentence.push(`با حرکت از ${origin}`);
  if (tourType) sentence.push(`به صورت ${tourType}`);
  if (vehicle) sentence.push(`و با ${vehicle}`);
  if (season || month) {
    sentence.push(`در ${[season, month].filter(Boolean).join(' ')} برگزار می‌شود`);
  }
  if (holiday || occasion) {
    sentence.push(`مناسب ${[holiday, occasion].filter(Boolean).join(' و ')}`);
  }
  if (theme) sentence.push(`با تمرکز بر ${theme}`);
  if (hotelName) {
    sentence.push(`و اقامت در ${hotelName}${hotelStars ? ` ${hotelStars} ستاره` : ''}`);
  }
  if (audiencePersona) sentence.push(`ویژهٔ ${audiencePersona}`);
  if (classLabel) sentence.push(`در سطح ${classLabel}`);
  if (sentence.length > 0) {
    blocks.push(sentence.join(' ') + '.');
  }

  // ۲. تقویت سیگنال‌های پرارزش با تکرار هدفمند (وزن‌دهی معنایی)
  const emphasis: string[] = [];
  if (city) emphasis.push(`مقصد اصلی: ${city}`);
  if (country) emphasis.push(`کشور: ${country}`);
  if (theme) emphasis.push(`موضوع سفر: ${theme}`);
  if (tourType) emphasis.push(`سبک سفر: ${tourType}`);
  if (season) emphasis.push(`زمان سفر: ${season}`);
  if (emphasis.length > 0) {
    blocks.push(emphasis.join(' | '));
  }

  // ۳. بلوک ساختاریافته برای حفظ دقت روی مقادیر دقیق برچسب‌ها
  const structured: string[] = [];
  const pushField = (label: string, value: string) => {
    if (value) structured.push(`${label}: ${value}`);
  };
  pushField('قاره', continent);
  pushField('کشور', country);
  pushField('جهت', direction);
  pushField('شهر مقصد', city);
  pushField('مبدأ', origin);
  pushField('نوع تور', tourType);
  pushField('نوع سفر', travelType);
  pushField('فصل', season);
  pushField('ماه', month);
  pushField('تعطیلات', holiday);
  pushField('مناسبت', occasion);
  pushField('تم', theme);
  pushField('وسیله', vehicle);
  pushField('هتل', hotelName ? `${hotelName}${hotelStars ? ` (${hotelStars} ستاره)` : ''}` : '');
  pushField('کلاس', classLabel);
  pushField('پرسونا', audiencePersona);
  if (structured.length > 0) {
    blocks.push(structured.join('\n'));
  }

  return blocks.join('\n\n');
}
