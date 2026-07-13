/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page, PageFeatures } from '../../types';
import {
  MONTH_TO_SEASON_MAP,
  LUNAR_OCCASIONS,
  POLARITY_PRICE_BUDGET,
  POLARITY_PRICE_PREMIUM,
  THEME_BUCKETS,
  DOMESTIC_COUNTRY,
  CONTINENT_ALIAS
} from './dictionaries';

// تابع نرمال‌سازی متون فارسی (یکدست‌سازی نویسه‌ها و ارقام)
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  let normalized = text;
  
  // یکدست‌سازی حرف ی و ک
  normalized = normalized.replace(/[\u064a\u0649]/g, 'ی');
  normalized = normalized.replace(/[\u0643]/g, 'ک');
  
  // تبدیل نیم‌فاصله به فاصله معمولی
  normalized = normalized.replace(/\u200c/g, ' ');
  
  // تبدیل ارقام فارسی و عربی به انگلیسی برای پردازش آسان‌تر عددی
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(faDigits[i], 'g'), String(i));
    normalized = normalized.replace(new RegExp(arDigits[i], 'g'), String(i));
  }
  
  return normalized.trim().toLowerCase();
}

// استخراج عدد ستاره از متن
function parseStars(starsStr: string | null | undefined): number | null {
  if (!starsStr) return null;
  const normalized = normalizeText(starsStr);
  const match = normalized.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 5) return num;
  }
  if (normalized.includes('پنج') || normalized.includes('5')) return 5;
  if (normalized.includes('چهار') || normalized.includes('4')) return 4;
  if (normalized.includes('سه') || normalized.includes('3')) return 3;
  if (normalized.includes('دو') || normalized.includes('2')) return 2;
  if (normalized.includes('یک') || normalized.includes('1')) return 1;
  return null;
}

// استخراج مدت تور به شب از فیلد نوع_سفر یا عنوان
function parseNights(travelType: string | null | undefined, title: string): number | null {
  const normalizedType = normalizeText(travelType || '');
  const normalizedTitle = normalizeText(title);
  
  // جستجوی الگوهای مثل "۴ شب" یا "۴ روز"
  const patterns = [
    /(\d+)\s*شب/,
    /(\d+)\s*روز/
  ];
  
  for (const pattern of patterns) {
    let match = normalizedType.match(pattern);
    if (!match) {
      match = normalizedTitle.match(pattern);
    }
    if (match) {
      const val = parseInt(match[1], 10);
      if (pattern.source.includes('روز')) {
        // اگر روز ذکر شده، تعداد شب معمولاً یکی کمتر است (حداقل ۱)
        return Math.max(1, val - 1);
      }
      return val;
    }
  }
  
  // واژه‌یابی عددی فارسی
  const numNames = {
    'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10
  };
  
  for (const [name, val] of Object.entries(numNames)) {
    if (normalizedType.includes(`${name} شب`) || normalizedTitle.includes(`${name} شب`)) {
      return val;
    }
    if (normalizedType.includes(`${name} روز`) || normalizedTitle.includes(`${name} روز`)) {
      return Math.max(1, val - 1);
    }
  }
  
  return null;
}

// تشخیص سطل‌های تم متعلق به رکورد (حذف تفریحیِ عام)
function extractThemeBuckets(
  themeField: string | null | undefined,
  travelTypeField: string | null | undefined,
  title: string
): Set<string> {
  const buckets = new Set<string>();
  const normalizedField = normalizeText(themeField || '');
  const normalizedTravel = normalizeText(travelTypeField || '');
  const normalizedTitle = normalizeText(title);
  
  for (const [key, keywords] of Object.entries(THEME_BUCKETS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (
        normalizedField.includes(normalizedKeyword) ||
        normalizedTravel.includes(normalizedKeyword) ||
        normalizedTitle.includes(normalizedKeyword)
      ) {
        buckets.add(key);
      }
    }
  }
  
  return buckets;
}

// تشخیص صفحه عام/تجمیعی بر اساس الگوی دیوار خود/تجمیعی
export function checkIfAggregate(title: string): boolean {
  let clean = title.replace(/\s+/g, ' ');
  // حذف زیررشته‌های "تورهای" و "تور"
  clean = clean.replace(/تورهای/g, '');
  clean = clean.replace(/تور/g, '');
  clean = clean.trim();
  
  const normalizedClean = normalizeText(clean);
  if (normalizedClean === '') return true;
  
  const generalSet = new Set(['خارجی', 'داخلی', 'مسافرتی', 'لحظه آخری', 'ارزان', 'لوکس', 'آفر', 'قیمت مناسب']);
  return generalSet.has(normalizedClean);
}

// تابع کمکی برای پاکسازی فیلدهای با مقدار متنی "null"
function cleanValue(val: string | null | undefined): string | null {
  if (!val) return null;
  const cleaned = val.trim();
  if (cleaned === '' || cleaned.toLowerCase() === 'null') return null;
  return cleaned;
}

// پیاده‌سازی اصلی استخراجگر ویژگی‌های صفحه
export function parsePage(page: Page): PageFeatures {
  const title = page.title;
  const normalizedTitle = normalizeText(title);
  
  const city = cleanValue(page.city);
  const country = cleanValue(page.country);
  const rawRegion = cleanValue(page.continent);
  
  // اعمال نام مستعار قاره
  let region = rawRegion;
  if (rawRegion && CONTINENT_ALIAS[rawRegion]) {
    region = CONTINENT_ALIAS[rawRegion];
  }
  
  const subRegion = cleanValue(page.direction);
  const origin = cleanValue(page.origin);
  
  const season = cleanValue(page.season);
  const month = cleanValue(page.month);
  
  // مناسبت یا تعطیلات خاص
  let occasion: string | null = null;
  const cleanHoliday = cleanValue(page.holiday);
  const cleanOccasion = cleanValue(page.occasion);
  if (cleanHoliday !== null) {
    occasion = cleanHoliday;
  } else if (cleanOccasion !== null) {
    occasion = cleanOccasion;
  }
  
  const hotel = cleanValue(page.hotelName);
  const star = parseStars(page.hotelStars);
  const durationNights = parseNights(page.travelType, title);
  
  // قطبیت قیمت بر اساس بررسی عنوان، کلاس تور و فیلد تم
  let pricePole: 'budget' | 'premium' | null = null;
  const contentToSearch = [normalizedTitle, normalizeText(page.classLabel), normalizeText(page.theme)].join(' ');
  
  const hasBudget = POLARITY_PRICE_BUDGET.some(kw => contentToSearch.includes(normalizeText(kw)));
  const hasPremium = POLARITY_PRICE_PREMIUM.some(kw => contentToSearch.includes(normalizeText(kw)));
  
  if (hasBudget && !hasPremium) {
    pricePole = 'budget';
  } else if (hasPremium && !hasBudget) {
    pricePole = 'premium';
  }
  
  // قطبیت ستاره هتل
  let starPole: 'budget' | 'premium' | null = null;
  if (star !== null) {
    if (star <= 3) starPole = 'budget';
    else if (star === 5) starPole = 'premium';
  }
  
  // قطبیت مدت سفر
  let durPole: 'budget' | 'premium' | null = null;
  if (durationNights !== null) {
    if (durationNights <= 4) durPole = 'budget';
    else if (durationNights >= 6) durPole = 'premium';
  }
  
  // استخراج تم‌ها
  const themeBuckets = extractThemeBuckets(page.theme, page.travelType, title);
  
  // تشخیص تقویم زمانی خورشیدی یا قمری
  let timeTrack: 'solar' | 'lunar' | null = null;
  if (month && MONTH_TO_SEASON_MAP[month]) {
    timeTrack = 'solar';
  } else if (season) {
    timeTrack = 'solar';
  }
  
  // اگر مناسبت خاصی منطبق با لیست مناسبت‌های قمری باشد، قمری است
  if (occasion) {
    const normOccasion = normalizeText(occasion);
    const isLunar = LUNAR_OCCASIONS.some(occ => normOccasion.includes(normalizeText(occ)));
    if (isLunar) {
      timeTrack = 'lunar';
    } else {
      timeTrack = 'solar';
    }
  }
  
  // هاب به شکل ویژگی‌محور تشخیص داده می‌شود (بر اساس ساختار فیلدها)
  // هاب شهر: شهر پر است ولی هتل، فصل، ماه، قیمت و مناسبت خالی هستند
  const isHubCity = city !== null && hotel === null && season === null && month === null && pricePole === null && occasion === null;
  // هاب کشور: کشور پر است ولی شهر و هتل، فصل، ماه، قیمت و مناسبت خالی هستند
  const isHubCountry = country !== null && city === null && hotel === null && season === null && month === null && pricePole === null && occasion === null;
  // هاب قاره: قاره پر است ولی کشور، شهر و هتل خالی هستند
  const isContinentHub = region !== null && country === null && city === null && hotel === null;
  
  // تشخیص صفحه عام تجمیعی
  const isAggregate = checkIfAggregate(title);
  
  // داخلی یا خارجی بودن
  const isDomestic = country === DOMESTIC_COUNTRY || 
                     region === DOMESTIC_COUNTRY ||
                     normalizedTitle.includes('داخلی') || 
                     normalizedTitle.includes('ایران');
  
  // محور نیت (انتخاب اولین مورد منطبق)
  let intentAxis = 'GENERIC';
  if (isContinentHub) {
    intentAxis = 'CONTINENT';
  } else if (normalizedTitle.includes('ترکیبی') || (page.tourType && normalizeText(page.tourType).includes('ترکیبی'))) {
    intentAxis = 'COMBO';
  } else if (isHubCountry || isHubCity) {
    intentAxis = 'HUB';
  } else if (pricePole !== null) {
    intentAxis = 'PRICE';
  } else if (origin !== null && (normalizedTitle.includes('از') || normalizedTitle.includes('حرکت'))) {
    intentAxis = 'ORIGIN';
  } else if (month !== null) {
    intentAxis = 'MONTH';
  } else if (season !== null) {
    intentAxis = 'SEASON';
  } else if (hotel !== null) {
    intentAxis = 'HOTEL';
  } else if (occasion !== null) {
    intentAxis = 'OCCASION';
  } else {
    intentAxis = 'GENERIC';
  }
  
  return {
    city,
    country,
    region,
    subRegion,
    origin,
    season,
    month,
    occasion,
    hotel,
    star,
    durationNights,
    pricePole,
    starPole,
    durPole,
    themeBuckets,
    timeTrack,
    isHubCity,
    isHubCountry,
    isContinentHub,
    isAggregate,
    isDomestic,
    intentAxis
  };
}
