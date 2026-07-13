/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { MatchResult, Page } from '../types';
import { enrichMatch } from './reasonEngine';

// نگاشت یک ردیف خام RPC (snake_case) به ساختار MatchResult (camelCase)
function mapRpcRow(row: any): MatchResult {
  return {
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
    travelType: row.travel_type || '',
    url: row.url || '',
    impression: row.impression ? Number(row.impression) : 0,
    similarity: typeof row.similarity === 'number' ? row.similarity : Number(row.similarity) || 0,
    structureScore: typeof row.structure_score === 'number' ? row.structure_score : Number(row.structure_score) || 0,
    relevance: typeof row.relevance === 'number' ? row.relevance : Number(row.relevance) || 0,
    // این دو فیلد در مرحله غنی‌سازی مقداردهی می‌شوند
    sharedTags: [],
    reason: '',
  };
}

/**
 * دریافت نزدیک‌ترین کاندیداهای رتبه‌بندی ترکیبی (شباهت برداری + سیگنال ساختاری) از دیتابیس.
 * سپس هر کاندیدا با تگ‌های مشترک و «دلیل رتبه» (بدون هوش مصنوعی) غنی‌سازی می‌شود.
 *
 * @param sourcePage صفحه مبدأ (برای محاسبه دلیل و تگ‌های مشترک لازم است)
 * @param matchCount تعداد کاندیداهای درخواستی (پیش‌فرض ۳۰)
 */
export async function getMatches(
  sourcePage: Page,
  matchCount: number = 30
): Promise<MatchResult[]> {
  if (sourcePage.id === undefined || sourcePage.id === null) {
    throw new Error('صفحه مبدأ فاقد شناسه معتبر است.');
  }

  const { data, error } = await supabase.rpc('match_pages', {
    source_id: sourcePage.id,
    match_count: matchCount
  });

  if (error) {
    console.error('موتور رتبه‌بندی ترکیبی با خطا مواجه شد:', error);
    throw new Error(`خطا در واکشی کاندیداهای مشابه از موتور برداری: ${error.message}`);
  }

  const rows = (data || []) as any[];
  // نگاشت و غنی‌سازی با دلیل رتبه بر پایه امبدینگ و تگ‌های مشترک
  return rows.map(row => enrichMatch(sourcePage, mapRpcRow(row)));
}

/**
 * دریافت لیست کل صفحات ثبت شده در سیستم جهت پر کردن سایدبار.
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

/**
 * حذف کامل تمام صفحات از پایگاه داده Supabase (پاک‌سازی سراسری).
 */
export async function clearAllPages(): Promise<void> {
  // حذف همه ردیف‌ها؛ شرط id>=0 برای عبور از محافظ حذف بدون فیلتر
  const { error } = await supabase.from('pages').delete().gte('id', 0);

  if (error) {
    console.error('خطا در پاک‌سازی داده‌ها از Supabase:', error);
    throw new Error(`خطا در حذف داده‌ها از پایگاه داده: ${error.message}`);
  }
}
