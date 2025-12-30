import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
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

const chain = prompt.pipe(model).pipe(new StringOutputParser());

const topic = process.argv[2] ?? "LCEL basics";
const result = await chain.invoke({ topic });
console.log(result);
