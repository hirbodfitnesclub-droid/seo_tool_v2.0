/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MatchResult } from '../../types';
import { MapPin } from 'lucide-react';

interface SimilarityTableRowProps {
  match: MatchResult;
}

export const SimilarityTableRow: React.FC<SimilarityTableRowProps> = ({ match }) => {
  const similarityPercent = Math.round(match.similarity * 100);
  const finalScorePercent = Math.round(match.final_score * 100);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors" id={`row_candidate_${match.id}`}>
      {/* رتبه */}
      <td className="py-3.5 px-3 text-center w-12">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
          {match.rank}
        </span>
      </td>

      {/* عنوان کاندیدا و ویژگی‌های مکانی */}
      <td className="py-3.5 px-4 font-semibold text-slate-800">
        <div className="flex flex-col gap-1">
          <span className="truncate max-w-[200px]" title={match.title}>{match.title}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-slate-300" />
              {match.city || match.country || 'نامشخص'}
            </span>
            {match.theme && (
              <span className="bg-slate-100 text-slate-600 px-1 rounded">{match.theme}</span>
            )}
            {match.season && (
              <span className="bg-blue-50 text-blue-600 px-1 rounded">فصل {match.season}</span>
            )}
          </div>
        </div>
      </td>

      {/* شباهت معنایی */}
      <td className="py-3.5 px-3 text-center w-24">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-mono font-bold text-slate-700 text-xs">{similarityPercent}%</span>
          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${similarityPercent}%` }} />
          </div>
        </div>
      </td>

      {/* امتیاز نهایی هیبریدی */}
      <td className="py-3.5 px-3 text-center w-24">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-mono font-bold text-emerald-700 text-xs">{finalScorePercent}%</span>
          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${finalScorePercent}%` }} />
          </div>
        </div>
      </td>

      {/* دلیل رتبه */}
      <td className="py-3.5 px-4 text-slate-600">
        <p className="text-xs leading-relaxed">{match.reason}</p>
      </td>
    </tr>
  );
};
