/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search } from 'lucide-react';

interface PageListHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export const PageListHeader: React.FC<PageListHeaderProps> = ({
  totalCount,
  filteredCount,
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="p-4 border-b border-slate-100 bg-slate-50/50" id="search_header">
      <label className="text-xs font-semibold text-slate-500 block mb-2">
        لیست صفحات هدف ({filteredCount} از {totalCount})
      </label>
      <div className="relative" id="search_wrapper">
        <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
        <input
          type="text"
          placeholder="جستجو در عنوان یا مقصد..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-3 pr-10 py-1.5 text-sm bg-white border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-none transition-colors"
          id="search_pages_input"
        />
      </div>
    </div>
  );
};
