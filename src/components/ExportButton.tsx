/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../state/AppContext';
import { exportResultsToCsv } from '../services/csvService';
import { Download } from 'lucide-react';
import { FinalLink } from '../types';

export const ExportButton: React.FC = () => {
  const { selectedPageId, pages, matches, rerankResults } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const activeMatches = selectedPageId !== null ? matches[selectedPageId] || [] : [];
  const activeRerankResults = selectedPageId !== null ? rerankResults[selectedPageId] || [] : [];

  const handleExport = () => {
    if (!selectedPage || activeMatches.length === 0) return;

    try {
      // ادغام داده‌های شباهت برداری با رتبه‌بندی نهایی هوش مصنوعی
      const finalLinks: FinalLink[] = activeMatches.map(m => {
        const r = activeRerankResults.find(item => item.id === m.id);
        return {
          page_title: m.title,
          anchor_text: m.title,
          seo_reason: r ? r.seo_reason : 'ارتباط معنایی همسایگی بر مبنای مقصد، فصل و تم تفریحی تور.',
          similarity: m.similarity,
          rank: r?.rank
        };
      });

      // مرتب‌سازی نهایی بر اساس رتبه AI (در صورت وجود) یا شباهت برداری
      const sortedLinks = [...finalLinks].sort((a, b) => {
        if (a.rank !== undefined && b.rank !== undefined) {
          return a.rank - b.rank;
        }
        return b.similarity - a.similarity;
      });

      const csvContent = exportResultsToCsv(selectedPage.title, sortedLinks);
      
      // افزودن بایت مارک UTF-8 BOM جهت رفع مشکلات به هم ریختگی زبان فارسی در نرم‌افزار Excel
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const cleanTitleForFile = selectedPage.title.replace(/\s+/g, '_');
      link.setAttribute('download', `linkmesh_embedding_${cleanTitleForFile}.csv`);
      
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('خطا در صادرات نتایج سئو:', err);
    }
  };

  if (activeMatches.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
      id="export_csv_btn"
      title="صادرات تمام کاندیداهای جدول به فرمت اکسل / CSV"
    >
      <Download className="w-3.5 h-3.5" />
      صادرات به CSV
    </button>
  );
};
