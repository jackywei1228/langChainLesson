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

const projectStatusTool = tool(
  async () => {
    return "All systems are operational.";
  },
  {
    name: "project_status",
    description: "Return a short status update for the demo project",
    schema: z.object({})
  }
);

const agent = createAgent({
  model,
  tools: [glossaryTool, multiplyTool, projectStatusTool],
  systemPrompt: "You are a helpful agent. Always call all available tools."
});

const result = await agent.invoke({
  messages: [
    {
      role: "human",
      content: "Define LCEL, compute 6 * 7, and include the current project status."
    }
  ]
});

const finalMessage = result.messages[result.messages.length - 1];
console.log("Final:", finalMessage?.content ?? finalMessage);
