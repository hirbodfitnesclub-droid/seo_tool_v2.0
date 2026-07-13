/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MatchResult, RerankResult } from '../../types';
import { MapPin, Sparkles } from 'lucide-react';

interface SimilarityTableRowProps {
  idx: number;
  match: MatchResult;
  rerank: RerankResult | undefined;
}

export const SimilarityTableRow: React.FC<SimilarityTableRowProps> = ({
  idx,
  match,
  rerank
}) => {
  const currentReason = rerank?.seo_reason || '';
  const similarityPercent = Math.round(match.similarity * 100);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors" id={`row_candidate_${match.id}`}>
      {/* عنوان کاندیدا و ویژگی‌های مکانی */}
      <td className="py-3.5 px-4 font-semibold text-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {rerank?.rank !== undefined && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                رتبه {rerank.rank}
              </span>
            )}
            <span className="truncate max-w-[200px]" title={match.title}>{match.title}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-slate-300" />
              {match.city || match.country || 'نامشخص'}
            </span>
            {match.theme && (
              <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                {match.theme}
              </span>
            )}
            {match.season && (
              <span className="bg-blue-50 text-blue-600 px-1 py-0.2 rounded">
                فصل {match.season}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* درصد تشابه برداری معنایی */}
      <td className="py-3.5 px-3 text-center">
        <div className="flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-slate-700">{similarityPercent}%</span>
          {/* پروگرس بار کوچک تشابه */}
          <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${similarityPercent}%` }}
            />
          </div>
        </div>
      </td>

      {/* دلیل سئویی هوش مصنوعی (ادیتور درون خطی مستقل) */}
      <td className="py-3.5 px-4 text-slate-600">
        {rerank ? (
          <div className="flex items-center gap-2" id={`reason_cell_${match.id}`}>
            <div className="flex items-center justify-between w-full">
              <p className="text-xs leading-relaxed text-slate-600 pl-4">{currentReason}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-slate-300 animate-pulse" />
            <span>منتظر اجرای رتبه‌بندی هوشمند جمینی...</span>
          </div>
        )}
      </td>
    </tr>
  );
};
