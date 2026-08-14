-- ============================================================
-- 在 Supabase 的 SQL Editor 里粘贴、整段运行
-- ============================================================

create table if not exists posts (
  id bigint generated always as identity primary key,
  author text not null check (author in ('M', 'W')),
  caption text,
  media_url text not null,
  tag text,                         -- 可选，标了这个词的照片会出现在小屋窗户的相册里
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id) on delete cascade,
  author text not null check (author in ('M', 'W')),
  content text not null check (char_length(content) <= 1000),
  created_at timestamptz not null default now()
);

-- 表情反应：每点一下存一条记录，展示时按 emoji 汇总数量
create table if not exists reactions (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id) on delete cascade,
  author text not null check (author in ('M', 'W')),
  emoji text not null,
  created_at timestamptz not null default now()
);

alter table posts enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;

create policy "任何人可读动态" on posts for select using (true);
create policy "任何人可发动态" on posts for insert with check (author in ('M', 'W'));

create policy "任何人可读评论" on comments for select using (true);
create policy "任何人可发评论" on comments for insert with check (
  author in ('M', 'W') and char_length(content) <= 1000
);

create policy "任何人可读反应" on reactions for select using (true);
create policy "任何人可发反应" on reactions for insert with check (author in ('M', 'W'));
create policy "任何人可删反应" on reactions for delete using (true);

alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table reactions;

-- ============================================================
-- 图片储存桶：先在网页里操作
-- 1. 左侧菜单点 Storage → New bucket → 名字填 media → 勾选 Public bucket → 创建
-- 2. 桶建好之后，回到 SQL Editor，新建一个 query，把下面两行单独跑一遍
-- ============================================================

create policy "任何人可读图片" on storage.objects
  for select using (bucket_id = 'media');

create policy "任何人可传图片" on storage.objects
  for insert with check (bucket_id = 'media');
