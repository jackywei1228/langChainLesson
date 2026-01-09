import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const apiKey = process.env.ZHIPU_API_KEY;

const prompt = PromptTemplate.fromTemplate(
  "You are a concise tutor. Explain {topic} in 3 short bullet points."
);

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
    const content = output.generations?.[0]?.[0]?.message?.content;
    const message = output.generations?.[0]?.[0]?.message;
    console.log("LLM raw output:\n", JSON.stringify(output, null, 2));
    if (message) {
      console.log("LLM response message:\n", JSON.stringify(message, null, 2));
    }
    if (content) {
      console.log("LLM content:\n", content);
    }
  }
});

const chain = prompt.pipe(model).pipe(new StringOutputParser());

const topic = process.argv[2] ?? "LCEL 基础知识";
const result = await chain.invoke({ topic }, { callbacks: [logHandler] });
console.log("-------------------------- LLM -----------------------\n");
console.log(result);
