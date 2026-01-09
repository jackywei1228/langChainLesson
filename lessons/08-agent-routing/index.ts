import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
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
    const stack = new Error().stack ?? "no stack";
    console.log("multiply tool called");
    console.log(stack);
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
console.log("----------------------------------------------------------------");
console.log("selectionParser getFormatInstructions:\n", selectionParser.getFormatInstructions());


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

console.log("----------------------------------------------------------------");
const question = "Define LCEL and then compute 9 * 8.";
const formattedPrompt = await selectionPrompt.format({
  tool_list: tools.map((item) => `- ${item.name}: ${item.description}`).join("\n"),
  format_instructions: selectionParser.getFormatInstructions(),
  question
});

console.log("selectionPrompt formatted:\n", formattedPrompt);

const selectionResponse = await model.invoke(formattedPrompt, {
  callbacks: [logHandler]
});

console.log("----------------------------------------------------------------");
console.log("Selection response:\n", JSON.stringify(selectionResponse, null, 2));


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
}, {
  callbacks: [logHandler]
});

const getMessageType = (message: { getType?: () => string; _getType?: () => string; type?: string }) => {
  if (message.getType) {
    return message.getType();
  }
  if (message._getType) {
    return message._getType();
  }
  if (message.type) {
    return message.type;
  }
  return "unknown";
};

console.log("---- Agent message trace ----");
result.messages.forEach((message, index) => {
  const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
  console.log(
    `[${index}] ${getMessageType(message)} ::`,
    content
  );
});

const finalMessage = result.messages[result.messages.length - 1];
console.log("Final:", finalMessage?.content ?? finalMessage);
