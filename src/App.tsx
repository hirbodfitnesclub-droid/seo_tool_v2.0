/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { FileUpload } from './components/FileUpload';
import { PageList } from './components/PageList';
import { SimilarityTable } from './components/SimilarityTable';
import { Layers, Sparkles } from 'lucide-react';

function Dashboard() {
  const { pages, selectedPageId } = useApp();

  const selectedPage = pages.find(p => p.id === selectedPageId);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans" dir="rtl" id="app_dashboard">
      {/* هدر */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-xs" id="app_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 tracking-tight" id="header_logo">LinkMesh Lite 3.0</h1>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">رتبه‌بندی هیبریدی قطعی • بردار + تگ‌های ساختاری سئو</p>
            </div>
          </div>
        </div>
      </header>

      {/* محتوای اصلی */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <FileUpload />

        {pages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8" id="workspace_grid">
            <div className="lg:col-span-4" id="sidebar_col">
              <PageList />
            </div>

            <div className="lg:col-span-8 space-y-6" id="main_col">
              {selectedPage ? (
                <SimilarityTable />
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center h-[650px] flex flex-col items-center justify-center" id="no_selected_placeholder">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">هیچ صفحه‌ای انتخاب نشده است</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                    یکی از لندینگ‌پیج‌ها را از ستون سمت راست انتخاب کنید تا ۳۰ پیشنهاد رتبه‌بندی‌شده با دلیل سئویی نمایش داده شود.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {pages.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center max-w-xl mx-auto mt-12" id="intro_welcome_box">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">به LinkMesh Lite 3.0 خوش آمدید</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              فایل CSV صفحات سایت را آپلود کنید یا داده نمونه را بارگذاری کنید. امبدینگ و رتبه‌بندی هیبریدی به‌صورت خودکار اجرا می‌شود.
            </p>
            <div className="mt-6 border-t border-slate-50 pt-6">
              <p className="text-[11px] text-slate-400">رتبه‌بندی قطعی: بردار معنایی Gemini (۱۵۳۶ بُعد) + تگ‌های ساختاری سئو — بدون هزینهٔ هوش مصنوعی</p>
            </div>
          </div>
        )}
      </main>
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
