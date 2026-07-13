# CURRENT_TASK.md — وضعیت جاری پیاده‌سازی فاز ۳

## تسک فعال جاری
**تمامی تسک‌های فاز ۳ (P3.T1 تا P3.T6) با موفقیت ۱۰۰٪ به پایان رسیده‌اند.**

---

## وضعیت تسک‌های فاز ۳

- [x] **P3.T1 — مهاجرت DB: بُعد ۱۵۳۶ + جدول page_links + توابع rank/reason/clear**
  - وضعیت: تکمیل شده. مهاجرت `0002_hybrid_ranking.sql` نوشته شد. بُعد بردار از ۷۶۸ به ۱۵۳۶ ارتقا یافت، ایندکس HNSW بازسازی شد، جدول `page_links` برای کش نتایج رتبه‌بندی اضافه شد، تابع `rank_all_pages` با منطق هیبرید (cosine + overlap + impression) پیاده‌سازی شد، و `clear_all_data` با security definer برای حذف کامل از Supabase.
- [x] **P3.T2 — به‌روزرسانی Edge Function امبدینگ + غنی‌سازی متن**
  - وضعیت: تکمیل شده. `models.ts` به ۱۵۳۶ dim به‌روز شد، هر دو مسیر batch و fallback در `embed-pages/index.ts` با `taskType: 'SEMANTIC_SIMILARITY'` ارسال می‌کنند، و `embedding-text.ts` یک جملهٔ خلاصهٔ طبیعی فارسی به ابتدای متن اضافه می‌کند و `'null'` متنی را فیلتر می‌کند.
- [x] **P3.T3 — حذف لایهٔ AI rerank**
  - وضعیت: تکمیل شده. Edge function `rerank`، `rerankService.ts`، `AiRerankButton.tsx`، `AiButton.tsx`، `SettingsModal.tsx`، `config/models.ts`، `geminiService.ts`، `impressionService.ts`، `engine.worker.ts` و کل فایل‌های `core/linking/*` حذف شدند.
- [x] **P3.T4 — لایهٔ دادهٔ کلاینت: types + services**
  - وضعیت: تکمیل شده. `types.ts` با `MatchResult` جدید (`final_score/rank/shared_attrs/reason`) و `AppPhase` بازنویسی شد؛ `matchService.ts` با سه RPC جدید `getPageLinks`، `rankAllPages`، `clearAllData` کاملاً بازنویسی شد؛ `csvService.ts` ستون‌های خروجی را با فاز ۳ هماهنگ کرد.
- [x] **P3.T5 — State/Context: جریان خودکار + پاک‌سازی سرویسی**
  - وضعیت: تکمیل شده. `AppContext.tsx` با `AppPhase` بازنویسی شد؛ جریان `parsing→embedding→ranking→done` خودکار است؛ `clearAllDataAction` ابتدا `clearAllData()` سروری را فراخوانی می‌کند.
- [x] **P3.T6 — UI: حذف دکمهٔ شروع، جریان خودکار، جدول با reason، export**
  - وضعیت: تکمیل شده. `FileUpload.tsx` بازنویسی شد با نمایش فاز پیشرفت بدون دکمهٔ شروع؛ `SimilarityTable*` با ستون‌های رتبه، امتیاز، reason به‌روز شد؛ `AiRerankButton`، `SettingsModal`، `FileUploadActions` حذف شدند؛ `App.tsx` تمیز شد.

---

## درخت تمرکز فاز ۳ (فایل‌های نهایی)

### Edge Functions (Supabase)
- `supabase/functions/_shared/models.ts` — ثابت embedding، dim=1536
- `supabase/functions/_shared/embedding-text.ts` — ساخت متن غنی برای embedding
- `supabase/functions/embed-pages/index.ts` — embedding دسته‌ای با taskType=SEMANTIC_SIMILARITY

### DB Migration
- `supabase/migrations/0002_hybrid_ranking.sql` — schema فاز ۳ کامل

### Client
- `src/types.ts` — تایپ‌های فاز ۳ (Page, MatchResult, AppPhase, ...)
- `src/services/matchService.ts` — RPC calls: getPageLinks, rankAllPages, clearAllData
- `src/services/ingestService.ts` — آپلود دسته‌ای صفحات
- `src/services/csvService.ts` — export با ستون‌های فاز ۳
- `src/state/AppContext.tsx` — ارکستریشن جریان خودکار
- `src/App.tsx` — ورودی UI
- `src/components/FileUpload.tsx` — آپلود + نمایش فاز
- `src/components/SimilarityTable.tsx` + زیرکامپوننت‌ها — جدول با رتبه/reason
- `src/components/ExportButton.tsx` — export CSV فاز ۳
