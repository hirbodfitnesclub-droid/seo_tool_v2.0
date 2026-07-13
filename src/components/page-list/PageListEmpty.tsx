/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers } from 'lucide-react';

export const PageListEmpty: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center" id="empty_page_list">
      <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
        <Layers className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-600 font-medium text-sm">هیچ صفحه‌ای برای نمایش موجود نیست.</p>
      <p className="text-slate-400 text-xs mt-1">فایل‌های CSV را در فرم بالا آپلود کنید.</p>
    </div>
  );
};
