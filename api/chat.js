import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";


const firebaseConfig = {

  apiKey: "AIzaSyCqF7iPmI6VMbC-AsJZgY-8fFLMfJAtlRg",
  authDomain: "haru-chat-b1718.firebaseapp.com",
  projectId: "haru-chat-b1718",
  storageBucket: "haru-chat-b1718.appspot.com",
  messagingSenderId: "378629883584",
  appId: "1:378629883584:web:c430e4cc6e2de4c03bcf25"

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

    const { messages } = req.body;


    // 🔹 Firestoreに保存
    await setDoc(
      doc(db, "logs", CLOUD_KEY),
      { messages: messages }
    );


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
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          model: "gpt-4.1-mini",

          input: [
            {
              role: "system",
              content: systemPrompt
            },
            ...messages
          ]

        })

      }
    );


    const data = await response.json();

    const reply =
      data.output?.[0]?.content?.[0]?.text
      || "（応答取得失敗）";


    res.status(200).json({
      reply: reply
    });


  } catch (e) {

    res.status(500).json({
      reply: "（サーバエラー）"
    });

  }

}
