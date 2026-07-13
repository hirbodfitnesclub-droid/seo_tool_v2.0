/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FileUploadHeaderProps {
  hasPages: boolean;
  onLoadSample: () => void;
  onClearAll: () => void;
}

export const FileUploadHeader: React.FC<FileUploadHeaderProps> = ({
  hasPages,
  onLoadSample,
  onClearAll
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight" id="upload_title">بارگذاری فایل‌های مأخذ</h2>
        <p className="text-sm text-slate-500 mt-1" id="upload_desc">
          برای رتبه‌بندی، دو فایل CSV (صفحات سایت متشکل از ۱۹ ستون + ایمپرشن) را بکشید و رها کنید.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onLoadSample}
          className="px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all active:scale-[98%]"
          id="load_sample_btn"
        >
          بارگذاری سناریوی نمونه (سریع)
        </button>
        {hasPages && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all"
            id="clear_data_btn"
          >
            پاک‌سازی داده‌ها
          </button>
        )}
      </div>
    </div>
  );
};
