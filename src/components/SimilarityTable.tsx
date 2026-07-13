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
  const { 
    pages, 
    selectedPageId, 
    matches, 
    rerankResults 
  } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const pageMatches = selectedPageId !== null ? matches[selectedPageId] || [] : [];
  const pageReranks = selectedPageId !== null ? rerankResults[selectedPageId] || [] : [];

  if (!selectedPage) return null;

  const hasReranked = pageReranks.length > 0;

  // مرتب‌سازی کاندیداها: در صورت بازرتبه‌بندی، اولویت با رتبه AI است؛ در غیر این صورت، بر اساس میزان شباهت برداری
  const sortedMatches = [...pageMatches].sort((a, b) => {
    const aRerank = pageReranks.find(r => r.id === a.id);
    const bRerank = pageReranks.find(r => r.id === b.id);
    
    if (aRerank !== undefined && bRerank !== undefined) {
      return aRerank.rank - bRerank.rank;
    }
    // در صورتی که فقط یکی رتبه داشته باشد (که نامتعارف است) رتبه‌دار بالاتر قرار می‌گیرد
    if (aRerank !== undefined) return -1;
    if (bRerank !== undefined) return 1;

    return b.similarity - a.similarity;
  });

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]" id="candidate_table_container">
      {/* هدر بالایی جدول به انضمام عنوان صفحه و کلیدهای اکشن */}
      <SimilarityTableHeader selectedPage={selectedPage} />

      {/* ناحیه اسکرول اصلی جدول کاندیداها */}
      <div className="flex-1 overflow-auto" id="table_scroller_wrapper">
        {sortedMatches.length === 0 ? (
          <SimilarityTableEmpty />
        ) : (
          <table className="w-full text-right border-collapse" id="candidate_table_element">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100 z-1" id="table_head">
              <tr>
                <th className="py-3 px-4 w-[240px]">لندینگ‌پیج کاندیدا (هدف)</th>
                <th className="py-3 px-3 w-[120px] text-center">شباهت معنایی</th>
                <th className="py-3 px-4">توجیه / دلیل ارتباط پیوند سئو</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs" id="table_body">
              {sortedMatches.map((match, idx) => {
                const rerankInfo = pageReranks.find(r => r.id === match.id);
                return (
                  <SimilarityTableRow
                    key={match.id}
                    idx={idx}
                    match={match}
                    rerank={rerankInfo}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* بخش شمارشگر کاندیداها و وضعیت هوش مصنوعی */}
      <SimilarityTableFooter 
        totalCount={sortedMatches.length} 
        hasReranked={hasReranked} 
      />
    </div>
  );
};
