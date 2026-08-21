-- ============================================================
-- 老表升级用：在 Supabase 的 SQL Editor 里整段运行一次
-- （第一次建表的人请跑 schema.sql，不要跑这个）
-- ============================================================

-- 1. 纯文字的分享：不再强制要有图片
alter table posts alter column media_url drop not null;

-- 2. 一条分享最多 9 张图：新增一个数组字段
alter table posts add column if not exists media_urls jsonb;

-- 3. 表情反应已经不用了，旧数据留着不影响。想彻底清掉再取消下面这行注释：
-- drop table if exists reactions;
