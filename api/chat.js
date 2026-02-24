import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// セッションIDキー（現在のセッション）
const CURRENT_SESSION_KEY = "haru_current_session";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {

    // 現在のセッションID取得（なければ新規作成）
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

    // 新しいユーザーメッセージ取得
    const incoming = req.body.messages;
    const last = incoming[incoming.length - 1];

    if (last && last.role === "user") {

      messages.push({
        role: "user",
        content: last.content,
        timestamp: Date.now()
      });

    }

    // 現在日時（AI用）
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
            ...messages.map(m => ({
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

    // AI返信保存（timestamp付き）
    messages.push({
      role: "assistant",
      content: reply,
      timestamp: Date.now()
    });

    // セッション保存
    await redis.set(SESSION_KEY, messages);

    // クライアントに返す
    res.status(200).json({
      reply,
      sessionId,
      messages
    });

  } catch (e) {

    res.status(500).json({
      reply: "（サーバエラー）"
    });

  }

}
