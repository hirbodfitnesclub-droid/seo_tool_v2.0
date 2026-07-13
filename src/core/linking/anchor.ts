/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page } from '../../types';

// تمیزسازی انکر پیشنهادی مطابق با قوانین فرآیند تمیزسازی انکر (§۵.۵)
export function cleanAnchor(title: string): string {
  if (!title) return '';
  
  let anchor = title.trim();
  
  // ۱. حذف سال‌های شمسی و میلادی و بازه‌های زمانی تکراری (نظیر ۱۴۰۲-۱۴۰۳ یا 2024-2025)
  anchor = anchor.replace(/([۰-۹1390-9]{4})\s*[-–—]\s*([۰-۹130-9]{4})/g, '');
  anchor = anchor.replace(/\b(139\d|140\d|202\d)\b/g, '');
  anchor = anchor.replace(/(۱۳۹\d|۱۴۰\d|۲۰۲\d)/g, '');

  // ۲. اصلاح وضعیت هتل‌ها: «تور [شهر] هتل [نام]» ➔ «تور هتل [نام] [شهر]»
  // فرض بر این است که نام هتل پس از واژه "هتل" آمده است
  const hotelMatch = anchor.match(/^تور\s+((?!هتل)[^\s]+(?:\s+(?!هتل)[^\s]+)*)\s+هتل\s+(.+)$/);
  if (hotelMatch) {
    const city = hotelMatch[1].trim();
    const hotelName = hotelMatch[2].trim();
    anchor = `تور هتل ${hotelName} ${city}`;
  }

  // ۳. اصلاح وضعیت ایام خاص: «تور [شهر] نوروز» ➔ «تور نوروزی [شهر]»
  const nowruzMatch = anchor.match(/^تور\s+((?!نوروز)[^\s]+(?:\s+(?!نوروز)[^\s]+)*)\s+نوروز$/);
  if (nowruzMatch) {
    const city = nowruzMatch[1].trim();
    anchor = `تور نوروزی ${city}`;
  }

  // ۴. یکدست‌سازی تلفظ قاره‌ها به حالت جمع طبیعی (مثلاً «تور آسیا» ➔ «تورهای آسیا»)
  if (anchor.startsWith('تور آسیا')) {
    anchor = anchor.replace('تور آسیا', 'تورهای آسیا');
  } else if (anchor.startsWith('تور اروپا')) {
    anchor = anchor.replace('تور اروپا', 'تورهای اروپا');
  }

  // حذف فواصل اضافی به جا مانده از حذفیات قبلی
  anchor = anchor.replace(/\s+/g, ' ').trim();
  
  // حذف خط پیوند یا کاراکترهای یتیم در انتهای متن
  anchor = anchor.replace(/[-–—\s]+$/, '');

  return anchor;
}

// ساخت دلیل سئویی خودکار بر مبنای برچسب رابطه (§۵.۶)
export function buildReason(relationTag: string, tgt: Page): string {
  const destName = TgtName(tgt);
  
  switch (relationTag) {
    case 'HUB_CITY':
      return `پیوند صعودی به لندینگ صفحه اصلی شهر ${destName} جهت تقویت جریان اعتبار و ثبت سیگنال جغرافیایی متمرکز.`;
    case 'HUB_COUNTRY':
      return `ارتقای هدایت مخاطب به هاب اصلی کشور ${destName} برای تجمیع گردش رتبه صفحه در زنجیره بالادستی پورتال.`;
    case 'SPOKE_AXIS':
      return `پیوند جانبی به صفحات فرعی و مأموریت‌محور در مقصد ${destName} جهت غنی‌سازی سبد انتخاب‌های اختصاصی کاربر.`;
    case 'SAME_HOTEL':
      return `توصیه گزینه‌محور برای طرفداران اقامت در هتل ${tgt.hotelName || 'مشابه'} در همان محدوده جغرافیایی مقصد.`;
    case 'SAME_OCCASION':
      return `مکملی مناسب جهت توزیع اثربخش تقاضا برای مناسبت تقویمی ${tgt.holiday || tgt.occasion || 'مشترک'} در زنجیره محتوا.`;
    case 'SAME_MONTH':
      return `پیشنهاد هوشمند زمان‌بندی ماهیانه برای بهبود بهره‌وری تبدیل در دوره زمانی ${tgt.month || 'یکسان'}.`;
    case 'SAME_PRICE_CLASS':
      return `هم‌افزایی هم‌نوعان بر مبنای انطباق ترجیح اقتصادی مخاطب به کلاس قیمتی مشابه در شهر ${destName}.`;
    case 'SAME_ORIGIN':
      return `یکپارچه‌سازی سفر بر مبنای بستر پرواز مشترک از مبدأ ${tgt.origin || 'همسان'} برای راحتی فرآیند ترانسفر مسافران.`;
    case 'SAME_DESTINATION':
      return `ترغیب کاربر به مقایسه پکیج‌های متنوع مهارتی، زمانی و قیمتی در قلمرو مقصد پایدار ${destName}.`;
    case 'TWIN_REGION':
      return `ارائه گزینه جایگزین در همان خوشه منطقه‌ای به علت تسهیلات دسترسی به ویزا و شرایط اقلیمی فوق‌العاده معادل.`;
    case 'PARENT_HUB':
      return `اتصال ساختاری لایه‌به‌لایه به هاب مرجع کشور یا قاره ${destName} جهت بهبود معماری پیوندهای خروجی لندینگ‌پیج.`;
    case 'ADJACENT_STAR':
      return `معرفی پکیج‌های طبقه‌بندی مجاور در هتل‌های ${tgt.hotelStars || 'ستاره گوناگون'} جهت ایجاد حق انتخاب عمیق‌تر کلاس اقامتی.`;
    case 'ADJACENT_DURATION':
      return `پیشنهاد توازن پکیج در همان مقصد با تغییر ظریف در طول دوره اقامت مسافر بدون گسست برنامه‌ریزی اصلی.`;
    case 'SUB_REGION':
      return `توالی هوشمند در زیرمنطقه جغرافیایی هم‌جهت با تمرکز بر همپوشانی ایدئال تم فرهنگی - تفریحی مقصدها.`;
    case 'CROSSSELL':
      return `پیشنهاد جذاب خرید متقاطع در همان قاره با تطابق تماتیک علاقه کاربر جهت ارتقای تعاملات جانبی بر روی سایت.`;
    case 'CROSSSELL_NEAR':
      return `پیوند دوربرد به مقاصد مکمل با تمرکز بر هم‌ترازی خوشه‌های تماتیک نزدیک همچون طبیعت و استراحت در پهنه موروثی.`;
    default:
      return `پیوند تکمیلی سئو به صفحه ${destName} برای انسجام چیدمان ساختار مأخذهای داخلی سایت.`;
  }
}

// تابع ثانویه استخراج نام خوانای فارسی مقصد هدف
function TgtName(tgt: Page): string {
  if (tgt.city) return tgt.city;
  if (tgt.country) return tgt.country;
  if (tgt.continent) return tgt.continent;
  return 'مقصد مرتبط';
}
