/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { Page, MatchResult, RerankResult } from '../types';

/**
 * بازرتبه‌بندی کاندیداهای شباهت برداری با هوش مصنوعی جمینی
 * @param sourcePage صفحه لندینگ مبدا
 * @param candidates لیست کاندیداهای همسایگی نزدیک به دست آمده از RPC
 * @param model مدل انتخابی برای چت/رتبه‌بندی
 */
export async function rerankCandidates(
  sourcePage: Page,
  candidates: MatchResult[],
  model: string
): Promise<RerankResult[]> {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  // آماده‌سازی تمیز صفحه مبدا با فیلدهای مرتبط جهت کاهش تداخل و بهینه‌سازی توکن‌ها
  const cleanSourcePage = {
    title: sourcePage.title,
    continent: sourcePage.continent,
    country: sourcePage.country,
    direction: sourcePage.direction,
    city: sourcePage.city,
    origin: sourcePage.origin,
    tourType: sourcePage.tourType,
    season: sourcePage.season,
    month: sourcePage.month,
    holiday: sourcePage.holiday,
    occasion: sourcePage.occasion,
    theme: sourcePage.theme,
    vehicle: sourcePage.vehicle,
    hotelName: sourcePage.hotelName,
    hotelStars: sourcePage.hotelStars,
    classLabel: sourcePage.classLabel,
    audiencePersona: sourcePage.audiencePersona,
    visaStatus: sourcePage.visaStatus,
    travelType: sourcePage.travelType,
  };

  // فیلتر کردن و سبک‌سازی کاندیداها برای ارسال به جمینی
  const cleanCandidates = candidates.map(c => ({
    id: c.id,
    title: c.title,
    country: c.country,
    city: c.city,
    season: c.season,
    theme: c.theme,
    similarity: c.similarity
  }));

  // فراخوانی تابع Edge Function 'rerank' سوپابیس
  const { data, error } = await supabase.functions.invoke('rerank', {
    body: {
      sourcePage: cleanSourcePage,
      candidates: cleanCandidates,
      model
    }
  });

  if (error) {
    console.error('موتور بازرتبه‌بندی جمینی با خطا مواجه شد:', error);
    throw new Error(`خطا در بازرتبه‌بندی کاندیداها با هوش مصنوعی: ${error.message}`);
  }

  return (data || []) as RerankResult[];
}
