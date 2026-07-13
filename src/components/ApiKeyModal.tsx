/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../state/AppContext';
import { X, Key, Info, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey } = useApp();
  const [tempKey, setTempKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempKey(apiKey);
      setIsSaved(false);
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs font-sans" dir="rtl" id="api_key_modal">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full mx-4 overflow-hidden" id="modal_content_box">
        {/* هدر مودال */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/40" id="modal_header">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800 text-sm">تنظیم کلید هوش مصنوعی (Gemini API)</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            id="close_modal_btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه مودال */}
        <div className="p-6 space-y-4" id="modal_body">
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/30 rounded-xl text-xs text-indigo-800 space-y-1" id="keys_infotip">
            <div className="font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              توضیح سیستم اعتبارسنجی پلتفرم
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500">
              این کلید صرفاً به صورت کلاینت‌ساید ذخیره شده و جهت اجرای دکمهٔ «پولیش کاندیداها با هوش مصنوعی» مورد استفاده قرار می‌گیرد. در صورتی که کلید خودکار در سیستم پلتفرم تعریف شده باشد، نیازی به پر کردن این بخش نیست.
            </p>
          </div>

          <div id="api_input_group">
            <label className="text-xs font-bold text-slate-700 block mb-2">کلید اختصاصی Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl focus:outline-none transition-all font-mono text-left"
              id="api_key_input_field"
            />
          </div>
        </div>

        {/* فوتر مودال */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/20 flex justify-end gap-2" id="modal_footer">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            id="cancel_modal_btn"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 ${
              isSaved ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
            }`}
            id="save_modal_btn"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                کلید ذخیره شد
              </>
            ) : (
              'ذخیره تنظیمات'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
