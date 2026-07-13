
### فایل ۳ — `tasks.md` (Zero-to-One، فقط همین پروژه)

```markdown
# tasks.md — نقشه راه ساختِ پروژهٔ نو (Zero-to-One)

> ترتیب اجباری و متوالی. هیچ دو تسکی که روی فایل مشترک R/W دارند موازی نمی‌شوند.
> مرجعِ کامل منطق و دیکشنری‌ها: `Docs/ARCHITECTURE.md` · قوانین: `Docs/PROJECT.md`.
> راهبرد: اول اسکلت، بعد موتورِ خالصِ ایزوله (۲–۷)، بعد سرویس‌ها و داده (۸–۹)، بعد UI و AI (۱۰–۱۳). هر تسک پس از سبزشدنِ بیلد به بعدی می‌رود.

---

## تسک ۱ — اسکلت پروژه + types
**خروجی:** پروژهٔ Vite+React+TS+Tailwind (RTL، فارسی، تم emerald/blue) + `src/types.ts`.
**راهنمای فنی:** راه‌اندازی Vite، Tailwind v3 با `dir="rtl"` و فونت Vazirmatn؛ `types.ts` شامل `Page`, `ImpressionRow`, `PageFeatures`, `Candidate`, `FinalLink` طبق §۸ ARCHITECTURE.
**محدودیت‌ها:** بدون هیچ دیتابیس/state library. فقط اسکلت و تایپ‌ها؛ منطق نه.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "Docs/PROJECT.md"]

---

## تسک ۲ — دیکشنری‌ها
**خروجی:** `src/core/linking/dictionaries.ts`.
**راهنمای فنی:** همهٔ ثابت‌های پیوست‌های الف–و: REGIONAL_CLUSTERS, SUB_REGIONS, CONTINENTS+ALIAS+DOMESTIC, POLARITY, THEME_BUCKETS+NEAR_THEME_GROUPS, SEASON_ORDER/MONTH_TO_SEASON/LUNAR_OCCASIONS, و مجموعهٔ «صفحات عام».
**محدودیت‌ها:** فقط داده/تایپ؛ هیچ تابع. کامنت فارسی. مقادیر دقیقاً از ARCHITECTURE.md.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/types.ts"]

---

## تسک ۳ — استخراج‌گر ویژگی
**خروجی:** `src/core/linking/attributes.ts` (`parsePage(page): PageFeatures`).
**راهنمای فنی:** نرمال‌سازی + null-safety + استخراج همهٔ فیلدها و مشتقات (قطب‌ها، themeBuckets با حذف «تفریحیِ» عام، timeTrack، پرچم‌های هاب/تجمیعی/قاره/داخلی، intentAxis).
**محدودیت‌ها:** توابع خالص؛ تشخیص هاب ویژگی‌محور (نه رشتهٔ عنوان). فقط همین فایل.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/dictionaries.ts", "src/types.ts"]

---

## تسک ۴ — دیوارها
**خروجی:** `src/core/linking/walls.ts` (`passesWalls(src,tgt):boolean`).
**راهنمای فنی:** شش دیوارِ §۵.۲ هرکدام تابعِ بولیِ کوچک؛ AND نهایی. «صفحهٔ عام» طبق مجموعهٔ دیکشنری (نه چند رشتهٔ ثابت).
**محدودیت‌ها:** فقط بولی؛ هیچ امتیاز. دیوار برای حجم نرم نشود. فقط همین فایل.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/attributes.ts", "src/core/linking/dictionaries.ts"]

---

## تسک ۵ — حلقه‌ها
**خروجی:** `src/core/linking/rings.ts` (`assignRing(src,tgt):{ring,tag}|null`).
**راهنمای فنی:** نردبان R0..R4.5 طبق §۵.۳؛ منطقِ **±۱ طیفی برای R3** (قیمت/ستاره/مدت)؛ نردبان تدریجی؛ تمِ خاصِ سفت بدون fallback.
**محدودیت‌ها:** تخصیص قطعی و تک‌مقدار؛ بدون مرتب‌سازی نهایی. پرش خوشه→قاره ممنوع.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/attributes.ts", "src/core/linking/dictionaries.ts", "src/core/linking/walls.ts"]

---

## تسک ۶ — انکر کلاینر + دلیل‌ساز
**خروجی:** `src/core/linking/anchor.ts` (`cleanAnchor(title)`, `buildReason(tag, ctx)`).
**راهنمای فنی:** تمیزسازی انکر §۵.۵ و قالب‌های دلیل §۵.۶.
**محدودیت‌ها:** توابع خالص؛ فقط همین فایل.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/types.ts"]

---

## تسک ۷ — پُرسازی + موتور
**خروجی:** `src/core/linking/fill.ts` و `src/core/linking/engine.ts`.
**راهنمای فنی:** `fill.ts`: قانون نماینده، **مرتب‌سازیِ سه‌گانه (ring↑، impressionWeight↓، index↑) بدون هیچ فرمول ضربی**، سقف نرمِ حلقه۱ و هر تگ، توقف ۲۰–۳۰، بدون پُرکردن از بیرونِ دیوار. `engine.ts`: `computeAll(pages, weightMap): Map<number, Candidate[]>` — parse→دیوار/حلقه روی همه→fill→ساخت anchor/reason.
**محدودیت‌ها:** وزن فقط از weightMap (ایمپرشن)؛ هیچ وزنِ تم/دسته. خروجی مرتبِ نهایی.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/rings.ts", "src/core/linking/walls.ts", "src/core/linking/attributes.ts", "src/core/linking/anchor.ts", "src/types.ts"]

---

## تسک ۸ — سرویس CSV + ایمپرشن
**خروجی:** `src/services/csvService.ts` و `src/services/impressionService.ts`.
**راهنمای فنی:** پارس pages.csv (۱۹ ستون) و impressions.csv با Papa Parse؛ `buildWeightMap` (نرمال ۱..۲، تطبیق با عنوانِ نرمال، نبود→۱)؛ `exportResults` به CSV خروجی (نام تور/انکر/دلیل/حلقه).
**محدودیت‌ها:** بدون ذخیرهٔ دائمی؛ فقط درون‌حافظه. تطبیق null-safe.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/types.ts"]

---

## تسک ۹ — Web Worker + ارکستریشن
**خروجی:** `src/workers/engine.worker.ts` + `src/state/AppContext.tsx`.
**راهنمای فنی:** worker رپرِ نازک روی `engine.computeAll`؛ Context وضعیت درون‌حافظه (pages/weights/candidates/results/apiKey/loading) و اکشن‌های آپلود/محاسبه.
**محدودیت‌ها:** worker فقط محاسبه؛ هیچ I/O. Context تنها منبع state.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/engine.ts", "src/services/impressionService.ts", "src/types.ts"]

---

## تسک ۱۰ — UI آپلود و فهرست صفحات
**خروجی:** `src/components/FileUpload.tsx`, `PageList.tsx`, و اتصال در `App.tsx`.
**راهنمای فنی:** دو آپلودِ CSV → trigger محاسبه؛ فهرست صفحات منبع با جست‌وجو؛ تم emerald/blue، RTL. فلوی مشابه نسخهٔ قبلی.
**محدودیت‌ها:** کامپوننت‌ها Dumb؛ منطق در Context/core. فقط همین فایل‌ها.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/state/AppContext.tsx", "src/services/csvService.ts", "src/App.tsx"]

---

## تسک ۱۱ — جدول کاندیداها
**خروجی:** `src/components/CandidateTable.tsx`.
**راهنمای فنی:** برای صفحهٔ انتخاب‌شده، نمایش ۲۰–۳۰ کاندیدا با ستون‌های: انکر، دلیل، حلقه، برچسب رابطه (برای شفافیت/دیباگ).
**محدودیت‌ها:** فقط نمایش؛ بدون منطق. فقط همین فایل.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/state/AppContext.tsx", "src/types.ts"]

---

## تسک ۱۲ — دکمهٔ هوش مصنوعی (Gemini)
**خروجی:** `src/services/geminiService.ts`, `src/components/AiButton.tsx`, `src/components/ApiKeyModal.tsx`.
**راهنمای فنی:** ارسال کاندیداهای موتور به Gemini با prompt ساده (اعتماد به ترتیب/برچسب حلقه)؛ schema خروجی `[{page_title, anchor_text, seo_reason}]`؛ کلید API در localStorage؛ per-page و batch.
**محدودیت‌ها:** فقط نهایی‌سازی/پولیش؛ منطقِ ربط را تکرار نکن. خطا/لودینگ مدیریت شود.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/state/AppContext.tsx", "src/types.ts"]

---

## تسک ۱۳ — خروجی CSV
**خروجی:** `src/components/ExportButton.tsx` + اتصال `exportResults`.
**راهنمای فنی:** export خروجیِ موتور یا نتیجهٔ AI به CSV (نام تور، متن انکر پیشنهادی، دلیل سئویی، حلقه).
**محدودیت‌ها:** فقط همین فایل + استفاده از csvService.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/services/csvService.ts", "src/state/AppContext.tsx"]

---

## ترتیب و وابستگی
۱ → ۲ → ۳ → ۴ → ۵ → ۶ → ۷ (موتورِ خالصِ ایزوله) → ۸ → ۹ (داده/state) → ۱۰ → ۱۱ (UI) → ۱۲ (AI) → ۱۳ (export). هر تسک پس از سبزشدنِ بیلد به بعدی می‌رود.

---


---
# فاز اصلاح (Corrective Phase) — رفع ۱۲ باگِ نسخهٔ ۱
> ترتیب اجباری C1→C7. مرجع: `Docs/ARCHITECTURE.md §۹`. هر تسک پس از سبزشدن بیلد و تست روی صفحات نمونه به بعدی می‌رود.
> صفحات تستِ مرجع: تور کیش، تور ارزان کیش، تور استانبول از مشهد، تور ارمنستان از تبریز، تور ارزان کربلا، تور مارماریس تابستان، تور قشم مهر.

## C1 — اصلاح تشخیص هاب و ویژگی‌ها (رفع B4، B12-مدت، بخشی از B7)
**ویرایش:** `src/core/linking/attributes.ts`.
**راهنما:** (الف) `isHubCity`/`isHubCountry` را طبق §۹.۴ سخت کن: علاوه بر شرایط فعلی، باید `origin===null && vehicle(نوع‌وسیله)===null && durationNights===null && star===null && نوع_تور!==ترکیبی` باشد. (ب) `durationNights` فقط از **عنوان** خوانده شود، نه از `نوع_سفر`. (ج) `isContinentHub` را طبق §۹.۶ محدود کن (فقط نام قارهٔ کانونی). (د) `checkIfAggregate` را گسترش بده تا «تورهای آسیای شرقی/غربی/مرکزی»، «جام ملت‌ها» و عناوینِ سطح‌قاره‌ایِ غیرکانونی را هم عام بشناسد.
**محدودیت:** فقط همین فایل؛ توابع خالص؛ خروجی PageFeatures سازگار بماند.
**Done:** «کیش از مشهد»، «استانبول زمینی»، «ترکیه با قطار» دیگر هاب شناخته نشوند؛ «تور جام ملت‌های آسیا» aggregate شود.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/attributes.ts", "src/core/linking/dictionaries.ts"]

## C2 — دیکشنری: زیرمنطقهٔ کیوریت + تمِ نزدیک + قاره (رفع B8، B9، بخشی از B7)
**ویرایش:** `src/core/linking/dictionaries.ts`.
**راهنما:** (الف) `CURATED_SUBREGION: Record<string,string>` (کشور→زیرمنطقهٔ تمیز) طبق §۹.۷؛ قفقاز/آناتولی/آسیای‌مرکزی جدا. (ب) `NEAR_THEME_GROUPS` را طبق §۹.۸ به فقط `[['culture','shopping']]` کاهش بده (حذف {beach,nature}). (ج) `CONTINENT_HUB_TITLES` (لیست عناوین قارهٔ کانونی) و گسترشِ `GENERAL_PAGES_KEYWORDS` برای aggregateهای قاره‌ای.
**محدودیت:** فقط داده/ثابت؛ بدون منطق.
**Done:** کشورهای آسیای‌مرکزی دیگر هم‌زیرمنطقهٔ ترکیه نباشند.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/dictionaries.ts"]

## C3 — موتورِ محور-محور + سیلوی مبدأ + بین‌مقصدی=هاب (رفع B1، B2، B5، B7، نیت‌نابینایی) — هستهٔ اصلی
**ویرایش:** `src/core/linking/rings.ts` (و در صورت نیاز امضای آن).
**راهنما:** (الف) `assignRing` ورودیِ `axis = src.features.intentAxis` بگیرد و طبق §۹.۱ هستهٔ R0/R1 را محور-محور بسازد. (ب) رابطهٔ جدید **ORIGIN_SILO** طبق §۹.۲ اضافه شود (هم‌مبدأ، مقصد متفاوت، هدف هاب‌لِوِل، رینگ ۰/۱). (ج) همهٔ رینگ‌های بین‌مقصدی (TWIN/SUBREGION/CROSSSELL/PARENT) **فقط هدفِ هاب‌لِوِل** بپذیرند (§۹.۳). (د) PARENT_HUB فقط هابِ کشور یا قارهٔ کانونی (§۹.۶). (ه) R3.5 از `CURATED_SUBREGION` استفاده کند نه فیلد خام. (و) برای محور PRICE/SEASON رفتار §۹.۱ اعمال شود.
**محدودیت:** تخصیص قطعی و تک‌مقدار؛ بدون مرتب‌سازیِ نهایی؛ هیچ فرمول عددی.
**Done:** «استانبول از مشهد» سیلوی «X از مشهد» را در رینگ بالا بدهد؛ TWINها فقط «تور گرجستان/قشم» (هاب) باشند نه زیرصفحه‌ها.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/rings.ts", "src/core/linking/attributes.ts", "src/core/linking/dictionaries.ts"]

## C4 — دیوارها: استثنای زیارتی + معافیتِ سیلوی مبدأ + زیرمنطقهٔ کیوریت (رفع B6، پشتیبان B1)
**ویرایش:** `src/core/linking/walls.ts`.
**راهنما:** (الف) دیوار جغرافیایی طبق §۹.۵: اگر هر دو `religious`، عبورِ مرز داخلی/خارجی و قارهٔ متفاوت مجاز شود. (ب) طبق §۹.۲: اگر `S.origin` و `T.origin` برابر و غیرخالی‌اند، دیوارِ قارهٔ متفاوت **معاف** شود (سیلوی مبدأ بین‌قاره‌ای). (ج) سایر دیوارها (خود/تجمیعی، قرنطینهٔ مبدأِ نابرابر، قطبیت، زمانی) دست‌نخورده.
**محدودیت:** فقط بولی؛ فقط همین فایل.
**Done:** «ارزان کربلا» به «مشهد» لینک بخورد؛ «استانبول از مشهد» به «اروپا از مشهد» اجازه یابد.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/walls.ts", "src/core/linking/attributes.ts"]

## C5 — پُرسازی: سقف/رزروِ حلقهٔ ۰ + قانون نماینده + قیچی زمانی (رفع B3، B10)
**ویرایش:** `src/core/linking/fill.ts`.
**راهنما:** (الف) سقفِ نرم برای صفحاتِ هم‌مقصد (R0+R1) طبق §۹.۹ (مثلاً مجموع ≤ ۱۴) تا اسلات برای R2..R4.5 بماند و تا ۲۰–۳۰ متنوع پر شود. (ب) قانون نماینده **قبل از مرتب‌سازی**: ماه‌های هم‌فصل که صفحهٔ فصلشان موجود است، پیش‌حذف شوند (نه وابسته به ترتیبِ ایمپرشن). (ج) اطمینان از اینکه فصلِ مجاور (R3) فقط یک نماینده می‌گیرد.
**محدودیت:** مرتب‌سازی سه‌گانهٔ (ring↑، impression↓، id↑) حفظ شود؛ فقط همین فایل.
**Done:** «تور کیش» دیگر ۳۰ صفحهٔ هم‌شهر ندهد؛ تنوع (قشم/داخلی) ظاهر شود؛ «ارزان استانبول» همهٔ فصل‌ها را با هم نیاورد.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/fill.ts", "src/core/linking/dictionaries.ts"]

## C6 — انکر و دلیل: رفع null، سال، تطابق با رابطه (رفع B11، B12)
**ویرایش:** `src/core/linking/anchor.ts`.
**راهنما:** (الف) `buildReason` هرگز «null» چاپ نکند؛ نام کشور/قاره را از فیلدها بگیرد و اگر خالی بود از قالبِ بدون‌نام استفاده کند؛ متن باید با `relation_tag` بخواند (HUB_CITY فقط برای هابِ واقعی). (ب) `cleanAnchor` الگوی `20\d\d` و بازهٔ «… ۱۴۰۴ و [ماه] ۱۴۰۵» انتهایی را هم پاک کند.
**محدودیت:** توابع خالص؛ فقط همین فایل.
**Done:** هیچ «null» در دلیل نماند؛ «کریسمس 2026»→«کریسمس»؛ بازهٔ دوساله تمیز شود.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/anchor.ts"]

## C7 — اتصال محور به موتور + بازبینی رگرسیون (یکپارچه‌سازی)
**ویرایش:** `src/core/linking/engine.ts` (و در صورت تغییرِ امضای assignRing، نقطهٔ فراخوانی).
**راهنما:** `computeAll` هنگام صدا زدن `assignRing` محورِ منبع را پاس بدهد؛ اطمینان از اینکه ترتیب walls→rings→fill با تغییرات C1..C6 سازگار است.
**محدودیت:** فقط اتصال؛ بدون منطق جدید.
**Done:** اجرای end-to-end روی ۷ صفحهٔ تستِ مرجع، خروجیِ محور-محور و متنوع و بدون باگ‌های B1..B12 بدهد.
CONTEXT_FILES: ["Docs/ARCHITECTURE.md", "src/core/linking/engine.ts", "src/core/linking/rings.ts", "src/core/linking/fill.ts"]

## ترتیب فاز اصلاح
C1 → C2 → C3 → C4 → C5 → C6 → C7. (C3 وابسته به C1/C2؛ C7 وابسته به C3..C6.)