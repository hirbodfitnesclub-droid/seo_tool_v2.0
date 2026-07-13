/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candidate, Page } from '../../types';
import { MONTH_TO_SEASON_MAP } from './dictionaries';

// تابع انتخاب کاندیداهای نهایی سئو و اعمال قوانین سقف‌ها و قانون نماینده (§۵.۴)
export function selectCandidates(candidates: Candidate[], pagesMap: Record<number, Page>): Candidate[] {
  // ۱. مرتب‌سازی سه‌گانه قطعی: حلقه (صعودی) ➔ ایمپرشن (نزولی) ➔ شناسه صفحه (صعودی)
  const sorted = [...candidates].sort((a, b) => {
    if (a.ring !== b.ring) {
      return a.ring - b.ring;
    }
    if (Math.abs(b.impressionWeight - a.impressionWeight) > 0.0001) {
      return b.impressionWeight - a.impressionWeight;
    }
    return a.page_id - b.page_id;
  });

  const selected: Candidate[] = [];
  
  // شمارنده‌های سقف نرم
  let ring1Count = 0;
  const tagCountMap: Record<string, number> = {};
  
  // نگهداری وضعیت فصل‌های برگزیده شده برای قانون نماینده
  const chosenSeasons = new Set<string>();

  for (const cand of sorted) {
    const tgtPage = pagesMap[cand.page_id];
    const tFeat = tgtPage?.features;
    if (!tFeat) continue;

    // الف - اعمال سقف نرم حلقه ۱ تا ۱۶ مورد
    if (cand.ring === 1) {
      if (ring1Count >= 16) continue;
    }

    // ب - اعمال سقف نرم هر برچسب رابطه تا ۱۰ مورد
    const currentTagCount = tagCountMap[cand.relation_tag] || 0;
    if (currentTagCount >= 10) continue;

    // ج - اعمال قانون نماینده
    // در سطح فصل نگهداری، ماه‌های همان فصل حذف می‌شوند (مگر اینکه مناسبت پرتقاضایی ثبت شده باشد که استثناست)
    if (tFeat.month && !tFeat.occasion) {
      const mappedSeason = MONTH_TO_SEASON_MAP[tFeat.month];
      if (mappedSeason && chosenSeasons.has(mappedSeason)) {
        continue; // ماه‌های همفصل به دلیل قانون نماینده حذف می‌شوند
      }
    }

    // اگر کاندیدا پذیرفته شود، وضعیت‌ها به‌روزرسانی می‌شوند
    if (cand.ring === 1) {
      ring1Count++;
    }
    tagCountMap[cand.relation_tag] = (tagCountMap[cand.relation_tag] || 0) + 1;
    
    // ثبت فصل مرتبط با صفحه انتخابی جهت مقاصد بعدی قانون نماینده
    if (tFeat.season) {
      chosenSeasons.add(tFeat.season);
    } else if (tFeat.month) {
      const mappedSeason = MONTH_TO_SEASON_MAP[tFeat.month];
      if (mappedSeason) {
        chosenSeasons.add(mappedSeason);
      }
    }

    selected.push(cand);

    // سقف نهایی مطلق ۲۵ تا ۳۰ تایی، ما بر روی سقف ۳۰ تمرکز می‌کنیم
    if (selected.length >= 30) {
      break;
    }
  }

  return selected;
}
