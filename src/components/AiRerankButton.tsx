/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react';

export const AiRerankButton: React.FC = () => {
  const { selectedPageId, rerankAction, loading, batchRerankProgress } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  if (selectedPageId === null) return null;

  const handleSingleRerank = async () => {
    setShowDropdown(false);
    await rerankAction(selectedPageId, 'single');
  };

  const handleBatchRerank = async () => {
    setShowDropdown(false);
    await rerankAction(selectedPageId, 'batch');
  };

  const isBatching = batchRerankProgress !== null && loading;

  return (
    <div className="relative inline-block text-right" id="ai_rerank_btn_wrapper">
      <div className="flex items-center">
        <button
          onClick={handleSingleRerank}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-xl transition-all shadow-xs"
          id="trigger_single_rerank"
        >
          {loading && !isBatching ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {isBatching 
            ? `پردازش گروهی (${batchRerankProgress.current}/${batchRerankProgress.total})` 
            : 'رتبه‌بندی هوشمند با جمینی'}
        </button>
        
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading}
          className="px-2 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border-r border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-xl transition-all shadow-xs"
          id="toggle_rerank_dropdown"
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden z-20 overflow-hidden border border-slate-100" id="rerank_dropdown_menu">
          <div className="py-1">
            <button
              onClick={handleSingleRerank}
              className="flex w-full items-center px-4 py-2.5 text-right text-xs text-slate-700 hover:bg-slate-50 font-medium"
            >
              رتبه‌بندی هوشمند همین لندینگ‌پیج
            </button>
            <button
              onClick={handleBatchRerank}
              className="flex w-full items-center px-4 py-2.5 text-right text-xs text-emerald-700 hover:bg-emerald-50 border-t border-slate-50 font-bold"
            >
              رتبه‌بندی دسته‌ای کل صفحات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
