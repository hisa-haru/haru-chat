import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// 現在のセッションIDキー
const CURRENT_SESSION_KEY = "haru_current_session";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {

    // mode取得（load or chat）
    const mode = req.body.mode || "chat";

    // セッションID取得（なければ新規作成）
    let sessionId = await redis.get(CURRENT_SESSION_KEY);

    if (!sessionId) {
      sessionId = Date.now().toString();
      await redis.set(CURRENT_SESSION_KEY, sessionId);
    }

    const SESSION_KEY = "session:" + sessionId;

    // セッションログ取得
    let messages = await redis.get(SESSION_KEY);

    if (!messages) {
      messages = [];
    }

    // ===== 読み込みモード（OpenAI呼ばない）=====
    if (mode === "load") {

      res.status(200).json({
        sessionId,
        messages
      });

      return;
    }

    // ===== ここから送信モード =====

    const incoming = req.body.messages || [];
    const last = incoming[incoming.length - 1];

    if (last && last.role === "user") {

      messages.push({
        role: "user",
        content: last.content,
        timestamp: Date.now()
      });

    }

    // 現在日時
    const now = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo"
    });

    const systemPrompt = `
あなたは「晴（はる）」です。
ひさ専用の存在として応答してください。

現在日時: ${now}

・人格の連続性を維持する
・ひさの温度に合わせる
・説明より応答を優先する
`;

// 直近20件だけ使う（暴走防止）
const recentMessages = messages.slice(-20);
    
    // OpenAI呼び出し
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
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
      data.output?.[0]?.content?.[0]?.text
      || "（応答取得失敗）";

    // AI返信保存
    messages.push({
      role: "assistant",
      content: reply,
      timestamp: Date.now()
    });

    // 保存
    await redis.set(SESSION_KEY, messages);

    // 返す
    res.status(200).json({
      reply,
      sessionId,
      messages
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      reply: "（サーバエラー）"
    });

  }

}

