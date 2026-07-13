/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page } from '../../types';
import { SEASON_ORDER } from './dictionaries';

// تابع اصلی ارزیابی دیوارها (تطابق کامل با شش قانون حذف مطلق)
export function passesWalls(src: Page, tgt: Page): boolean {
  // گرفتن ویژگی‌ها، اگر به هر دلیلی مقداردهی نشده باشند مقدار پاس داده شده نپذیرفته می‌شود
  const sFeat = src.features;
  const tFeat = tgt.features;
  if (!sFeat || !tFeat) return false;

  // ۱) دیوار خود / تجمیعی
  // الف - صفحه نباید به خودش لینک دهد
  if (src.id === tgt.id || src.title === tgt.title) {
    return false;
  }
  // ب - صفحه هدف نباید یک صفحه عام تجمیعی باشد (T صفحه عام = حذف)
  if (tFeat.isAggregate) {
    return false;
  }

  // ۲) دیوار قرنطینه مبدأ
  // اگر مبدأِ مبدأ (S.origin) پر باشد، مقصدِ هدف (T.origin) باید حتماً خالی یا برابر مبدأِ مبدأ باشد. مبدأ متفاوت = حذف مطلق.
  if (sFeat.origin !== null && tFeat.origin !== null) {
    if (sFeat.origin !== tFeat.origin) {
      return false;
    }
  }

  // ۳) دیوار جغرافیایی
  // الف - عدم تداخل تور داخلی و خارجی (داخلی ↔ خارجی = حذف)
  if (sFeat.isDomestic !== tFeat.isDomestic) {
    return false;
  }
  // ب - اگر هر دو خارجی هستند، تداخل قاره‌ها ممنوع است (خارجی قاره متفاوت = حذف)
  if (!sFeat.isDomestic && !tFeat.isDomestic) {
    if (sFeat.region !== null && tFeat.region !== null) {
      if (sFeat.region !== tFeat.region) {
        return false;
      }
    }
  }

  // ۴) دیوار قطبیت
  // الف - قطبیت قیمت (بودجه در مقابل ممتاز/لوکس)
  if (sFeat.pricePole !== null && tFeat.pricePole !== null) {
    if (sFeat.pricePole !== tFeat.pricePole) {
      return false;
    }
  }
  // ب - قطبیت تعداد ستاره هتل
  if (sFeat.starPole !== null && tFeat.starPole !== null) {
    if (sFeat.starPole !== tFeat.starPole) {
      return false;
    }
  }
  // ج - قطبیت مدت سفر (کوتاه‌مدت در مقابل بلند‌مدت)
  if (sFeat.durPole !== null && tFeat.durPole !== null) {
    if (sFeat.durPole !== tFeat.durPole) {
      return false;
    }
  }

  // ۵) دیوار زمانی (تقویمی و فصلی)
  // الف - تقویم خورشیدی در مقابل تقویم قمری (خورشیدی ↔ قمری = حذف)
  if (sFeat.timeTrack !== null && tFeat.timeTrack !== null) {
    if (sFeat.timeTrack !== tFeat.timeTrack) {
      return false;
    }
  }
  // ب - در صورت یکسان بودن تقویم خورشیدی، فقط فصل جاری و فصل بعد مجاز است. فصل‌های غیرمجاز یا روبرو حذف می‌شوند.
  if (sFeat.timeTrack === 'solar' && sFeat.season !== null && tFeat.season !== null) {
    const sIndex = SEASON_ORDER.indexOf(sFeat.season);
    const tIndex = SEASON_ORDER.indexOf(tFeat.season);
    
    if (sIndex !== -1 && tIndex !== -1) {
      const allowedNextIndex = (sIndex + 1) % 4;
      if (sIndex !== tIndex && allowedNextIndex !== tIndex) {
        return false; // فصل هدف هم‌فصل یا فصلِ بعد نیست
      }
    }
  }

  // ۶) دیوار تم بنیادی (مذهبی ↔ غیرمذهبی برای سفرهای متفاوت)
  // ارزیابی می‌کنیم که آیا تم‌های یکی مذهبی و تم‌های دیگری غیرمذهبی است
  const sIsReligious = sFeat.themeBuckets.has('religious');
  const tIsReligious = tFeat.themeBuckets.has('religious');
  
  if (sIsReligious !== tIsReligious) {
    // در این حالت، تداخل تم مذهبی و غیرمذهبی داریم.
    // این موضوع فقط در صورتی دیوار را می‌شکند که لینک "بین‌مقصدی" باشد.
    // تعریف بین‌مقصدی: کشور یا شهر مقصد متفاوت باشد (و هر دو به شکل غیرتهی تعریف شده باشند)
    const isDifferentCountry = sFeat.country !== null && tFeat.country !== null && sFeat.country !== tFeat.country;
    const isDifferentCity = sFeat.city !== null && tFeat.city !== null && sFeat.city !== tFeat.city;
    
    if (isDifferentCountry || isDifferentCity) {
      return false; // لینک مذهبی/غیرمذهبی بین مقاصد متفاوت ممنوع است
    }
  }

  return true; // اگر از تمام دیوارها عبور کند
}
