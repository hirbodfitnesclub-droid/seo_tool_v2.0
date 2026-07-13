-- =============================================================================
-- مهاجرت ۰۰۰۲ — رتبه‌بندی هیبریدی قطعی (فاز ۳)
-- تغییرات: بُعد بردار → ۱۵۳۶ | جدول page_links | rank_all_pages | get_page_links | clear_all_data
-- =============================================================================

-- ۱. تغییر بُعد ستون embedding از ۷۶۸ به ۱۵۳۶
drop index if exists public.pages_embedding_hnsw_idx;

alter table public.pages
  alter column embedding type extensions.vector(1536) using null;

create index pages_embedding_hnsw_idx
  on public.pages
  using hnsw (embedding extensions.vector_cosine_ops);

-- ۲. جدول page_links — نتایج پیش‌محاسبه‌شده رتبه‌بندی هیبریدی
create table if not exists public.page_links (
  source_id    bigint not null references public.pages(id) on delete cascade,
  target_id    bigint not null references public.pages(id) on delete cascade,
  rank         int    not null,
  similarity   double precision not null,
  structured   double precision not null,
  final_score  double precision not null,
  shared_attrs text[]           not null default '{}',
  reason       text             not null default '',
  primary key (source_id, target_id)
);

create index if not exists page_links_source_idx
  on public.page_links (source_id);

alter table public.page_links enable row level security;

create policy "page_links read all"
  on public.page_links
  for select
  to anon, authenticated
  using (true);

-- ۳. تابع کمکی: is_meaningful — مقدار تهی یا رشتهٔ 'null' را رد می‌کند
create or replace function public.is_meaningful(val text)
returns boolean
language sql immutable
as $$
  select val is not null
     and trim(val) <> ''
     and lower(trim(val)) <> 'null';
$$;

-- ۴. تابع rank_all_pages — هستهٔ رتبه‌بندی هیبریدی
create or replace function public.rank_all_pages()
returns int
language plpgsql
as $$
declare
  -- =====================================================================
  -- ثابت‌های ترکیب (α) و وزن‌های ساختاری — تنظیم‌پذیر یک‌نقطه‌ای
  -- جمع وزن‌های ساختاری = 1.0
  -- =====================================================================
  v_alpha         double precision := 0.65;   -- وزن بردار در امتیاز نهایی
  w_city          double precision := 0.28;   -- شهر مقصد (قوی‌ترین سیگنال)
  w_country       double precision := 0.20;   -- کشور مقصد
  w_theme         double precision := 0.16;   -- تم/هدف سفر
  w_occasion      double precision := 0.10;   -- مناسبت/تعطیلات
  w_season        double precision := 0.08;   -- فصل
  w_tour_type     double precision := 0.06;   -- نوع تور
  w_origin        double precision := 0.05;   -- مبدأ
  w_continent     double precision := 0.04;   -- قاره/منطقه
  w_travel_type   double precision := 0.03;   -- نوع سفر
  -- =====================================================================
  v_total_links   int := 0;
  v_candidates    int := 80;   -- کاندیداهای اولیهٔ HNSW
  v_top_k         int := 30;   -- پیشنهادهای نهایی برای هر صفحه
begin
  truncate public.page_links;

  -- CTE اصلی: محاسبهٔ امتیاز برای هر جفت (مبدأ، کاندیدا) + رتبه‌بندی با row_number
  insert into public.page_links
    (source_id, target_id, rank, similarity, structured, final_score, shared_attrs, reason)
  with scored as (
    select
      s.id as source_id,
      c.id as target_id,
      -- کسینوس
      (1 - (s.embedding <=> c.embedding))::double precision as sim,
      -- امتیاز ساختاری (مجموع وزن تگ‌های مشترک)
      (
          case when is_meaningful(s.city)        and is_meaningful(c.city)        and trim(lower(s.city))        = trim(lower(c.city))        then w_city        else 0 end
        + case when is_meaningful(s.country)     and is_meaningful(c.country)     and trim(lower(s.country))     = trim(lower(c.country))     then w_country     else 0 end
        + case when is_meaningful(s.theme)       and is_meaningful(c.theme)       and trim(lower(s.theme))       = trim(lower(c.theme))       then w_theme       else 0 end
        + case when (is_meaningful(s.occasion)   and is_meaningful(c.occasion)    and trim(lower(s.occasion))    = trim(lower(c.occasion)))
                 or (is_meaningful(s.holiday)    and is_meaningful(c.holiday)     and trim(lower(s.holiday))     = trim(lower(c.holiday)))   then w_occasion    else 0 end
        + case when is_meaningful(s.season)      and is_meaningful(c.season)      and trim(lower(s.season))      = trim(lower(c.season))      then w_season      else 0 end
        + case when is_meaningful(s.tour_type)   and is_meaningful(c.tour_type)   and trim(lower(s.tour_type))   = trim(lower(c.tour_type))   then w_tour_type   else 0 end
        + case when is_meaningful(s.origin)      and is_meaningful(c.origin)      and trim(lower(s.origin))      = trim(lower(c.origin))      then w_origin      else 0 end
        + case when is_meaningful(s.continent)   and is_meaningful(c.continent)   and trim(lower(s.continent))   = trim(lower(c.continent))   then w_continent   else 0 end
        + case when is_meaningful(s.travel_type) and is_meaningful(c.travel_type) and trim(lower(s.travel_type)) = trim(lower(c.travel_type)) then w_travel_type  else 0 end
      )::double precision as struct,
      -- آرایهٔ کلیدهای تگ مشترک
      array_remove(array[
        case when is_meaningful(s.city)        and is_meaningful(c.city)        and trim(lower(s.city))        = trim(lower(c.city))        then 'city'        else null end,
        case when is_meaningful(s.country)     and is_meaningful(c.country)     and trim(lower(s.country))     = trim(lower(c.country))     then 'country'     else null end,
        case when is_meaningful(s.theme)       and is_meaningful(c.theme)       and trim(lower(s.theme))       = trim(lower(c.theme))       then 'theme'       else null end,
        case when (is_meaningful(s.occasion)   and is_meaningful(c.occasion)    and trim(lower(s.occasion))    = trim(lower(c.occasion)))
                or (is_meaningful(s.holiday)   and is_meaningful(c.holiday)     and trim(lower(s.holiday))     = trim(lower(c.holiday)))    then 'occasion'    else null end,
        case when is_meaningful(s.season)      and is_meaningful(c.season)      and trim(lower(s.season))      = trim(lower(c.season))      then 'season'      else null end,
        case when is_meaningful(s.tour_type)   and is_meaningful(c.tour_type)   and trim(lower(s.tour_type))   = trim(lower(c.tour_type))   then 'tour_type'   else null end,
        case when is_meaningful(s.origin)      and is_meaningful(c.origin)      and trim(lower(s.origin))      = trim(lower(c.origin))      then 'origin'      else null end,
        case when is_meaningful(s.continent)   and is_meaningful(c.continent)   and trim(lower(s.continent))   = trim(lower(c.continent))   then 'continent'   else null end,
        case when is_meaningful(s.travel_type) and is_meaningful(c.travel_type) and trim(lower(s.travel_type)) = trim(lower(c.travel_type)) then 'travel_type'  else null end
      ], null) as attrs,
      -- اطلاعات پایه برای ساخت reason
      c.city        as c_city,
      c.country     as c_country,
      c.theme       as c_theme,
      c.occasion    as c_occasion,
      c.holiday     as c_holiday,
      c.season      as c_season,
      c.tour_type   as c_tour_type,
      c.origin      as c_origin,
      c.continent   as c_continent,
      c.travel_type as c_travel_type,
      -- رتبه در بین کاندیداهای این مبدأ
      row_number() over (
        partition by s.id
        order by (
          v_alpha * (1 - (s.embedding <=> c.embedding))
          + (1 - v_alpha) * (
              case when is_meaningful(s.city)        and is_meaningful(c.city)        and trim(lower(s.city))        = trim(lower(c.city))        then w_city        else 0 end
            + case when is_meaningful(s.country)     and is_meaningful(c.country)     and trim(lower(s.country))     = trim(lower(c.country))     then w_country     else 0 end
            + case when is_meaningful(s.theme)       and is_meaningful(c.theme)       and trim(lower(s.theme))       = trim(lower(c.theme))       then w_theme       else 0 end
            + case when (is_meaningful(s.occasion)   and is_meaningful(c.occasion)    and trim(lower(s.occasion))    = trim(lower(c.occasion)))
                     or (is_meaningful(s.holiday)    and is_meaningful(c.holiday)     and trim(lower(s.holiday))     = trim(lower(c.holiday)))   then w_occasion    else 0 end
            + case when is_meaningful(s.season)      and is_meaningful(c.season)      and trim(lower(s.season))      = trim(lower(c.season))      then w_season      else 0 end
            + case when is_meaningful(s.tour_type)   and is_meaningful(c.tour_type)   and trim(lower(s.tour_type))   = trim(lower(c.tour_type))   then w_tour_type   else 0 end
            + case when is_meaningful(s.origin)      and is_meaningful(c.origin)      and trim(lower(s.origin))      = trim(lower(c.origin))      then w_origin      else 0 end
            + case when is_meaningful(s.continent)   and is_meaningful(c.continent)   and trim(lower(s.continent))   = trim(lower(c.continent))   then w_continent   else 0 end
            + case when is_meaningful(s.travel_type) and is_meaningful(c.travel_type) and trim(lower(s.travel_type)) = trim(lower(c.travel_type)) then w_travel_type  else 0 end
          )
        ) desc
      ) as rn
    from public.pages s
    cross join lateral (
      select c.*
      from public.pages c
      where c.id <> s.id
        and c.embedding is not null
      order by s.embedding <=> c.embedding
      limit v_candidates
    ) c
    where s.embedding is not null
  )
  select
    source_id,
    target_id,
    rn::int                                              as rank,
    sim                                                  as similarity,
    struct                                               as structured,
    (v_alpha * sim + (1 - v_alpha) * struct)::double precision as final_score,
    attrs                                                as shared_attrs,
    -- ساخت رشتهٔ دلیل فارسی از اجزای امتیاز
    concat_ws('  •  ',
      'شباهت معنایی ' || round(sim * 100)::int || '٪',
      case when 'city'        = any(attrs) then 'مقصد مشترک: '      || c_city        else null end,
      case when 'country'     = any(attrs) then 'کشور مشترک: '      || c_country     else null end,
      case when 'theme'       = any(attrs) then 'تم مشترک: '        || c_theme       else null end,
      case when 'occasion'    = any(attrs) then 'مناسبت مشترک: '    || coalesce(c_occasion, c_holiday) else null end,
      case when 'season'      = any(attrs) then 'هم‌فصل: '          || c_season      else null end,
      case when 'tour_type'   = any(attrs) then 'نوع تور مشترک: '   || c_tour_type   else null end,
      case when 'origin'      = any(attrs) then 'مبدأ مشترک: '      || c_origin      else null end,
      case when 'continent'   = any(attrs) then 'منطقه مشترک: '     || c_continent   else null end,
      case when 'travel_type' = any(attrs) then 'سبک سفر مشترک: '   || c_travel_type else null end
    )                                                    as reason
  from scored
  where rn <= v_top_k;

  get diagnostics v_total_links = row_count;
  return v_total_links;
end;
$$;

-- ۵. تابع get_page_links
create or replace function public.get_page_links(p_source_id bigint)
returns table (
  id           bigint,
  title        text,
  country      text,
  city         text,
  season       text,
  theme        text,
  url          text,
  similarity   double precision,
  final_score  double precision,
  rank         int,
  shared_attrs text[],
  reason       text
)
language sql stable
as $$
  select
    p.id,
    p.title,
    p.country,
    p.city,
    p.season,
    p.theme,
    p.url,
    l.similarity,
    l.final_score,
    l.rank,
    l.shared_attrs,
    l.reason
  from public.page_links l
  join public.pages p on p.id = l.target_id
  where l.source_id = p_source_id
  order by l.rank asc;
$$;

-- ۶. تابع clear_all_data — پاک‌سازی کامل با security definer
create or replace function public.clear_all_data()
returns void
language sql
security definer
set search_path = public
as $$
  truncate public.page_links;
  delete from public.pages;
$$;

-- مجوز اجرا برای کاربران anon
grant execute on function public.clear_all_data()         to anon;
grant execute on function public.rank_all_pages()         to anon;
grant execute on function public.get_page_links(bigint)   to anon;
grant execute on function public.is_meaningful(text)      to anon;
