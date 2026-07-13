# tasks.md — نقشه راه فاز ۳ (رتبه‌بندیِ هیبریدیِ قطعی)

> فاز ۲ (T0→T8) کامل شد. فاز ۳ روی همان استک ساخته می‌شود و کیفیت + جریان را ارتقا می‌دهد.
> ترتیب اجباری و متوالی P3.T1→P3.T6. هیچ دو تسکی که روی فایل مشترک R/W دارند موازی نمی‌شوند.
> مرجع کامل: `docs/ARCHITECTURE.md` · قوانین و نبایدها: `docs/PROJECT.md`.
> راهبرد: اول دیتابیس و منطقِ سرور (SQL)، بعد Edge امبد، بعد حذفِ AI، بعد لایهٔ دادهٔ کلاینت، بعد جریانِ خودکار و UI، بعد export.

---

## P3.T1 — مهاجرت دیتابیس: بُعد ۱۵۳۶ + جدول page_links + توابع رتبه/دلیل/پاک‌سازی
**خروجی:** `supabase/migrations/0002_hybrid_ranking.sql` و اجرای آن روی دیتابیس (از طریق ادغام Supabase).
**راهنمای فنی (طبق §۳ ARCHITECTURE):**
1. تغییرِ بُعدِ ستونِ `pages.embedding` به `vector(1536)` (drop index → alter column `using null` → recreate HNSW). طبق §۳.۱.
2. جدول `page_links` با کلید ترکیبی، `similarity/structured/final_score`, `shared_attrs text[]`, `reason text`, ایندکس روی `source_id`, RLS فقط‌خواندنِ `anon`. طبق §۳.۲.
3. تابع `rank_all_pages()`: truncate + برای هر مبدأ، پیش‌فیلترِ ~۸۰ نزدیک‌ترین با HNSW، محاسبهٔ `structured` با وزن‌های §۳.۳ و قاعدهٔ تگِ معتبرِ §۳.۴، `final_score=0.65*sim+0.35*structured`, انتخاب ۳۰ برتر، `rank` با row_number، ساختِ `reason` طبق §۳.۶، insert. وزن‌ها و `α` ثابتِ نام‌دار و کامنت‌دار.
4. تابع `get_page_links(source_id)` طبق §۳.۷.
5. تابع `clear_all_data()` با `security definer` طبق §۳.۸ + `grant execute` به `anon`.
6. حذفِ (یا بلااستفاده کردنِ) `match_pages` طبق §۳.۹.
**محدودیت‌ها:** بُعد **باید ۱۵۳۶** باشد (سقف ایندکس pgvector=۲۰۰۰؛ اگر مدل ۱۵۳۶ را نپذیرفت به ۷۶۸ برگرد و همین‌جا هماهنگ کن). فقط SQL؛ بدون منطقِ اپلیکیشن. هیچ محاسبه‌ای به کلاینت منتقل نشود. مقدارِ متنیِ `'null'` تهی محسوب شود (§۹.۶).
**Done:** `select rank_all_pages();` بدون خطا اجرا می‌شود (حتی روی دادهٔ خالی)؛ `select * from get_page_links(1);` و `select clear_all_data();` بدون خطای ساختاری کار می‌کنند؛ ستون `embedding` نوع `vector(1536)` دارد و ایندکس HNSW سالم است.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "docs/PROJECT.md", "supabase/migrations/0001_init.sql"]

---

## P3.T2 — به‌روزرسانیِ Edge امبد + غنی‌سازیِ متنِ امبدینگ
**خروجی:** ویرایشِ `supabase/functions/embed-pages/index.ts`، `supabase/functions/_shared/embedding-text.ts`، و پاک‌سازیِ `supabase/functions/_shared/models.ts`.
**راهنمای فنی:**
(الف) در `embed-pages`: `outputDimensionality` را به `1536` تغییر بده و `taskType: 'SEMANTIC_SIMILARITY'` را به بدنهٔ `embedContent` و `batchEmbedContents` اضافه کن (§۴). صحتِ نامِ فیلد و پشتیبانیِ بُعد را راستی‌آزمایی کن. `l2Normalize`، upsert `on conflict (title)` و منطقِ مقاومت در خطا **دست‌نخورده** بماند.
(ب) در `embedding-text.ts`: فیلدهای تهی شاملِ رشتهٔ متنیِ `'null'` را حذف کن؛ یک جملهٔ خلاصهٔ طبیعیِ فارسی به ابتدای متن بیفزا؛ بقیهٔ قالبِ برچسب‌دار و `normalizeFarsiText` حفظ شود (§۴.۱).
(ج) در `_shared/models.ts`: `EMBEDDING_DIMENSIONALITY=1536`؛ **حذفِ** `CHAT_MODELS`, `ChatModelId`, `isValidChatModel`.
**محدودیت‌ها:** کلید فقط از Secret. `buildEmbeddingText` فقط یک‌جا تعریف شود. بدون تغییرِ ساختارِ خطا/دسته.
**Done:** ارسالِ یک دستهٔ نمونه، ردیف‌ها را با بردارِ **۱۵۳۶‌بُعدیِ نرمال** در `pages` می‌نشاند؛ `'null'` متنی دیگر در `embedding_text` نیست؛ اجرای دوباره تکراری نمی‌سازد.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "docs/PROJECT.md", "supabase/functions/embed-pages/index.ts", "supabase/functions/_shared/embedding-text.ts", "supabase/functions/_shared/models.ts", "supabase/migrations/0002_hybrid_ranking.sql"]

---

## P3.T3 — حذفِ کاملِ لایهٔ هوش مصنوعی (Teardown)
**خروجی:** حذفِ فایل‌های AI و پاک‌سازیِ ارجاع‌ها.
**راهنمای فنی (طبق §۵):**
(الف) حذف: کلِ پوشهٔ `supabase/functions/rerank/`، `src/services/rerankService.ts`، `src/components/AiRerankButton.tsx`، و `src/components/AiButton.tsx` اگر مانده.
(ب) هر ارجاع به این‌ها را **اول استفاده، بعد import** پاک کن (به‌ویژه در `AppContext.tsx`، `SimilarityTable.tsx`، `App.tsx`).
(ج) `SettingsModal.tsx`: انتخابِ مدل چت را بردار؛ اگر چیزِ معناداری نماند، مودال و دکمهٔ بازکننده‌اش در `App.tsx` را حذف کن.
(د) `config/models.ts`: لیستِ مدل چت و `DEFAULT_MODEL` را حذف کن.
**محدودیت‌ها:** در این تسک منطقِ جدید اضافه نمی‌شود؛ فقط حذف و پاک‌سازیِ ارجاع. `localStorage` مربوط به `selected_model` هم حذف شود.
**Done:** هیچ فایلی به `rerank`, `rerankService`, `AiRerankButton`, `CHAT_MODELS`, `selectedModel` ارجاع نمی‌دهد؛ بیلد از ارجاعِ مرده پاک است (ممکن است تا P3.T4/T5 به‌خاطرِ تایپ‌ها موقتاً بشکند).
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "src/state/AppContext.tsx", "src/components/SimilarityTable.tsx", "src/components/SettingsModal.tsx", "src/config/models.ts", "src/App.tsx"]

---

## P3.T4 — لایهٔ دادهٔ کلاینت: types + سرویس‌ها
**خروجی:** بازنویسیِ `src/types.ts` و `src/services/matchService.ts` (+ نگه‌داشتنِ `ingestService.ts`).
**راهنمای فنی (طبق §۶):**
(الف) `types.ts`: `MatchResult` را با `similarity, final_score, rank, shared_attrs, reason` بازتعریف کن؛ `AppPhase` را اضافه کن؛ `ModelId` و `RerankResult` را حذف کن؛ `FinalLink` را با ستون‌های خروجیِ جدید هماهنگ کن.
(ب) `matchService.ts`: `getPageLinks(sourceId)` → `supabase.rpc('get_page_links', {source_id})`؛ `rankAllPages()` → `supabase.rpc('rank_all_pages')`؛ `clearAllData()` → `supabase.rpc('clear_all_data')`؛ `getAllPages()` حفظ شود. حذفِ هر ارجاع به `match_pages`.
(ج) `ingestService.ts` بدون تغییرِ ساختاری.
**محدودیت‌ها:** بدونِ محاسبهٔ شباهت/امتیاز در JS (§۹.۴). سرویس‌ها خالص و بدون UI.
**Done:** از کنسول، `rankAllPages()` سپس `getPageLinks(id)` ۳۰ ردیفِ رتبه‌دار با `reason` و `final_score` برمی‌گرداند؛ `clearAllData()` جدول‌ها را در Supabase خالی می‌کند.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "src/types.ts", "src/services/matchService.ts", "src/services/ingestService.ts"]

---

## P3.T5 — State/Context: جریانِ خودکار (embedding→ranking→done) + پاک‌سازیِ سروری
**خروجی:** بازنویسیِ `src/state/AppContext.tsx`.
**راهنمای فنی:**
- state جدید: `phase: AppPhase`, `matches: Record<number, MatchResult[]>`, `ingestProgress`, `loading`, `error`, `selectedPageId`, `pages`. حذفِ `rerankResults`, `selectedModel`, `batchRerankProgress`.
- `ingestPagesAction(pages)`: `phase='embedding'` → `ingestPages` (با پیشرفت) → پس از پایان `phase='ranking'` → `rankAllPages()` → `loadPages()` → `phase='done'`. خطا → `phase='error'`.
- `selectPage(id)`: از `getPageLinks(id)` بخوان و در `matches` کش کن (کش درون‌حافظه فقط برای جلوگیری از کوئریِ تکراری).
- `clearAllDataAction()`: `clearAllData()` سروری → سپس خالی‌کردنِ کاملِ state و `phase='idle'`.
**محدودیت‌ها:** فقط ارکستریشن؛ منطقِ شبکه در سرویس‌ها. رتبه‌بندی فقط پس از پایانِ کاملِ امبد (§۹.۵). بدونِ `localStorage`.
**Done:** Provider بدونِ ارجاع به کدهای حذف‌شده کامپایل می‌شود؛ آپلود به‌صورت خودکار امبد و سپس رتبه‌بندی می‌کند و `phase` درست پیش می‌رود؛ پاک‌سازی داده را از Supabase حذف می‌کند.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "src/types.ts", "src/services/matchService.ts", "src/services/ingestService.ts"]

---

## P3.T6 — UI: حذفِ دکمهٔ شروع، جریانِ خودکار، جدولِ دلیل‌دار، و Export
**خروجی:** ویرایشِ `FileUpload.tsx` (+ حذف `file-upload/FileUploadActions.tsx`)، `SimilarityTable.tsx` و زیرمجموعه‌اش، `ExportButton.tsx` + `csvService.ts`، و `App.tsx`.
**راهنمای فنی:**
- `FileUpload.tsx`: پس از parse، **بلافاصله و خودکار** `ingestPagesAction` صدا زده شود (هم برای فایل، هم نمونه). دکمهٔ «شروع» و `FileUploadActions` حذف شود. نمایشِ فاز: نوارِ پیشرفتِ امبد، سپس لودینگِ «در حال رتبه‌بندیِ همهٔ صفحات...»، سپس بنرِ «تمام شد ✓». دکمهٔ «پاک‌سازی» به `clearAllDataAction` وصل شود (نه فقط clearState).
- `SimilarityTable.tsx` و `similarity-table/*`: حذفِ کاملِ منطقِ rerank و مرتب‌سازیِ کلاینت؛ ردیف‌ها همان ترتیبِ `rank`ِ آمده از `page_links`؛ ستون‌ها: **رتبه**، لندینگ‌پیج هدف، **درصد شباهت**، **امتیاز نهایی**، **دلیلِ رتبه** (`reason`). فوتر: شمارشِ کاندیداها.
- `ExportButton.tsx` + `csvService.ts`: export از دادهٔ `matches` صفحهٔ انتخابی با ستون‌های §۷ (مبدأ، هدف، درصد شباهت، امتیاز نهایی، رتبه، دلیل)، UTF-8 BOM.
- `App.tsx`: اگر `SettingsModal` خالی شد حذفش کن؛ متن‌های راهنما را با جریانِ خودکار هماهنگ کن (دیگر «دکمه بزنید» نگو).
**محدودیت‌ها:** کامپوننت‌ها Dumb؛ همهٔ منطق در Context/سرویس. بدونِ هاردکد. تم emerald/slate، RTL، Vazirmatn حفظ شود.
**Done:** فلوی کامل در مرورگر: آپلود → امبدِ خودکار (پیشرفت) → رتبه‌بندیِ خودکار (لودینگ) → «تمام شد» → انتخاب صفحه → ۳۰ پیشنهاد با رتبه/شباهت/امتیاز/دلیل → Export CSV. «پاک‌سازی» داده را از Supabase حذف می‌کند و UI به حالتِ اولیه برمی‌گردد.
CONTEXT_FILES: ["docs/ARCHITECTURE.md", "docs/PROJECT.md", "src/state/AppContext.tsx", "src/components/FileUpload.tsx", "src/components/SimilarityTable.tsx", "src/services/csvService.ts", "src/App.tsx"]

---

## ترتیب و وابستگی
P3.T1 → P3.T2 → P3.T3 → P3.T4 → P3.T5 → P3.T6.
- P3.T2 وابسته به P3.T1 (بُعد ۱۵۳۶ و اسکیما).
- P3.T4 وابسته به P3.T1 (قراردادِ RPCها).
- P3.T5 وابسته به P3.T3 و P3.T4.
- P3.T6 وابسته به P3.T5.
- بیلد کامل کلاینت از پایان P3.T5 به بعد باید سبز بماند.
