import "dotenv/config";
import util from "node:util";

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", util.inspect(err, { showHidden: true, depth: null }));
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", util.inspect(reason, { showHidden: true, depth: null }));
});

(async () => {
  try {
    console.log("Starting lessons/04-tools...");

    const { ChatOpenAI } = await import("@langchain/openai");
    console.log("Starting lessons/04-tools... 02");
    const { HumanMessage, ToolMessage } = await import("@langchain/core/messages");
    console.log("Starting lessons/04-tools... 03");
    const { tool } = await import("@langchain/core/tools");
    console.log("Starting lessons/04-tools... 04");
    const { z } = await import("zod");

    const apiKey = process.env.ZHIPU_API_KEY;
    console.log("ZHIPU_API_KEY set:", !!apiKey);

    if (!apiKey) {
      throw new Error("ZHIPU_API_KEY is missing");
    }

    let model;
    try {
      model = new ChatOpenAI({
        model: "glm-4.7",
        temperature: 0.2,
        apiKey,
        configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
      });
      console.log("ChatOpenAI instance created");
    } catch (err) {
      console.error("Error creating ChatOpenAI instance:", util.inspect(err, { showHidden: true, depth: null }));
      try {
        console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      } catch (e) {
        console.error("Failed to stringify error details:", e);
      }
      process.exit(1);
      return;
    }

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

    console.log("messages:", messages.map(m => m.content ?? m));

    const aiMessage = await modelWithTools.invoke(messages);
    console.log("aiMessage (raw):", util.inspect(aiMessage, { showHidden: true, depth: 2 }));

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
  } catch (err) {
    console.error("Caught error:\n", util.inspect(err, { showHidden: true, depth: null }));
    try {
      console.error("Error properties:\n", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch (e) {
      console.error("Failed to stringify error:", e);
    }
    process.exit(1);
  }
})();
