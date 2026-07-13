/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { MatchResult, Page } from '../types';

/**
 * دریافت ۳۰ پیشنهاد پیش‌محاسبه‌شدهٔ هیبریدی برای یک صفحهٔ مبدأ از page_links
 */
export async function getPageLinks(sourceId: number): Promise<MatchResult[]> {
  const { data, error } = await supabase.rpc('get_page_links', {
    p_source_id: sourceId
  });

  if (error) {
    console.error('خطا در دریافت page_links:', error);
    throw new Error(`خطا در واکشی پیشنهادهای رتبه‌بندی‌شده: ${error.message}`);
  }

  return (data || []) as MatchResult[];
}

/**
 * رتبه‌بندی هیبریدی کلِ صفحات — یک RPC واحد، کلِ page_links را بازمی‌سازد
 * بازمی‌گرداند: تعداد کلِ لینک‌های ساخته‌شده
 */
export async function rankAllPages(): Promise<number> {
  const { data, error } = await supabase.rpc('rank_all_pages');

  if (error) {
    console.error('خطا در rank_all_pages:', error);
    throw new Error(`خطا در رتبه‌بندی صفحات: ${error.message}`);
  }

  return (data as number) ?? 0;
}

/**
 * پاک‌سازی کامل دیتابیس — حذف کلِ pages و page_links از Supabase
 */
export async function clearAllData(): Promise<void> {
  const { error } = await supabase.rpc('clear_all_data');

  if (error) {
    console.error('خطا در clear_all_data:', error);
    throw new Error(`خطا در پاک‌سازی دیتابیس: ${error.message}`);
  }
}

/**
 * دریافت لیست کل صفحات ثبت‌شده در سیستم
 */
export async function getAllPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('خطا در دریافت لیست صفحات:', error);
    throw new Error(`خطا در واکشی فهرست صفحات: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any): Page => ({
    id: Number(row.id),
    title: row.title || '',
    continent: row.continent || '',
    country: row.country || '',
    direction: row.direction || '',
    city: row.city || '',
    origin: row.origin || '',
    tourType: row.tour_type || '',
    season: row.season || '',
    month: row.month || '',
    holiday: row.holiday || '',
    occasion: row.occasion || '',
    theme: row.theme || '',
    vehicle: row.vehicle || '',
    hotelName: row.hotel_name || '',
    hotelStars: row.hotel_stars || '',
    classLabel: row.class_label || '',
    audiencePersona: row.audience_persona || '',
    visaStatus: row.visa_status || '',
    travelType: row.travel_type || '',
    url: row.url || '',
    impression: row.impression ? Number(row.impression) : 0,
  }));
}
