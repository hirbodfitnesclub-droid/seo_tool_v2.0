/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FileUploadErrorProps {
  errorText: string;
}

export const FileUploadError: React.FC<FileUploadErrorProps> = ({ errorText }) => {
  return (
    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm animate-none" id="upload_error_box">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p>{errorText}</p>
    </div>
  );
};
