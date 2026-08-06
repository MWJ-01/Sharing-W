# 写给你的地方

一个只属于你们两个人的小网站：
- **日常** — 你写的时间线日记，她随时能看
- **悄悄话** — 一个实时留言墙，你们俩都能写、都能看到对方的回复

整个站是纯静态网页（HTML/CSS/JS），部署在 GitHub Pages，免费、无需服务器；
留言数据存在 Supabase（免费额度足够两个人日常使用）。

---

## 第一步：把网站发布到 GitHub Pages（约 5 分钟）

1. 打开 GitHub，右上角 **+** → **New repository**
   - Repository name 随便取，比如 `for-her`
   - 选 **Public**（GitHub Pages 免费版需要公开仓库；仓库公开不代表网站会被搜索引擎轻易找到——只要你不在别处分享链接，几乎不会有陌生人访问到）
   - 不要勾选 "Add a README"，直接 Create repository

2. 把这个文件夹里的所有文件上传上去，两种方式选一种：

   **方式 A（网页操作，不用装任何软件）**
   - 进入刚建好的仓库页面 → **Add file → Upload files**
   - 把 `index.html`、`css/`、`js/`、`sql/`、`README.md` 整个拖进去
   - 下方填写提交信息，点击 **Commit changes**

   **方式 B（如果你电脑上装了 git）**
   ```bash
   cd 这个文件夹的路径
   git init
   git remote add origin https://github.com/你的用户名/for-her.git
   git add .
   git commit -m "第一版：写给你的地方"
   git branch -M main
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**
   - Source 选择 **Deploy from a branch**
   - Branch 选 `main`，目录选 `/ (root)`，点击 **Save**
   - 等 1-2 分钟，页面顶部会出现一个网址，形如：
     `https://你的用户名.github.io/for-her/`
   - 这个网址就是以后发给她的链接

> 现在打开这个网址，"日常"页已经能看了，但"悄悄话"还不能用——需要接下来的 Supabase 步骤。

---

## 第二步：申请 Supabase，让"悄悄话"能实时互动（约 5 分钟）

1. 打开 [supabase.com](https://supabase.com) → 用 GitHub 账号登录 → **New project**
   - 项目名随意，数据库密码记下来（之后一般用不到，但以防万一）
   - Region 选离你近的（比如 Southeast Asia (Singapore)）
   - 等 1-2 分钟项目初始化完成

2. 建数据表：
   - 左侧菜单 **SQL Editor** → **New query**
   - 打开这个文件夹里的 `sql/schema.sql`，把内容全部复制进去 → 点击 **Run**
   - 看到 "Success" 就说明表建好了

3. 拿到连接信息：
   - 左侧菜单 **Project Settings（齿轮图标）→ API**
   - 复制 **Project URL**（形如 `https://xxxx.supabase.co`）
   - 复制 **anon public** 这一栏的 key（一长串字符）

4. 回到你的网站文件，打开 `js/config.js`，把最下面两行换成刚才复制的内容：
   ```js
   supabaseUrl: "https://xxxx.supabase.co",
   supabaseAnonKey: "你复制的那一长串 anon key",
   ```
   保存后重新上传 / push 到 GitHub（重复第一步的第 2 步），等 1-2 分钟网站更新。

5. 打开网站，切到"悄悄话"，试着发一条 —— 如果两个浏览器窗口同时打开这个网址，
   一边发消息，另一边应该几秒内就能实时看到。

---

## 之后怎么持续更新内容

**只需要改一个文件：`js/config.js`**

- 加一条新的日常动态：在 `journalEntries` 数组里，照着已有格式加一段（date / tag / title / content），记得每段后面要有逗号
- 改开头那封信：改 `openingLetter` 数组里的文字
- 改称呼：改 `friendName` / `myName`

改完之后，重新上传这个文件到 GitHub（网页版就是打开 `js/config.js` 文件页面，
点右上角铅笔图标编辑，改完点 **Commit changes**），网站会自动更新，
**不需要重新做整个网站**。

---

## 关于隐私，你需要知道的

- 这个网站没有登录/密码，只要拿到链接谁都能打开。请只把链接发给她本人。
- `supabaseAnonKey` 会出现在网站源代码里（这是前端项目的正常做法），
  拿到这个 key 的人理论上可以往留言表插入内容，但读不到你 Supabase 账号里的其它数据。
  如果之后想要更强的私密性（比如加一个简单密码），可以再来找我加。
- 如果她提到不想用微信是因为"被工作打扰"，这个网站不会有任何通知推送，
  完全是"想到了就来看看"的节奏，不会像即时通讯那样有压力。

祝顺利 🕯️
