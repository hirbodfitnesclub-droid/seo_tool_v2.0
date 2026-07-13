-- اکستنشن vector برای کار با بردارها در Postgres
create extension if not exists vector with schema extensions;

-- ایجاد جدول صفحات (pages) برای ذخیره اطلاعات تورها و امبدینگ آن‌ها
create table if not exists public.pages (
  id bigint generated always as identity primary key,
  title text not null,
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
  embedding_text text,
  embedding extensions.vector(768),
  created_at timestamptz default now(),
  unique (title)
);

-- ایجاد ایندکس HNSW برای سرعت بخشیدن به جستجوی شباهت کسینوسی
create index if not exists pages_embedding_hnsw_idx 
  on public.pages 
  using hnsw (embedding extensions.vector_cosine_ops);

-- ایجاد تابع match_pages برای یافتن نزدیک‌ترین صفحات همسایه بر اساس شباهت معنایی
create or replace function public.match_pages(source_id bigint, match_count int default 30)
returns table (
  id bigint, 
  title text, 
  country text, 
  city text, 
  season text,
  theme text, 
  url text, 
  similarity float
)
language sql stable
as $$
  select p.id, p.title, p.country, p.city, p.season, p.theme, p.url,
         1 - (p.embedding <=> src.embedding) as similarity
  from public.pages p, (select embedding from public.pages where id = source_id) src
  where p.id <> source_id and p.embedding is not null
  order by p.embedding <=> src.embedding asc
  limit match_count;
$$;

-- فعال‌سازی امنیت سطح ردیف (RLS) روی جدول صفحات
alter table public.pages enable row level security;

-- ایجاد خط‌مشی فقط خواندنی برای تمام کاربران (anon و authenticated)
create policy "Allow read access for all"
  on public.pages
  for select
  to anon, authenticated
  using (true);
