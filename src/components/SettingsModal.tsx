/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { CHAT_MODELS } from '../config/models';
import { X, Settings, Check, HelpCircle } from 'lucide-react';
import { ModelId } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { selectedModel, setSelectedModel } = useApp();
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSelectModel = (modelId: ModelId) => {
    setSelectedModel(modelId);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs font-sans animate-none" dir="rtl" id="settings_modal">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full mx-4 overflow-hidden" id="modal_content_box">
        {/* سربرگ مودال */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/40" id="modal_header">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600 animate-spin-slow" />
            <span className="font-extrabold text-slate-800 text-sm">تنظیمات هوش مصنوعی</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            id="close_modal_btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه تنظیمات */}
        <div className="p-6 space-y-6" id="modal_body">
          {/* بخش انتخاب مدل چت */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">انتخاب مدل چت و بازرتبه‌بندی (Gemini API)</h4>
            <div className="space-y-2.5">
              {CHAT_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                     key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50/30' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{model.name}</h5>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{model.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* راهنما یا استاتوس ذخیره */}
          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800 font-bold">
              مدل فعال بازرتبه‌بندی به عنوان ترجیح شما ذخیره گردید.
            </div>
          )}
        </div>

        {/* دکمه اتمام */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/20 flex justify-end" id="modal_footer">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
            id="close_settings_btn"
          >
            بستن تنظیمات
          </button>
        </div>
      </div>
    </div>
  );
};
