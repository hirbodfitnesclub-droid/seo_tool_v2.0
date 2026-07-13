/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Page, MatchResult, RerankResult, ModelId } from '../types';
import { getAllPages, getMatches } from '../services/matchService';
import { ingestPages, IngestProgress } from '../services/ingestService';
import { rerankCandidates } from '../services/rerankService';
import { DEFAULT_MODEL } from '../config/models';
import { supabase } from '../lib/supabaseClient';

// ساختار پیشرفت بازرتبه‌بندی دسته‌ای
export interface BatchRerankProgress {
  current: number;
  total: number;
  success: number;
  failed: number;
}

// تعریف نوع اطلاعات کانتکست سراسری
interface AppContextType {
  pages: Page[];
  matches: Record<number, MatchResult[]>;
  rerankResults: Record<number, RerankResult[]>;
  selectedPageId: number | null;
  selectedModel: ModelId;
  ingestProgress: IngestProgress | null;
  batchRerankProgress: BatchRerankProgress | null;
  loading: boolean;
  error: string | null;
  
  loadPages: () => Promise<void>;
  ingestPagesAction: (pages: Page[]) => Promise<void>;
  selectPage: (id: number | null) => Promise<void>;
  rerankAction: (pageId: number, mode: 'single' | 'batch') => Promise<void>;
  setSelectedModel: (model: ModelId) => void;
  clearState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [matches, setMatches] = useState<Record<number, MatchResult[]>>({});
  const [rerankResults, setRerankResults] = useState<Record<number, RerankResult[]>>({});
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [selectedModel, setSelectedModelInternal] = useState<ModelId>(DEFAULT_MODEL);
  const [ingestProgress, setIngestProgress] = useState<IngestProgress | null>(null);
  const [batchRerankProgress, setBatchRerankProgress] = useState<BatchRerankProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // بارگذاری مدل انتخابی کاربر از localStorage در بدو ورود
  useEffect(() => {
    const savedModel = localStorage.getItem('linkmesh_selected_model') as ModelId;
    if (savedModel && ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview'].includes(savedModel)) {
      setSelectedModelInternal(savedModel);
    }
  }, []);

  // تنظیم مدل چت و ذخیره در کلاینت
  const setSelectedModel = useCallback((model: ModelId) => {
    setSelectedModelInternal(model);
    localStorage.setItem('linkmesh_selected_model', model);
  }, []);

  // دریافت کل صفحات از دیتابیس Supabase
  const loadPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPages();
      setPages(data);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری صفحات از پایگاه داده.');
    } finally {
      setLoading(false);
    }
  }, []);

  // بارگذاری کل صفحات در ابتدای راه‌اندازی در صورت ست بودن کانفیگ
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // آپلود گروهی و ایجاد بردار امبدینگ صفحات
  const ingestPagesAction = useCallback(async (newPages: Page[]) => {
    setLoading(true);
    setError(null);
    setIngestProgress({
      current: 0,
      total: newPages.length,
      inserted: 0,
      failed: 0,
      errors: []
    });

    try {
      await ingestPages(newPages, (prog) => {
        setIngestProgress(prog);
      });
      // پس از اتمام بارگذاری، کل لیست صفحات را رفرش می‌کنیم
      await loadPages();
    } catch (err: any) {
      setError(err.message || 'خطای اساسی در فرآیند امبدینگ و آپلود.');
    } finally {
      setLoading(false);
    }
  }, [loadPages]);

  // انتخاب یک لندینگ‌پیج و واکشی اتوماتیک ۳۰ همسایه شباهت کسینوسی در صورت نیاز
  const selectPage = useCallback(async (id: number | null) => {
    setSelectedPageId(id);
    if (id === null) return;

    // بررسی اینکه آیا کاندیداهای شباهت از پیش بارگذاری شده‌اند یا خیر (کاهش کوئری‌های تکراری)
    if (matches[id]) return;

    setLoading(true);
    setError(null);
    try {
      const candidatesList = await getMatches(id, 30);
      setMatches(prev => ({
        ...prev,
        [id]: candidatesList
      }));
    } catch (err: any) {
      setError(err.message || 'خطا در محاسبه و دریافت صفحات مرتبط.');
    } finally {
      setLoading(false);
    }
  }, [matches]);

  // بازرتبه‌بندی با هوش مصنوعی (تک‌صفحه‌ای یا تمام صفحات به صورت ترتیبی)
  const rerankAction = useCallback(async (pageId: number, mode: 'single' | 'batch') => {
    setLoading(true);
    setError(null);

    if (mode === 'single') {
      const page = pages.find(p => p.id === pageId);
      let pageMatches = matches[pageId];

      if (!page) {
        setError('صفحه مورد نظر یافت نشد.');
        setLoading(false);
        return;
      }

      try {
        // واکشی کاندیداها در صورت عدم وجود در استیت کلاینت
        if (!pageMatches) {
          pageMatches = await getMatches(pageId, 30);
          setMatches(prev => ({ ...prev, [pageId]: pageMatches }));
        }

        const results = await rerankCandidates(page, pageMatches, selectedModel);
        setRerankResults(prev => ({
          ...prev,
          [pageId]: results
        }));
      } catch (err: any) {
        setError(err.message || 'فرآیند بازرتبه‌بندی تک‌صفحه با خطا مواجه شد.');
      } finally {
        setLoading(false);
      }
    } else {
      // حالت دسته جمعی (Batch) برای کل صفحات ثبت شده
      if (pages.length === 0) {
        setError('هیچ صفحه‌ای برای بازرتبه‌بندی دسته‌ای یافت نشد.');
        setLoading(false);
        return;
      }

      setBatchRerankProgress({
        current: 0,
        total: pages.length,
        success: 0,
        failed: 0
      });

      let currentSuccess = 0;
      let currentFailed = 0;

      // رتبه‌بندی کاملاً ترتیبی تک‌به‌تک صفحات جهت ممانعت از مسدودسازی و مدیریت دقیق محدودیت نرخ
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page.id) continue;

        try {
          let pageMatches = matches[page.id];
          if (!pageMatches) {
            pageMatches = await getMatches(page.id, 30);
            const currentId = page.id;
            setMatches(prev => ({ ...prev, [currentId]: pageMatches }));
          }

          if (pageMatches.length > 0) {
            const results = await rerankCandidates(page, pageMatches, selectedModel);
            const currentId = page.id;
            setRerankResults(prev => ({
              ...prev,
              [currentId]: results
            }));
            currentSuccess++;
          } else {
            currentSuccess++; // خالی بودن کاندیداها خطا محسوب نمی‌شود
          }
        } catch (err) {
          console.error(`Error reranking page ${page.title}:`, err);
          currentFailed++;
        }

        setBatchRerankProgress({
          current: i + 1,
          total: pages.length,
          success: currentSuccess,
          failed: currentFailed
        });
      }

      setLoading(false);
    }
  }, [pages, matches, selectedModel]);

  // خالی کردن کامل وضعیت کلاینت
  const clearState = useCallback(() => {
    setPages([]);
    setMatches({});
    setRerankResults({});
    setSelectedPageId(null);
    setIngestProgress(null);
    setBatchRerankProgress(null);
    setError(null);
  }, []);

  return (
    <AppContext.Provider value={{
      pages,
      matches,
      rerankResults,
      selectedPageId,
      selectedModel,
      ingestProgress,
      batchRerankProgress,
      loading,
      error,
      loadPages,
      ingestPagesAction,
      selectPage,
      rerankAction,
      setSelectedModel,
      clearState
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
