/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../state/AppContext';
import { SimilarityTableHeader } from './similarity-table/SimilarityTableHeader';
import { SimilarityTableEmpty } from './similarity-table/SimilarityTableEmpty';
import { SimilarityTableRow } from './similarity-table/SimilarityTableRow';
import { SimilarityTableFooter } from './similarity-table/SimilarityTableFooter';

export const SimilarityTable: React.FC = () => {
  const { pages, selectedPageId, matches } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);
  // ردیف‌ها از page_links می‌آیند و از قبل رتبه‌بندی‌شده‌اند — فقط نمایش
  const pageMatches = selectedPageId !== null ? matches[selectedPageId] || [] : [];

  if (!selectedPage) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]" id="candidate_table_container">
      <SimilarityTableHeader selectedPage={selectedPage} />

      <div className="flex-1 overflow-auto" id="table_scroller_wrapper">
        {pageMatches.length === 0 ? (
          <SimilarityTableEmpty />
        ) : (
          <table className="w-full text-right border-collapse" id="candidate_table_element">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100 z-1" id="table_head">
              <tr>
                <th className="py-3 px-3 w-12 text-center">رتبه</th>
                <th className="py-3 px-4">لندینگ‌پیج هدف</th>
                <th className="py-3 px-3 w-24 text-center">شباهت</th>
                <th className="py-3 px-3 w-24 text-center">امتیاز نهایی</th>
                <th className="py-3 px-4">دلیل رتبه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs" id="table_body">
              {pageMatches.map((match) => (
                <SimilarityTableRow key={match.id} match={match} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SimilarityTableFooter totalCount={pageMatches.length} />
    </div>
  );
};
