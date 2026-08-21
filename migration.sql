-- ============================================================
-- 升级用：在 Supabase 的 SQL Editor 里整段运行一次
-- （已经建过表的人跑这个，不要重跑 schema.sql）
-- ============================================================

-- 1. 纯文字分享：不再强制要有图片
alter table posts alter column media_url drop not null;

-- 2. 一条分享最多 9 张图：新增一个数组字段
alter table posts add column if not exists media_urls jsonb;

-- 3. tag 已经不用了，保留旧数据即可（想彻底删掉再取消下面这行的注释）
-- alter table posts drop column tag;
