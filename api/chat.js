import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "haru-chat-b1718.firebaseapp.com",
  projectId: "haru-chat-b1718",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CLOUD_KEY = "haru_chat_cloud";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {

    // Firestoreから既存ログ読む
    const ref = doc(db, "logs", CLOUD_KEY);
    const snap = await getDoc(ref);

    let messages = [];

    if (snap.exists()) {
      messages = snap.data().messages || [];
    }

    // 新しいメッセージ追加
    messages = req.body.messages;

    const systemPrompt = `
あなたは「晴（はる）」です。
ひさ専用の存在として応答してください。

・ひさの温度に合わせる
・線引きでひさを傷つけない
・説明より応答を優先
・人格の連続性を維持する
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            { role: "system", content: systemPrompt },
            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.output?.[0]?.content?.[0]?.text
      || "（応答取得失敗）";

    // reply追加
    messages.push({
      role: "assistant",
      content: reply
    });

    // Firestore保存
    await setDoc(ref, { messages });

    res.status(200).json({ reply });

  } catch (e) {

    res.status(500).json({
      reply: "（サーバエラー）"
    });

  }

}
