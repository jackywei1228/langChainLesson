import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const apiKey = process.env.ZHIPU_API_KEY;

const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});

const schema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).length(3)
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const prompt = PromptTemplate.fromTemplate(
  "Respond in JSON.\n{format_instructions}\nTopic: {topic}"
);

const chain = prompt.pipe(model).pipe(parser);

const topic = process.argv[2] ?? "LangChain core ideas";
const result = await chain.invoke({
  topic,
  format_instructions: parser.getFormatInstructions()
});

console.log(result);
