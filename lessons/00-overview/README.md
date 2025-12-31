# Lesson Overview

This folder maps the learning path across core LangChain concepts. Each lesson is self-contained and can be run independently.

## Lessons
- `01-setup`: environment, model config, and a minimal invoke.
- `02-prompts-and-lcel`: prompt templates and LCEL piping.
- `03-structured-output`: enforce JSON output with Zod + parser.
- `04-tools`: tool calling loop and ToolMessage wiring.
- `05-memory`: conversation history with RunnableWithMessageHistory.
- `06-rag`: basic retriever + context injection (no external vector DB).
- `07-agent-basics`: minimal agent with tools and final response.
- `08-agent-routing`: use LLM tool selection middleware for routing.

## Running
Use the `npm run dev -- <path>` pattern to run a lesson:

```
npm run dev -- lessons/02-prompts-and-lcel/index.ts
```

Make sure `.env` includes `ZHIPU_API_KEY`.
