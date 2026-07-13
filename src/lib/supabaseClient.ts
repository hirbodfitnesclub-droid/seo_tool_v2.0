/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// دریافت متغیرهای محیطی با پیشوند VITE_ برای کلاینت با کست کردن نوع داده جهت رفع خطای کامپایلر
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// بررسی وجود متغیرهای محیطی برای اطلاع‌رسانی توسعه‌دهنده در صورت نامعتبر بودن
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'هشدار: متغیرهای محیطی Supabase ست نشده‌اند. لطفاً در فایل .env تنظیم نمایید تا اتصال پایگاه داده برقرار شود.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
