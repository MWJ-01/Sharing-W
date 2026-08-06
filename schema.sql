-- 在 Supabase 的 SQL Editor 里粘贴并运行这段脚本
-- 用来创建"悄悄话"留言墙需要的数据表

create table if not exists messages (
  id bigint generated always as identity primary key,
  sender text not null check (sender in ('我', '她')),
  content text not null check (char_length(content) <= 1000),
  created_at timestamptz not null default now()
);

-- 打开 Row Level Security（行级安全）
alter table messages enable row level security;

-- 允许任何持有你的 anon key 的人读取留言
-- （因为这是一个只靠链接访问、没有登录的私密小站，
--   风险主要来自 anon key 外泄，不建议把仓库以外的地方公开这个 key）
create policy "任何人可读" on messages
  for select using (true);

-- 允许任何持有你的 anon key 的人插入留言
create policy "任何人可写" on messages
  for insert with check (
    sender in ('我', '她')
    and char_length(content) <= 1000
  );

-- 开启 Realtime（让双方能实时看到彼此的留言）
alter publication supabase_realtime add table messages;
