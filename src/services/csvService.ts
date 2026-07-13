/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import { Page, ImpressionRow, FinalLink } from '../types';

// واکشی کلیدهای معادل برای پردازش پویا و مقاوم در برابر سر‌آیندهای متغیر
const PAGES_HEADER_MAP: Record<string, keyof Page> = {
  'عنوان_h1': 'title',
  'عنوان': 'title',
  'عنوان h1': 'title',
  'قاره_یا_منطقه': 'continent',
  'قاره': 'continent',
  'کشور_مقصد': 'country',
  'کشور': 'country',
  'جهت_در_منطقه': 'direction',
  'جهت': 'direction',
  'شهر_یا_جزیره_مقصد': 'city',
  'شهر': 'city',
  'شهر_یا_استان_مبدا': 'origin',
  'مبدا': 'origin',
  'نوع_تور': 'tourType',
  'فصل_برگزاری': 'season',
  'فصل': 'season',
  'ماه_تقویمی_برگزاری': 'month',
  'ماه': 'month',
  'تعطیلات_خاص_تقویمی': 'holiday',
  'تعطیلات': 'holiday',
  'رویداد_یا_مناسبت_خاص': 'occasion',
  'مناسبت': 'occasion',
  'تم_یا_هدف_سفر': 'theme',
  'تم': 'theme',
  'نوع_وسیله_نقلیه': 'vehicle',
  'وسیله': 'vehicle',
  'نام_دقیق_هتل': 'hotelName',
  'هتل': 'hotelName',
  'تعداد_ستاره_هتل': 'hotelStars',
  'ستاره': 'hotelStars',
  'برچسب_کلاسی_تور': 'classLabel',
  'برچسب': 'classLabel',
  'پرسونای_مخاطب': 'audiencePersona',
  'پرسونا': 'audiencePersona',
  'وضعیت_ویزا': 'visaStatus',
  'ویزا': 'visaStatus',
  'نوع_سفر': 'travelType'
};

const IMPRESSIONS_HEADER_MAP: Record<string, keyof ImpressionRow> = {
  'آدرس صفحه': 'url',
  'آدرس': 'url',
  'url': 'url',
  'عنوان (h1)': 'title',
  'عنوان_h1': 'title',
  'عنوان': 'title',
  'ایمپرشن': 'impression',
  'impression': 'impression'
};

// پارس کردن فایل CSV صفحات
export function parsePagesCsv(csvText: string): Promise<Page[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const pages: Page[] = [];
        const headers = results.meta.fields || [];

        results.data.forEach((row, index) => {
          const pageObj: Partial<Page> = {
            id: index,
            title: '',
            continent: '',
            country: '',
            direction: '',
            city: '',
            origin: '',
            tourType: '',
            season: '',
            month: '',
            holiday: '',
            occasion: '',
            theme: '',
            vehicle: '',
            hotelName: '',
            hotelStars: '',
            classLabel: '',
            audiencePersona: '',
            visaStatus: '',
            travelType: ''
          };

          // نگاشت یا فالبک بر اساس موقعیت ستون‌ها در صورت ناهماهنگی نام سرآیند
          headers.forEach((header) => {
            const cleanHeader = header.trim().toLowerCase();
            const mappedKey = PAGES_HEADER_MAP[cleanHeader];
            if (mappedKey) {
              (pageObj as any)[mappedKey] = row[header] ? String(row[header]).trim() : '';
            }
          });

          // اگر هدرها مپ نشدند، از ستون‌های ثابت فالبک استفاده می‌کنیم
          if (!pageObj.title && Object.keys(row).length >= 1) {
            const values = Object.values(row);
            pageObj.title = values[0] ? String(values[0]).trim() : '';
            pageObj.continent = values[1] ? String(values[1]).trim() : '';
            pageObj.country = values[2] ? String(values[2]).trim() : '';
            pageObj.direction = values[3] ? String(values[3]).trim() : '';
            pageObj.city = values[4] ? String(values[4]).trim() : '';
            pageObj.origin = values[5] ? String(values[5]).trim() : '';
            pageObj.tourType = values[6] ? String(values[6]).trim() : '';
            pageObj.season = values[7] ? String(values[7]).trim() : '';
            pageObj.month = values[8] ? String(values[8]).trim() : '';
            pageObj.holiday = values[9] ? String(values[9]).trim() : '';
            pageObj.occasion = values[10] ? String(values[10]).trim() : '';
            pageObj.theme = values[11] ? String(values[11]).trim() : '';
            pageObj.vehicle = values[12] ? String(values[12]).trim() : '';
            pageObj.hotelName = values[13] ? String(values[13]).trim() : '';
            pageObj.hotelStars = values[14] ? String(values[14]).trim() : '';
            pageObj.classLabel = values[15] ? String(values[15]).trim() : '';
            pageObj.audiencePersona = values[16] ? String(values[16]).trim() : '';
            pageObj.visaStatus = values[17] ? String(values[17]).trim() : '';
            pageObj.travelType = values[18] ? String(values[18]).trim() : '';
          }

          if (pageObj.title) {
            pages.push(pageObj as Page);
          }
        });

        resolve(pages);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}

// پارس کردن فایل CSV ایمپرشن‌ها
export function parseImpressionsCsv(csvText: string): Promise<ImpressionRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ImpressionRow[] = [];
        const headers = results.meta.fields || [];

        results.data.forEach((row) => {
          const impObj: Partial<ImpressionRow> = {
            url: '',
            title: '',
            impression: 0
          };

          headers.forEach((header) => {
            const cleanHeader = header.trim().toLowerCase();
            const mappedKey = IMPRESSIONS_HEADER_MAP[cleanHeader];
            if (mappedKey) {
              if (mappedKey === 'impression') {
                const cleanVal = String(row[header]).replace(/,/g, ''); // حذف کماها در صورت وجود
                impObj.impression = parseInt(cleanVal, 10) || 0;
              } else {
                (impObj as any)[mappedKey] = row[header] ? String(row[header]).trim() : '';
              }
            }
          });

          // فالبک موقعیتی برای ساختار ۳ ستونه
          if (!impObj.title && Object.keys(row).length >= 3) {
            const values = Object.values(row);
            impObj.url = values[0] ? String(values[0]).trim() : '';
            impObj.title = values[1] ? String(values[1]).trim() : '';
            const cleanImp = String(values[2]).replace(/,/g, '');
            impObj.impression = parseInt(cleanImp, 10) || 0;
          }

          if (impObj.title || impObj.url) {
            rows.push(impObj as ImpressionRow);
          }
        });

        resolve(rows);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}

// ایجاد و بازگشت خروجی به صورت فایل CSV استاندارد جهت صادرات مطمئن (فاز ۳)
export function exportResultsToCsv(sourcePageTitle: string, links: FinalLink[]): string {
  const headerRow = ['صفحه مبدا', 'صفحه هدف', 'درصد شباهت', 'امتیاز نهایی', 'رتبه', 'دلیل رتبه'];
  const rows = links.map(link => [
    sourcePageTitle,
    link.page_title,
    `${Math.round(link.similarity * 100)}%`,
    link.final_score.toFixed(4),
    link.rank,
    link.reason || ''
  ]);

  const csvContent = Papa.unparse({
    fields: headerRow,
    data: rows
  }, {
    quotes: true
  });

  return csvContent;
}
