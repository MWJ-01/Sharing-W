// ===================================================
// 页面基础渲染
// ===================================================
document.title = CONFIG.siteTitle;
document.getElementById("brandTitle").textContent = CONFIG.siteTitle;
document.getElementById("footerNote").textContent =
  `只属于 ${CONFIG.myName} 和 ${CONFIG.friendName} 的角落`;

// 开信
const letterEl = document.getElementById("openingLetter");
CONFIG.openingLetter.forEach((line) => {
  const p = document.createElement("p");
  p.textContent = line;
  letterEl.appendChild(p);
});

// 日常时间线（按日期倒序）
const timelineEl = document.getElementById("timeline");
const entries = [...CONFIG.journalEntries].sort((a, b) =>
  a.date < b.date ? 1 : -1
);
if (entries.length === 0) {
  timelineEl.innerHTML = `<p class="wall__empty">还没有写下第一条日常，去 config.js 里加一条吧。</p>`;
} else {
  entries.forEach((e) => {
    const el = document.createElement("article");
    el.className = "entry";
    el.innerHTML = `
      <div class="entry__meta">
        <span>${formatDate(e.date)}</span>
        ${e.tag ? `<span class="entry__tag">${escapeHTML(e.tag)}</span>` : ""}
      </div>
      <h3 class="entry__title">${escapeHTML(e.title)}</h3>
      <p class="entry__content">${escapeHTML(e.content)}</p>
    `;
    timelineEl.appendChild(el);
  });
}

// ===================================================
// Tab 切换
// ===================================================
document.querySelectorAll(".navtab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".navtab")
      .forEach((b) => b.classList.remove("is-active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("is-active"));
    btn.classList.add("is-active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("is-active");
  });
});

// ===================================================
// 悄悄话留言墙（Supabase 实时同步）
// ===================================================
const wallFeed = document.getElementById("wallFeed");
const wallEmpty = document.getElementById("wallEmpty");
const composerForm = document.getElementById("composerForm");
const composerInput = document.getElementById("composerInput");
const composerSend = document.getElementById("composerSend");
const composerHint = document.getElementById("composerHint");
const whoHerBtn = document.getElementById("whoHer");
const whoMeBtn = document.getElementById("whoMe");

document.getElementById("whoHer").textContent = CONFIG.friendName;
document.getElementById("whoMe").textContent = CONFIG.myName;

let currentSender = "她"; // 内部固定值：'她' 或 '我'，与数据库存储值一致

whoHerBtn.addEventListener("click", () => setSender("她"));
whoMeBtn.addEventListener("click", () => setSender("我"));

function setSender(who) {
  currentSender = who;
  whoHerBtn.classList.toggle("is-active", who === "她");
  whoMeBtn.classList.toggle("is-active", who === "我");
}

const isConfigured =
  CONFIG.supabaseUrl &&
  CONFIG.supabaseUrl !== "YOUR_SUPABASE_URL" &&
  CONFIG.supabaseAnonKey &&
  CONFIG.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

let supabase = null;

if (!isConfigured) {
  composerHint.textContent =
    "还没有连接留言数据库——按 README.md 的步骤配置好 Supabase 后，双方就能实时留言了。";
  composerSend.disabled = true;
  composerInput.disabled = true;
} else {
  supabase = window.supabase.createClient(
    CONFIG.supabaseUrl,
    CONFIG.supabaseAnonKey
  );
  loadMessages();
  subscribeRealtime();
}

async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    composerHint.textContent = "留言加载失败，检查一下 Supabase 配置或网络。";
    console.error(error);
    return;
  }
  wallFeed.innerHTML = "";
  if (!data || data.length === 0) {
    wallFeed.appendChild(wallEmpty);
  } else {
    data.forEach(renderBubble);
    scrollToBottom();
  }
}

function subscribeRealtime() {
  supabase
    .channel("messages-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        wallEmpty.remove();
        renderBubble(payload.new);
        scrollToBottom();
      }
    )
    .subscribe();
}

function renderBubble(msg) {
  const el = document.createElement("div");
  const isMe = msg.sender === "我";
  el.className = `bubble ${isMe ? "bubble--me" : "bubble--her"}`;
  const displayName = isMe ? CONFIG.myName : CONFIG.friendName;
  el.innerHTML = `
    <div class="bubble__sender">${escapeHTML(displayName)}</div>
    <div class="bubble__text">${escapeHTML(msg.content)}</div>
    <div class="bubble__time">${formatTime(msg.created_at)}</div>
  `;
  wallFeed.appendChild(el);
}

composerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = composerInput.value.trim();
  if (!text || !supabase) return;

  composerSend.disabled = true;
  const { error } = await supabase
    .from("messages")
    .insert({ sender: currentSender, content: text });
  composerSend.disabled = false;

  if (error) {
    composerHint.textContent = "发送失败，再试一次？";
    console.error(error);
    return;
  }
  composerInput.value = "";
  autoGrow();
});

composerInput?.addEventListener("input", autoGrow);
composerInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composerForm.requestSubmit();
  }
});

function autoGrow() {
  composerInput.style.height = "auto";
  composerInput.style.height = composerInput.scrollHeight + "px";
}

function scrollToBottom() {
  wallFeed.scrollTop = wallFeed.scrollHeight;
}

// ===================================================
// 小工具
// ===================================================
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${weekdays[d.getDay()]}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${m}`;
}
