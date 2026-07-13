/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { computeAll } from '../core/linking/engine';

// شنوا برای اجرای پردازش سنگین در پس‌زمینه بدون درگیر کردن ترد اصلی رابط کاربری
self.onmessage = (e: MessageEvent) => {
  const { pages, weightMap } = e.data;
  try {
    const candidates = computeAll(pages, weightMap);
    self.postMessage({ status: 'success', candidates });
  } catch (err: any) {
    self.postMessage({ status: 'error', error: err?.message || 'خطای نامشخص در موتور محاسباتی' });
  }
};
