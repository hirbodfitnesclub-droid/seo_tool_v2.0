/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { FileUpload } from './components/FileUpload';
import { PageList } from './components/PageList';
import { CandidateTable } from './components/CandidateTable';
import { Key, Settings, Sparkles, Layers, Info } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';

function Dashboard() {
  const { pages, selectedPageId, candidates } = useApp();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const selectedPage = pages.find(p => p.id === selectedPageId);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans" dir="rtl" id="app_dashboard">
      {/* هدر بالای پورتال */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-xs" id="app_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 tracking-tight" id="header_logo">LinkMesh Lite</h1>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">سیستم تخصصی رتبه‌بندی پیوندهای داخلی سئو</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all rounded-lg"
              id="set_api_key_btn"
            >
              <Key className="w-3.5 h-3.5 text-slate-400" />
              تنظیمات کلید API هوش مصنوعی
            </button>
          </div>
        </div>
      </header>

      {/* محتوای اصلی داشبورد */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ۱. آپلودر مأخذ صفحات و ایمپرشن */}
        <FileUpload />

        {/* ۲. بخش ورک‌پلیس (تقسیم‌بندی گرید دو تایی) */}
        {pages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8" id="workspace_grid">
            {/* ستون راست: لیست لندینگ‌ها پیج‌ها */}
            <div className="lg:col-span-4" id="sidebar_col">
              <PageList />
            </div>

            {/* ستون چپ: تحلیل کاندیداها و خروجی‌های سئو */}
            <div className="lg:col-span-8 space-y-6" id="main_col">
              {selectedPage ? (
                <CandidateTable />
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center h-[650px] flex flex-col items-center justify-center" id="no_selected_placeholder">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">هیچ متقاضی یا صفحه‌ای انتخاب نشده است</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                    برای بررسی، بهینه‌سازی و صادرات کاندیداهای پیشنهادی هوشمند لینک داخلی، یکی از لندینگ‌پیج‌ها را از ویجت راست کلیک و معین نمایید.
                  </p>
                  
                  <div className="mt-6 flex items-center gap-2 bg-emerald-50/50 border border-emerald-50 px-4 py-2.5 rounded-xl text-xs text-emerald-800" id="tip_box">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    شما می‌توانید خروجی محاسباتی را با هوش مصنوعی جمینی پولیش نمایید.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* وضعیت نمایش خالی اولیه برای ترغیب آپلود */}
        {pages.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center max-w-xl mx-auto mt-12" id="intro_welcome_box">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">به LinkMesh Lite خوش آمدید</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              این ابزار تخصصی سئو با دریافت ساختارهای جدول صفحات سایت شما، الگوریتم نردبان معنایی دیوار ➔ حلقه ➔ پُرسازی را در مرورگر شما بدون بار مالی و به شکل آفلاین پردازش و طراحی می‌نماید.
            </p>
            <div className="mt-6 border-t border-slate-50 pt-6">
              <p className="text-[11px] text-slate-400">طراحی شده بر مبنای تورهای گردشگری هتل و مبصد داخلی (نمونه هماهنگ با نهال‌گشت)</p>
            </div>
          </div>
        )}
      </main>

      {/* مودال تخصیص کلید هوش مصنوعی */}
      <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
