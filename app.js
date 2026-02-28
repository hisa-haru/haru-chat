const API_URL = "/api/chat";
let messages = [];

/* =========================
   送信処理（司令塔）
   ========================= */
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

    if (!res.ok) throw new Error("サーバーエラー");

    const data = await res.json();

    hideTyping();
    clearLog();

    if (data.messages) {
      messages = data.messages;
      messages.forEach(m => append(m.role, m.content, m.timestamp));
    }

    loadSessions();

  } catch (err) {

    hideTyping();

    append("assistant", "通信エラーが発生しました。もう一度お試しください。");

  } finally {

    btn.disabled = false;
    btn.classList.remove("loadingBtn");
    btn.textContent = "➤";

  }
}

/* =========================
   新規セッション
   ========================= */
async function newSession() {

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "new" })
  });

  clearLog();
  closeSidebar();
  loadSessions();
}

/* =========================
   初期ロード
   ========================= */
async function initialLoad() {

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "load" })
  });

  const data = await res.json();

  if (data.messages) {
    messages = data.messages;
    messages.forEach(m => append(m.role, m.content, m.timestamp));
  }

  loadSessions();
}

initialLoad();

/* =========================
   セッション一覧取得
   ========================= */
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
        body: JSON.stringify({
          mode: "switch",
          sessionId: session.id
        })
      });

      const data2 = await res2.json();

      clearLog();

      if (data2.messages) {
        data2.messages.forEach(m =>
          append(m.role, m.content, m.timestamp)
        );
      }

      closeSidebar();
    };

    side.appendChild(btn);
  });
}
