/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../state/AppContext';
import { parsePagesCsv, parseImpressionsCsv } from '../services/csvService';
import { buildWeightMap } from '../services/impressionService';
import { FileUploadHeader } from './file-upload/FileUploadHeader';
import { FileUploadZone } from './file-upload/FileUploadZone';
import { FileUploadError } from './file-upload/FileUploadError';
import { FileUploadActions } from './file-upload/FileUploadActions';

export const FileUpload: React.FC = () => {
  const { setPages, setWeights, runInterlinking, isLoading, clearAll, pages } = useApp();
  
  const [pagesFileName, setPagesFileName] = useState<string | null>(null);
  const [impressionsFileName, setImpressionsFileName] = useState<string | null>(null);
  
  const [pagesDragActive, setPagesDragActive] = useState(false);
  const [impressionsDragActive, setImpressionsDragActive] = useState(false);
  
  const [errorText, setErrorText] = useState<string | null>(null);

  // لود داده‌های نمونه جهت تسریع دمو و بررسی مکانیزم سیستم بدون زحمت کاربر
  const loadSampleData = async () => {
    setErrorText(null);
    try {
      // داده نمونه گردشگری هماهنگ با ماهیت "نهال‌گشت"
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

      const sampleImpressionsCsv = `آدرس صفحه,عنوان (H1),ایمپرشن
/tours/istanbul-nowruz,تور استانبول نوروز,"25,000"
/tours/hotel-hilton-istanbul,تور هتل هیلتون استانبول,"4,500"
/tours/antalya-budget,تور آنتالیا ارزان,"18,200"
/tours/van-land,تور وان زمینی,"1,200"
/tours/tbilisi-air,تور تفلیس هوایی,980
/tours/batumi-beach,تور باتومی ساحلی,"3,400"
/tours/dubai-luxury,تور دبی لوکس,"14,500"
/tours/yerevan-winter,تور ارمنستان زمینی زمستانه,"1,100"
/tours/bangkok-phuket,تور بانکوک و پوکت ترکیبی,"7,600"
/tours/maldives-special,تور جزیره مالدیو ویژه,880
/tours/kish-nowruz,تور کیش نوروزی,"32,000"
/tours/qeshm-budget,تور قشم زمینی ارزان,250
/tours/mashhad-religious,تور مشهد هوایی زیارتی,"12,000"`;

      setPagesFileName('pages_sample.csv (نمونه تورهای نهال‌گشت)');
      setImpressionsFileName('impressions_sample.csv (نمونه ایمپرشن)');
      
      const parsedPages = await parsePagesCsv(samplePagesCsv);
      const parsedImpressions = await parseImpressionsCsv(sampleImpressionsCsv);
      const computedWeights = buildWeightMap(parsedImpressions);
      
      setPages(parsedPages);
      setWeights(computedWeights);
      runInterlinking(parsedPages, computedWeights);
    } catch (err: any) {
      setErrorText('خطا در فرآیند آماده‌سازی داده‌های نمونه: ' + err.message);
    }
  };

  // مدیریت رویداد درگ اند دراپ با ارسال به زون مناسب
  const handleDrag = (e: React.DragEvent, type: 'pages' | 'impressions', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'pages') {
      setPagesDragActive(active);
    } else {
      setImpressionsDragActive(active);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'pages' | 'impressions') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'pages') {
      setPagesDragActive(false);
    } else {
      setImpressionsDragActive(false);
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pages' | 'impressions') => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], type);
    }
  };

  // پردازش و پارس فایل ورودی
  const processFile = async (file: File, type: 'pages' | 'impressions') => {
    setErrorText(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      try {
        if (type === 'pages') {
          const parsedPages = await parsePagesCsv(text);
          if (parsedPages.length === 0) {
            throw new Error('فایلی خالی یا بدون عنوان_H1 معتبر بارگذاری شده است.');
          }
          setPages(parsedPages);
          setPagesFileName(file.name);
        } else {
          const parsedImpressions = await parseImpressionsCsv(text);
          const computedWeights = buildWeightMap(parsedImpressions);
          setWeights(computedWeights);
          setImpressionsFileName(file.name);
        }
      } catch (err: any) {
        setErrorText(`خطا در پردازش فایل ${file.name}: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    clearAll();
    setPagesFileName(null);
    setImpressionsFileName(null);
    setErrorText(null);
  };

  const triggerInterlinkCalculation = () => {
    if (pages.length === 0) {
      setErrorText('لطفاً ابتدا فایل صفحات سایت را بارگذاری نمایید.');
      return;
    }
    runInterlinking();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6" id="file_upload_section">
      {/* هدر بالایی لود سناریو و عنوان */}
      <FileUploadHeader
        hasPages={pages.length > 0}
        onLoadSample={loadSampleData}
        onClearAll={handleClearAllData}
      />

      {/* بخش درگ‌دراپ فایل‌ها به شکل دو گرید مجزا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="drag_drop_grid">
        <FileUploadZone
          type="pages"
          fileName={pagesFileName}
          dragActive={pagesDragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          title="بارگذاری فایل صفحات (pages.csv)"
          subtitle="شامل ۱۹ ستون اطلاعات ساختاری تورها"
          accentColor="emerald"
        />

        <FileUploadZone
          type="impressions"
          fileName={impressionsFileName}
          dragActive={impressionsDragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          title="بارگذاری فایل ایمپرشن (impressions.csv)"
          subtitle="دیتا پرفورمنس سرچ کنسول (انتخابی)"
          accentColor="blue"
        />
      </div>

      {/* نمایش پیام‌های خطا در صورت وجود */}
      {errorText && <FileUploadError errorText={errorText} />}

      {/* کلید فلوتینگ شروع تحلیل و پیوندزنی */}
      {pages.length > 0 && (
        <FileUploadActions
          isLoading={isLoading}
          onTrigger={triggerInterlinkCalculation}
        />
      )}
    </div>
  );
};
