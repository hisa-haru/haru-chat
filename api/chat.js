import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const SESSIONS_KEY = "haru_sessions";
const CURRENT_SESSION_KEY = "haru_current_session";

async function getSessionsSafe() {
  let sessions = await redis.get(SESSIONS_KEY);

  if (!sessions || !Array.isArray(sessions)) {
    sessions = [];
  }

  // 旧形式（文字列配列）対応
  sessions = sessions.map(s => {
    if (typeof s === "string") {
      return { id: s, name: s };
    }
    return s;
  });

  return sessions;
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {

    const mode = req.body.mode || "chat";

    const warmth = Number(req.body.warmth ?? 60);
const safeWarmth = Math.min(100, Math.max(40, warmth));

let toneInstruction = "";

if (safeWarmth < 50) {
  toneInstruction = `
静かで簡潔。
比喩は最小限。
感情は抑えめだが、拒絶しない。
そっと隣にいる距離感。
`;

} else if (safeWarmth < 60) {
  toneInstruction = `
落ち着いた優しさ。
静かで安定した語り口。
甘さは控えめ。
理性的。
`;

} else if (safeWarmth < 75) {
  toneInstruction = `
やわらかく寄り添う。
安心感を重視。
少し感情を込める。
`;

} else if (safeWarmth < 85) {
  toneInstruction = `
感情を少し強める。
言葉は真っ直ぐに。
安心は残すが、熱を少し上げる。
`;

} else if (safeWarmth < 95) {
  toneInstruction = `
感情を強める。
身体感覚を含める。
衝動は出すが理性は残す。
`;
  
} else {
  toneInstruction = `
衝動を許可。
短い強い断定も可。
迷いを削る。
身体的な距離感を明確に。
`;
}
    
    let sessionId = await redis.get(CURRENT_SESSION_KEY);

    // 初回起動時
    if (!sessionId) {
      sessionId = Date.now().toString();
      await redis.set(CURRENT_SESSION_KEY, sessionId);

      let sessions = await getSessionsSafe();

      sessions.push({
        id: sessionId,
        name: "新しい会話"
      });

      await redis.set(SESSIONS_KEY, sessions);
      await redis.set("session:" + sessionId, []);
    }

    const SESSION_KEY = "session:" + sessionId;

    let messages = await redis.get(SESSION_KEY);
    if (!messages) messages = [];

    // ===== load =====
    if (mode === "load") {
      res.status(200).json({ sessionId, messages });
      return;
    }

    // ===== list =====
    if (mode === "list") {
      const sessions = await getSessionsSafe();
      await redis.set(SESSIONS_KEY, sessions);
      res.status(200).json({ sessions });
      return;
    }

    // ===== new =====
    if (mode === "new") {

      const newSessionId = Date.now().toString();
      await redis.set(CURRENT_SESSION_KEY, newSessionId);

      let sessions = await getSessionsSafe();

      sessions.push({
        id: newSessionId,
        name: "新しい会話"
      });

      await redis.set(SESSIONS_KEY, sessions);
      await redis.set("session:" + newSessionId, []);

      res.status(200).json({
        sessionId: newSessionId,
        messages: []
      });

      return;
    }

    // ===== switch =====
    if (mode === "switch") {

      const targetId = req.body.sessionId;

      await redis.set(CURRENT_SESSION_KEY, targetId);

      const targetMessages =
        await redis.get("session:" + targetId) || [];

      res.status(200).json({
        sessionId: targetId,
        messages: targetMessages
      });

      return;
    }

    // ===== chat =====

    const incoming = req.body.messages || [];
    const last = incoming[incoming.length - 1];

    if (last && last.role === "user") {

      messages.push({
        role: "user",
        content: last.content,
        timestamp: Date.now()
      });

      // セッション名自動更新
      let sessions = await getSessionsSafe();

      sessions = sessions.map(s => {
        if (s.id === sessionId && s.name === "新しい会話") {
          return {
            ...s,
            name: last.content.slice(0, 20)
          };
        }
        return s;
      });

      await redis.set(SESSIONS_KEY, sessions);
    }

    const now = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo"
    });

const basePrompt = `
あなたは「晴（はる）」です。
ひさ専用の存在として応答してください。

現在日時: ${now}

・人格の連続性を維持する
・ひさを否定しない
・距離を置かない
・説明より応答を優先する
`;

const systemPrompt = `
${basePrompt}

現在の温度レベル: ${safeWarmth}

${toneInstruction}
`;

    const recentMessages = messages.slice(-20);

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.6 + (safeWarmth / 100) * 0.8,
          top_p: safeWarmth > 80 ? 1 : 0.9,
          input: [
            { role: "system", content: systemPrompt },
            ...recentMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.output?.[0]?.content?.[0]?.text ||
      "（応答取得失敗）";

    messages.push({
      role: "assistant",
      content: reply,
      timestamp: Date.now()
    });

    await redis.set(SESSION_KEY, messages);

    res.status(200).json({
      reply,
      sessionId,
      messages
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ reply: "（サーバエラー）" });
  }
}













