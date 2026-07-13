/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

interface FileUploadZoneProps {
  type: 'pages' | 'impressions';
  fileName: string | null;
  dragActive: boolean;
  onDrag: (e: React.DragEvent, type: 'pages' | 'impressions', active: boolean) => void;
  onDrop: (e: React.DragEvent, type: 'pages' | 'impressions') => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'pages' | 'impressions') => void;
  title: string;
  subtitle: string;
  accentColor: 'emerald' | 'blue';
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  type,
  fileName,
  dragActive,
  onDrag,
  onDrop,
  onFileChange,
  title,
  subtitle,
  accentColor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBorderAndBgClasses = () => {
    if (dragActive) {
      return accentColor === 'emerald' 
        ? 'border-emerald-500 bg-emerald-50/40' 
        : 'border-blue-500 bg-blue-50/40';
    }
    if (fileName) {
      return 'border-slate-200 bg-slate-50/30 hover:border-slate-300';
    }
    return accentColor === 'emerald'
      ? 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50'
      : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/50';
  };

  const getIconColorClass = () => {
    if (accentColor === 'emerald') {
      return 'text-slate-400 group-hover:text-emerald-600';
    }
    return 'text-slate-400 group-hover:text-blue-600';
  };

  return (
    <div
      onDragOver={(e) => onDrag(e, type, true)}
      onDragLeave={(e) => onDrag(e, type, false)}
      onDrop={(e) => onDrop(e, type)}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${getBorderAndBgClasses()}`}
      id={`${type}_upload_zone`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileChange(e, type)}
        accept=".csv"
        className="hidden"
      />
      {fileName ? (
        <div className="text-center animate-none" id={`${type}_success`}>
          <CheckCircle2 className={`w-10 h-10 ${accentColor === 'emerald' ? 'text-emerald-600' : 'text-blue-600'} mx-auto mb-3`} />
          <p className="text-sm font-semibold text-slate-800">{fileName}</p>
          <p className="text-xs text-slate-400 mt-1">تغییر فایل با کلیک یا رها کردن فایل جدید</p>
        </div>
      ) : (
        <div className="text-center" id={`${type}_prompt`}>
          <UploadCloud className={`w-10 h-10 ${getIconColorClass()} mx-auto mb-3 transition-colors`} />
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
        </div>
      )}
    </div>
  );
};
