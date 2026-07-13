/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { Page } from '../types';

export interface IngestProgress {
  current: number;
  total: number;
  inserted: number;
  failed: number;
  errors: string[];
}

export type IngestProgressCallback = (progress: IngestProgress) => void;

/**
 * آپلود دسته‌ای صفحات به Edge Function 'embed-pages' جهت تولید امبدینگ و ذخیره در پایگاه داده
 */
export async function ingestPages(
  pages: Page[],
  onProgress?: IngestProgressCallback
): Promise<void> {
  const CHUNK_SIZE = 50;
  const total = pages.length;
  let current = 0;
  let inserted = 0;
  let failed = 0;
  const errors: string[] = [];

  // تقسیم آرایه صفحات به دسته‌های حداکثر 50 تایی برای بهینه‌سازی بار و نرخ محدودیت جمینی
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = pages.slice(i, i + CHUNK_SIZE);
    
    try {
      // فراخوانی مستقیم تابع ادج فانکشن سوپابیس
      const { data, error } = await supabase.functions.invoke('embed-pages', {
        body: { pages: chunk }
      });

      if (error) {
        throw new Error(error.message || 'خطا در برقراری ارتباط با سرویس ابری امبدینگ.');
      }

      if (data) {
        inserted += data.inserted || 0;
        failed += data.failed || 0;
        if (data.errors && Array.isArray(data.errors)) {
          errors.push(...data.errors);
        }
      } else {
        failed += chunk.length;
        errors.push(`خطای ناشناخته: پاسخی از تابع امبدینگ برای ردیف‌های ${i + 1} تا ${Math.min(i + CHUNK_SIZE, total)} دریافت نشد.`);
      }
    } catch (err: any) {
      console.error('Ingestion chunk error:', err);
      failed += chunk.length;
      errors.push(`خطای دسته ${i / CHUNK_SIZE + 1}: ${err.message || 'مشکل ارتباطی با سرور.'}`);
    }

    current += chunk.length;

    // ارسال گزارش پیشرفت زنده به کال‌بک در صورت تعبیه
    if (onProgress) {
      onProgress({
        current: Math.min(current, total),
        total,
        inserted,
        failed,
        errors
      });
    }
  }
}
