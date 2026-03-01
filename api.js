/* =========================
   API担当ファイル api.js
   ========================= */

const API_URL = "/api/chat";

async function apiChat(text, warmth = 60) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "chat",
      warmth,
      messages: [{ role: "user", content: text }]
    })
  });

  const raw = await res.text();

  console.log("RAW RESPONSE:", raw);

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse failed", e);
    throw new Error("JSON parse failed");
  }
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
