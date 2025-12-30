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
    const q = query.toLowerCase();
    return this.docs.filter((doc) => doc.pageContent.toLowerCase().includes(q));
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
