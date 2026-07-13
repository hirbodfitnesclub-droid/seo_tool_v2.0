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
  const { selectedPageId, pages, matches } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const activeMatches = selectedPageId !== null ? matches[selectedPageId] || [] : [];

  const handleExport = () => {
    if (!selectedPage || activeMatches.length === 0) return;

    try {
      const finalLinks: FinalLink[] = activeMatches.map(m => ({
        page_title: m.title,
        similarity: m.similarity,
        final_score: m.final_score,
        rank: m.rank,
        reason: m.reason,
      }));

      // ردیف‌ها از قبل رتبه‌بندی‌شده‌اند (rank اعمال‌شده در Postgres)
      const csvContent = exportResultsToCsv(selectedPage.title, finalLinks);

      // UTF-8 BOM برای رفع مشکل فارسی در Excel
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      const cleanTitle = selectedPage.title.replace(/\s+/g, '_');
      link.setAttribute('download', `linkmesh_hybrid_${cleanTitle}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('خطا در صادرات نتایج:', err);
    }
  };

  if (activeMatches.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
      id="export_csv_btn"
      title="صادرات پیشنهادها به فرمت CSV"
    >
      <Download className="w-3.5 h-3.5" />
      صادرات CSV
    </button>
  );
};
