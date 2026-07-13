/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CandidateTableFooterProps {
  totalCount: number;
}

export const CandidateTableFooter: React.FC<CandidateTableFooterProps> = ({ totalCount }) => {
  return (
    <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center" id="table_footer_meta">
      <span>تعداد کل نتایج آماده خروجی: {totalCount} کاندیدا</span>
      <span>الگوریتم بر مبنای سقف ۳۰-تایی از دیوارها عبور کرده است.</span>
    </div>
  );
};
