// ===================================================
// 基础
// ===================================================
document.title = CONFIG.siteTitle;

const isConfigured =
  CONFIG.supabaseUrl && CONFIG.supabaseUrl !== "YOUR_SUPABASE_URL" &&
  CONFIG.supabaseAnonKey && CONFIG.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

let sb = null;
if (isConfigured && window.supabase) {
  sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
} else {
  console.warn("Supabase 还没配置，先在 js/config.js 里填好 URL 和 anon key。");
}

// ===================================================
// 身份：只在第一次进来时问一次，之后永远不再问
// ===================================================
const ID_KEY = "heartsite_identity";
function getIdentity() { return localStorage.getItem(ID_KEY); }
function setIdentity(who) { localStorage.setItem(ID_KEY, who); }

const firstRun = document.getElementById("firstRun");
const greetingEl = document.getElementById("greeting");
document.getElementById("enterW").textContent = CONFIG.friendName;
document.getElementById("enterM").textContent = CONFIG.myName;

const VISIT_KEY = "heartsite_visits";
function bumpVisits() {
  const n = (parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) || 0) + 1;
  localStorage.setItem(VISIT_KEY, String(n));
  return n;
}
function showGreeting() {
  const n = bumpVisits();
  greetingEl.textContent = `这是你第 ${n} 次来建设你的私人海滩`;
  greetingEl.hidden = false;
  requestAnimationFrame(() => greetingEl.classList.add("is-in"));
  setTimeout(() => greetingEl.classList.remove("is-in"), 2600);
  setTimeout(() => { greetingEl.hidden = true; }, 3600);
}

function boot() {
  if (getIdentity()) {
    firstRun.hidden = true;
    showGreeting();
  } else {
    firstRun.hidden = false;
  }
}
function chooseIdentity(who) {
  setIdentity(who);
  startAudio();
  firstRun.classList.add("is-hidden");
  setTimeout(() => { firstRun.hidden = true; showGreeting(); }, 700);
}
document.getElementById("enterW").addEventListener("click", () => chooseIdentity("W"));
document.getElementById("enterM").addEventListener("click", () => chooseIdentity("M"));
boot();

// 已经选过身份的人，第一次点屏幕时开声音（浏览器要求有用户手势）
document.addEventListener("pointerdown", function once() {
  startAudio();
  document.removeEventListener("pointerdown", once);
}, { once: true });

// ===================================================
// 环境音
// ===================================================
let audioCtx = null, audioStarted = false, muted = false, masterGain = null;

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
  if (!audioCtx) { startAudio(); return; }
  muted = !muted;
  masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.55, audioCtx.currentTime + 0.4);
  document.getElementById("soundIcon").style.opacity = muted ? 0.4 : 1;
}
document.getElementById("soundBtn").addEventListener("click", toggleMute);

function buildWaveSound() {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer; noise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 500; filter.Q.value = 0.7;

  const waveGain = audioCtx.createGain();
  waveGain.gain.value = 0.5;

  noise.connect(filter); filter.connect(waveGain); waveGain.connect(masterGain);
  noise.start();

  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();

  const lfo2 = audioCtx.createOscillator();
  lfo2.frequency.value = 0.11;
  const lfo2Gain = audioCtx.createGain();
  lfo2Gain.gain.value = 0.18;
  lfo2.connect(lfo2Gain); lfo2Gain.connect(waveGain.gain); lfo2.start();
}

function buildFireCrackle() {
  function crackle() {
    if (!audioCtx) return;
    const dur = 0.03 + Math.random() * 0.05;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = 1200 + Math.random() * 1500;
    const g = audioCtx.createGain();
    g.gain.value = 0.12 + Math.random() * 0.1;
    src.connect(filter); filter.connect(g); g.connect(masterGain);
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
// 大图查看（点任何图都能放大，可左右翻）
// ===================================================
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCount = document.getElementById("lightboxCount");
let lbList = [], lbIndex = 0;

function openLightbox(list, index) {
  lbList = list; lbIndex = index;
  renderLightbox();
  lightbox.classList.add("is-open");
}
function renderLightbox() {
  lightboxImg.src = lbList[lbIndex];
  lightboxCount.textContent = lbList.length > 1 ? `${lbIndex + 1} / ${lbList.length}` : "";
  const many = lbList.length > 1;
  document.getElementById("lightboxPrev").hidden = !many;
  document.getElementById("lightboxNext").hidden = !many;
}
function stepLightbox(d) {
  lbIndex = (lbIndex + d + lbList.length) % lbList.length;
  renderLightbox();
}
document.getElementById("lightboxClose").addEventListener("click", () => lightbox.classList.remove("is-open"));
document.getElementById("lightboxPrev").addEventListener("click", (e) => { e.stopPropagation(); stepLightbox(-1); });
document.getElementById("lightboxNext").addEventListener("click", (e) => { e.stopPropagation(); stepLightbox(1); });
lightbox.addEventListener("click", (e) => { if (e.target === lightbox || e.target === lightboxImg) lightbox.classList.remove("is-open"); });
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("is-open")) return;
  if (e.key === "Escape") lightbox.classList.remove("is-open");
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});
// 手机上左右滑
let lbTouchX = null;
lightbox.addEventListener("touchstart", (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (e) => {
  if (lbTouchX === null || lbList.length < 2) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
  lbTouchX = null;
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
      renderReactionsRow(container, postId, await fetchReactions(postId));
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
// 一条分享的图片列表（兼容老数据：单张 media_url）
// ===================================================
function mediaListOf(post) {
  if (Array.isArray(post.media_urls) && post.media_urls.length) return post.media_urls;
  if (typeof post.media_urls === "string" && post.media_urls.trim().startsWith("[")) {
    try { const a = JSON.parse(post.media_urls); if (Array.isArray(a) && a.length) return a; } catch (e) {}
  }
  if (post.media_url) {
    if (post.media_url.trim().startsWith("[")) {
      try { const a = JSON.parse(post.media_url); if (Array.isArray(a)) return a; } catch (e) {}
    }
    return [post.media_url];
  }
  return [];
}

// ===================================================
// 单条动态的完整展示块
// 结构：大号日期 → 图片/纸条 → 作者 → 文字 → 表情 → 评论
// ===================================================
async function buildPostDetail(post) {
  const wrap = document.createElement("div");

  // ---- 正上方的大号时间 ----
  const day = document.createElement("div");
  day.className = "post-day";
  const d = new Date(post.created_at);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  day.innerHTML = `
    <span class="post-day__main">${d.getMonth() + 1}月${d.getDate()}日</span>
    <span class="post-day__sub">${d.getFullYear()} · 周${weekdays[d.getDay()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}</span>
  `;
  wrap.appendChild(day);

  const list = mediaListOf(post);

  if (list.length === 0) {
    // 纯文字：沙滩纸条
    const note = document.createElement("div");
    note.className = "note";
    note.innerHTML = `<p class="note__text"></p>`;
    note.querySelector(".note__text").textContent = post.caption || "";
    wrap.appendChild(note);
  } else if (list.length === 1) {
    const frame = document.createElement("div");
    frame.className = "post-view__frame";
    const img = document.createElement("img");
    img.src = list[0]; img.alt = post.caption || ""; img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(list, 0));
    frame.appendChild(img);
    wrap.appendChild(frame);
  } else {
    const grid = document.createElement("div");
    grid.className = "photo-grid" + (list.length === 4 ? " photo-grid--4" : "");
    list.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url; img.alt = ""; img.loading = "lazy";
      img.addEventListener("click", () => openLightbox(list, i));
      grid.appendChild(img);
    });
    wrap.appendChild(grid);
  }

  const meta = document.createElement("div");
  meta.className = "post-view__meta";
  const authorName = post.author === "M" ? CONFIG.myName : CONFIG.friendName;
  meta.innerHTML = `<span class="post-view__author">${escapeHTML(authorName)}</span>`;
  wrap.appendChild(meta);

  if (post.caption && list.length > 0) {
    const cap = document.createElement("p");
    cap.className = "post-view__caption";
    cap.textContent = post.caption;
    wrap.appendChild(cap);
  }

  const reactionsRow = document.createElement("div");
  reactionsRow.className = "reactions-row";
  wrap.appendChild(reactionsRow);
  fetchReactions(post.id).then((rows) => renderReactionsRow(reactionsRow, post.id, rows));

  wrap.appendChild(buildCommentsBlock(post.id, await fetchComments(post.id)));
  return wrap;
}

// ===================================================
// 篝火 → 最新一条分享
// ===================================================
const fireModalBackdrop = document.getElementById("fireModalBackdrop");
const fireModalBody = document.getElementById("fireModalBody");

async function openLatestPost() {
  openModal(fireModalBackdrop);
  fireModalBody.innerHTML = `<p class="comments__empty">走近篝火…</p>`;
  if (!sb) { fireModalBody.innerHTML = `<p class="comments__empty">还没有连接数据库，按 README 配置好 Supabase 后就能用了。</p>`; return; }
  const { data, error } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(1);
  if (error) { console.error(error); fireModalBody.innerHTML = `<p class="comments__empty">加载失败。</p>`; return; }
  if (!data || data.length === 0) {
    fireModalBody.innerHTML = `<p class="comments__empty">还没有人分享过，右下角"+"发第一条吧。</p>`;
    return;
  }
  fireModalBody.innerHTML = "";
  fireModalBody.appendChild(await buildPostDetail(data[0]));
}
document.getElementById("fireBtn").addEventListener("click", openLatestPost);
document.getElementById("fireModalClose").addEventListener("click", () => closeModal(fireModalBackdrop));

// ===================================================
// 窗户 → 所有照片
// ===================================================
const windowModalBackdrop = document.getElementById("windowModalBackdrop");
const windowGalleryGrid = document.getElementById("windowGalleryGrid");
document.getElementById("windowModalTitle").textContent = "窗外的风景 · 所有照片";

async function openWindowGallery(){
  openModal(windowModalBackdrop);
  windowGalleryGrid.innerHTML = `<p class="comments__empty">推开窗…</p>`;
  if (!sb) { windowGalleryGrid.innerHTML = `<p class="comments__empty">还没有连接数据库。</p>`; return; }

  const { data, error } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) { console.error(error); windowGalleryGrid.innerHTML = `<p class="comments__empty">加载失败。</p>`; return; }

  const all = [];
  (data || []).forEach((p) => mediaListOf(p).forEach((u) => all.push(u)));
  if (all.length === 0) {
    windowGalleryGrid.innerHTML = `<p class="comments__empty">这扇窗还没有风景，发一张照片就会出现在这里。</p>`;
    return;
  }
  windowGalleryGrid.innerHTML = "";
  all.forEach((url, i) => {
    const img = document.createElement("img");
    img.src = url; img.alt = ""; img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(all, i));
    windowGalleryGrid.appendChild(img);
  });
}
document.getElementById("cabinHit").addEventListener("click", openWindowGallery);
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

  const { data, error } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) { console.error(error); calendarTrack.innerHTML = `<p class="calendar-empty">加载失败。</p>`; return; }
  if (!data || data.length === 0) {
    calendarTrack.innerHTML = `<p class="calendar-empty">还没有任何分享，发第一条开始记录吧。</p>`;
    return;
  }
  calendarTrack.innerHTML = "";
  for (const post of data) {
    const card = document.createElement("div");
    card.className = "calendar-card";
    card.appendChild(await buildPostDetail(post));
    calendarTrack.appendChild(card);
  }
});
document.getElementById("calendarModalClose").addEventListener("click", () => closeModal(calendarModalBackdrop));

// ===================================================
// 发布新分享
// ===================================================
const postModalBackdrop = document.getElementById("postModalBackdrop");
const postForm = document.getElementById("postForm");
const postCaption = document.getElementById("postCaption");
const postHint = document.getElementById("postHint");
const postSubmit = document.getElementById("postSubmit");
const pickRow = document.getElementById("pickRow");
const thumbs = document.getElementById("thumbs");
const fileCamera = document.getElementById("fileCamera");
const fileAlbum = document.getElementById("fileAlbum");
const modeText = document.getElementById("modeText");
const modePhoto = document.getElementById("modePhoto");

let mode = "text";
let files = [];

function setMode(m) {
  mode = m;
  modeText.classList.toggle("is-active", m === "text");
  modePhoto.classList.toggle("is-active", m === "photo");
  pickRow.hidden = m !== "photo";
  thumbs.hidden = m !== "photo" || files.length === 0;
  postCaption.placeholder = m === "text" ? "想说的话…" : "配一句话（可以留空）";
}
modeText.addEventListener("click", () => setMode("text"));
modePhoto.addEventListener("click", () => setMode("photo"));

document.getElementById("pickCamera").addEventListener("click", () => fileCamera.click());
document.getElementById("pickAlbum").addEventListener("click", () => fileAlbum.click());
fileCamera.addEventListener("change", () => addFiles(fileCamera.files));
fileAlbum.addEventListener("change", () => addFiles(fileAlbum.files));

function addFiles(fileList) {
  for (const f of fileList) {
    if (files.length >= 9) break;
    files.push(f);
  }
  renderThumbs();
  fileCamera.value = ""; fileAlbum.value = "";
}
function renderThumbs() {
  thumbs.innerHTML = "";
  files.forEach((f, i) => {
    const cell = document.createElement("div");
    cell.className = "thumb";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(f);
    const del = document.createElement("button");
    del.type = "button"; del.className = "thumb__del"; del.textContent = "✕";
    del.addEventListener("click", () => { files.splice(i, 1); renderThumbs(); });
    cell.append(img, del);
    thumbs.appendChild(cell);
  });
  thumbs.hidden = files.length === 0;
  postHint.textContent = files.length ? `已选 ${files.length}/9 张` : "";
}

document.getElementById("fabAdd").addEventListener("click", () => {
  openModal(postModalBackdrop);
});
document.getElementById("postCancel").addEventListener("click", () => closeModal(postModalBackdrop));
document.getElementById("postModalClose").addEventListener("click", () => closeModal(postModalBackdrop));

function resetComposer() {
  postForm.reset();
  files = [];
  renderThumbs();
  setMode("text");
  postHint.textContent = "";
}
setMode("text");

async function uploadOne(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(CONFIG.storageBucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return sb.storage.from(CONFIG.storageBucket).getPublicUrl(path).data.publicUrl;
}

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!sb) return;
  const text = postCaption.value.trim();

  if (mode === "text" && !text) { postHint.textContent = "写一句话再发吧。"; return; }
  if (mode === "photo" && files.length === 0) { postHint.textContent = "先拍一张，或者从相册里选。"; return; }

  postSubmit.disabled = true;
  postHint.textContent = files.length ? "上传中…" : "发布中…";

  try {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      postHint.textContent = `上传中… ${i + 1}/${files.length}`;
      urls.push(await uploadOne(files[i]));
    }

    const row = {
      author: getIdentity() || "M",
      caption: text || null,
      media_url: urls[0] || null,
      media_urls: urls.length ? urls : null,
    };
    const { error: insertError } = await sb.from("posts").insert(row);
    if (insertError) throw insertError;

    postHint.textContent = "发布成功";
    refreshMail();
    setTimeout(() => { closeModal(postModalBackdrop); resetComposer(); }, 600);
  } catch (err) {
    console.error(err);
    postHint.textContent = "发布失败：" + (err.message || "检查一下网络或 Supabase 配置。");
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
function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}


// ===================================================
// 信箱：纯文字的分享 = 一封信
// ===================================================
const veil = document.getElementById("veil");
const veilSlot = document.getElementById("veilSlot");
const mailbox = document.getElementById("mailbox");
const READ_KEY = "heartsite_read_letters";

function readIds(){
  try { return JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch (e) { return []; }
}
function markRead(id){
  const ids = readIds();
  if (!ids.includes(id)) { ids.push(id); localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-500))); }
}

let letters = [];          // 别人写的、还没读的信，新的在前
let allLetters = [];       // 所有纯文字分享

async function refreshMail(){
  if (!sb) return;
  const { data, error } = await sb
    .from("posts").select("*").order("created_at", { ascending: false }).limit(100);
  if (error || !data) return;
  const me = getIdentity() || "M";
  allLetters = data.filter((p) => mediaListOf(p).length === 0 && p.caption);
  const seen = readIds();
  letters = allLetters.filter((p) => p.author !== me && !seen.includes(p.id));
  mailbox.classList.toggle("has-mail", letters.length > 0);
}
refreshMail();
setInterval(refreshMail, 60000);

function openVeil(node){ veilSlot.innerHTML = ""; veilSlot.appendChild(node); veil.classList.add("on"); }
function closeVeil(){ veil.classList.remove("on"); veilSlot.innerHTML = ""; }
document.getElementById("veilX").addEventListener("click", closeVeil);
veil.addEventListener("click", (e) => { if (e.target === veil) closeVeil(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVeil(); });

const WAX = `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,205,185,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9 6 9-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
const STAR = `<svg viewBox="0 0 100 100"><defs>
  <radialGradient id="sg" cx="42%" cy="34%"><stop offset="0%" stop-color="#ffd79a"/><stop offset="55%" stop-color="#f7a13f"/><stop offset="100%" stop-color="#e07c22"/></radialGradient></defs>
  <path fill="url(#sg)" d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z"/></svg>`;

// 晚上（黄昏、夜里）用星夜蓝的信，白天用牛皮纸
function isNightNow(){
  const h = new Date().getHours();
  return h >= 16 || h < 5;
}
function starField(n){
  let s = "";
  for (let i = 0; i < n; i++){
    const sz = (Math.random() * 2 + 0.8).toFixed(1);
    s += `<i style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;width:${sz}px;height:${sz}px;opacity:${(.3+Math.random()*.6).toFixed(2)};animation-delay:${(-Math.random()*4).toFixed(1)}s"></i>`;
  }
  return s;
}

// 1. 选项
function showChoice(){
  const n = letters.length;
  const nameOf = (p) => (p.author === "M" ? CONFIG.myName : CONFIG.friendName);
  const box = document.createElement("div");
  box.className = "choice";
  box.innerHTML = `
    <div class="choice__icon">${n ? "✉" : "☐"}</div>
    <p class="choice__title">${n ? (n > 1 ? `收到 ${n} 封信` : "收到一封信") : "信箱是空的"}</p>
    <p class="choice__sub">${n ? `来自 ${escapeHTML(nameOf(letters[0]))}　·　未拆开` : (allLetters.length ? "旧的信都读过了" : "不如先写一封")}</p>
    <div class="choice__btns">
      ${n ? '<button class="btn btn--main" data-a="read">读信</button>' : ""}
      ${allLetters.length ? `<button class="btn btn--ghost" data-a="old">翻旧信（${allLetters.length}）</button>` : ""}
      <button class="btn ${n ? "btn--ghost" : "btn--main"}" data-a="write">写信</button>
    </div>`;
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "read") showEnvelope(letters[0]);
    else if (b.dataset.a === "old") showOldList();
    else showWriter(null);
  });
  openVeil(box);
}

// 2. 牛皮纸信封 + 火漆
function showEnvelope(post){
  const to = post.author === "M" ? CONFIG.friendName : CONFIG.myName;
  const night = isNightNow();
  const env = document.createElement("div");
  env.className = "envelope" + (night ? " envelope--night" : "");
  env.innerHTML = `
    <div class="envelope__body">
      ${night ? `<div class="env-stars">${starField(70)}</div>` : ""}
      <div class="envelope__stamp"></div>
      <div class="envelope__to">致　${escapeHTML(to)}</div>
    </div>
    ${night ? '<div class="env-halo"></div>' : ""}
    <div class="envelope__flap"></div>
    <div class="seal${night ? " seal--star" : ""}">${night ? STAR : WAX}</div>
    <span class="envelope__hint">点一下，拆开它</span>`;
  env.addEventListener("click", () => {
    if (env.classList.contains("opening")) return;
    env.classList.add("opening");
    setTimeout(() => showPaper(post), 950);
  });
  openVeil(env);
}

// 3. 展开到最大的信纸
function showPaper(post){
  const d = new Date(post.created_at);
  const wd = ["日","一","二","三","四","五","六"][d.getDay()];
  const from = post.author === "M" ? CONFIG.myName : CONFIG.friendName;
  const p = document.createElement("div");
  p.className = "paper" + (isNightNow() ? " paper--night" : "");
  p.innerHTML = `
    <div class="paper__date">${d.getFullYear()} 年 ${d.getMonth()+1} 月 ${d.getDate()} 日　周${wd}　${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}</div>
    <p class="paper__body"></p>
    <div class="paper__sign">—— ${escapeHTML(from)}</div>
    <div class="paper__acts">
      <button class="btn btn--paperghost" data-a="done">已阅读，合上</button>
      <button class="btn btn--paper" data-a="reply">回信</button>
    </div>`;
  p.querySelector(".paper__body").textContent = post.caption;
  p.addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    markRead(post.id);
    if (b.dataset.a === "reply") { showWriter(post); return; }
    p.classList.add("closing");
    setTimeout(() => { closeVeil(); refreshMail(); }, 560);
  });
  openVeil(p);
}

// 3b. 旧信
function showOldList(){
  const box = document.createElement("div");
  box.className = "choice";
  box.innerHTML = `<p class="choice__title" style="margin-bottom:16px">从前的信</p><div class="choice__btns" id="oldList"></div>`;
  const list = box.querySelector("#oldList");
  allLetters.slice(0, 12).forEach((p) => {
    const d = new Date(p.created_at);
    const btn = document.createElement("button");
    btn.className = "btn btn--ghost";
    btn.style.textAlign = "left";
    btn.innerHTML = `<span style="opacity:.55;font-family:'JetBrains Mono',monospace;font-size:11px">${d.getMonth()+1}/${d.getDate()}</span>　${escapeHTML(p.caption.length > 14 ? p.caption.slice(0,14) + "…" : p.caption)}`;
    btn.addEventListener("click", () => showPaper(p));
    list.appendChild(btn);
  });
  openVeil(box);
}

// 4. 写信 / 回信 —— 存成一条纯文字的分享
function showWriter(replyTo){
  const now = new Date();
  const toName = replyTo ? (replyTo.author === "M" ? CONFIG.myName : CONFIG.friendName) : null;
  const p = document.createElement("div");
  p.className = "paper" + (isNightNow() ? " paper--night" : "");
  p.innerHTML = `
    <div class="paper__date">${now.getFullYear()} 年 ${now.getMonth()+1} 月 ${now.getDate()} 日</div>
    <textarea placeholder="${replyTo ? "回信给 " + escapeHTML(toName) + "…" : "写点什么…"}"></textarea>
    <div class="paper__acts">
      <button class="btn btn--paperghost" data-a="cancel">不写了</button>
      <button class="btn btn--paper" data-a="send">封好，放进信箱</button>
    </div>`;
  const ta = p.querySelector("textarea");
  p.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "cancel") { p.classList.add("closing"); setTimeout(closeVeil, 560); return; }
    const text = ta.value.trim();
    if (!text || !sb) return;
    b.disabled = true; b.textContent = "封蜡中…";
    const { error } = await sb.from("posts").insert({
      author: getIdentity() || "M", caption: text, media_url: null, media_urls: null
    });
    if (error) { console.error(error); b.disabled = false; b.textContent = "再试一次"; return; }
    p.classList.add("closing");
    setTimeout(() => { closeVeil(); refreshMail(); }, 560);
  });
  openVeil(p);
  setTimeout(() => ta.focus(), 300);
}

document.getElementById("mailboxHit").addEventListener("click", showChoice);
