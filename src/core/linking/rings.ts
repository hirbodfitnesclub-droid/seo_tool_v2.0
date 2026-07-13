/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page } from '../../types';
import { REGIONAL_CLUSTERS, NEAR_THEME_GROUPS } from './dictionaries';
import { normalizeText } from './attributes';

// بررسی تعلق دو کشور یا دو مقصد داخلی به یک خوشه منطقه‌ای
function isRegionalTwin(
  countryA: string | null,
  countryB: string | null,
  isDomA?: boolean,
  isDomB?: boolean,
  subRegA?: string | null,
  subRegB?: string | null
): boolean {
  if (!countryA || !countryB) return false;
  const cA = normalizeText(countryA);
  const cB = normalizeText(countryB);
  
  if (cA === cB) {
    if (isDomA && isDomB && subRegA && subRegB) {
      const srA = normalizeText(subRegA);
      const srB = normalizeText(subRegB);
      if (srA === srB && srA !== '') {
        return true; // هم‌خوشه داخلی (مثل قشم و کیش که هر دو جنوب کشور هستند)
      }
    }
    return false; // باید دو کشور متفاوت باشند
  }

  for (const cluster of Object.values(REGIONAL_CLUSTERS)) {
    const normCluster = cluster.map(c => normalizeText(c));
    if (normCluster.includes(cA) && normCluster.includes(cB)) {
      return true;
    }
  }
  return false;
}

// بررسی اشتراک تم خاص (سفت‌سخت)
function hasCommonSpecialTheme(sBuckets: Set<string>, tBuckets: Set<string>): boolean {
  if (sBuckets.size === 0) return true; // اگر منبع تمی ندارد، مانعی برای بررسی حلقه نیست
  for (const theme of sBuckets) {
    if (tBuckets.has(theme)) return true;
  }
  return false;
}

// بررسی تم نزدیک بر اساس جفت سطل‌های مجاور برای R4.5
function hasNearTheme(sBuckets: Set<string>, tBuckets: Set<string>): boolean {
  if (sBuckets.size === 0) return true;
  
  // بررسی اشتراکی واقعی ابتدا
  if (hasCommonSpecialTheme(sBuckets, tBuckets)) return true;

  // بررسی جفت‌های نزدیک
  for (const group of NEAR_THEME_GROUPS) {
    const containsS = group.some(t => sBuckets.has(t));
    const containsT = group.some(t => tBuckets.has(t));
    if (containsS && containsT) {
      return true;
    }
  }
  return false;
}

// تخصیص رتبه حلقه و برچسب رابطه مطابق با §۵.۳
export function assignRing(src: Page, tgt: Page): { ring: number; relation_tag: string } | null {
  const sFeat = src.features;
  const tFeat = tgt.features;
  if (!sFeat || !tFeat) return null;

  const sCity = sFeat.city ? normalizeText(sFeat.city) : null;
  const tCity = tFeat.city ? normalizeText(tFeat.city) : null;
  
  const sCountry = sFeat.country ? normalizeText(sFeat.country) : null;
  const tCountry = tFeat.country ? normalizeText(tFeat.country) : null;

  const sRegion = sFeat.region ? normalizeText(sFeat.region) : null;
  const tRegion = tFeat.region ? normalizeText(tFeat.region) : null;

  // وضعیت یکسان بودن مقصد
  const isSameCity = sCity !== null && tCity !== null && sCity === tCity;
  const isSameCountry = sCountry !== null && tCountry !== null && sCountry === tCountry;
  
  // دو صفحه زمانی هم‌مقصد هستند که یا دقیقاً هم‌شهری باشند،
  // یا منبع صفحه‌ای در سطح کشور باشد ولی هدف در همان کشور باشد (ارتباط هاب به اسپوک)،
  // یا هر دو در سطح کشور باشند.
  const isSameDestination = isSameCity || (isSameCountry && sCity === null);

  // ================= حلقه R0 =================
  if (isSameDestination) {
    // هابِ خودِ مقصد
    if (isSameCity && tFeat.isHubCity) {
      return { ring: 0, relation_tag: 'HUB_CITY' };
    }
    if (isSameCountry && tFeat.isHubCountry && sCity === null) {
      return { ring: 0, relation_tag: 'HUB_COUNTRY' };
    }
    
    // اسپوکِ دقیقِ محور (اگر منبع هاب باشد و هدف از لحاظ قطبیت/فصل/مبدأ با آن برابر باشد)
    const isSourceHub = sFeat.isHubCity || sFeat.isHubCountry;
    if (isSourceHub) {
      const sameOrigin = sFeat.origin === null || tFeat.origin === null || normalizeText(sFeat.origin) === normalizeText(tFeat.origin);
      const sameSeason = sFeat.season === null || tFeat.season === null || normalizeText(sFeat.season) === normalizeText(tFeat.season);
      const samePrice = sFeat.pricePole === null || tFeat.pricePole === null || sFeat.pricePole === tFeat.pricePole;
      
      if (sameOrigin && sameSeason && samePrice) {
        return { ring: 0, relation_tag: 'SPOKE_AXIS' };
      }
    }
  }

  // ================= حلقه R1 =================
  // همان مقصد، ابعاد مجاور دیگر
  if (isSameDestination) {
    if (sFeat.hotel !== null && tFeat.hotel !== null && normalizeText(sFeat.hotel) === normalizeText(tFeat.hotel)) {
      return { ring: 1, relation_tag: 'SAME_HOTEL' };
    }
    if (sFeat.occasion !== null && tFeat.occasion !== null && normalizeText(sFeat.occasion) === normalizeText(tFeat.occasion)) {
      return { ring: 1, relation_tag: 'SAME_OCCASION' };
    }
    if (sFeat.month !== null && tFeat.month !== null && normalizeText(sFeat.month) === normalizeText(tFeat.month)) {
      return { ring: 1, relation_tag: 'SAME_MONTH' };
    }
    if (sFeat.pricePole !== null && tFeat.pricePole !== null && sFeat.pricePole === tFeat.pricePole) {
      return { ring: 1, relation_tag: 'SAME_PRICE_CLASS' };
    }
    if (sFeat.origin !== null && tFeat.origin !== null && normalizeText(sFeat.origin) === normalizeText(tFeat.origin)) {
      return { ring: 1, relation_tag: 'SAME_ORIGIN' };
    }
    return { ring: 1, relation_tag: 'SAME_DESTINATION' };
  }

  // ================= حلقه R2 =================
  // هم‌خوشه منطقه‌ای، سطح هاب یا تم مشترک سفت‌سخت
  if (isRegionalTwin(sFeat.country, tFeat.country, sFeat.isDomestic, tFeat.isDomestic, sFeat.subRegion, tFeat.subRegion)) {
    if (hasCommonSpecialTheme(sFeat.themeBuckets, tFeat.themeBuckets)) {
      return { ring: 2, relation_tag: 'TWIN_REGION' };
    }
  }

  // ================= حلقه R3 =================
  // مجاور طیف (تفاوت قیمت/ستاره/مدت در حد ۱ درجه) یا هاب والد قاره/کشور
  // هاب والد
  const isContinentParent = sRegion !== null && tRegion !== null && sRegion === tRegion && tFeat.isContinentHub;
  const isCountryParent = sCountry !== null && tCountry !== null && sCountry === tCountry && tFeat.isHubCountry;
  if (isContinentParent || isCountryParent) {
    return { ring: 3, relation_tag: 'PARENT_HUB' };
  }

  // تفاوت ستاره هتل در بازه ±۱
  if (sFeat.star !== null && tFeat.star !== null) {
    if (Math.abs(sFeat.star - tFeat.star) <= 1) {
      return { ring: 3, relation_tag: 'ADJACENT_STAR' };
    }
  }

  // تفاوت مدت در بازه ±۱ شب
  if (sFeat.durationNights !== null && tFeat.durationNights !== null) {
    if (Math.abs(sFeat.durationNights - tFeat.durationNights) <= 1) {
      return { ring: 3, relation_tag: 'ADJACENT_DURATION' };
    }
  }

  // ================= حلقه R3.5 =================
  // هم‌زیرمنطقه (همان جهت)، کشور متفاوت، تم خاص مشترک
  if (sCountry !== tCountry && sFeat.subRegion !== null && tFeat.subRegion !== null) {
    if (normalizeText(sFeat.subRegion) === normalizeText(tFeat.subRegion)) {
      if (hasCommonSpecialTheme(sFeat.themeBuckets, tFeat.themeBuckets)) {
        return { ring: 3.5, relation_tag: 'SUB_REGION' };
      }
    }
  }

  // ================= حلقه R4 =================
  // هم‌قاره + تم خاص مشترک (سطح CROSSSELL)
  if (sRegion !== null && tRegion !== null && sRegion === tRegion) {
    if (hasCommonSpecialTheme(sFeat.themeBuckets, tFeat.themeBuckets)) {
      return { ring: 4, relation_tag: 'CROSSSELL' };
    }
  }

  // ================= حلقه R4.5 =================
  // هم‌قاره + تم نزدیک (CROSSSELL_NEAR)
  if (sRegion !== null && tRegion !== null && sRegion === tRegion) {
    if (hasNearTheme(sFeat.themeBuckets, tFeat.themeBuckets)) {
      return { ring: 4.5, relation_tag: 'CROSSSELL_NEAR' };
    }
  }

  return null; // خارج از نردبان معنایی
}
