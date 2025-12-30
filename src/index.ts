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
    `请用中文回答。\n{format_instructions}\n主题：{topic}`
  );

  const chain = prompt.pipe(model).pipe(parser);

  const topic = process.argv[2] ?? "LangChain 1.x 的核心概念";
  const result = await chain.invoke({
    topic,
    format_instructions: parser.getFormatInstructions()
  });

  console.log(result);

