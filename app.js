/* =========================
   制御層 app.js
   ========================= */

let messages = [];

/* =========================
   送信処理
   ========================= */
async function send() {

  const input = document.getElementById("msg");
  const btn = document.getElementById("sendBtn");

  const text = input.value.trim();
  if (!text) return;

  btn.disabled = true;
  btn.classList.add("loadingBtn");
  btn.textContent = "...";

  input.value = "";
  input.style.height = "auto";

  append("user", text, Date.now());
  showTyping();

  try {

    const warmthSlider = document.getElementById("warmthSlider");
    const warmth = warmthSlider ? Number(warmthSlider.value) : 60;

    const data = await apiChat(text, warmth);

    hideTyping();
    clearLog();

    if (data.messages) {
      messages = data.messages;
      messages.forEach(m =>
        append(m.role, m.content, m.timestamp)
      );
    }

    await loadSessions();

  } catch (err) {

    hideTyping();
    append("assistant", "通信エラーが発生しました。");

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

  await apiNewSession();

  clearLog();
  closeSidebar();
  await loadSessions();
}

/* =========================
   初期ロード
   ========================= */
async function initialLoad() {

  const data = await apiLoad();

  if (data.messages) {
    messages = data.messages;
    messages.forEach(m =>
      append(m.role, m.content, m.timestamp)
    );
  }

  await loadSessions();
}

initialLoad();

/* =========================
   セッション一覧
   ========================= */
async function loadSessions() {

  const data = await apiListSessions();

  const side = document.getElementById("sessionsInSidebar");

  if (!side) return;   // ← これ追加 
   
  side.innerHTML = "";

  if (!data.sessions) return;

  data.sessions.forEach(s => {

    const session = typeof s === "string" ? { id: s, name: s } : s;

    const btn = document.createElement("button");
    btn.textContent = session.name;

    btn.onclick = async () => {

      const data2 = await apiSwitchSession(session.id);

      clearLog();

      if (data2.messages) {
        messages = data2.messages;
        data2.messages.forEach(m =>
          append(m.role, m.content, m.timestamp)
        );
      }

      closeSidebar();
    };

    side.appendChild(btn);
  });
}
