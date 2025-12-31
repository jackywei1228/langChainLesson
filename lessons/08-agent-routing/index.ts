import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
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

const faqTool = tool(
  async ({ topic }) => {
    const faqs: Record<string, string> = {
      pricing: "Pricing is usage-based with free-tier credits.",
      setup: "Set ZHIPU_API_KEY in your .env file before running lessons."
    };
    return faqs[topic] ?? "No FAQ entry found.";
  },
  {
    name: "lookup_faq",
    description: "Look up short FAQ entries by topic",
    schema: z.object({ topic: z.string() })
  }
);

const statusTool = tool(
  async () => {
    return "All systems are operational.";
  },
  {
    name: "project_status",
    description: "Return a short status update for the demo project",
    schema: z.object({})
  }
);

const tools = [glossaryTool, multiplyTool, faqTool, statusTool];
console.log("Available tools:", tools.map((item) => item.name).join(", "));

const toolNames = tools.map((item) => item.name);
const toolNameEnum = z.enum(toolNames as [string, ...string[]]);
const selectionSchema = z.object({
  tools: z.array(toolNameEnum).min(1).max(2)
});
const selectionParser = StructuredOutputParser.fromZodSchema(selectionSchema);

const selectionPrompt = PromptTemplate.fromTemplate(
  [
    "You are selecting tools for an agent.",
    "Pick up to 2 tool names that are most relevant.",
    "Only select from this list:",
    "{tool_list}",
    "",
    "{format_instructions}",
    "",
    "User question: {question}"
  ].join("\n")
);

const question = "Define LCEL and then compute 9 * 8.";
const selectionResponse = await model.invoke(
  await selectionPrompt.format({
    tool_list: tools.map((item) => `- ${item.name}: ${item.description}`).join("\n"),
    format_instructions: selectionParser.getFormatInstructions(),
    question
  })
);
const selection = await selectionParser.parse(
  typeof selectionResponse.content === "string" ? selectionResponse.content : ""
);
const selectedToolSet = new Set(selection.tools);
const selectedTools = tools.filter((item) => selectedToolSet.has(item.name));
console.log("Selected tools:", selectedTools.map((item) => item.name).join(", "));

const agent = createAgent({
  model,
  tools: selectedTools,
  systemPrompt: "You are a helpful agent. Use tools when they add value."
});

const result = await agent.invoke({
  messages: [
    {
      role: "human",
      content: question
    }
  ]
});

const finalMessage = result.messages[result.messages.length - 1];
console.log("Final:", finalMessage?.content ?? finalMessage);
