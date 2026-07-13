/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../state/AppContext';
import { CandidateTableHeader } from './candidate-table/CandidateTableHeader';
import { CandidateTableEmpty } from './candidate-table/CandidateTableEmpty';
import { CandidateTableRow } from './candidate-table/CandidateTableRow';
import { CandidateTableFooter } from './candidate-table/CandidateTableFooter';

export const CandidateTable: React.FC = () => {
  const { pages, selectedPageId, results, updateFinalLinks } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const links = selectedPageId !== null ? results[selectedPageId] || [] : [];

  if (!selectedPage) return null;

  // مدیریت ویرایش فرآیند کلاینت‌ساید همزمان متن انکر
  const handleAnchorChange = (idx: number, newVal: string) => {
    if (selectedPageId === null) return;
    const updated = [...links];
    updated[idx] = { ...updated[idx], anchor_text: newVal };
    updateFinalLinks(selectedPageId, updated);
  };

  // مدیریت ویرایش همزمان دلیل سئویی در سطرها
  const handleReasonChange = (idx: number, newVal: string) => {
    if (selectedPageId === null) return;
    const updated = [...links];
    updated[idx] = { ...updated[idx], seo_reason: newVal };
    updateFinalLinks(selectedPageId, updated);
  };

  // حذف تک‌گزینه کاندیدا از جدول
  const handleDeleteRow = (idx: number) => {
    if (selectedPageId === null) return;
    const updated = links.filter((_, i) => i !== idx);
    updateFinalLinks(selectedPageId, updated);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]" id="candidate_table_container">
      {/* سرستون تنظیمات صفحه و دکمه‌های کنترلی بالای جدول */}
      <CandidateTableHeader selectedPage={selectedPage} />

      {/* بخش نمایش جدول کاندیداها */}
      <div className="flex-1 overflow-auto" id="table_scroller_wrapper">
        {links.length === 0 ? (
          <CandidateTableEmpty />
        ) : (
          <table className="w-full text-right border-collapse" id="candidate_table_element">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100 z-1" id="table_head">
              <tr>
                <th className="py-3 px-4 w-[240px]">تور کاندیدا (مقصد)</th>
                <th className="py-3 px-4 w-[180px]">متن انکر سئو (کلیک کنید)</th>
                <th className="py-3 px-4">جواز / دلیل سئویی الگوریتم</th>
                <th className="py-3 px-3 w-[120px] text-center">شاخص معنایی</th>
                <th className="py-3 px-3 w-[60px] text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs" id="table_body">
              {links.map((link, idx) => (
                <CandidateTableRow
                  key={idx}
                  idx={idx}
                  link={link}
                  onAnchorChange={handleAnchorChange}
                  onReasonChange={handleReasonChange}
                  onDeleteRow={handleDeleteRow}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* پی‌نوشت شمارشی جدول */}
      <CandidateTableFooter totalCount={links.length} />
    </div>
  );
};
