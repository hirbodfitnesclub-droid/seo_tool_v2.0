/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { parsePagesCsv } from '../services/csvService';
import { FileUploadHeader } from './file-upload/FileUploadHeader';
import { FileUploadZone } from './file-upload/FileUploadZone';
import { FileUploadError } from './file-upload/FileUploadError';
import { Loader2, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';

export const FileUpload: React.FC = () => {
  const {
    ingestPagesAction,
    ingestProgress,
    loading,
    clearAllDataAction,
    pages,
    phase,
    error: contextError,
  } = useApp();

  const [pagesFileName, setPagesFileName] = useState<string | null>(null);
  const [pagesDragActive, setPagesDragActive] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // بارگذاری داده نمونه و شروع خودکار
  const loadSampleData = async () => {
    setErrorText(null);
    try {
      const samplePagesCsv = `عنوان_H1,قاره_یا_منطقه,کشور_مقصد,جهت_در_منطقه,شهر_یا_جزیره_مقصد,شهر_یا_استان_مبدا,نوع_تور,فصل_برگزاری,ماه_تقویمی_برگزاری,تعطیلات_خاص_تقویمی,رویداد_یا_مناسبت_خاص,تم_یا_هدف_سفر,نوع_وسیله_نقلیه,نام_دقیق_هتل,تعداد_ستاره_هتل,برچسب_کلاسی_تور,پرسونای_مخاطب,وضعیت_ویزا,نوع_سفر
تور استانبول نوروز,آسیا,ترکیه,غرب,استانبول,تهران,هوایی,,فروردین,نوروز,,خرید,هواپیما,هتل هیلتون استانبول,۵ ستاره,لوکس,خانوادگی,,۷ شب
تور هتل هیلتون استانبول,آسیا,ترکیه,غرب,استانبول,تهران,هوایی,,,,,,استراحت,هواپیما,هتل هیلتون استانبول,۵ ستاره,لوکس,,,۷ شب
تور آنتالیا ارزان,آسیا,ترکیه,غرب,آنتالیا,تهران,هوایی,تابستان,تیر,,,ریلکس,هواپیما,هتل کنکورد آنتالیا,۵ ستاره,اقتصادی,,,۶ شب
تور وان زمینی,آسیا,ترکیه,غرب,وان,تبریز,زمینی,زمستان,دی,,,خرید,اتوبوس,هتل رویال وان,۳ ستاره,ارزان,,,۳ شب
تور تفلیس هوایی,اروپا,گرجستان,قفقاز,تفلیس,تهران,هوایی,بهار,اردیبهشت,,,فرهنگی,هواپیما,هتل ایبیس تفلیس,۴ ستاره,منصفانه,,,۴ شب
تور باتومی ساحلی,اروپا,گرجستان,قفقاز,باتومی,تهران,هوایی,تابستان,مرداد,,,ساحل,هواپیما,هتل شرایتون باتومی,۵ ستاره,لوکس,,,۵ شب
تور دبی لوکس,آسیا,امارات,خلیج,دبی,تهران,هوایی,,بهمن,,رمضان,خرید,هواپیما,هتل برج العرب دبی,۵ ستاره,vip,خانوادگی,,۵ شب
تور ارمنستان زمینی زمستانه,اروپا,ارمنستان,قفقاز,ایروان,تهران,زمینی,زمستان,اسفند,,,تاریخی,اتوبوس,هتل آنی پلازا,۴ ستاره,اقتصادی,,,۴ شب
تور بانکوک و پوکت ترکیبی,آسیا,تایلند,جنوب‌شرق آسیا,پوکت,تهران,ترکیبی,پاییز,آذر,,,طبیعت,هواپیما,هتل نووتل پوکت,۴ ستاره,متنوع,,,۹ شب
تور جزیره مالدیو ویژه,آسیا,مالدیو,جنوب آسیا,مالدیو,تهران,هوایی,بهار,اردیبهشت,,,ریلکس,هواپیما,هتل رویال آیلند,۵ ستاره,خاص,لاکچری,,۷ شب
تور کیش نوروزی,ایران,ایران,,کیش,تهران,هوایی,,فروردین,نوروز,,ساحل,هواپیما,هتل داریوش کیش,۵ ستاره,ویژه,خانوادگی,,۴ شب
تور قشم زمینی ارزان,ایران,ایران,,قشم,اصفهان,زمینی,پاییز,مهر,,,طبیعت,قطار,هتل آپارتمان قشم,۳ ستاره,ارزان,,,۵ شب
تور مشهد هوایی زیارتی,ایران,ایران,,مشهد,مشهد,هوایی,,آذر,,,زیارتی,هواپیما,هتل درویشی مشهد,۵ ستاره,لوکس,مذهبی,,۳ شب`;

      const parsedPages = await parsePagesCsv(samplePagesCsv);
      setPagesFileName('pages_sample.csv (تورهای نمونه)');
      // اجرای خودکار بلافاصله پس از parse
      await ingestPagesAction(parsedPages);
    } catch (err: any) {
      setErrorText('خطا در بارگذاری داده‌های نمونه: ' + err.message);
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'pages' | 'impressions', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'pages') setPagesDragActive(active);
  };

  const handleDrop = (e: React.DragEvent, type: 'pages' | 'impressions') => {
    e.preventDefault();
    e.stopPropagation();
    setPagesDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pages' | 'impressions') => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // پردازش فایل CSV و شروع خودکار امبدینگ
  const processFile = async (file: File) => {
    setErrorText(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      try {
        const parsedPages = await parsePagesCsv(text);
        if (parsedPages.length === 0) {
          throw new Error('فایل خالی یا بدون ساختار معتبر هدرهای فارسی است.');
        }
        setPagesFileName(file.name);
        // شروع خودکار — بدون دکمه
        await ingestPagesAction(parsedPages);
      } catch (err: any) {
        setErrorText(`خطا در پردازش فایل صفحات: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    setPagesFileName(null);
    setErrorText(null);
    await clearAllDataAction();
  };

  const isEmbedding = phase === 'embedding';
  const isRanking  = phase === 'ranking';
  const isDone     = phase === 'done';
  const isError    = phase === 'error';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 mb-6" id="file_upload_section">
      <FileUploadHeader
        hasPages={pages.length > 0}
        onLoadSample={loadSampleData}
        onClearAll={handleClearAll}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="drag_drop_grid">
        <FileUploadZone
          type="pages"
          fileName={pagesFileName}
          dragActive={pagesDragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          title="بارگذاری فایل صفحات (pages.csv)"
          subtitle="شامل ۱۹ ستون اطلاعات و برچسب‌های توصیفی تور"
          accentColor="emerald"
        />

        {/* پانل وضعیت جریان خودکار */}
        <div className="border border-slate-100 bg-slate-50/40 rounded-xl p-6 flex flex-col items-center justify-center text-center select-none gap-3" id="status_zone">
          {isEmbedding && (
            <>
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">در حال تولید امبدینگ برداری...</p>
              <p className="text-xs text-slate-400">مدل Gemini-Embedding-2 • بُعد ۱۵۳۶ • SEMANTIC_SIMILARITY</p>
            </>
          )}
          {isRanking && (
            <>
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">در حال رتبه‌بندی هیبریدی همهٔ صفحات...</p>
              <p className="text-xs text-slate-400">بردار + تگ‌های ساختاری • بدون هوش مصنوعی</p>
            </>
          )}
          {isDone && (
            <>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">رتبه‌بندی کامل شد</p>
              <p className="text-xs text-slate-400">{pages.length} صفحه آماده — از ستون راست انتخاب کنید</p>
            </>
          )}
          {isError && (
            <>
              <AlertCircle className="w-8 h-8 text-rose-600" />
              <p className="text-sm font-bold text-rose-700">خطا در پردازش</p>
              <p className="text-xs text-rose-400 max-w-xs leading-relaxed">{contextError}</p>
            </>
          )}
          {!isEmbedding && !isRanking && !isDone && !isError && (
            <>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">امبدینگ هیبریدی — رتبه‌بندی خودکار</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                پس از آپلود CSV، امبدینگ و رتبه‌بندی کل صفحات به‌صورت خودکار اجرا می‌شود.
              </p>
            </>
          )}
        </div>
      </div>

      {/* نوار پیشرفت زندهٔ امبدینگ */}
      {isEmbedding && ingestProgress && (
        <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-5" id="ingest_progress_panel">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-xs font-bold text-slate-700">در حال تولید بردار معنایی و آپلود...</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600" dir="ltr">
              {ingestProgress.current} / {ingestProgress.total}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${(ingestProgress.current / ingestProgress.total) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500">
            <span className="text-emerald-600">ثبت شده: {ingestProgress.inserted} مورد</span>
            {ingestProgress.failed > 0 && <span className="text-rose-600">ناکام: {ingestProgress.failed} مورد</span>}
          </div>
          {ingestProgress.errors.length > 0 && (
            <div className="mt-3 max-h-24 overflow-y-auto text-[10px] text-rose-500 bg-rose-50/50 p-2.5 rounded-lg border border-rose-50/50 space-y-1">
              {ingestProgress.errors.slice(0, 5).map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
              {ingestProgress.errors.length > 5 && <p>و {ingestProgress.errors.length - 5} خطای دیگر...</p>}
            </div>
          )}
        </div>
      )}

      {errorText && <FileUploadError errorText={errorText} />}
    </div>
  );
};
