/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Page, MatchResult, AppPhase } from '../types';
import { getAllPages, getPageLinks, rankAllPages, clearAllData } from '../services/matchService';
import { ingestPages, IngestProgress } from '../services/ingestService';

// تعریف نوع اطلاعات کانتکست سراسری (فاز ۳ — بدون AI)
interface AppContextType {
  pages: Page[];
  matches: Record<number, MatchResult[]>;
  selectedPageId: number | null;
  ingestProgress: IngestProgress | null;
  phase: AppPhase;
  loading: boolean;
  error: string | null;

  loadPages: () => Promise<void>;
  ingestPagesAction: (pages: Page[]) => Promise<void>;
  selectPage: (id: number | null) => Promise<void>;
  clearAllDataAction: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [matches, setMatches] = useState<Record<number, MatchResult[]>>({});
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [ingestProgress, setIngestProgress] = useState<IngestProgress | null>(null);
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // دریافت کل صفحات از دیتابیس Supabase
  const loadPages = useCallback(async () => {
    try {
      const data = await getAllPages();
      setPages(data);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری صفحات از پایگاه داده.');
    }
  }, []);

  // بارگذاری صفحات در ابتدای راه‌اندازی (اگر قبلاً داده‌ای وجود دارد)
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // جریان خودکار: امبدینگ → رتبه‌بندی → done
  // این تابع بلافاصله پس از parse فایل (یا بارگذاری نمونه) فراخوانی می‌شود.
  const ingestPagesAction = useCallback(async (newPages: Page[]) => {
    setError(null);
    setMatches({});
    setSelectedPageId(null);

    // ---- مرحلهٔ ۱: امبدینگ ----
    setPhase('embedding');
    setLoading(true);
    setIngestProgress({ current: 0, total: newPages.length, inserted: 0, failed: 0, errors: [] });

    try {
      await ingestPages(newPages, (prog) => {
        setIngestProgress(prog);
      });
    } catch (err: any) {
      setError(err.message || 'خطای اساسی در فرآیند امبدینگ و آپلود.');
      setPhase('error');
      setLoading(false);
      return;
    }

    // ---- مرحلهٔ ۲: رتبه‌بندی ----
    setPhase('ranking');
    try {
      await rankAllPages();
    } catch (err: any) {
      setError(err.message || 'خطا در رتبه‌بندی هیبریدی صفحات.');
      setPhase('error');
      setLoading(false);
      return;
    }

    // ---- مرحلهٔ ۳: پایان ----
    await loadPages();
    setPhase('done');
    setLoading(false);
  }, [loadPages]);

  // انتخاب یک لندینگ‌پیج و واکشی پیشنهادهای آمادهٔ page_links
  const selectPage = useCallback(async (id: number | null) => {
    setSelectedPageId(id);
    if (id === null) return;

    // کش داخل‌حافظه برای جلوگیری از کوئری تکراری
    if (matches[id]) return;

    setLoading(true);
    setError(null);
    try {
      const results = await getPageLinks(id);
      setMatches(prev => ({ ...prev, [id]: results }));
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت پیشنهادهای رتبه‌بندی‌شده.');
    } finally {
      setLoading(false);
    }
  }, [matches]);

  // پاک‌سازی کامل: ابتدا Supabase، سپس state کلاینت
  const clearAllDataAction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await clearAllData();
    } catch (err: any) {
      setError(err.message || 'خطا در پاک‌سازی دیتابیس.');
      setLoading(false);
      return;
    }
    // خالی‌کردن کامل state
    setPages([]);
    setMatches({});
    setSelectedPageId(null);
    setIngestProgress(null);
    setPhase('idle');
    setLoading(false);
  }, []);

  return (
    <AppContext.Provider value={{
      pages,
      matches,
      selectedPageId,
      ingestProgress,
      phase,
      loading,
      error,
      loadPages,
      ingestPagesAction,
      selectPage,
      clearAllDataAction,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp باید داخل AppProvider فراخوانی شود.');
  }
  return context;
};
