-- ============================================================
-- 在 Supabase 的 SQL Editor 里整段运行一次
-- ============================================================

-- 1. 纯文字的分享：不再强制要有图片
alter table posts alter column media_url drop not null;

-- 2. 一条分享最多 9 张图
alter table posts add column if not exists media_urls jsonb;

-- 3. 信件：和分享分开存，互不影响
create table if not exists letters (
  id bigint generated always as identity primary key,
  author text not null check (author in ('M', 'W')),
  content text not null,
  reply_to bigint references letters(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table letters enable row level security;
create policy "任何人可读信" on letters for select using (true);
create policy "任何人可写信" on letters for insert with check (author in ('M', 'W'));
