/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers } from 'lucide-react';

export const CandidateTableEmpty: React.FC = () => {
  return (
    <div className="p-12 text-center h-full flex flex-col items-center justify-center text-slate-400" id="table_empty_state">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
        <Layers className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-700">هیچ کاندیدای ارزیابی شده‌ای برای این صفحه وجود ندارد.</p>
      <p className="text-xs text-slate-400 mt-1">دیوارها یا تم‌های این صفحه مانع برقراری هرگونه تطابق شده است.</p>
    </div>
  );
};
