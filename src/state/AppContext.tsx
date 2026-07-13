/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Page, Candidate, FinalLink } from '../types';
import { computeAll } from '../core/linking/engine';

// ساختار داده‌ای Context سراسری اپلیکیشن
interface AppContextType {
  pages: Page[];
  weights: Record<string, number>;
  candidates: Record<number, Candidate[]>;
  results: Record<number, FinalLink[]>;
  apiKey: string;
  isLoading: boolean;
  error: string | null;
  selectedPageId: number | null;
  setPages: (pages: Page[]) => void;
  setWeights: (weights: Record<string, number>) => void;
  setApiKey: (key: string) => void;
  setSelectedPageId: (id: number | null) => void;
  updateFinalLinks: (pageId: number, links: FinalLink[]) => void;
  runInterlinking: (customPages?: Page[], customWeights?: Record<string, number>) => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pages, setPagesState] = useState<Page[]>([]);
  const [weights, setWeightsState] = useState<Record<string, number>>({});
  const [candidates, setCandidates] = useState<Record<number, Candidate[]>>({});
  const [results, setResults] = useState<Record<number, FinalLink[]>>({});
  const [apiKey, setApiKeyInternal] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

  // بارگذاری کلید API از LocalStorage در گام ابتدایی اجرای نرم‌افزار
  useEffect(() => {
    const savedKey = localStorage.getItem('linkmesh_api_key');
    if (savedKey) {
      setApiKeyInternal(savedKey);
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyInternal(key);
    localStorage.setItem('linkmesh_api_key', key);
  };

  const setPages = (newPages: Page[]) => {
    setPagesState(newPages);
  };

  const setWeights = (newWeights: Record<string, number>) => {
    setWeightsState(newWeights);
  };

  const updateFinalLinks = (pageId: number, links: FinalLink[]) => {
    setResults(prev => ({
      ...prev,
      [pageId]: links
    }));
  };

  const clearAll = () => {
    setPagesState([]);
    setWeightsState({});
    setCandidates({});
    setResults({});
    setSelectedPageId(null);
    setError(null);
  };

  // تابع هماهنگ‌سازی و اجرای پردازش سنگین موتور پیوندساز
  const runInterlinking = (customPages?: Page[], customWeights?: Record<string, number>) => {
    const activePages = customPages || pages;
    const activeWeights = customWeights || weights;

    if (activePages.length === 0) return;

    setIsLoading(true);
    setError(null);

    // پیاده‌سازی مکانیزم ترکیبی (Web Worker + نخ اصلی در صورت عدم کارکرد)
    try {
      // استفاده از تکنولوژی بارگذاری ماژولار ورکر در Vite
      // برای پیشگیری از بروز خطا در محیط‌های فریم خاص یا ایزوله شده، از Blob یا ایمپورت استاتیک با بررسی استفاده می‌شود
      const workerUrl = new URL('../workers/engine.worker.ts', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });

      worker.postMessage({
        pages: activePages,
        weightMap: activeWeights
      });

      worker.onmessage = (e) => {
        const { status, candidates: computed, error: err } = e.data;
        if (status === 'success') {
          setCandidates(computed);
          
          // تولید پاسخ نهایی به ازای تمام صفحات جهت نمایش اولیه در برنامه
          const initialResults: Record<number, FinalLink[]> = {};
          Object.keys(computed).forEach(key => {
            const pageId = Number(key);
            initialResults[pageId] = computed[pageId].map((c: Candidate) => ({
              page_title: c.title,
              anchor_text: c.anchor,
              seo_reason: c.reason,
              ring: c.ring,
              relation_tag: c.relation_tag
            }));
          });
          setResults(initialResults);
          setIsLoading(false);
          worker.terminate();
        } else {
          throw new Error(err || 'خطای ناخواسته در حین اجرای کد ورکر');
        }
      };

      worker.onerror = (e) => {
        worker.terminate();
        throw new Error('عدم امکان اجرای کامل ماژول ورکر در این مرورگر؛ سوئیچ خودکار به ترد اصلی انجام می‌شود.');
      };

    } catch (workerErr) {
      // فالبک ایمن به ترد اصلی در صورت مسدود بودن یا عدم توانمندی مرورگر در ایجاد ورکر پیوند دهی
      console.warn('سیستم از قابلیت ورکر عبور کرد و به روند پردازش مستقیم روی آورد.', workerErr);
      try {
        const computed = computeAll(activePages, activeWeights);
        setCandidates(computed);

        const initialResults: Record<number, FinalLink[]> = {};
        Object.keys(computed).forEach(key => {
          const pageId = Number(key);
          initialResults[pageId] = computed[pageId].map((c: Candidate) => ({
            page_title: c.title,
            anchor_text: c.anchor,
            seo_reason: c.reason,
            ring: c.ring,
            relation_tag: c.relation_tag
          }));
        });
        setResults(initialResults);
        setIsLoading(false);
      } catch (syncErr: any) {
        setError(syncErr?.message || 'خطای مهلک در پردازش پیوندها؛ لطفاً فایل‌های ورودی را بررسی نمایید.');
        setIsLoading(false);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      pages,
      weights,
      candidates,
      results,
      apiKey,
      isLoading,
      error,
      selectedPageId,
      setPages,
      setWeights,
      setApiKey,
      setSelectedPageId,
      updateFinalLinks,
      runInterlinking,
      clearAll
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('تابع استفاده از پکیج سئو باید درون AppProvider تعریف شود.');
  }
  return context;
};
