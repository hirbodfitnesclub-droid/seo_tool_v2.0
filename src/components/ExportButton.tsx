/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../state/AppContext';
import { exportResultsToCsv } from '../services/csvService';
import { Download, CheckCircle2 } from 'lucide-react';

export const ExportButton: React.FC = () => {
  const { selectedPageId, pages, results } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const activeLinks = selectedPageId !== null ? results[selectedPageId] || [] : [];

  const handleExport = () => {
    if (!selectedPage || activeLinks.length === 0) return;

    try {
      const csvContent = exportResultsToCsv(selectedPage.title, activeLinks);
      
      // اضافه کردن تگ UTF-8 BOM جهت بالا بردن سازگاری فونت‌ها در نرم‌افزار Excel ایرانیان
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      // نام فا‌یل داینامیک مناسب
      const cleanTitleForFile = selectedPage.title.replace(/\s+/g, '_');
      link.setAttribute('download', `linkmesh_lite_${cleanTitleForFile}.csv`);
      
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('خطا در صادرات نتایج سئو:', err);
    }
  };

  if (activeLinks.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
      id="export_csv_btn"
      title="صادرات تمام کاندیداهای جدول به فرمت اکسل / CSV"
    >
      <Download className="w-3.5 h-3.5" />
      صادرات به CSV
    </button>
  );
};
