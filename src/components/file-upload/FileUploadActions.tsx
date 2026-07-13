/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

interface FileUploadActionsProps {
  isLoading: boolean;
  onTrigger: () => void;
}

export const FileUploadActions: React.FC<FileUploadActionsProps> = ({ isLoading, onTrigger }) => {
  return (
    <div className="mt-6 flex justify-end" id="action_row">
      <button
        onClick={onTrigger}
        disabled={isLoading}
        className="px-6 py-3 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 active:scale-95"
        id="run_computation_btn"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            در حال پردازش نردبانی و دیواربندی...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            اجرای موتور مدل‌سازی پیوندهای داخلی
          </>
        )}
      </button>
    </div>
  );
};
