/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { polishCandidatesWithAi } from '../services/geminiService';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

export const AiButton: React.FC = () => {
  const { selectedPageId, pages, results, updateFinalLinks, apiKey } = useApp();
  const [isPolishing, setIsPolishing] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const activeLinks = selectedPageId !== null ? results[selectedPageId] || [] : [];

  const handleAiPolish = async () => {
    if (selectedPageId === null || !selectedPage || activeLinks.length === 0) return;
    
    setIsPolishing(true);
    setToastError(null);

    try {
      const polished = await polishCandidatesWithAi(apiKey, selectedPage.title, activeLinks);
      updateFinalLinks(selectedPageId, polished);
    } catch (err: any) {
      setToastError(err?.message || 'بروز خطا در پردازش زبان طبیعی پایدار کاندیداها.');
      // محو کردن خودکار پاپ‌آپ خطا پس از ۴ ثانیه
      setTimeout(() => {
        setToastError(null);
      }, 4000);
    } finally {
      setIsPolishing(false);
    }
  };

  if (activeLinks.length === 0) return null;

  return (
    <div className="relative flex items-center" id="ai_polish_component">
      <button
        onClick={handleAiPolish}
        disabled={isPolishing}
        className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-800 disabled:to-indigo-300 disabled:cursor-not-allowed rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
        id="ai_polish_trigger_btn"
      >
        {isPolishing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            در حال بهینه‌سازی ادبی انکرها...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            پولیش هوشمند (Gemini)
          </>
        )}
      </button>

      {/* نمایش ظریف پیام خطا به شکل بنر فلوتینگ */}
      {toastError && (
        <div 
          className="absolute left-0 bottom-12 w-64 p-3 bg-rose-50 border border-rose-150 rounded-xl shadow-lg flex items-start gap-2 z-50 text-[11px] text-rose-800 animate-in fade-in slide-in-from-bottom-2 duration-300"
          id="ai_error_bubble"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{toastError}</p>
        </div>
      )}
    </div>
  );
};
