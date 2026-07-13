/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { Page } from '../../types';

interface PageListItemProps {
  page: Page;
  isSelected: boolean;
  targetCount: number;
  onSelect: () => void;
}

export const PageListItem: React.FC<PageListItemProps> = ({
  page,
  isSelected,
  targetCount,
  onSelect
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 cursor-pointer transition-all flex justify-between items-start gap-3 select-none ${
        isSelected 
          ? 'bg-emerald-50/80 border-r-4 border-emerald-600 text-emerald-900 font-semibold' 
          : 'hover:bg-slate-50 text-slate-700'
      }`}
      id={`page_item_${page.id}`}
    >
      <div className="flex-1 min-w-0" id={`p_meta_${page.id}`}>
        <h4 className="font-semibold text-sm leading-snug truncate" title={page.title}>
          {page.title}
        </h4>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {page.city || page.country || 'مقصدی نامشخص'}
          </span>
          {page.origin && (
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
              از {page.origin}
            </span>
          )}
          {page.theme && (
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-medium text-[9px] flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              {page.theme}
            </span>
          )}
        </div>
      </div>

      <div className="text-left flex-shrink-0" id={`p_count_section_${page.id}`}>
        <span className={`inline-block px-2 py-1 text-xs rounded-full font-bold ${
          targetCount > 0 
            ? 'bg-emerald-50 text-emerald-700' 
            : 'bg-slate-100 text-slate-400'
        }`}>
          {targetCount} همسایه
        </span>
      </div>
    </div>
  );
};
