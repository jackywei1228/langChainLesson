import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const apiKey = process.env.ZHIPU_API_KEY;

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
    description: "Look up LangChain glossary terms",
    schema: z.object({ term: z.string() })
  }
);

const modelWithTools = model.bindTools([glossaryTool]);

const messages = [
  new HumanMessage(
    "Call lookup_glossary for LCEL and explain it in one sentence."
  )
];

const aiMessage = await modelWithTools.invoke(messages);

if (!aiMessage.tool_calls?.length) {
  console.log("No tool call:", aiMessage.content);
  process.exit(0);
}

const toolMessages = await Promise.all(
  aiMessage.tool_calls.map(async (call, i) => {
    const result = await glossaryTool.invoke(call.args);
    return new ToolMessage(result, call.id ?? `call-${i}`);
  })
);

const final = await modelWithTools.invoke([
  ...messages,
  aiMessage,
  ...toolMessages
]);

console.log(final.content);
