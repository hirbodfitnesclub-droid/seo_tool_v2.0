-- =====================================================================
-- مهاجرت ۰۰۰۲: رتبه‌بندی عمیق ترکیبی (Hybrid Ranking)
-- هدف: افزایش کیفیت تشخیص شباهت بدون نیاز به هوش مصنوعی
--   ۱. ارتقای ابعاد بردار امبدینگ از ۷۶۸ به ۱۵۳۶ (کیفیت معنایی عمیق‌تر)
--   ۲. بازنویسی match_pages به یک موتور ترکیبی: شباهت برداری + سیگنال‌های ساختاری تگ‌ها
--   ۳. بازگرداندن تمام تگ‌های مشترک تا کلاینت بتواند «دلیل رتبه» را بدون AI بسازد
--   ۴. افزودن خط‌مشی حذف برای امکان پاک‌سازی کامل داده‌ها از سمت کلاینت
-- توجه: چون ابعاد بردار تغییر می‌کند، تمام صفحات باید مجدداً امبد شوند.
-- =====================================================================

-- ۱. حذف ایندکس قدیمی و بازسازی ستون امبدینگ با ابعاد ۱۵۳۶
drop index if exists public.pages_embedding_hnsw_idx;

alter table public.pages drop column if exists embedding;
alter table public.pages add column embedding extensions.vector(1536);

-- بازسازی ایندکس HNSW روی ستون جدید (شباهت کسینوسی)
create index if not exists pages_embedding_hnsw_idx
  on public.pages
  using hnsw (embedding extensions.vector_cosine_ops);

-- ۲. تابع کمکی برای مقایسه امن دو مقدار متنی (نرمال‌سازی فاصله/خالی)
create or replace function public.tags_match(a text, b text)
returns boolean
language sql
immutable
as $$
  select
    a is not null and b is not null
    and length(trim(a)) > 0 and length(trim(b)) > 0
    and lower(trim(a)) = lower(trim(b));
$$;

-- ۳. بازنویسی موتور تطبیق به صورت ترکیبی (Hybrid)
--    relevance = شباهت برداری + مجموع وزنی تگ‌های مشترک ساختاری
drop function if exists public.match_pages(bigint, int);

create or replace function public.match_pages(source_id bigint, match_count int default 30)
returns table (
  id bigint,
  title text,
  continent text,
  country text,
  direction text,
  city text,
  origin text,
  tour_type text,
  season text,
  month text,
  holiday text,
  occasion text,
  theme text,
  vehicle text,
  hotel_name text,
  hotel_stars text,
  class_label text,
  audience_persona text,
  visa_status text,
  travel_type text,
  url text,
  impression bigint,
  similarity float,
  structure_score float,
  relevance float
)
language sql
stable
as $$
  with src as (
    select * from public.pages where id = source_id
  )
  select
    p.id, p.title, p.continent, p.country, p.direction, p.city, p.origin,
    p.tour_type, p.season, p.month, p.holiday, p.occasion, p.theme, p.vehicle,
    p.hotel_name, p.hotel_stars, p.class_label, p.audience_persona,
    p.visa_status, p.travel_type, p.url, p.impression,
    -- شباهت برداری خام (۰ تا ۱)
    (1 - (p.embedding <=> src.embedding))::float as similarity,
    -- امتیاز ساختاری بر پایه تگ‌های مشترک وزن‌دار
    (
        (case when public.tags_match(p.city, src.city) then 0.15 else 0 end)
      + (case when public.tags_match(p.country, src.country) then 0.12 else 0 end)
      + (case when public.tags_match(p.hotel_name, src.hotel_name) then 0.10 else 0 end)
      + (case when public.tags_match(p.theme, src.theme) then 0.08 else 0 end)
      + (case when public.tags_match(p.tour_type, src.tour_type) then 0.06 else 0 end)
      + (case when public.tags_match(p.origin, src.origin) then 0.05 else 0 end)
      + (case when public.tags_match(p.season, src.season) then 0.04 else 0 end)
      + (case when public.tags_match(p.audience_persona, src.audience_persona) then 0.04 else 0 end)
      + (case when public.tags_match(p.continent, src.continent) then 0.03 else 0 end)
      + (case when public.tags_match(p.month, src.month) then 0.03 else 0 end)
      + (case when public.tags_match(p.travel_type, src.travel_type) then 0.03 else 0 end)
      + (case when public.tags_match(p.occasion, src.occasion) then 0.03 else 0 end)
      + (case when public.tags_match(p.holiday, src.holiday) then 0.03 else 0 end)
      + (case when public.tags_match(p.direction, src.direction) then 0.02 else 0 end)
      + (case when public.tags_match(p.vehicle, src.vehicle) then 0.02 else 0 end)
    )::float as structure_score,
    -- امتیاز نهایی ترکیبی برای مرتب‌سازی
    (
      (1 - (p.embedding <=> src.embedding))
      + (
          (case when public.tags_match(p.city, src.city) then 0.15 else 0 end)
        + (case when public.tags_match(p.country, src.country) then 0.12 else 0 end)
        + (case when public.tags_match(p.hotel_name, src.hotel_name) then 0.10 else 0 end)
        + (case when public.tags_match(p.theme, src.theme) then 0.08 else 0 end)
        + (case when public.tags_match(p.tour_type, src.tour_type) then 0.06 else 0 end)
        + (case when public.tags_match(p.origin, src.origin) then 0.05 else 0 end)
        + (case when public.tags_match(p.season, src.season) then 0.04 else 0 end)
        + (case when public.tags_match(p.audience_persona, src.audience_persona) then 0.04 else 0 end)
        + (case when public.tags_match(p.continent, src.continent) then 0.03 else 0 end)
        + (case when public.tags_match(p.month, src.month) then 0.03 else 0 end)
        + (case when public.tags_match(p.travel_type, src.travel_type) then 0.03 else 0 end)
        + (case when public.tags_match(p.occasion, src.occasion) then 0.03 else 0 end)
        + (case when public.tags_match(p.holiday, src.holiday) then 0.03 else 0 end)
        + (case when public.tags_match(p.direction, src.direction) then 0.02 else 0 end)
        + (case when public.tags_match(p.vehicle, src.vehicle) then 0.02 else 0 end)
      )
    )::float as relevance
  from public.pages p, src
  where p.id <> source_id and p.embedding is not null and src.embedding is not null
  order by relevance desc
  limit match_count;
$$;

-- ۴. خط‌مشی حذف: اجازه پاک‌سازی کامل داده‌ها از سمت کلاینت (ابزار داخلی تک‌مستأجری)
drop policy if exists "Allow delete access for all" on public.pages;
create policy "Allow delete access for all"
  on public.pages
  for delete
  to anon, authenticated
  using (true);
