/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Page } from '../../types';
import { AiRerankButton } from '../AiRerankButton';
import { ExportButton } from '../ExportButton';

interface SimilarityTableHeaderProps {
  selectedPage: Page;
}

export const SimilarityTableHeader: React.FC<SimilarityTableHeaderProps> = ({ selectedPage }) => {
  return (
    <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="table_actions_header">
      <div className="min-w-0" id="table_page_title_section">
        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">بررسی کاندیداها</span>
        <h3 className="text-base font-extrabold text-slate-800 mt-2 truncate" title={selectedPage.title}>
          {selectedPage.title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
          <span>قلمرو: {selectedPage.city || selectedPage.country || 'نامشخص'}</span>
          {selectedPage.season && <span>• فصل برگزاری: {selectedPage.season}</span>}
          {selectedPage.theme && <span className="text-emerald-600 font-semibold">• تم: {selectedPage.theme}</span>}
        </p>
      </div>

      {/* اکشن‌های همبستگی معنایی و اکسپورت */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto" id="table_btn_group">
        <AiRerankButton />
        <ExportButton />
      </div>
    </div>
  );
};
