/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImpressionRow } from '../types';
import { normalizeText } from '../core/linking/attributes';

// تولید هموار نقشه وزن برای ایمپرشن‌ها به فرمول وزن = ۱ + نرمال‌شده‌ی log(ایمپرشن+۱) (§۵.۰)
export function buildWeightMap(rows: ImpressionRow[]): Record<string, number> {
  const weightMap: Record<string, number> = {};
  if (!rows || rows.length === 0) return weightMap;

  // محاسبه لگاریتم تمام ایمپرشن‌ها
  const logs = rows.map(r => {
    const imp = Number(r.impression);
    return {
      title: r.title ? normalizeText(r.title) : '',
      url: r.url ? r.url.trim().toLowerCase() : '',
      logVal: Math.log((isNaN(imp) ? 0 : imp) + 1),
    };
  });

  // بدست آوردن کمترین و بیشترین مقدار لگاریتم جهت قرینه‌سازی و نرمال‌سازی در بازه ۱ تا ۲
  let minLog = Infinity;
  let maxLog = -Infinity;

  for (const item of logs) {
    if (item.logVal < minLog) minLog = item.logVal;
    if (item.logVal > maxLog) maxLog = item.logVal;
  }

  const range = maxLog - minLog;

  // اعمال فرمول وزن به طوری که در بازه دقیق ۱.۰ تا ۲.۰ بنشیند
  for (const item of logs) {
    let weight = 1.0;
    if (range > 0.0001) {
      weight = 1.0 + (item.logVal - minLog) / range;
    } else {
      weight = 1.0; // در صورتی که همه مقادیر یکسان باشند مخرج صفر نشود و ۱ باشد
    }

    // ذخیره‌سازی هم بر اساس عنوان و هم آدرس یونیک صفحه جهت بیشترین سرعت تطابق
    if (item.title) {
      weightMap[item.title] = weight;
    }
    if (item.url) {
      weightMap[item.url] = weight;
    }
  }

  return weightMap;
}
