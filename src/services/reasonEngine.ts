/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page, MatchResult, SharedTag } from '../types';

/**
 * موتور تولید «دلیل رتبه» بدون هوش مصنوعی.
 *
 * این ماژول توضیح می‌دهد چرا یک صفحه پس از بررسی امبدینگ، این رتبه را گرفته است:
 *   - شباهت معنایی برداری (خروجی مدل امبدینگ)
 *   - تگ‌های ساختاری مشترک وزن‌دار (کشور، شهر، تم، فصل و ...)
 * وزن‌ها دقیقاً منطبق بر تابع match_pages در پایگاه داده هستند تا دلیل نمایش‌داده‌شده
 * با منطق واقعی رتبه‌بندی هم‌راستا باشد.
 */

interface TagDef {
  key: keyof Page & keyof MatchResult;
  label: string;
  weight: number;
}

// تعریف فیلدهای ساختاری و وزن آن‌ها (هم‌تراز با SQL)
const TAG_DEFS: TagDef[] = [
  { key: 'city', label: 'شهر مقصد', weight: 0.15 },
  { key: 'country', label: 'کشور', weight: 0.12 },
  { key: 'hotelName', label: 'هتل', weight: 0.10 },
  { key: 'theme', label: 'تم سفر', weight: 0.08 },
  { key: 'tourType', label: 'نوع تور', weight: 0.06 },
  { key: 'origin', label: 'مبدأ حرکت', weight: 0.05 },
  { key: 'season', label: 'فصل برگزاری', weight: 0.04 },
  { key: 'audiencePersona', label: 'پرسونای مخاطب', weight: 0.04 },
  { key: 'continent', label: 'قاره', weight: 0.03 },
  { key: 'month', label: 'ماه', weight: 0.03 },
  { key: 'travelType', label: 'نوع سفر', weight: 0.03 },
  { key: 'occasion', label: 'مناسبت', weight: 0.03 },
  { key: 'holiday', label: 'تعطیلات', weight: 0.03 },
  { key: 'direction', label: 'جهت منطقه', weight: 0.02 },
  { key: 'vehicle', label: 'وسیله نقلیه', weight: 0.02 },
];

// مقایسه امن دو مقدار متنی (نرمال‌سازی فاصله و حروف)
function valuesMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  return na.length > 0 && nb.length > 0 && na === nb;
}

// استخراج فهرست تگ‌های مشترک میان صفحه مبدأ و کاندیدا
export function computeSharedTags(source: Page, candidate: MatchResult): SharedTag[] {
  const shared: SharedTag[] = [];
  for (const def of TAG_DEFS) {
    const sourceVal = source[def.key] as string | undefined;
    const candidateVal = candidate[def.key] as string | undefined;
    if (valuesMatch(sourceVal, candidateVal)) {
      shared.push({
        key: def.key,
        label: def.label,
        value: (candidateVal as string).trim(),
        weight: def.weight,
      });
    }
  }
  // مرتب‌سازی بر اساس وزن (مهم‌ترین سیگنال‌ها ابتدا)
  return shared.sort((a, b) => b.weight - a.weight);
}

// توصیف کیفی شباهت معنایی برای خوانایی بهتر
function describeSemantic(similarity: number): string {
  const pct = Math.round(similarity * 100);
  if (similarity >= 0.85) return `شباهت معنایی بسیار بالا (${pct}٪)`;
  if (similarity >= 0.7) return `شباهت معنایی بالا (${pct}٪)`;
  if (similarity >= 0.55) return `شباهت معنایی متوسط (${pct}٪)`;
  return `شباهت معنایی پایین (${pct}٪)`;
}

/**
 * ساخت متن دلیل نهایی بر اساس شباهت برداری و تگ‌های مشترک.
 */
export function buildRelationReason(
  source: Page,
  candidate: MatchResult,
  sharedTags: SharedTag[]
): string {
  const semantic = describeSemantic(candidate.similarity);

  if (sharedTags.length === 0) {
    return `${semantic}؛ ارتباط عمدتاً بر پایه نزدیکی محتوایی و مفهومی متن است، بدون تگ ساختاری مشترک.`;
  }

  // ساخت عبارت‌های «هم‌X (مقدار)»
  const tagPhrases = sharedTags.map(tag => `${tag.label}: ${tag.value}`);
  const tagsText = tagPhrases.join('، ');

  return `${semantic} به همراه ${sharedTags.length} ویژگی ساختاری مشترک — ${tagsText}.`;
}

/**
 * غنی‌سازی یک نتیجه خام تطبیق با تگ‌های مشترک و دلیل رتبه.
 */
export function enrichMatch(source: Page, candidate: MatchResult): MatchResult {
  const sharedTags = computeSharedTags(source, candidate);
  const reason = buildRelationReason(source, candidate, sharedTags);
  return { ...candidate, sharedTags, reason };
}
