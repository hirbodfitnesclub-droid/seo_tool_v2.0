/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// رجیستری مدل‌های مورد استفاده در سامانه (مرجع واحد و مشترک برای کلاینت و توابع)
export const EMBEDDING_MODEL = 'gemini-embedding-2';
export const EMBEDDING_DIMENSIONALITY = 768;

export const CHAT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview'
] as const;

export type ChatModelId = typeof CHAT_MODELS[number];

// تابع بررسی اعتبار مدل انتخاب‌شده برای چت و بازرتبه‌بندی
export function isValidChatModel(model: string): model is ChatModelId {
  return CHAT_MODELS.includes(model as any);
}
