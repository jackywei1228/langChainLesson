import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";

const apiKey = process.env.ZHIPU_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!apiKey) {
  throw new Error("ZHIPU_API_KEY is missing");
}

if (!tavilyApiKey) {
  throw new Error("TAVILY_API_KEY is missing");
}

const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});

const retriever = new TavilySearchAPIRetriever({
  apiKey: tavilyApiKey,
  k: 5
});

const prompt = PromptTemplate.fromTemplate(
  [
    "Answer using the search results only.",
    "If results are insufficient, say you could not find it.",
    "",
    "Search Results:",
    "{context}",
    "",
    "Question: {question}"
  ].join("\n")
);

const question = process.argv[2] ?? "What is LCEL?";
const docs = await retriever.invoke(question);
const context = docs
  .map((doc, index) => {
    const source = doc.metadata?.source ?? "unknown";
    return `(${index + 1}) ${doc.pageContent}\nSource: ${source}`;
  })
  .join("\n\n");

const formatted = await prompt.format({ context, question });
const answer = await model.invoke(formatted);
console.log("Final:", answer.content);
