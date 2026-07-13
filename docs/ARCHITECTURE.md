# ARCHITECTURE.md — معماری SemanticLink (امبدینگ + Supabase)

> منبعِ حقیقتِ واحد برای مهندسی. در تعارض با هر فایل دیگری، این فایل حاکم است. نسخهٔ ۲.۰ — بدون هیچ الگوریتم قانون‌محور.

---

## ۰) تصمیمات کلیدی معماری (هر کدام با ≥۲ گزینه، انتخاب نهایی مستدل)

### ۰.۱ محل تولید امبدینگ
- گزینه A — **Edge Function در Supabase** (کلید سمت سرور، نزدیک به دیتابیس، Deno).
- گزینه B — سرور Express فعلی (`server.ts`).
- گزینه C — کلاینت (مرورگر).
**انتخاب: A.** خواستهٔ صریح کارفرماست، کلید امن می‌ماند، و امبدینگ کنار جایی که ذخیره می‌شود اجرا می‌شود (چسبندگی پایین، معماری تمیز). C کلید را لو می‌دهد؛ B یک بک‌اند اضافه را زنده نگه می‌دارد.

### ۰.۲ موتور شباهت
- گزینه A — **`pgvector` + RPC در Postgres** (اپراتور `<=>`، ایندکس HNSW).
- گزینه B — واکشی همهٔ بردارها در کلاینت و کسینوس دستی.
**انتخاب: A.** استاندارد مدرن، در دیتابیس اجرا می‌شود، مقیاس‌پذیر و ساده. B هم بردارها را در شبکه جابه‌جا می‌کند هم منطق را در UI می‌ریزد (نقض جداسازی).

### ۰.۳ محاسبهٔ ۳۰ همسایه: پیش‌محاسبه یا درلحظه؟
- گزینه A — **درلحظه (on-demand) با RPC** هنگام انتخاب صفحه.
- گزینه B — پیش‌محاسبه و ذخیره در جدول `page_similarities`.
**انتخاب: A.** برای ۶۰۰ صفحه، کوئری برداری در حد میلی‌ثانیه است. جدول دوم = داده بی‌مصرفِ کهنه‌شونده و پیچیدگیِ همگام‌سازی (اُور-انجینیرینگ).

### ۰.۴ بُعد بردار امبدینگ
- گزینه A — ۳۰۷۲ (پیش‌فرض مدل).
- گزینه B — **۷۶۸ با MRL + نرمال‌سازی L2**.
**انتخاب: B.** **ایندکس‌های `pgvector` (HNSW/IVFFlat) حداکثر ۲۰۰۰ بُعد را پشتیبانی می‌کنند؛ ۳۰۷۲ ایندکس‌پذیر نیست.** ۷۶۸ موردِ توصیهٔ گوگل، سبک‌تر برای ذخیره، و با نرمال‌سازی L2 کسینوس دقیق می‌ماند.

### ۰.۵ محل لایهٔ Re-rank (چت)
- گزینه A — **Edge Function دوم (`rerank`)**.
- گزینه B — سرور Express.
**انتخاب: A.** یک پارادایم بک‌اند واحد (Supabase)، کلید امن، و امکان حذف کامل Express. سازگار با ۰.۱.

### ۰.۶ سرویس‌دهی اپ
- گزینه A — **Vite استاندارد** (`vite dev` / `vite build`)، SPA خالص.
- گزینه B — نگه‌داشتن `server.ts` (Express + Vite middleware).
**انتخاب: A.** با حذف نقشِ AI از Express، دیگر دلیلی برای بک‌اند Node نیست. حذف یک لایهٔ کامل = ساده‌ترین حالت.

---

## ۱) معماری کلان
SPA (React + Vite) که **مستقیماً** با Supabase گفتگو می‌کند:
- **خواندن/جست‌وجو:** `supabase-js` → RPC `match_pages` و کوئری جدول `pages`.
- **نوشتن/امبدینگ:** فراخوانی Edge Function `embed-pages` (ingestion).
- **بازرتبه‌بندی:** فراخوانی Edge Function `rerank`.

کلید Gemini فقط Secret روی Supabase است. کلاینت هیچ کلیدی ندارد.

## ۲) جریان داده (Data Flow)

**فاز ورود داده (یک‌بار):**
```
[۱] کاربر pages.csv (۱۹ ستون) را آپلود می‌کند
[۲] Papa Parse در کلاینت → Page[]
[۳] کلاینت داده را دسته‌ای (chunk=~۵۰) به Edge Function `embed-pages` می‌فرستد
[۴] embed-pages: برای هر ردیف embedding_text می‌سازد → gemini-embedding-2 (dim=768, normalize) → upsert در جدول pages
[۵] کلاینت پیشرفت را نشان می‌دهد (n/۶۰۰)
```

**فاز پیشنهاد (تکراری):**
```
[۶] کلاینت فهرست pages را از Supabase می‌خواند → PageList
[۷] انتخاب یک صفحه → RPC match_pages(source_id, 30) → ۳۰ کاندیدا با similarity(٪)
[۸] نمایش در جدول (عنوان کاندیدا، درصد شباهت، تگ‌های کلیدی)
[۹] (اختیاری) دکمهٔ «رتبه‌بندی هوشمند» per-page یا batch → Edge Function `rerank(source, candidates, model)`
       → لیست بازچینش‌شده + دلیل سئوییِ تولیدشده
[۱۰] Export CSV (صفحهٔ مبدأ، صفحهٔ هدف، درصد شباهت، رتبهٔ نهایی، دلیل)
```

## ۳) اسکیمای دیتابیس (Supabase Postgres)

### اکستنشن
`create extension if not exists vector with schema extensions;`

### جدول `pages`
| ستون | نوع | توضیح |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | شناسه |
| `title` | `text not null` | عنوان_H1 (کلید یکتای منطقی برای upsert) |
| `continent` | `text` | قاره_یا_منطقه |
| `country` | `text` | کشور_مقصد |
| `direction` | `text` | جهت_در_منطقه |
| `city` | `text` | شهر_یا_جزیره_مقصد |
| `origin` | `text` | شهر_یا_استان_مبدا |
| `tour_type` | `text` | نوع_تور |
| `season` | `text` | فصل_برگزاری |
| `month` | `text` | ماه_تقویمی_برگزاری |
| `holiday` | `text` | تعطیلات_خاص_تقویمی |
| `occasion` | `text` | رویداد_یا_مناسبت_خاص |
| `theme` | `text` | تم_یا_هدف_سفر |
| `vehicle` | `text` | نوع_وسیله_نقلیه |
| `hotel_name` | `text` | نام_دقیق_هتل |
| `hotel_stars` | `text` | تعداد_ستاره_هتل |
| `class_label` | `text` | برچسب_کلاسی_تور |
| `audience_persona` | `text` | پرسونای_مخاطب |
| `visa_status` | `text` | وضعیت_ویزا |
| `travel_type` | `text` | نوع_سفر |
| `url` | `text` | آدرس صفحه (اختیاری) |
| `impression` | `bigint` | متادیتای نمایشیِ اختیاری — **بدون نقش رتبه‌بندی** |
| `embedding_text` | `text` | متنی که امبد شده (برای شفافیت/دیباگ) |
| `embedding` | `extensions.vector(768)` | بردار نرمال‌شده |
| `created_at` | `timestamptz default now()` | |

- **کلید یکتا:** `unique (title)` → برای `upsert on conflict (title)` هنگام ingestion مجدد.
- **ایندکس برداری:** `create index on pages using hnsw (embedding vector_cosine_ops);`

### RPC — `match_pages`
هستهٔ شباهت. بردار مبدأ را داخل خودش می‌خواند (کلاینت بردار نمی‌بیند):
```sql
create or replace function match_pages(source_id bigint, match_count int default 30)
returns table (
  id bigint, title text, country text, city text, season text,
  theme text, url text, similarity float
)
language sql stable
as $$
  select p.id, p.title, p.country, p.city, p.season, p.theme, p.url,
         1 - (p.embedding <=> src.embedding) as similarity
  from pages p, (select embedding from pages where id = source_id) src
  where p.id <> source_id and p.embedding is not null
  order by p.embedding <=> src.embedding asc
  limit match_count;
$$;
```
- `<=>` = فاصلهٔ کسینوسی؛ `similarity = 1 - distance`.
- ترتیب صعودیِ فاصله = نزدیک‌ترین اول.

### امنیت (RLS)
ابزار داخلی و تک‌کاربره است. RLS روی `pages` فعال شود و یک policy سادهٔ فقط‌خواندن برای `anon`، و نوشتن فقط از Edge Function با `service_role` (که RLS را دور می‌زند). کلاینت هرگز مستقیماً insert/update نمی‌کند.

## ۴) Edge Functions (Deno)

### `embed-pages` (ingestion + امبدینگ)
- **ورودی:** `{ pages: Page[] }` (یک دسته، حداکثر ~۵۰ ردیف).
- **گام‌ها:** برای هر ردیف `buildEmbeddingText(page)` → فراخوانی `gemini-embedding-2` با `output_dimensionality=768` → نرمال‌سازی L2 → `upsert` در `pages` با `service_role`.
- **خروجی:** `{ inserted: number, failed: number, errors?: string[] }`.
- **مقاومت:** خطای یک ردیف نباید کل دسته را بشکند؛ خطاها جمع و برگردانده شوند.

### `rerank` (لایهٔ هوش مصنوعی اختیاری)
- **ورودی:** `{ sourcePage: {title, tags...}, candidates: [{id, title, similarity, tags...}], model: string }`.
- **گام‌ها:** اعتبارسنجی اینکه `model` عضو رجیستری مجاز است → prompt فارسی → فراخوانی مدل چت با `responseSchema` JSON.
- **وظیفهٔ مدل:** بازچینش ۳۰ کاندیدا بر اساس ارتباط معناییِ لینک داخلی + تولید یک «دلیل سئویی» کوتاه برای هرکدام. **حذف کاندیدا مجاز نیست؛ فقط ترتیب + دلیل.**
- **خروجی:** `[{ id, rank, seo_reason }]` (کلاینت با `id` به کاندیدای اصلی join می‌کند).

### تعریف `buildEmbeddingText` (کیفیت بردار — حیاتی)
متن امبدینگ از تگ‌های ناتهیِ صفحه ساخته می‌شود؛ فیلدهای `null`/خالی حذف می‌شوند. قالب فارسیِ برچسب‌دار (تا مدل بافت را بفهمد):
```
عنوان: {title}
مقصد: {country}، {city}، {continent}، جهت {direction}
مبدأ: {origin}
نوع تور: {tour_type} | نوع سفر: {travel_type}
زمان: فصل {season}، ماه {month}
مناسبت: {occasion} {holiday}
تم سفر: {theme}
وسیله: {vehicle}
هتل: {hotel_name} ({hotel_stars} ستاره)
کلاس: {class_label} | پرسونا: {audience_persona}
```
> این تابع باید **در Edge Function و دقیقاً یک‌بار** تعریف شود (منطق مرجع). نرمال‌سازی متن (ی/ک، نیم‌فاصله) قبل از امبد اعمال شود.

## ۵) درخت فایل هدف (پس از بازسازی)

### حذف کامل (Teardown)
```
src/core/                      ← کل پوشه (linking/*: anchor, attributes, dictionaries, engine, fill, rings, walls)
src/workers/engine.worker.ts   ← ورکر موتور
server.ts                      ← سرور Express (درگاه AI قدیمی)
src/services/geminiService.ts  ← بریج polish قدیمی
src/services/impressionService.ts ← وزن ایمپرشن (منسوخ)
```

### افزودن / بازنویسی
```
supabase/
  migrations/0001_init.sql        # اکستنشن + جدول pages + ایندکس HNSW + RPC match_pages + RLS
  functions/
    embed-pages/index.ts          # Edge Function امبدینگ + upsert
    rerank/index.ts               # Edge Function بازرتبه‌بندی
    _shared/models.ts             # Model Registry (embedding + لیست چت) — منبع مشترک
    _shared/embedding-text.ts     # buildEmbeddingText مرجع
src/
  lib/supabaseClient.ts           # ساخت client از env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
  config/models.ts                # آینهٔ رجیستری برای کلاینت (لیست چت + پیش‌فرض)
  types.ts                        # بازنویسی: Page, MatchResult, RerankResult, ModelId
  services/
    csvService.ts                 # (نگه‌داشته/سبک‌شده) parse pages + export CSV
    ingestService.ts              # آپلود دسته‌ای به embed-pages + گزارش پیشرفت
    matchService.ts               # فراخوانی RPC match_pages
    rerankService.ts              # فراخوانی Edge Function rerank (per-page/batch)
  state/AppContext.tsx            # بازنویسی: pages, matches, rerankResults, selectedModel, loading
  components/
    FileUpload.tsx                # آپلود + شروع ingestion
    PageList.tsx                  # فهرست صفحات از Supabase
    SimilarityTable.tsx           # (جایگزین CandidateTable) ۳۰ کاندیدا با درصد شباهت
    AiRerankButton.tsx            # (جایگزین AiButton) per-page + batch
    SettingsModal.tsx             # (جایگزین ApiKeyModal) انتخاب مدل چت
    ExportButton.tsx              # export نتایج
  App.tsx                         # اتصال جریان جدید
```
> زیرپوشه‌های کامپوننتیِ قدیمی (`candidate-table/*`, `file-upload/*`, `page-list/*`) در صورت وابستگی به مفاهیم منسوخ (حلقه/رابطه) بازبینی و ساده شوند.

## ۶) قرارداد تایپ‌ها (خلاصه — `src/types.ts`)
```ts
export type ModelId = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3-flash-preview';

export interface Page {
  id?: number; title: string;
  continent?: string; country?: string; direction?: string; city?: string; origin?: string;
  tourType?: string; season?: string; month?: string; holiday?: string; occasion?: string;
  theme?: string; vehicle?: string; hotelName?: string; hotelStars?: string;
  classLabel?: string; audiencePersona?: string; visaStatus?: string; travelType?: string;
  url?: string; impression?: number;
}

export interface MatchResult {          // خروجی RPC match_pages
  id: number; title: string; country?: string; city?: string;
  season?: string; theme?: string; url?: string;
  similarity: number;                   // 0..1
}

export interface RerankResult {         // خروجی Edge Function rerank
  id: number; rank: number; seo_reason: string;
}
```

## ۷) قرارداد CSV (ورودی/خروجی)
- **ورودی صفحات (۱۹ ستون):** بدون تغییر نسبت به نسخهٔ قبل — همان هدرهای فارسی. `csvService.parsePagesCsv` حفظ می‌شود.
- **ورودی ایمپرشن:** اختیاری؛ اگر آمد فقط برای پرکردن ستون نمایشیِ `impression` (تطبیق با عنوانِ نرمال‌شده). **هیچ نقشی در رتبه‌بندی ندارد.**
- **خروجی:** `صفحه مبدأ، صفحه هدف، درصد شباهت، رتبهٔ نهایی، دلیل سئویی`.

## ۸) متغیرهای محیطی
- کلاینت (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Edge Functions (Secrets در Supabase): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **هیچ‌گاه** `GEMINI_API_KEY` با پیشوند `VITE_` تعریف نشود (وگرنه به باندل کلاینت نشت می‌کند).

## ۹) شفاف‌سازی‌های الزامی (برای مدل کدنویس)
- **۹.۱ نرمال‌سازی بردار:** چون `output_dimensionality < 3072` است، بردار باید **قبل از ذخیره** L2-نرمال شود؛ در غیر این صورت شباهت کسینوسی مخدوش می‌شود.
- **۹.۲ Idempotency ورود داده:** ingestion باید `upsert on conflict (title)` باشد تا اجرای دوباره داده تکراری نسازد.
- **۹.۳ خطای دسته:** در `embed-pages` شکست یک ردیف نباید کل دسته را fail کند؛ نتیجهٔ تجمیعی برگردد و UI بتواند retry نشان دهد.
- **۹.۴ batch در کلاینت:** «رتبه‌بندی همه» صفحات را **تک‌به‌تک** و ترتیبی صدا می‌زند (نه موازیِ انبوه) تا نرخ محدود و پیشرفت قابل‌نمایش باشد؛ دقیقاً مانند حالت per-page اما در حلقه.
- **۹.۵ اعتبارسنجی مدل:** Edge Function `rerank` باید مقدار `model` را در برابر رجیستری چک کند و در صورت نامعتبر بودن ۴۰۰ برگرداند (جلوگیری از تزریق مدل دلخواه).
- **۹.۶ بدون کش سمت‌سرورِ اضافه:** نتایج match در state درون‌حافظه نگه داشته می‌شوند؛ نیازی به جدول دوم یا کش نیست.
- **۹.۷ شناسه‌ها از رجیستری:** هیچ رشتهٔ مدلی نباید در سرویس‌ها/کامپوننت‌ها هاردکد شود.
