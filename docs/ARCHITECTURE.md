# ARCHITECTURE.md — معماری SemanticLink (نسخهٔ ۳.۰ — رتبه‌بندیِ هیبریدیِ قطعی)

> منبعِ حقیقتِ واحد برای مهندسی. در تعارض با هر فایل دیگری، این فایل حاکم است.
> **این نسخه فاز ۳ را تعریف می‌کند.** بخش‌های زیرساختیِ فاز ۲ (اتصال Supabase، جدول `pages`، الگوی Edge Function، پارسر CSV) که تغییر نمی‌کنند، اینجا فقط ارجاع داده می‌شوند نه بازتعریف.

---

## ۰) تصمیمات کلیدی معماری فاز ۳ (هر کدام با ≥۲ گزینه و انتخاب مستدل)

### ۰.۱ چرا کیفیت فاز ۲ ضعیف بود؟ (ریشه‌یابی)
داده ۵۷۶ صفحهٔ تورِ بسیار هم‌شکل است (همه «تور {مقصد} {زمان}»). متنِ امبدینگ کوتاه و برچسب‌محور بود و `taskType` ست نشده بود؛ نتیجه: بردارها در فضای معنایی بسیار نزدیک به هم خوشه می‌شوند و کسینوسِ خالص نمی‌تواند تفاوت‌های ظریفِ سئویی (هم‌مقصد بودن، هم‌تم بودن، هم‌فصل بودن) را قاطعانه رتبه‌بندی کند. راه‌حل: **سیگنالِ ساختاری** را کنار سیگنالِ معنایی بگذاریم.

### ۰.۲ موتور رتبه‌بندی: کسینوسِ خالص یا هیبرید؟
- گزینه A — کسینوسِ تک‌برداریِ خالص (فاز ۲).
- گزینه B — **هیبرید: `α·cosine + (1−α)·structured`** (کسینوس + هم‌پوشانیِ وزن‌دارِ تگ‌ها) در Postgres.
- گزینه C — بازگشت به موتورِ قانون‌محورِ قدیمی.
**انتخاب: B.** A کیفیت لازم را نداد. C ممنوع و منسوخ است. B استانداردِ مدرنِ «Hybrid Retrieval» است: بردار مفهوم را می‌فهمد، تگ‌ها دقتِ حوزه‌ای می‌دهند. کاملاً قطعی، بدون هوش مصنوعی، شفاف و قابل‌توضیح.
> **هشدار ضدتعارض (برای مدل کدنویس):** «امتیاز ساختاری» یعنی مقایسهٔ برابریِ چند فیلدِ متنی با وزن‌های ثابت داخل SQL. این **ابداً** موتورِ قدیمیِ walls/rings/fill نیست و هیچ فایلی در `src/core/*` نباید ساخته/برگردانده شود. کل منطق داخل یک تابع SQL است.

### ۰.۳ دلیلِ رتبه: هوش مصنوعی یا قطعی؟
- گزینه A — تولید دلیل با فراخوانی مدل چت (هزینه‌بر، غیرقطعی).
- گزینه B — **دلیلِ قطعی از خودِ اجزای امتیاز** (تگ‌های مشترک + درصد شباهت) در همان RPC.
**انتخاب: B.** خواستهٔ صریح کارفرما: «فقط اگر از امبدینگ درمی‌آید و هزینه ندارد». چون امتیاز ساختاری دقیقاً می‌داند کدام تگ‌ها مشترک بوده‌اند، دلیل رایگان و صادق ساخته می‌شود (مثلاً «مقصد مشترک: استانبول • تم مشترک: خرید • هم‌فصل: تابستان • شباهت معنایی ۸۷٪»).

### ۰.۴ رتبه‌بندی: درلحظه یا پیش‌محاسبه؟
- گزینه A — درلحظه هنگام انتخاب صفحه (فاز ۲).
- گزینه B — **پیش‌محاسبهٔ کاملِ همهٔ صفحات پس از امبد، ذخیره در جدول `page_links`.**
**انتخاب: B (تغییر نسبت به فاز ۲).** کارفرما صراحتاً «رتبه‌بندیِ خودکارِ کلِ صفحات پس از امبد + وضعیت تمام‌شدن» می‌خواهد. پیش‌محاسبه یک «فاز رتبه‌بندی» با پایانِ مشخص می‌سازد، مرور را آنی می‌کند، و export همه‌چیز را بی‌دردسر می‌کند. نگرانیِ کهنگی رفع است چون بعد از هر امبد دوباره ساخته و در پاک‌سازی حذف می‌شود. برای ۵۷۶×۳۰ ردیف، بارِ ناچیز — اُور-انجینیرینگ نیست.

### ۰.۵ محلِ رتبه‌بندیِ گروهی: کلاینت یا سرور؟
- گزینه A — حلقهٔ کلاینت که تک‌تک صفحات را صدا می‌زند (الگوی قدیمیِ batch rerank).
- گزینه B — **یک RPC واحدِ مجموعه‌ای در Postgres** که همهٔ `page_links` را در یک فراخوانی می‌سازد.
**انتخاب: B.** قطعی و سریع (با ایندکس برداری)، بدون ارکستریشنِ شکنندهٔ کلاینت. یک `rank_all_pages()` کلِ کار را انجام می‌دهد.

### ۰.۶ پاک‌سازیِ سروری: Edge Function یا RPC؟
- گزینه A — Edge Function جدید با `service_role`.
- گزینه B — **تابع SQLِ `security definer` به‌نام `clear_all_data()`** که با نقشِ تعریف‌کننده RLS را دور می‌زند.
**انتخاب: B.** ساده‌تر (بدون Edge Function جدید و بدون رفت‌وبرگشتِ service key)، و با وضعیتِ امنیتیِ موجود (ابزار داخلیِ تک‌کاربره) سازگار است.

### ۰.۷ حذف کاملِ لایهٔ هوش مصنوعی
لایهٔ Re-rank (edge function `rerank`، `rerankService.ts`، `AiRerankButton.tsx`، انتخاب مدل چت، `CHAT_MODELS`) **حذف** می‌شود. رتبه‌بندیِ قطعیِ هیبریدی محصولِ نهایی است. این بزرگ‌ترین ساده‌سازیِ فاز ۳ است و مستقیماً با «تا حد زیادی نیاز به AI نداریم» هم‌راستاست.

---

## ۱) معماری کلان (فاز ۳)
SPA (React + Vite) که **مستقیماً** با Supabase گفتگو می‌کند:
- **نوشتن/امبدینگ:** فراخوانی Edge Function `embed-pages` (بدون تغییرِ ساختاری؛ فقط پارامترهای امبد به‌روز می‌شوند).
- **رتبه‌بندی:** فراخوانی RPC `rank_all_pages()` (یک‌بار، پس از امبد).
- **خواندن پیشنهادها:** RPC `get_page_links(source_id)` یا `select` از `page_links`.
- **پاک‌سازی:** RPC `clear_all_data()`.

کلید Gemini فقط Secret روی Supabase است. کلاینت هیچ کلیدی و هیچ محاسبهٔ امتیازی ندارد.

## ۲) جریان داده (Data Flow — فاز ۳)

**جریانِ خودکارِ یک‌مرحله‌ای (بدون دکمهٔ شروع):**
```
[۱] کاربر pages.csv (۱۹ ستون) را آپلود/دراپ می‌کند
[۲] Papa Parse در کلاینت → Page[]
[۳] بلافاصله و خودکار: phase='embedding' → ارسال دسته‌ای (chunk=۵۰) به embed-pages
      embed-pages: buildEmbeddingText → gemini-embedding-2 (dim=1536, taskType=SEMANTIC_SIMILARITY, L2 normalize) → upsert در pages
      UI نوار پیشرفت n/total نشان می‌دهد
[۴] پس از پایان امبد: phase='ranking' → فراخوانی RPC rank_all_pages()
      این تابع page_links را خالی و برای هر صفحه ۳۰ مکملِ برتر را با امتیاز هیبریدی + دلیل می‌سازد
      UI لودینگِ «در حال رتبه‌بندیِ همهٔ صفحات...» نشان می‌دهد
[۵] پس از پایان: phase='done' → بنر «تمام شد» + رفرش فهرست صفحات
[۶] کاربر یک صفحه انتخاب می‌کند → get_page_links(source_id) از page_links (آنی)
      نمایش ۳۰ پیشنهاد با درصد شباهت، امتیاز نهایی، رتبه، و «دلیلِ رتبه»
[۷] Export CSV (صفحهٔ مبدأ، صفحهٔ هدف، درصد شباهت، امتیاز نهایی، رتبه، دلیل)
```

**پاک‌سازی:** کاربر «پاک‌سازی» را می‌زند → RPC `clear_all_data()` (حذف از Supabase) → clearState کلاینت → phase='idle'.

## ۳) اسکیمای دیتابیس (Supabase Postgres — تغییرات فاز ۳)

> مهاجرتِ جدید: `supabase/migrations/0002_hybrid_ranking.sql`. فایل `0001_init.sql` دست‌نخورده می‌ماند؛ تغییرات به‌صورت افزایشی اعمال شوند.

### ۳.۱ تغییرِ بُعدِ بردار در جدول `pages`
بُعد امبدینگ از ۷۶۸ به **۱۵۳۶** می‌رود. چون تغییر نوعِ ستونِ `vector(768)`→`vector(1536)` روی داده‌ای که دوباره امبد می‌شود بی‌معناست، ساده‌ترین راهِ اصولی:
```sql
-- ایندکس قدیمی را بردار، ستون را با بُعد جدید بازتعریف کن، سپس ایندکس را دوباره بساز
drop index if exists public.pages_embedding_hnsw_idx;
alter table public.pages alter column embedding type extensions.vector(1536) using null;
create index if not exists pages_embedding_hnsw_idx
  on public.pages using hnsw (embedding extensions.vector_cosine_ops);
```
> نکته: چون `using null` امبدینگ‌های قبلی را پاک می‌کند، کاربر باید یک بار داده را دوباره آپلود کند (که در فاز ۳ خودکار امبد می‌شود). این پذیرفته‌شده است.

### ۳.۲ جدول جدید `page_links` (نتایجِ پیش‌محاسبه‌شده)
```sql
create table if not exists public.page_links (
  source_id   bigint not null references public.pages(id) on delete cascade,
  target_id   bigint not null references public.pages(id) on delete cascade,
  rank        int    not null,          -- ۱..۳۰ داخل هر مبدأ
  similarity  double precision not null, -- کسینوس ۰..۱
  structured  double precision not null, -- امتیاز ساختاری ۰..۱
  final_score double precision not null, -- امتیاز نهایی ۰..۱
  shared_attrs text[] not null default '{}', -- کلیدهای تگ‌های مشترک (برای دلیل)
  reason      text not null default '',  -- دلیلِ فارسیِ آماده‌شده
  primary key (source_id, target_id)
);
create index if not exists page_links_source_idx on public.page_links (source_id);
alter table public.page_links enable row level security;
create policy "page_links read all" on public.page_links for select to anon, authenticated using (true);
```

### ۳.۳ ثابت‌های وزن‌دهیِ ساختاری (SEO-informed) — تنظیم‌پذیر یک‌نقطه‌ای
وزن‌ها باید **به‌صورت ثابت‌های نام‌دار و کامنت‌دار در ابتدای تابع** باشند تا تغییرشان یک‌نقطه‌ای باشد. جمع وزن‌ها = ۱.۰ تا `structured` مستقیماً ۰..۱ شود:
| تگ مشترک | فیلد | وزن | منطق سئو |
|---|---|---|---|
| شهر مقصد | `city` | **0.28** | قوی‌ترین: همان مکان، تاریخ/هتلِ متفاوت |
| کشور مقصد | `country` | **0.20** | خوشهٔ مقصدِ اصلی |
| تم/هدف سفر | `theme` | **0.16** | خوشهٔ موضوعی (خرید/ساحل/طبیعت/زیارتی) |
| مناسبت/تعطیلات | `occasion`/`holiday` | **0.10** | فقط وقتی هر دو ناتهی و برابر (نوروز/رمضان) |
| فصل | `season` | **0.08** | ربطِ فصلی |
| نوع تور | `tour_type` | **0.06** | تک‌مقصد/ترکیبی |
| مبدأ | `origin` | **0.05** | مخاطبِ هم‌مبدأ |
| قاره/منطقه | `continent` | **0.04** | خوشهٔ جغرافیاییِ کلان |
| نوع سفر | `travel_type` | **0.03** | ربطِ سبکِ سفر |

ضریبِ ترکیب: **`α = 0.65`** (بردار-محور، تقویت‌شده با ساختار). `final_score = 0.65·similarity + 0.35·structured`. `α` و وزن‌ها ثابت‌های نام‌دار در همان مهاجرت/تابع.

### ۳.۴ قاعدهٔ «تگِ معتبر برای تطبیق»
یک فیلد فقط وقتی «مشترک» شمرده می‌شود که در **هر دو** صفحه مقدارِ معنادار داشته باشد و برابر باشند. مقادیرِ زیر «تهی» محسوب می‌شوند و هرگز تطبیق نمی‌خورند: `NULL`، رشتهٔ خالی، فقط‌فاصله، و رشتهٔ متنیِ `'null'` (در CSVِ نمونه دیده شده). تابعِ کمکیِ SQLِ `is_meaningful(text)` یا شرطِ inline این را تضمین کند. مقایسه پس از `trim` و نرمال‌سازیِ سبک (ی/ک) انجام شود.

### ۳.۵ RPC — `rank_all_pages()` (هستهٔ فاز ۳)
یک تابع که کلِ `page_links` را بازمی‌سازد:
```
1) truncate public.page_links;
2) برای هر صفحهٔ مبدأ s که embedding دارد:
     a) با ایندکس HNSW، ~۸۰ نزدیک‌ترین کاندیدا بر اساس کسینوس پیش‌فیلتر شود (سرعت)
     b) برای هر کاندیدا: similarity = 1-(s.emb <=> c.emb)
        structured = مجموع وزنِ تگ‌های مشترک (طبق ۳.۳ و قاعدهٔ ۳.۴)
        final_score = 0.65*similarity + 0.35*structured
        shared_attrs = آرایهٔ کلیدهای مشترک (مثلاً {city,theme,season})
     c) مرتب بر اساس final_score نزولی، ۳۰ ردیفِ برتر
     d) rank = ردیفِ ۱..۳۰ (row_number)
     e) reason = رشتهٔ فارسی از shared_attrs + درصد شباهت (بخش ۳.۶)
     f) insert در page_links
```
پیاده‌سازیِ توصیه‌شده: مجموعه‌ای با `LATERAL` (نه حلقهٔ PL/pgSQLِ کند). اگر واضح‌تر است، `for` روی `pages` هم قابل‌قبول است چون ۵۷۶ ردیف کوچک است. خروجی: `returns void` یا `returns int` (تعداد کلِ لینک‌های ساخته‌شده) برای نمایش در UI.

### ۳.۶ تولید `reason` (قطعی، فارسی)
از `shared_attrs` (به ترتیبِ وزنِ نزولی، حداکثر ۴ مورد) + مقدارِ واقعیِ تگ + درصد شباهت، رشته‌ای مثل زیر ساخته شود (با `concat_ws('  •  ', …)` و برچسب‌های فارسی):
```
شباهت معنایی ۸۷٪  •  مقصد مشترک: استانبول  •  تم مشترک: خرید  •  هم‌فصل: تابستان
```
نگاشتِ برچسب‌ها (SQL `case`): `city→«مقصد مشترک»`, `country→«کشور مشترک»`, `theme→«تم مشترک»`, `season→«هم‌فصل»`, `occasion/holiday→«مناسبت مشترک»`, `tour_type→«نوع تور مشترک»`, `origin→«مبدأ مشترک»`, `continent→«منطقهٔ مشترک»`, `travel_type→«سبک سفر مشترک»`. اگر هیچ تگِ مشترکی نبود: فقط «شباهت معنایی X٪ (ارتباط مفهومی)». اعداد در نمایش فارسی‌اند اما ذخیره به هر شکل مجاز است؛ فارسی‌سازیِ رقم می‌تواند در کلاینت هم انجام شود.

### ۳.۷ RPC — `get_page_links(source_id bigint)`
خواندنِ آنیِ پیشنهادهای یک صفحه:
```sql
create or replace function public.get_page_links(source_id bigint)
returns table (
  id bigint, title text, country text, city text, season text, theme text, url text,
  similarity double precision, final_score double precision, rank int,
  shared_attrs text[], reason text
)
language sql stable as $$
  select p.id, p.title, p.country, p.city, p.season, p.theme, p.url,
         l.similarity, l.final_score, l.rank, l.shared_attrs, l.reason
  from public.page_links l
  join public.pages p on p.id = l.target_id
  where l.source_id = get_page_links.source_id
  order by l.rank asc;
$$;
```

### ۳.۸ RPC — `clear_all_data()` (`security definer`)
```sql
create or replace function public.clear_all_data()
returns void
language sql
security definer
set search_path = public
as $$
  truncate public.page_links;
  delete from public.pages;   -- یا truncate با cascade؛ page_links با on delete cascade هم پاک می‌شود
$$;
```
> باید به `anon` اجازهٔ `execute` داده شود. چون `security definer` است، RLSِ نوشتن را دور می‌زند (فقط همین یک عملیاتِ کنترل‌شده).

### ۳.۹ سرنوشتِ `match_pages` (فاز ۲)
تابع قدیمیِ `match_pages` دیگر مسیرِ اصلی نیست. **حذفش کن** (یا اگر می‌ماند، در کلاینت استفاده نشود) تا دو منبعِ حقیقتِ رتبه‌بندی نداشته باشیم. تنها منبعِ رتبه: `page_links` (ساخته‌شده توسط `rank_all_pages`).

## ۴) Edge Functions (Deno)

### `embed-pages` — تغییراتِ حداقلیِ فاز ۳
فایل موجود می‌ماند؛ فقط:
- **پارامترهای امبد:** `outputDimensionality: 1536` و افزودن `taskType: 'SEMANTIC_SIMILARITY'` به بدنهٔ درخواستِ `embedContent` و `batchEmbedContents` (فیلدِ REST: `taskType`). صحتِ نامِ فیلد و پشتیبانیِ بُعد ۱۵۳۶ توسط مدل، پیش از نهایی‌سازی راستی‌آزمایی شود؛ در صورت خطا به ۷۶۸ برگرد و مهاجرت را هماهنگ کن.
- `l2Normalize` و upsert `on conflict (title)` و منطقِ مقاومت در برابر خطا **بدون تغییر**.
- `buildEmbeddingText` غنی‌تر شود (بخش ۴.۱).

### `rerank` — حذف کامل
کلِ پوشهٔ `supabase/functions/rerank/` حذف شود. `isValidChatModel` و آرایهٔ `CHAT_MODELS` از `_shared/models.ts` حذف شوند (فقط ثابت‌های امبدینگ بمانند).

### ۴.۱ غنی‌سازیِ `buildEmbeddingText` (اهرمِ کیفیت)
قالبِ برچسب‌دارِ فعلی خوب است اما برای بردارِ قوی‌تر:
- فیلدهای تهی (شاملِ رشتهٔ `'null'`) حذف شوند (الان `'null'` متنی وارد متن می‌شود و بردار را آلوده می‌کند — این را اصلاح کن).
- یک جملهٔ خلاصهٔ طبیعیِ فارسی در ابتدای متن اضافه شود تا مدل بافت را بهتر بگیرد، مثلاً: «این صفحه دربارهٔ {نوع تور} به {مقصد} در {فصل/ماه} با تم {تم} است.» و سپس بخش‌های برچسب‌دار.
- نرمال‌سازیِ ی/ک و نیم‌فاصله (تابع موجود `normalizeFarsiText`) حفظ شود.
> `buildEmbeddingText` همچنان **تنها یک‌بار** در `_shared/embedding-text.ts` تعریف می‌شود (منبعِ مرجع).

## ۵) درخت فایل هدف (فاز ۳)

### حذف (Teardown فاز ۳)
```
supabase/functions/rerank/                 ← کل پوشه
src/services/rerankService.ts              ← سرویس AI
src/components/AiRerankButton.tsx          ← دکمهٔ AI
src/components/AiButton.tsx                ← اگر هنوز مانده (منسوخ)
src/components/AiRerankButton.tsx          ← (تکرار جهت تأکید)
```
> `SettingsModal.tsx`: انتخابِ مدل چت حذف شود. اگر بعد از حذف چیزِ معناداری نماند، خودِ مودال و دکمهٔ بازکنندهٔ آن در `App.tsx` حذف شوند (پاک‌سازی در بخش آپلود است، نه در تنظیمات).

### افزودن / بازنویسی
```
supabase/
  migrations/0002_hybrid_ranking.sql   # بُعد ۱۵۳۶ + page_links + rank_all_pages + get_page_links + clear_all_data + گرنت‌ها
  functions/
    embed-pages/index.ts               # فقط پارامترهای امبد (dim=1536, taskType) — تغییرِ حداقلی
    _shared/embedding-text.ts          # غنی‌سازیِ متن + حذف 'null' متنی
    _shared/models.ts                  # فقط ثابت‌های امبدینگ (dim=1536)؛ حذف CHAT_MODELS
src/
  config/models.ts                     # حذفِ لیستِ مدل چت؛ فقط ثابتِ امبدینگ در صورت نیاز کلاینت
  types.ts                             # MatchResult بازتعریف (similarity, final_score, rank, shared_attrs, reason)؛ حذف RerankResult/ModelId/CHAT
  services/
    matchService.ts                    # getPageLinks(sourceId) → RPC get_page_links؛ rankAllPages() → RPC rank_all_pages؛ clearAllData() → RPC clear_all_data
    ingestService.ts                   # بدون تغییرِ ساختاری (batch امبد)
    csvService.ts                      # export ستون‌های جدید (بخش ۷)
  state/AppContext.tsx                 # حذف rerank/selectedModel؛ افزودن phase + rankAll + clearAllData سروری؛ خودکارسازیِ ingest→rank
  components/
    FileUpload.tsx                     # حذف دکمهٔ شروع؛ اجرای خودکارِ ingest پس از parse؛ نمایشِ فاز embedding→ranking→done
    file-upload/FileUploadActions.tsx  # حذف (دیگر دکمهٔ شروع نداریم)
    PageList.tsx                       # بدون تغییرِ عمده
    SimilarityTable.tsx                # حذفِ منطقِ rerank؛ نمایشِ رتبه + امتیاز نهایی + دلیل (از page_links)
    similarity-table/*                 # ستون‌ها: رتبه، شباهت، امتیاز نهایی، دلیل
    ExportButton.tsx                   # export از page_links
  App.tsx                              # حذفِ SettingsModal اگر خالی شد؛ اتصال جریانِ خودکار
```

## ۶) قرارداد تایپ‌ها (خلاصه — `src/types.ts`)
```ts
// ModelId و RerankResult حذف می‌شوند.

export interface Page {
  id?: number; title: string;
  continent?: string; country?: string; direction?: string; city?: string; origin?: string;
  tourType?: string; season?: string; month?: string; holiday?: string; occasion?: string;
  theme?: string; vehicle?: string; hotelName?: string; hotelStars?: string;
  classLabel?: string; audiencePersona?: string; visaStatus?: string; travelType?: string;
  url?: string; impression?: number;
}

// خروجی get_page_links — تنها ساختارِ پیشنهاد
export interface MatchResult {
  id: number; title: string;
  country?: string; city?: string; season?: string; theme?: string; url?: string;
  similarity: number;      // کسینوس ۰..۱
  final_score: number;     // امتیاز هیبریدیِ نهایی ۰..۱
  rank: number;            // ۱..۳۰
  shared_attrs: string[];  // کلیدهای تگِ مشترک
  reason: string;          // دلیلِ فارسیِ آماده
}

// فازِ جریانِ خودکار
export type AppPhase = 'idle' | 'embedding' | 'ranking' | 'done' | 'error';
```

## ۷) قرارداد CSV (ورودی/خروجی)
- **ورودی صفحات (۱۹ ستون):** بدون تغییر؛ همان هدرهای فارسی؛ `csvService.parsePagesCsv` حفظ می‌شود.
- **خروجی (به‌روزشده):** `صفحه مبدأ، صفحه هدف، درصد شباهت، امتیاز نهایی، رتبه، دلیل`. کدگذاری UTF-8 BOM برای اکسل حفظ شود.

## ۸) متغیرهای محیطی
- کلاینت (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Edge Function `embed-pages` (Secrets): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **هیچ‌گاه** `GEMINI_API_KEY` با پیشوند `VITE_`.

## ۹) شفاف‌سازی‌های الزامی (برای مدل کدنویس)
- **۹.۱ نرمال‌سازی L2:** چون `outputDimensionality<3072`، بردار **قبل از ذخیره** L2-نرمال شود (تابع موجود). با ۱۵۳۶ هم لازم است.
- **۹.۲ Idempotency:** upsert `on conflict (title)` حفظ شود.
- **۹.۳ خطای دسته:** شکستِ یک ردیف کلِ دسته را fail نکند (منطقِ موجود حفظ شود).
- **۹.۴ کلِ امتیازدهی در SQL:** هیچ محاسبهٔ شباهت/امتیاز/مرتب‌سازی در JS مجاز نیست. کلاینت فقط `page_links` را می‌خواند و نمایش می‌دهد.
- **۹.۵ ترتیبِ خودکار:** جریان دقیقاً `embedding → (پس از پایان) ranking → done` است؛ رتبه‌بندی نباید قبل از پایانِ کاملِ امبد اجرا شود.
- **۹.۶ 'null' متنی:** مقدارِ متنیِ `'null'` در همه‌جا (embedding_text و تطبیقِ تگ) به‌عنوان تهی رفتار شود.
- **۹.۷ تنها منبعِ رتبه:** `page_links`. `match_pages` قدیمی استفاده نشود/حذف شود.
- **۹.۸ پاک‌سازیِ واقعی:** «پاک‌سازی» حتماً `clear_all_data()` سروری را صدا بزند، سپس state کلاینت را خالی کند.
- **۹.۹ بدونِ اُور-انجینیرینگ:** بدونِ صف/کش/جدولِ اضافه. وزن‌ها ثابتِ نام‌دار درون تابع، نه جدولِ config.
