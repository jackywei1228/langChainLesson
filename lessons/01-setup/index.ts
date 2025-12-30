import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

const apiKey = process.env.ZHIPU_API_KEY;
if (!apiKey) {
  console.warn("Missing ZHIPU_API_KEY in .env or environment.");
}

const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});

const result = await model.invoke("请用一句话概括一下 LangChain");
console.log(result.content);
