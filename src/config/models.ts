/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelId } from '../types';

// لیست مدل‌های چت مجاز برای انتخاب در رابط کاربری سئو
export const CHAT_MODELS: { id: ModelId; name: string; description: string }[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash (سریع و هوشمند)',
    description: 'بهترین موازنه سرعت و دقت سئو. ایده آل برای تحلیل دسته‌ای.'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite (بسیار سبک و کم‌هزینه)',
    description: 'بسیار سریع و سبک. مناسب برای پروژه‌های بزرگ با تعداد صفحات بالا.'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview (آخرین تکنولوژی تجربی)',
    description: 'مدل آزمایشی نسل بعدی با قابلیت‌های استدلال عمیق‌تر.'
  }
];

// مدل پیش‌فرض در صورت عدم ذخیره ترجیح کاربر
export const DEFAULT_MODEL: ModelId = 'gemini-3.5-flash';
