import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { z } from "zod";

const apiKey = process.env.ZHIPU_API_KEY;

if (!apiKey) {
  throw new Error("ZHIPU_API_KEY is missing");
}

const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});

const glossaryTool = tool(
  async ({ term }) => {
    const glossary: Record<string, string> = {
      LCEL: "LangChain Expression Language for composable chains.",
      Runnable: "Composable execution unit with streaming and parallel support.",
      Retriever: "Component that fetches relevant documents for a query."
    };
    return glossary[term] ?? "No definition found.";
  },
  {
    name: "lookup_glossary",
    description: "Look up a LangChain glossary term",
    schema: z.object({ term: z.string() })
  }
);

const multiplyTool = tool(
  async ({ a, b }) => {
    return `${a} * ${b} = ${a * b}`;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number()
    })
  }
);

const agent = createAgent({
  model,
  tools: [glossaryTool, multiplyTool],
  systemPrompt: "You are a helpful agent. Use tools when necessary."
});

const result = await agent.invoke({
  messages: [
    {
      role: "human",
      content: "Use lookup_glossary to define LCEL, then use multiply for 12 * 7."
    }
  ]
});

const finalMessage = result.messages[result.messages.length - 1];
console.log("Final:", finalMessage?.content ?? finalMessage);
