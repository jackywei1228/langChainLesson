import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

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

const getRoleFromMessage = (message: { getType?: () => string; _getType?: () => string; type?: string }) => {
  const type = message.getType?.() ?? message._getType?.() ?? message.type ?? "unknown";
  if (type === "human") return "user";
  if (type === "ai") return "assistant";
  if (type === "system") return "system";
  if (type === "tool") return "tool";
  return type;
};

const logHandler = BaseCallbackHandler.fromMethods({
  handleChatModelStart(_llm, messages) {
    console.log("LLM prompt messages:\n", JSON.stringify(messages, null, 2));
    const payload = messages.map((batch) =>
      batch.map((message) => ({
        role: getRoleFromMessage(message),
        content: message.content
      }))
    );
    console.log("LLM payload (role/content):\n", JSON.stringify(payload, null, 2));
  },
  handleLLMEnd(output) {
    const content = output.generations?.[0]?.[0]?.message?.kwargs?.content;
    const message = output.generations?.[0]?.[0]?.message;
    console.log("LLM raw output:\n", JSON.stringify(output, null, 2));
    if (message) {
      console.log("LLM response message:\n", JSON.stringify(message, null, 2));
    }
    if (content) {
      console.log("LLM content:\n", content);
    }
  },
  // 3. 看到每个工具的执行结果
  handleToolEnd(output) {
    console.log("工具返回:", output);
  },

  // 4. 流式输出（实时看到生成过程）
  handleLLMNewToken(token) {
    process.stdout.write(token); // 逐字打印
  }
});

const result = await model.invoke("请用一句话概括一下 LangChain", {
  callbacks: [logHandler]
});
console.log("---- result.content ----");
console.log(result.content);
