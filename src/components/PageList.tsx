/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { PageListHeader } from './page-list/PageListHeader';
import { PageListEmpty } from './page-list/PageListEmpty';
import { PageListNoResults } from './page-list/PageListNoResults';
import { PageListItem } from './page-list/PageListItem';

export const PageList: React.FC = () => {
  const { pages, selectedPageId, setSelectedPageId, candidates } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // فیلتر کردن صفحات بر اساس عبارت جستجو شده در عنوان، کشور یا شهر مقصد
  const filteredPages = pages.filter(p => {
    const text = searchTerm.toLowerCase();
    const titleMatch = p.title ? p.title.toLowerCase().includes(text) : false;
    const countryMatch = p.country ? p.country.toLowerCase().includes(text) : false;
    const cityMatch = p.city ? p.city.toLowerCase().includes(text) : false;
    return titleMatch || countryMatch || cityMatch;
  });

  if (pages.length === 0) {
    return <PageListEmpty />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[650px]" id="page_list_container">
      {/* هدر جستجو */}
      <PageListHeader
        totalCount={pages.length}
        filteredCount={filteredPages.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* لیست صفحات فیلتر شده */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50" id="pages_scroller">
        {filteredPages.length === 0 ? (
          <PageListNoResults />
        ) : (
          filteredPages.map(page => (
            <PageListItem
              key={page.id}
              page={page}
              isSelected={selectedPageId === page.id}
              targetCount={candidates[page.id]?.length || 0}
              onSelect={() => setSelectedPageId(page.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
