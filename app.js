<script>
const API_URL = "/api/chat";
let messages = [];

/* ===== Sidebar open/close ===== */
function toggleSidebar(){
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const isOpen = sidebar.classList.contains("open");
  if (isOpen){
    sidebar.classList.remove("open");
    overlay.style.display = "none";
  } else {
    sidebar.classList.add("open");
    overlay.style.display = "block";
  }
}

function closeSidebar(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").style.display = "none";
}

/* ===== 入力欄高さ自動調整 ===== */
const msg = document.getElementById("msg");
msg.addEventListener("input", () => {
  msg.style.height = "auto";
  msg.style.height = msg.scrollHeight + "px";
});

/* ===== ログ下余白自動調整 ===== */
(function(){
  const inputArea = document.getElementById("inputArea");
  const log = document.getElementById("log");
  function updatePadding(){
    log.style.paddingBottom = (inputArea.offsetHeight + 20) + "px";
  }
  new ResizeObserver(updatePadding).observe(inputArea);
  window.addEventListener("resize", updatePadding);
  updatePadding();
})();

/* ===== メッセージ表示 ===== */
function append(role, text, timestamp=null) {
  const log = document.getElementById("log");

  if (timestamp) {
    const timeDiv = document.createElement("div");
    timeDiv.className = "timestamp " + (role === "user" ? "me" : "bot");
    timeDiv.textContent = new Date(timestamp).toLocaleString("ja-JP");
    log.appendChild(timeDiv);
  }

  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "me" : "bot");
  div.textContent = text;
  log.appendChild(div);

  log.scrollTop = log.scrollHeight;
}

/* ===== 送信中・・・表示 ===== */
function showTyping() {
  const log = document.getElementById("log");

  const div = document.createElement("div");
  div.className = "msg bot typing";
  div.id = "typingIndicator";
  div.innerHTML = `
    <span>晴が入力中</span>
    <span class="dot">.</span>
    <span class="dot">.</span>
    <span class="dot">.</span>
  `;

  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

/* ===== 送信（Enterは改行。送信はボタンのみ） ===== */
async function send() {

  const input = document.getElementById("msg");
  const btn = document.getElementById("sendBtn");

  const text = input.value.trim();
  if (!text) return;

  // 二重送信防止
  btn.disabled = true;
  btn.classList.add("loadingBtn");
  btn.textContent = "...";

  input.value = "";
  input.style.height = "auto";

  append("user", text, Date.now());
  showTyping();

  try {

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "chat",
        messages: [{ role: "user", content: text }]
      })
    });

    if (!res.ok) {
      throw new Error("サーバーエラー");
    }

    const data = await res.json();

    document.getElementById("log").innerHTML = "";

    if (data.messages) {
      messages = data.messages;
      messages.forEach(m => append(m.role, m.content, m.timestamp));
    }

    loadSessions();

  } catch (err) {

    // 🔥 エラー表示
    hideTyping();

    const log = document.getElementById("log");
    const errorDiv = document.createElement("div");
    errorDiv.className = "msg bot";
    errorDiv.style.background = "#ffe5e5";
    errorDiv.style.border = "1px solid #ff9999";
    errorDiv.textContent = "通信エラーが発生しました。もう一度お試しください。";

    log.appendChild(errorDiv);
    log.scrollTop = log.scrollHeight;

  } finally {

    // ボタン復帰
    btn.disabled = false;
    btn.classList.remove("loadingBtn");
    btn.textContent = "➤";

  }

}

/* ===== 新規セッション ===== */
async function newSession() {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "new" })
  });

  document.getElementById("log").innerHTML = "";
  closeSidebar();
  loadSessions();
}

/* ===== 初期ロード ===== */
fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mode: "load" })
})
.then(r => r.json())
.then(data => {
  if (data.messages) {
    messages = data.messages;
    messages.forEach(m => append(m.role, m.content, m.timestamp));
  }
  loadSessions();
});

/* ===== セッション一覧読み込み（サイドバー） ===== */
async function loadSessions() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "list" })
  });
  const data = await res.json();

  const side = document.getElementById("sessionsInSidebar");
  side.innerHTML = "";

  if (!data.sessions) return;

  data.sessions.forEach(s => {
    const session = typeof s === "string" ? { id: s, name: s } : s;

    const btn = document.createElement("button");
    btn.textContent = session.name;

    btn.onclick = async () => {
      const res2 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "switch", sessionId: session.id })
      });
      const data2 = await res2.json();

      document.getElementById("log").innerHTML = "";
      if (data2.messages) {
        data2.messages.forEach(m => append(m.role, m.content, m.timestamp));
      }
      closeSidebar();
    };

    side.appendChild(btn);
  });
}
</script>
