// ===================================================
// 基础
// ===================================================
document.title = CONFIG.siteTitle;
document.getElementById("brandTitle").textContent = CONFIG.siteTitle;

const isConfigured =
  CONFIG.supabaseUrl && CONFIG.supabaseUrl !== "YOUR_SUPABASE_URL" &&
  CONFIG.supabaseAnonKey && CONFIG.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

let sb = null;
if (isConfigured) {
  sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
} else {
  console.warn("Supabase 还没配置，先在 js/config.js 里填好 URL 和 anon key。");
}

// ===================================================
// 身份（存在这台设备上，之后不用每次都选）
// ===================================================
const ID_KEY = "heartsite_identity";
function getIdentity() { return localStorage.getItem(ID_KEY); }
function setIdentity(who) { localStorage.setItem(ID_KEY, who); }

const enterOverlay = document.getElementById("enterOverlay");
const enterTitle = document.getElementById("enterTitle");
const enterSub = document.getElementById("enterSub");
const enterSkip = document.getElementById("enterSkip");

document.getElementById("enterW").textContent = CONFIG.friendName;
document.getElementById("enterM").textContent = CONFIG.myName;

function showEnterOverlay() {
  const existing = getIdentity();
  if (existing) {
    enterTitle.textContent = CONFIG.greeting || "全岛由特约精灵独家罩着，请放心作法，一切有我。";
    enterSub.textContent = `欢迎回来，${existing === "M" ? CONFIG.myName : CONFIG.friendName}`;
    enterSkip.hidden = false;
  } else {
    enterTitle.textContent = CONFIG.greeting || "全岛由特约精灵独家罩着，请放心作法，一切有我。";
    enterSub.textContent = "先告诉我，屏幕前的你是——";
    enterSkip.hidden = true;
  }
  enterOverlay.classList.remove("is-hidden");
}

function enterScene(who) {
  if (who) setIdentity(who);
  startAudio();
  enterOverlay.classList.add("is-hidden");
}

document.getElementById("enterW").addEventListener("click", () => enterScene("W"));
document.getElementById("enterM").addEventListener("click", () => enterScene("M"));
enterSkip.addEventListener("click", () => {
  localStorage.removeItem(ID_KEY);
  showEnterOverlay();
});

showEnterOverlay();
// 如果之前已经选过身份，点两个按钮都可以直接进（进场按钮同时承担"开始音效"的用户手势）

// ===================================================
// 星星
// ===================================================
const starsWrap = document.getElementById("stars");
for (let i = 0; i < 60; i++) {
  const s = document.createElement("span");
  s.className = "star";
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 70 + "%";
  s.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
  s.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
  starsWrap.appendChild(s);
}

// ===================================================
// 篝火余烬粒子
// ===================================================
const embersWrap = document.getElementById("embers");
function spawnEmber() {
  const e = document.createElement("span");
  e.className = "ember-particle";
  const dx = (Math.random() * 40 - 20).toFixed(1) + "px";
  e.style.setProperty("--dx", dx);
  e.style.left = 70 + (Math.random() * 20 - 10) + "px";
  e.style.animationDuration = (2 + Math.random() * 1.5).toFixed(2) + "s";
  embersWrap.appendChild(e);
  setTimeout(() => e.remove(), 3600);
}
setInterval(spawnEmber, 380);

// ===================================================
// 环境音（Web Audio API 实时合成，免费、不需要音频文件）
// ===================================================
let audioCtx = null;
let audioStarted = false;
let muted = false;
let masterGain = null;

function startAudio() {
  if (audioStarted) {
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return;
  }
  audioStarted = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.55;
  masterGain.connect(audioCtx.destination);

  buildWaveSound();
  buildFireCrackle();
}

function toggleMute() {
  if (!audioCtx) return;
  muted = !muted;
  masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.55, audioCtx.currentTime + 0.4);
  document.getElementById("soundIcon").style.opacity = muted ? 0.4 : 1;
}
document.getElementById("soundBtn").addEventListener("click", toggleMute);

// 海浪：白噪音过一个缓慢摆动的低通滤波器
function buildWaveSound() {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  filter.Q.value = 0.7;

  const waveGain = audioCtx.createGain();
  waveGain.gain.value = 0.5;

  noise.connect(filter);
  filter.connect(waveGain);
  waveGain.connect(masterGain);
  noise.start();

  // 缓慢起伏，模拟一波一波的浪
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const lfo2 = audioCtx.createOscillator();
  lfo2.frequency.value = 0.11;
  const lfo2Gain = audioCtx.createGain();
  lfo2Gain.gain.value = 0.18;
  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(waveGain.gain);
  lfo2.start();
}

// 篝火噼啪声：随机间隔的短促噪声爆点
function buildFireCrackle() {
  function crackle() {
    if (!audioCtx) return;
    const dur = 0.03 + Math.random() * 0.05;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1200 + Math.random() * 1500;

    const g = audioCtx.createGain();
    g.gain.value = 0.12 + Math.random() * 0.1;

    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start();

    setTimeout(crackle, 180 + Math.random() * 700);
  }
  crackle();
}

// ===================================================
// 通用：弹层开关
// ===================================================
function openModal(backdropEl) { backdropEl.classList.add("is-open"); }
function closeModal(backdropEl) { backdropEl.classList.remove("is-open"); }

document.querySelectorAll(".modal-backdrop").forEach((bd) => {
  bd.addEventListener("click", (e) => { if (e.target === bd) closeModal(bd); });
});

// ===================================================
// 反应（表情）
// ===================================================
async function fetchReactions(postId) {
  if (!sb) return [];
  const { data, error } = await sb.from("reactions").select("*").eq("post_id", postId);
  if (error) { console.error(error); return []; }
  return data || [];
}

function renderReactionsRow(container, postId, reactionRows) {
  container.innerHTML = "";
  const me = getIdentity() || "M";
  CONFIG.reactions.forEach((emoji) => {
    const rows = reactionRows.filter((r) => r.emoji === emoji);
    const mine = rows.some((r) => r.author === me);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "reaction-chip" + (mine ? " is-mine" : "");
    chip.innerHTML = `<span>${emoji}</span>${rows.length ? `<span class="reaction-chip__count">${rows.length}</span>` : ""}`;
    chip.addEventListener("click", async () => {
      if (!sb) return;
      if (mine) {
        const mineRow = rows.find((r) => r.author === me);
        await sb.from("reactions").delete().eq("id", mineRow.id);
      } else {
        await sb.from("reactions").insert({ post_id: postId, author: me, emoji });
      }
      const fresh = await fetchReactions(postId);
      renderReactionsRow(container, postId, fresh);
    });
    container.appendChild(chip);
  });
}

// ===================================================
// 评论
// ===================================================
async function fetchComments(postId) {
  if (!sb) return [];
  const { data, error } = await sb
    .from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

function renderCommentBubble(container, c) {
  const el = document.createElement("div");
  const isMe = c.author === "M";
  el.className = `bubble ${isMe ? "bubble--me" : "bubble--her"}`;
  const name = isMe ? CONFIG.myName : CONFIG.friendName;
  el.innerHTML = `
    <div class="bubble__sender">${escapeHTML(name)}</div>
    <div class="bubble__text">${escapeHTML(c.content)}</div>
    <div class="bubble__time">${formatTime(c.created_at)}</div>
  `;
  container.appendChild(el);
}

function buildCommentsBlock(postId, comments) {
  const wrap = document.createElement("div");

  const feed = document.createElement("div");
  feed.className = "comments__feed";
  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "comments__empty";
    empty.textContent = "还没有回应，写第一句吧。";
    feed.appendChild(empty);
  } else {
    comments.forEach((c) => renderCommentBubble(feed, c));
  }
  wrap.appendChild(feed);

  const form = document.createElement("form");
  form.className = "composer";
  form.innerHTML = `
    <textarea class="composer__input" placeholder="说点什么…" maxlength="1000" rows="1"></textarea>
    <button type="submit" class="composer__send" aria-label="发送">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L20 4L13 20L11 13L4 12Z"/></svg>
    </button>
  `;
  const textarea = form.querySelector("textarea");
  const sendBtn = form.querySelector("button");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text || !sb) return;
    sendBtn.disabled = true;
    const author = getIdentity() || "M";
    const { data, error } = await sb
      .from("comments").insert({ post_id: postId, author, content: text }).select();
    sendBtn.disabled = false;
    if (error) { console.error(error); return; }
    textarea.value = "";
    if (feed.querySelector(".comments__empty")) feed.innerHTML = "";
    if (data && data[0]) renderCommentBubble(feed, data[0]);
  });
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });

  wrap.appendChild(form);
  return wrap;
}

// ===================================================
// 单条动态的完整展示块（图 + 信息 + 反应 + 评论），
// 篝火弹层和日历卡片共用这套渲染逻辑
// ===================================================
async function buildPostDetail(post) {
  const wrap = document.createElement("div");

  const frame = document.createElement("div");
  frame.className = "post-view__frame";
  frame.innerHTML = `<img src="${post.media_url}" alt="" />`;
  wrap.appendChild(frame);

  const meta = document.createElement("div");
  meta.className = "post-view__meta";
  const authorName = post.author === "M" ? CONFIG.myName : CONFIG.friendName;
  meta.innerHTML = `<span class="post-view__author">${escapeHTML(authorName)}</span><span class="post-view__date">${formatDate(post.created_at)}</span>`;
  wrap.appendChild(meta);

  if (post.caption) {
    const cap = document.createElement("p");
    cap.className = "post-view__caption";
    cap.textContent = post.caption;
    wrap.appendChild(cap);
  }

  const reactionsRow = document.createElement("div");
  reactionsRow.className = "reactions-row";
  wrap.appendChild(reactionsRow);
  fetchReactions(post.id).then((rows) => renderReactionsRow(reactionsRow, post.id, rows));

  const comments = await fetchComments(post.id);
  wrap.appendChild(buildCommentsBlock(post.id, comments));

  return wrap;
}

// ===================================================
// 篝火 → 最新一条分享
// ===================================================
const fireModalBackdrop = document.getElementById("fireModalBackdrop");
const fireModalBody = document.getElementById("fireModalBody");

document.getElementById("fireBtn").addEventListener("click", async () => {
  openModal(fireModalBackdrop);
  fireModalBody.innerHTML = `<p class="comments__empty">走近篝火…</p>`;
  if (!sb) { fireModalBody.innerHTML = `<p class="comments__empty">还没有连接数据库，按 README 配置好 Supabase 后就能用了。</p>`; return; }

  const { data, error } = await sb
    .from("posts").select("*").order("created_at", { ascending: false }).limit(1);
  if (error) { console.error(error); fireModalBody.innerHTML = `<p class="comments__empty">加载失败。</p>`; return; }
  if (!data || data.length === 0) {
    fireModalBody.innerHTML = `<p class="comments__empty">还没有人分享过，右下角"+"发第一张吧。</p>`;
    return;
  }
  fireModalBody.innerHTML = "";
  fireModalBody.appendChild(await buildPostDetail(data[0]));
});
document.getElementById("fireModalClose").addEventListener("click", () => closeModal(fireModalBackdrop));

// ===================================================
// 窗户 → 风景相册
// ===================================================
const windowModalBackdrop = document.getElementById("windowModalBackdrop");
const windowGalleryGrid = document.getElementById("windowGalleryGrid");
document.getElementById("windowModalTitle").textContent = `${CONFIG.windowTag}相册`;

document.getElementById("windowBtn").addEventListener("click", async () => {
  openModal(windowModalBackdrop);
  windowGalleryGrid.innerHTML = `<p class="comments__empty">推开窗…</p>`;
  if (!sb) { windowGalleryGrid.innerHTML = `<p class="comments__empty">还没有连接数据库。</p>`; return; }

  const { data, error } = await sb
    .from("posts").select("*").eq("tag", CONFIG.windowTag).order("created_at", { ascending: false });
  if (error) { console.error(error); windowGalleryGrid.innerHTML = `<p class="comments__empty">加载失败。</p>`; return; }
  if (!data || data.length === 0) {
    windowGalleryGrid.innerHTML = `<p class="comments__empty">这扇窗还没有风景，发照片时标个"${CONFIG.windowTag}"就会出现在这里。</p>`;
    return;
  }
  windowGalleryGrid.innerHTML = "";
  data.forEach((p) => {
    const img = document.createElement("img");
    img.src = p.media_url; img.alt = p.caption || ""; img.loading = "lazy";
    windowGalleryGrid.appendChild(img);
  });
});
document.getElementById("windowModalClose").addEventListener("click", () => closeModal(windowModalBackdrop));

// ===================================================
// 日历 → 全部分享，左右滑动
// ===================================================
const calendarModalBackdrop = document.getElementById("calendarModalBackdrop");
const calendarTrack = document.getElementById("calendarTrack");

document.getElementById("calendarBtn").addEventListener("click", async () => {
  openModal(calendarModalBackdrop);
  calendarTrack.innerHTML = `<p class="calendar-empty">翻着旧照片…</p>`;
  if (!sb) { calendarTrack.innerHTML = `<p class="calendar-empty">还没有连接数据库。</p>`; return; }

  const { data, error } = await sb
    .from("posts").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) { console.error(error); calendarTrack.innerHTML = `<p class="calendar-empty">加载失败。</p>`; return; }
  if (!data || data.length === 0) {
    calendarTrack.innerHTML = `<p class="calendar-empty">还没有任何分享，发第一张开始记录吧。</p>`;
    return;
  }
  calendarTrack.innerHTML = "";
  for (const post of data) {
    const card = document.createElement("div");
    card.className = "calendar-card";
    card.innerHTML = `<div class="calendar-card__date">${formatDate(post.created_at)}</div>`;
    card.appendChild(await buildPostDetail(post));
    calendarTrack.appendChild(card);
  }
});
document.getElementById("calendarModalClose").addEventListener("click", () => closeModal(calendarModalBackdrop));

// ===================================================
// 发布新分享
// ===================================================
const fabAdd = document.getElementById("fabAdd");
const postModalBackdrop = document.getElementById("postModalBackdrop");
const postForm = document.getElementById("postForm");
const postFile = document.getElementById("postFile");
const postCaption = document.getElementById("postCaption");
const postTag = document.getElementById("postTag");
const postHint = document.getElementById("postHint");
const postSubmit = document.getElementById("postSubmit");

document.getElementById("pWhoW").textContent = CONFIG.friendName;
document.getElementById("pWhoM").textContent = CONFIG.myName;

fabAdd.addEventListener("click", () => {
  const me = getIdentity() || "M";
  setPostSender(me);
  openModal(postModalBackdrop);
});
document.getElementById("postCancel").addEventListener("click", () => closeModal(postModalBackdrop));
document.getElementById("postModalClose").addEventListener("click", () => closeModal(postModalBackdrop));

let currentSenderPost = "M";
document.getElementById("pWhoW").addEventListener("click", () => setPostSender("W"));
document.getElementById("pWhoM").addEventListener("click", () => setPostSender("M"));
function setPostSender(who) {
  currentSenderPost = who;
  document.getElementById("pWhoW").classList.toggle("is-active", who === "W");
  document.getElementById("pWhoM").classList.toggle("is-active", who === "M");
}

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!sb) return;
  const file = postFile.files[0];
  if (!file) return;

  postSubmit.disabled = true;
  postHint.textContent = "上传中…";

  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await sb.storage
      .from(CONFIG.storageBucket).upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;

    const { data: pub } = sb.storage.from(CONFIG.storageBucket).getPublicUrl(path);

    const { error: insertError } = await sb.from("posts").insert({
      author: currentSenderPost,
      caption: postCaption.value.trim() || null,
      media_url: pub.publicUrl,
      tag: postTag.value.trim() || null,
    });
    if (insertError) throw insertError;

    postHint.textContent = "发布成功";
    setTimeout(() => { closeModal(postModalBackdrop); postForm.reset(); postHint.textContent = ""; }, 600);
  } catch (err) {
    console.error(err);
    postHint.textContent = "发布失败，检查一下网络或 Supabase 配置。";
  } finally {
    postSubmit.disabled = false;
  }
});

// ===================================================
// 小工具
// ===================================================
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function formatDate(iso) {
  const d = new Date(iso);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${weekdays[d.getDay()]}`;
}
function formatTime(iso) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${m}`;
}
