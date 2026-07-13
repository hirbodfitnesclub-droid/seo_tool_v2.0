# tasks.md — نقشه راه بازسازی SemanticLink (نسخهٔ ۲.۰)

> ترتیب اجباری و متوالی T0→T8. هیچ دو تسکی که روی فایل مشترک R/W دارند موازی نمی‌شوند.
> مرجع کامل: `docs/ARCHITECTURE.md` · قوانین و نبایدها: `docs/PROJECT.md`.
> راهبرد: اول پیش‌نیاز و پاک‌سازی (T0،T1)، بعد بک‌اند Supabase (T2،T3،T4)، بعد لایهٔ دادهٔ کلاینت (T5،T6)، بعد UI (T7)، بعد خروجی (T8). هر تسک پس از سبزشدن بیلد به بعدی می‌رود.

---

## T0 — پیش‌نیاز: اتصال Supabase + Secrets (بدون کد اپلیکیشن)
**خروجی:** پروژهٔ Supabase متصل؛ متغیرهای محیطی موجود.
**راهنمای فنی:** اتصال ادغام Supabase به پروژه. اطمینان از وجود `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` برای کلاینت. تنظیم Secretهای Edge Function: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
**محدودیت‌ها:** هیچ کدی نوشته نمی‌شود؛ فقط تنظیمات. `GEMINI_API_KEY` هرگز با پیشوند `VITE_` نباشد.
**Done:** ادغام Supabase در تنظیمات پروژه سبز است و کلیدها ست شده‌اند.
CONTEXT_FILES: ["docs/PROJECT.md", "docs/ARCHITECTURE.md"]

---

## T1 — پاک‌سازی (Teardown) + پایهٔ استک جدید
**خروجی:** حذف کامل الگوریتم قانون‌محور و سرور Express؛ اصلاح `package.json` و اسکریپت‌ها؛ نصب `@supabase/supabase-js`.
**راهنمای فنی:**
(الف) حذف: کل پوشهٔ `src/core/`، `src/workers/engine.worker.ts`، `server.ts`، `src/services/geminiService.ts`، `src/services/impressionService.ts`.
(ب) `package.json`: حذف `express`، `@types/express`، `dotenv`، `@google/genai` (به Edge Function منتقل می‌شود)؛ افزودن `@supabase/supabase-js`. اسکریپت‌ها: `dev: "vite"`, `build: "vite build"`, `preview: "vite preview"`, `lint: "tsc --noEmit"`.
(ج) هر import اشاره‌کننده به فایل‌های حذف‌شده را پاک کن — **اول استفاده را بردار، بعد import را**. (`AppContext` و `App.tsx` موقتاً می‌شکنند؛ در T6/T7 بازنویسی می‌شوند — فعلاً فقط ارجاع‌های مرده حذف شوند تا خطای import نماند.)
**محدودیت‌ها:** در این تسک منطق جدید نوشته نمی‌شود؛ فقط حذف و پایه. بیلد ممکن است تا T6 کامل سبز نشود؛ هدف: صفرشدن ارجاع به ماژول‌های حذف‌شده.
**Done:** هیچ فایلی به `core/*`, `engine.worker`, `server.ts`, `geminiService`, `impressionService` import نمی‌دهد؛ `@supabase/supabase-js` نصب است.
CONTEXT_FILES: ["docs/PROJECT.md", "docs/ARCHITECTURE.md", "package.json", "src/state/AppContext.tsx", "src/App.tsx"]

---

## T2 — مهاجرت دیتابیس (اسکیما + ایندکس + RPC + RLS)
**خروجی:** `supabase/migrations/0001_init.sql` و اجرای آن روی دیتابیس.
**راهنمای فنی:** طبق §۳ ARCHITECTURE: (۱) `create extension vector`. (۲) جدول `pages` با تمام ستون‌ها + `embedding vector(768)` + `unique(title)`. (۳) ایندکس `hnsw (embedding vector_cosine_ops)`. (۴) تابع `match_pages(source_id, match_count)` دقیقاً طبق بدنهٔ §۳. (۵) فعال‌سازی RLS: policy فقط‌خواندن برای `anon`، نوشتن فقط `service_role`.
**محدودیت‌ها:** بُعد بردار **باید ۷۶۸** باشد (سقف ایندکس pgvector=۲۰۰۰). فقط SQL؛ بدون منطق اپلیکیشن.
**Done:** جدول و ایندکس ساخته شدند؛ `select match_pages(1,5)` بدون خطای ساختاری اجرا می‌شود (حتی اگر خالی).
CONTEXT_FILES: ["docs/ARCHITECTURE.md"]

---

## T3 — منابع مشترک Edge + Function امبدینگ (`embed-pages`)
**خروجی:** `supabase/functions/_shared/models.ts`, `supabase/functions/_shared/embedding-text.ts`, `supabase/functions/embed-pages/index.ts`.
**راهنمای فنی:**
(الف) `_shared/models.ts`: رجیستری — ثابت امبدینگ `gemini-embedding-2` (بُعد ۷۶۸) و آرایهٔ مدل‌های چت مجاز.
(ب) `_shared/embedding-text.ts`: `buildEmbeddingText(page)` دقیقاً طبق قالب §۴؛ حذف فیلدهای خالی؛ نرمال‌سازی متن (ی/ک، نیم‌فاصله).
(ج) `embed-pages/index.ts`: دریافت `{pages}` (دستهٔ ~۵۰)، برای هر ردیف embedding_text→فراخوانی `gemini-embedding-2` با `output_dimensionality=768`→**نرمال‌سازی L2**→`upsert on conflict (title)` با `service_role`. خروجی `{inserted, failed, errors}`.
**محدودیت‌ها:** کلید فقط از Secret. شکست یک ردیف کل دسته را fail نکند (§۹.۳). نرمال‌سازی L2 اجباری (§۹.۱). Idempotent باشد (§۹.۲).
**Done:** ارسال یک دستهٔ نمونه، ردیف‌ها را با بردار ۷۶۸‌بُعدیِ نرمال در `pages` می‌نشاند؛ اجرای دوباره تکراری نمی‌سازد.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "docs/PROJECT.md", "supabase/migrations/0001_init.sql"]

---

## T4 — Function بازرتبه‌بندی (`rerank`)
**خروجی:** `supabase/functions/rerank/index.ts`.
**راهنمای فنی:** دریافت `{sourcePage, candidates, model}`؛ اعتبارسنجی `model` در برابر رجیستری `_shared/models.ts` (نامعتبر→۴۰۰)؛ prompt فارسیِ متمرکز بر «لینک داخلی سئو»؛ فراخوانی مدل چت با `responseSchema` JSON آرایه‌ای `[{id, rank, seo_reason}]`. مدل فقط **بازچینش + دلیل**؛ حذف کاندیدا ممنوع.
**محدودیت‌ها:** کلید از Secret. خروجی حتماً JSON معتبر مطابق schema. شناسهٔ مدل از رجیستری (§۹.۵، §۹.۷).
**Done:** ارسال یک مبدأ + چند کاندیدا با هر سه مدل، آرایهٔ رتبه‌بندی‌شدهٔ معتبر با `seo_reason` برمی‌گرداند.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "supabase/functions/_shared/models.ts"]

---

## T5 — لایهٔ دادهٔ کلاینت (client + config + types + سرویس‌ها)
**خروجی:** `src/lib/supabaseClient.ts`, `src/config/models.ts`, بازنویسی `src/types.ts`, و `src/services/ingestService.ts`, `matchService.ts`, `rerankService.ts` (+ نگه‌داشتن `csvService.ts`).
**راهنمای فنی:**
(الف) `supabaseClient.ts`: ساخت client از `VITE_*`.
(ب) `config/models.ts`: آینهٔ لیست مدل چت + مدل پیش‌فرض (برای UI).
(ج) `types.ts`: طبق §۶ (Page, MatchResult, RerankResult, ModelId).
(د) `ingestService.ts`: تقسیم `Page[]` به chunk و فراخوانی متوالیِ `embed-pages` با گزارش پیشرفت (callback).
(ه) `matchService.ts`: `getMatches(sourceId)` → `supabase.rpc('match_pages', {source_id, match_count:30})`.
(و) `rerankService.ts`: `rerankOne(source, candidates, model)` → فراخوانی Edge Function؛ join نتیجه با `id`.
**محدودیت‌ها:** بدون محاسبهٔ شباهت در JS (§Anti-Patterns). شناسهٔ مدل فقط از `config/models.ts`. سرویس‌ها خالص و بدون UI.
**Done:** از کنسول/تست، `getMatches` ۳۰ ردیف با `similarity` برمی‌گرداند و `ingestService` پیشرفت را گزارش می‌کند.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "src/services/csvService.ts", "supabase/functions/_shared/models.ts"]

---

## T6 — State/Context جدید (ارکستریشن درون‌حافظه)
**خروجی:** بازنویسی `src/state/AppContext.tsx`.
**راهنمای فنی:** state: `pages`, `matches: Record<number, MatchResult[]>`, `rerankResults: Record<number, RerankResult[]>`, `selectedPageId`, `selectedModel` (از localStorage)، `ingestProgress`, `loading`, `error`. اکشن‌ها: `ingestPages(pages)` (→ingestService سپس refresh فهرست از Supabase)، `loadPages()`، `selectPage(id)` (→matchService)، `rerank(pageId, mode)` (per-page یا batch با حلقهٔ ترتیبی §۹.۴)، `setSelectedModel`.
**محدودیت‌ها:** فقط ارکستریشن؛ منطق شبکه در سرویس‌ها بماند. `selectedModel` تنها چیزی است که در localStorage می‌رود.
**Done:** Provider بدون ارجاع به کدهای حذف‌شده کامپایل می‌شود و اکشن‌ها سرویس‌های T5 را صدا می‌زنند.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "src/types.ts", "src/services/ingestService.ts", "src/services/matchService.ts", "src/services/rerankService.ts", "src/config/models.ts"]

---

## T7 — UI: آپلود/ورود، فهرست، جدول شباهت، دکمهٔ AI، تنظیمات
**خروجی:** `FileUpload.tsx`, `PageList.tsx`, `SimilarityTable.tsx` (جایگزین CandidateTable)، `AiRerankButton.tsx` (جایگزین AiButton)، `SettingsModal.tsx` (جایگزین ApiKeyModal)، و اتصال در `App.tsx`. حذف/ساده‌سازی زیرپوشه‌های کامپوننتی منسوخ.
**راهنمای فنی:** آپلود CSV → `ingestPages` با نوار پیشرفت (n/کل). PageList از Supabase با جست‌وجو. SimilarityTable: ۳۰ کاندیدا با ستون‌های عنوان، **درصد شباهت**، تگ‌های کلیدی، و پس از rerank ستون رتبهٔ نهایی + دلیل. `AiRerankButton`: دو حالت per-page و «رتبه‌بندی همه» (batch). `SettingsModal`: انتخاب مدل چت از `config/models.ts`. تم emerald/slate، RTL، Vazirmatn.
**محدودیت‌ها:** کامپوننت‌ها Dumb؛ همهٔ منطق در Context/سرویس. بدون نمایش مفاهیم منسوخ (حلقه/رابطه). بدون هاردکد مدل.
**Done:** فلوی کامل در مرورگر کار می‌کند: آپلود→ورود داده→انتخاب صفحه→۳۰ پیشنهاد با درصد شباهت→رتبه‌بندی هوشمند per-page و batch→تغییر مدل در تنظیمات.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "docs/PROJECT.md", "src/state/AppContext.tsx", "src/config/models.ts", "src/App.tsx"]

---

## T8 — خروجی CSV
**خروجی:** `src/components/ExportButton.tsx` + تابع export در `csvService.ts`.
**راهنمای فنی:** export نتایج صفحهٔ انتخاب‌شده به CSV با ستون‌های §۷: صفحهٔ مبدأ، صفحهٔ هدف، درصد شباهت، رتبهٔ نهایی (در صورت rerank)، دلیل سئویی. مدیریت quote برای متن فارسی (Papa Parse).
**محدودیت‌ها:** فقط همین فایل‌ها؛ استفاده از داده‌های state موجود.
**Done:** فایل CSV معتبر با ستون‌های درست دانلود می‌شود.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "src/services/csvService.ts", "src/state/AppContext.tsx"]

---

## ترتیب و وابستگی
T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.
- T3/T4 وابسته به T2 (اسکیما/RPC).
- T5 وابسته به T3/T4 (قرارداد Edge Functions).
- T6 وابسته به T5؛ T7 وابسته به T6؛ T8 وابسته به T7.
- بیلد کامل کلاینت از پایان T6 به بعد باید سبز بماند.
