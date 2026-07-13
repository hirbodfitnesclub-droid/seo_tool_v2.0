/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';

export const PageListNoResults: React.FC = () => {
  return (
    <div className="p-8 text-center text-slate-400 text-xs" id="no_search_results">
      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      موردی منطبق با جستجوی شما یافت نشد.
    </div>
  );
};
