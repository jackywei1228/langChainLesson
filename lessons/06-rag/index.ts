import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";

const apiKey = process.env.ZHIPU_API_KEY;

const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});

class KeywordRetriever extends BaseRetriever {
  private docs: Document[];
  constructor(docs: Document[]) {
    super();
    this.docs = docs;
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const tokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) {
      return [];
    }
    return this.docs.filter((doc) => {
      const content = doc.pageContent.toLowerCase();
      return tokens.some((token) => content.includes(token));
    });
  }
}

const docs = [
  new Document({ pageContent: "LCEL lets you compose chains with .pipe()." }),
  new Document({ pageContent: "Runnable is the base unit of execution." }),
  new Document({ pageContent: "Retrievers fetch relevant docs for a query." })
];

const retriever = new KeywordRetriever(docs);

const prompt = PromptTemplate.fromTemplate(
  "Answer using the context only.\nContext:\n{context}\n\nQuestion: {question}"
);

const question = process.argv[2] ?? "什么是检索,什么是RAG?";
const retrieved = await retriever.invoke(question);
const context = retrieved.map((d) => `- ${d.pageContent}`).join("\n");

const answer = await model.invoke(
  await prompt.format({ context, question })
);

console.log(answer.content);
