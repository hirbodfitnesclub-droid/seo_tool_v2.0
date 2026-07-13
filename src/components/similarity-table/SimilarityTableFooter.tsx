/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info } from 'lucide-react';

interface SimilarityTableFooterProps {
  totalCount: number;
}

export const SimilarityTableFooter: React.FC<SimilarityTableFooterProps> = ({ totalCount }) => {
  return (
    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2" id="table_footer_info">
      <p className="text-[10px] text-slate-400 font-bold">
        نمایش {totalCount} پیشنهاد رتبه‌بندی‌شده بر اساس امتیاز هیبریدی
      </p>
      <div className="flex items-center gap-1.5 text-[9px] text-emerald-800 bg-emerald-50/50 border border-emerald-50 px-2.5 py-1 rounded-lg">
        <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        <span>رتبه‌بندی بر اساس بردار معنایی + تگ‌های ساختاری سئو (قطعی — بدون هوش مصنوعی)</span>
      </div>
    </div>
  );
};
