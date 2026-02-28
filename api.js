/* =========================
   API担当ファイル api.js
   ========================= */

const API_URL = "/api/chat";

async function apiChat(text) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "chat",
      messages: [{ role: "user", content: text }]
    })
  });

  if (!res.ok) throw new Error("chat failed");

  return await res.json();
}

async function apiNewSession() {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "new" })
  });
}

async function apiLoad() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "load" })
  });

  return await res.json();
}

async function apiListSessions() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "list" })
  });

  return await res.json();
}

async function apiSwitchSession(sessionId) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "switch",
      sessionId
    })
  });

  return await res.json();
}
