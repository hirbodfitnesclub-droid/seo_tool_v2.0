/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export const SimilarityTableEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]" id="empty_candidates_state">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-3 animate-pulse">
        <Sparkles className="w-6 h-6 text-emerald-600" />
      </div>
      <h4 className="text-sm font-bold text-slate-700">هیچ کاندیدای همسایه‌ای یافت نشد</h4>
      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1.5 leading-relaxed">
        برای صفحه مبدا انتخاب شده هیچ کاندیدای مشابهی در پایگاه داده برداری پیدا نشد. لطفاً صفحات را مجدداً آپلود و امبد نمایید.
      </p>
    </div>
  );
};
