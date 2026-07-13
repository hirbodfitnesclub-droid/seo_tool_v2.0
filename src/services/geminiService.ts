/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinalLink } from '../types';

// بریج ارتباطی با بک‌اند سرور جهت پولیش کاندیداهای لینک‌سازی لندینگ‌پیج هدف
export async function polishCandidatesWithAi(
  apiKey: string,
  sourceTitle: string,
  candidates: FinalLink[]
): Promise<FinalLink[]> {
  const response = await fetch('/api/gemini/polish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customApiKey: apiKey,
      sourceTitle: sourceTitle,
      candidates: candidates.map(c => ({
        page_title: c.page_title,
        anchor_text: c.anchor_text,
        seo_reason: c.seo_reason
      }))
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'پاسخ ناموفقی در درگاه هوش مصنوعی ثبت شده است.');
  }

  // پیوند زدن نتایج پولیش شده با برچسب‌ها و حلقه‌های موروثی جهت حفظ سلامت ساختاری داده‌ها
  const polishedResults: FinalLink[] = data.results.map((polishedItem: any) => {
    const originalItem = candidates.find(c => c.page_title === polishedItem.page_title);
    return {
      page_title: polishedItem.page_title,
      anchor_text: polishedItem.anchor_text,
      seo_reason: polishedItem.seo_reason,
      ring: originalItem?.ring,
      relation_tag: originalItem?.relation_tag
    };
  });

  return polishedResults;
}
