import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

const apiKey = process.env.ZHIPU_API_KEY;
console.log("ZHIPU_API_KEY:", process.env.ZHIPU_API_KEY);
const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a concise tutor."],
  new MessagesPlaceholder("history"),
  ["human", "{question}"]
]);

const chain = prompt.pipe(model);

const store = new Map<string, InMemoryChatMessageHistory>();
const getHistory = (sessionId: string) => {
  if (!store.has(sessionId)) {
    store.set(sessionId, new InMemoryChatMessageHistory());
  }
  return store.get(sessionId)!;
};

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getHistory,
  inputMessagesKey: "question",
  historyMessagesKey: "history"
});

const sessionId = "demo-user";

const first = await chainWithHistory.invoke(
  { question: "Explain LCEL in one sentence." },
  { configurable: { sessionId } }
);
console.log("First:", first.content);

const second = await chainWithHistory.invoke(
  { question: "Give me a simple example." },
  { configurable: { sessionId } }
);
console.log("Second:", second.content);
