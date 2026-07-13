/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// تابع نرمال‌سازی متون فارسی (رفع ی/ک عربی و فضاهای اضافی)
export function normalizeFarsiText(text: string | null | undefined): string {
  if (!text) return '';
  const s = String(text)
    .replace(/\u064a/g, '\u06cc') // ي -> ی
    .replace(/\u0643/g, '\u06a9') // ك -> ک
    .replace(/\s+/g, ' ')         // فضاهای سفید متوالی -> تک اسپیس
    .trim();
  // مقدار متنی 'null' (که در CSV نمونه دیده شد) تهی محسوب می‌شود
  if (s.toLowerCase() === 'null') return '';
  return s;
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
export function buildEmbeddingText(page: PartialPage): string {
  const parts: string[] = [];

  const title    = normalizeFarsiText(page.title || page.title_h1);
  const country  = normalizeFarsiText(page.country || page.country_destination);
  const city     = normalizeFarsiText(page.city || page.city_destination);
  const continent = normalizeFarsiText(page.continent || page.continent_region);
  const direction = normalizeFarsiText(page.direction || page.direction_in_region);
  const origin   = normalizeFarsiText(page.origin || page.origin_city);
  const tourType = normalizeFarsiText(page.tourType || page.tour_type);
  const travelType = normalizeFarsiText(page.travelType || page.travel_type);
  const season   = normalizeFarsiText(page.season || page.season_held);
  const month    = normalizeFarsiText(page.month || page.month_held);
  const occasion = normalizeFarsiText(page.occasion);
  const holiday  = normalizeFarsiText(page.holiday);
  const theme    = normalizeFarsiText(page.theme);
  const vehicle  = normalizeFarsiText(page.vehicle);
  const hotelName = normalizeFarsiText(page.hotelName || page.hotel_name);
  const hotelStars = normalizeFarsiText(page.hotelStars || page.hotel_stars);
  const classLabel = normalizeFarsiText(page.classLabel || page.class_label);
  const audiencePersona = normalizeFarsiText(page.audiencePersona || page.audience_persona);

  // ۰. جملهٔ خلاصهٔ طبیعی فارسی در ابتدا — به مدل بافت کلی را می‌دهد
  const summaryParts: string[] = [];
  if (tourType)  summaryParts.push(tourType);
  if (city)      summaryParts.push(`به ${city}`);
  else if (country) summaryParts.push(`به ${country}`);
  if (season)    summaryParts.push(`در ${season}`);
  else if (month) summaryParts.push(`در ماه ${month}`);
  if (theme)     summaryParts.push(`با تم ${theme}`);
  if (summaryParts.length > 0) {
    parts.push(`این صفحه دربارهٔ ${summaryParts.join(' ')} است.`);
  } else if (title) {
    parts.push(`این صفحه دربارهٔ ${title} است.`);
  }

  // ۱. عنوان لندینگ پیج (H1)
  if (title) {
    parts.push(`عنوان: ${title}`);
  }

  // ۲. مشخصات مقصد گردشگری
  const destinationParts: string[] = [];
  if (country)   destinationParts.push(country);
  if (city)      destinationParts.push(city);
  if (continent) destinationParts.push(continent);
  if (direction) destinationParts.push(`جهت ${direction}`);
  if (destinationParts.length > 0) {
    parts.push(`مقصد: ${destinationParts.join('، ')}`);
  }

  // ۳. مبدأ حرکت
  if (origin) {
    parts.push(`مبدأ: ${origin}`);
  }

  // ۴. نوع تور و نوع سفر
  const typeParts: string[] = [];
  if (tourType)   typeParts.push(`نوع تور: ${tourType}`);
  if (travelType) typeParts.push(`نوع سفر: ${travelType}`);
  if (typeParts.length > 0) {
    parts.push(typeParts.join(' | '));
  }

  // ۵. زمان برگزاری
  const timeParts: string[] = [];
  if (season) timeParts.push(`فصل ${season}`);
  if (month)  timeParts.push(`ماه ${month}`);
  if (timeParts.length > 0) {
    parts.push(`زمان: ${timeParts.join('، ')}`);
  }

  // ۶. مناسبت و تعطیلات خاص
  const occasionParts = [occasion, holiday].filter(Boolean);
  if (occasionParts.length > 0) {
    parts.push(`مناسبت: ${occasionParts.join(' ')}`);
  }

  // ۷. تم یا هدف سفر
  if (theme) {
    parts.push(`تم سفر: ${theme}`);
  }

  // ۸. نوع وسیله نقلیه
  if (vehicle) {
    parts.push(`وسیله: ${vehicle}`);
  }

  // ۹. هتل و ستاره‌ها
  if (hotelName) {
    const starStr = hotelStars ? ` (${hotelStars} ستاره)` : '';
    parts.push(`هتل: ${hotelName}${starStr}`);
  }

  // ۱۰. کلاس تور و پرسونای مخاطب
  const classParts: string[] = [];
  if (classLabel)      classParts.push(`کلاس: ${classLabel}`);
  if (audiencePersona) classParts.push(`پرسونا: ${audiencePersona}`);
  if (classParts.length > 0) {
    parts.push(classParts.join(' | '));
  }

  return parts.join('\n');
}
