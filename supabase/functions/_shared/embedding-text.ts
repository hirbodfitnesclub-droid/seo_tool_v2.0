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
export function buildEmbeddingText(page: PartialPage): string {
  const parts: string[] = [];

  // ۱. عنوان لندینگ پیج (H1)
  const title = normalizeFarsiText(page.title || page.title_h1);
  if (title) {
    parts.push(`عنوان: ${title}`);
  }

  // ۲. مشخصات مقصد گردشگری
  const country = normalizeFarsiText(page.country || page.country_destination);
  const city = normalizeFarsiText(page.city || page.city_destination);
  const continent = normalizeFarsiText(page.continent || page.continent_region);
  const direction = normalizeFarsiText(page.direction || page.direction_in_region);

  const destinationParts: string[] = [];
  if (country) destinationParts.push(country);
  if (city) destinationParts.push(city);
  if (continent) destinationParts.push(continent);
  if (direction) destinationParts.push(`جهت ${direction}`);

  if (destinationParts.length > 0) {
    parts.push(`مقصد: ${destinationParts.join('، ')}`);
  }

  // ۳. مبدأ حرکت
  const origin = normalizeFarsiText(page.origin || page.origin_city);
  if (origin) {
    parts.push(`مبدأ: ${origin}`);
  }

  // ۴. نوع تور و نوع سفر
  const tourType = normalizeFarsiText(page.tourType || page.tour_type);
  const travelType = normalizeFarsiText(page.travelType || page.travel_type);
  const typeParts: string[] = [];
  if (tourType) typeParts.push(`نوع تور: ${tourType}`);
  if (travelType) typeParts.push(`نوع سفر: ${travelType}`);
  if (typeParts.length > 0) {
    parts.push(typeParts.join(' | '));
  }

  // ۵. زمان برگزاری
  const season = normalizeFarsiText(page.season || page.season_held);
  const month = normalizeFarsiText(page.month || page.month_held);
  const timeParts: string[] = [];
  if (season) timeParts.push(`فصل ${season}`);
  if (month) timeParts.push(`ماه ${month}`);
  if (timeParts.length > 0) {
    parts.push(`زمان: ${timeParts.join('، ')}`);
  }

  // ۶. مناسبت و تعطیلات خاص
  const occasion = normalizeFarsiText(page.occasion);
  const holiday = normalizeFarsiText(page.holiday);
  const occasionParts = [occasion, holiday].filter(Boolean);
  if (occasionParts.length > 0) {
    parts.push(`مناسبت: ${occasionParts.join(' ')}`);
  }

  // ۷. تم یا هدف سفر
  const theme = normalizeFarsiText(page.theme);
  if (theme) {
    parts.push(`تم سفر: ${theme}`);
  }

  // ۸. نوع وسیله نقلیه
  const vehicle = normalizeFarsiText(page.vehicle);
  if (vehicle) {
    parts.push(`وسیله: ${vehicle}`);
  }

  // ۹. هتل و ستاره‌ها
  const hotelName = normalizeFarsiText(page.hotelName || page.hotel_name);
  const hotelStars = normalizeFarsiText(page.hotelStars || page.hotel_stars);
  if (hotelName) {
    const starStr = hotelStars ? ` (${hotelStars} ستاره)` : '';
    parts.push(`هتل: ${hotelName}${starStr}`);
  }

  // ۱۰. کلاس تور و پرسونای مخاطب
  const classLabel = normalizeFarsiText(page.classLabel || page.class_label);
  const audiencePersona = normalizeFarsiText(page.audiencePersona || page.audience_persona);
  const classParts: string[] = [];
  if (classLabel) classParts.push(`کلاس: ${classLabel}`);
  if (audiencePersona) classParts.push(`پرسونا: ${audiencePersona}`);
  if (classParts.length > 0) {
    parts.push(classParts.join(' | '));
  }

  return parts.join('\n');
}
