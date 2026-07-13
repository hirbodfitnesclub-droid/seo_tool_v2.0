/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { MatchResult, Page } from '../types';

/**
 * دریافت ۳۰ صفحه مشابه معنایی (همسایه‌های نزدیک) بر مبنای فاصله کسینوسی برداری از دیتابیس
 * @param sourceId شناسه صفحه اصلی (مبدا)
 * @param matchCount تعداد کاندیداهای درخواستی (پیش‌فرض ۳۰)
 */
export async function getMatches(
  sourceId: number,
  matchCount: number = 30
): Promise<MatchResult[]> {
  const { data, error } = await supabase.rpc('match_pages', {
    source_id: sourceId,
    match_count: matchCount
  });

  if (error) {
    console.error('موتور شباهت برداری با خطا مواجه شد:', error);
    throw new Error(`خطا در واکشی کاندیداهای مشابه از موتور برداری: ${error.message}`);
  }

  return (data || []) as MatchResult[];
}

/**
 * دریافت لیست کل صفحات ثبت شده در سیستم جهت پر کردن سایدبار چپ
 */
export async function getAllPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('id, title, continent, country, direction, city, origin, tour_type, season, month, holiday, occasion, theme, vehicle, hotel_name, hotel_stars, class_label, audience_persona, visa_status, travel_type, url, impression')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('خطا در دریافت لیست صفحات:', error);
    throw new Error(`خطا در واکشی فهرست صفحات: ${error.message}`);
  }

  const rawData = data || [];
  return rawData.map((row): Page => ({
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
