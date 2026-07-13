/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page, Candidate } from '../../types';
import { parsePage, normalizeText } from './attributes';
import { passesWalls } from './walls';
import { assignRing } from './rings';
import { cleanAnchor, buildReason } from './anchor';
import { selectCandidates } from './fill';

// هماهنگ‌کننده و مجری کل فرآیند الگوریتم پیوندساز
export function computeAll(
  rawPages: Page[],
  weightMap: Record<string, number> // نقشه‌ی وزن‌های ایمپرشن استخراج شده
): Record<number, Candidate[]> {
  const result: Record<number, Candidate[]> = {};

  // ۱. مرحله استخراج ویژگی‌ها به ازای تمام صفحات جهت بهینه‌سازی سرعت محاسبات
  const pages: Page[] = rawPages.map((page, index) => {
    const parsedPage = {
      ...page,
      id: index, // انتصاب شناسه عددی منطبق برای ارجاع آسان
    };
    parsedPage.features = parsePage(parsedPage);
    return parsedPage;
  });

  // ساخت نقشه‌ی ارجاع شناسه به صفحه برای استفاده مجدد درون توابع مستقل
  const pagesMap: Record<number, Page> = {};
  for (const p of pages) {
    pagesMap[p.id] = p;
  }

  // ۲. محاسبه روابط برای تمام جفت صفحات (محاسبه دیوارها ➔ حلقه‌ها ➔ پُرسازی)
  for (const src of pages) {
    const sFeat = src.features;
    if (!sFeat) continue;

    const potentialCandidates: Candidate[] = [];

    for (const tgt of pages) {
      // تفویض به توابع موتور: اول دیوارها بررسی می‌شوند
      if (!passesWalls(src, tgt)) {
        continue;
      }

      // دوم حلقه‌ها تخصیص داده می‌شوند
      const ringAssigned = assignRing(src, tgt);
      if (ringAssigned !== null) {
        // واکشی سیگنال ایمپرشن برای رتبه‌بندی درون‌حلقه‌ای (فقط همین فاکتور وزن‌دهی دارد)
        const tgtTitleNormalized = tgt.title ? normalizeText(tgt.title) : '';
        const tgtUrlNormalized = tgt.url ? tgt.url.trim().toLowerCase() : '';
        
        let impressionWeight = 1.0;
        if (weightMap[tgtTitleNormalized] !== undefined) {
          impressionWeight = weightMap[tgtTitleNormalized];
        } else if (weightMap[tgtUrlNormalized] !== undefined) {
          impressionWeight = weightMap[tgtUrlNormalized];
        }

        potentialCandidates.push({
          page_id: tgt.id,
          title: tgt.title,
          anchor: cleanAnchor(tgt.title),
          reason: buildReason(ringAssigned.relation_tag, tgt),
          ring: ringAssigned.ring,
          relation_tag: ringAssigned.relation_tag,
          impressionWeight: impressionWeight,
        });
      }
    }

    // سوم اعمال توقف‌های نرم و سخت و قانون نماینده جهت غربالگری نهایی ۳۰ کاندیدای برتر
    const finalCandidates = selectCandidates(potentialCandidates, pagesMap);
    result[src.id] = finalCandidates;
  }

  return result;
}
