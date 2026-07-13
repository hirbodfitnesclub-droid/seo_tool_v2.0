/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { FinalLink } from '../../types';

interface CandidateTableRowProps {
  idx: number;
  link: FinalLink;
  onAnchorChange: (idx: number, val: string) => void;
  onReasonChange: (idx: number, val: string) => void;
  onDeleteRow: (idx: number) => void;
}

export const CandidateTableRow: React.FC<CandidateTableRowProps> = ({
  idx,
  link,
  onAnchorChange,
  onReasonChange,
  onDeleteRow
}) => {
  // دریافت استایل بصری مناسب بر اساس تم و اندیس هر حلقه
  const getRingBadgeStyle = (ring: number | undefined) => {
    if (ring === undefined) return 'bg-slate-100 text-slate-700';
    switch (ring) {
      case 0:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold';
      case 1:
        return 'bg-blue-50 text-blue-700 border border-blue-100 font-bold';
      case 2:
        return 'bg-cyan-50 text-cyan-750 border border-cyan-100';
      case 3:
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 3.5:
        return 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100';
      case 4:
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 4.5:
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group" id={`table_row_${idx}`}>
      {/* ستون اول: نام کاندیدا */}
      <td className="py-3 px-4 font-semibold text-slate-800" id={`cell_title_${idx}`}>
        <div className="truncate max-w-[220px]" title={link.page_title}>
          {link.page_title}
        </div>
      </td>

      {/* ستون دوم: انکر متن ویرایش‌پذیر */}
      <td className="py-3 px-4" id={`cell_anchor_${idx}`}>
        <input
          type="text"
          value={link.anchor_text}
          onChange={(e) => onAnchorChange(idx, e.target.value)}
          className="w-full px-2 py-1 text-xs text-indigo-900 bg-transparent hover:bg-slate-200/50 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-lg focus:outline-none focus:bg-white transition-all font-medium animate-none"
          title="کلیک جهت ویرایش سریع انکر تکست"
        />
      </td>

      {/* ستون سوم: دلیل سئویی رتبه‌دهنده ویرایش‌پذیر */}
      <td className="py-3 px-4" id={`cell_reason_${idx}`}>
        <textarea
          rows={2}
          value={link.seo_reason}
          onChange={(e) => onReasonChange(idx, e.target.value)}
          className="w-full px-2 py-1 text-xs text-slate-600 bg-transparent hover:bg-slate-200/50 border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:bg-white transition-all resize-none leading-relaxed"
          title="کلیک جهت اصلاح جملهٔ سئویی"
        />
      </td>

      {/* ستون چهارم: دپارتمان یا برچسب پیوند */}
      <td className="py-3 px-3 text-center" id={`cell_ring_${idx}`}>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getRingBadgeStyle(link.ring)}`}>
          {link.ring !== undefined ? `حلقه ${link.ring}` : 'ناشناس'}
        </span>
        <span className="block text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
          {link.relation_tag || 'عادی'}
        </span>
      </td>

      {/* ستون پنجم: حذف سطر */}
      <td className="py-3 px-3 text-center" id={`cell_delete_${idx}`}>
        <button
          onClick={() => onDeleteRow(idx)}
          className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
          title="حذف پیوند از لیست صادر شونده"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};
