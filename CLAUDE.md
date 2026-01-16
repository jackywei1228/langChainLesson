# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based educational project for learning LangChain concepts progressively. The course is designed for Chinese-speaking developers and uses Zhipu AI's GLM-4.7 model as the default LLM provider.

## Architecture

The project is organized as independent lesson modules under `lessons/`. Each lesson is self-contained and can be run independently without building the entire project.

- **Entry Point**: `src/index.ts` demonstrates basic LangChain concepts but is not the main focus
- **Lessons**: `lessons/00-overview/` through `lessons/10-web-search/` cover progressive LangChain concepts
- **Build Output**: `dist/` directory (generated from TypeScript compilation)

## Common Commands

### Running Lessons

Use `tsx` for development (recommended for running TypeScript directly without building):

```bash
# Run a specific lesson (most common)
npx tsx lessons/02-prompts-and-lcel/index.ts

# Alternative using npm script
npm run dev -- lessons/02-prompts-and-lcel/index.ts
```

### Build and Run

```bash
# Build TypeScript to JavaScript
npm run build

# Run the built main application
npm start

# Install dependencies
npm install
```

## Configuration

The project uses Zhipu AI (智谱AI) as the LLM provider via an OpenAI-compatible API:

**Required Environment Variables** (`.env` file):
- `ZHIPU_API_KEY`: API key for Zhipu AI GLM models
- `TAVILY_API_KEY`: For web search functionality (lesson 10)

**Model Configuration** (from `src/index.ts`):
```typescript
const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey: process.env.ZHIPU_API_KEY,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});
```

## Technology Stack

- **Language**: TypeScript (strict mode, ES2022 target, NodeNext modules)
- **AI Framework**: LangChain 1.2+ ecosystem
  - `@langchain/core`: Core abstractions
  - `@langchain/openai`: OpenAI-compatible integration
  - `@langchain/community`: Community tools (web search, etc.)
- **Schema Validation**: Zod for structured outputs
- **Runtime**: Node.js with ES modules

## Coding Conventions

From `AGENTS.md`:
- 2-space indentation for TypeScript/JavaScript files
- `camelCase` for variables/functions, `PascalCase` for classes
- Keep lesson modules self-contained and focused
- Chinese language for comments and user-facing strings

## Lesson Progression

1. **01-setup**: Environment configuration and basic model invocation
2. **02-prompts-and-lcel**: Prompt templates and LangChain Expression Language (LCEL)
3. **03-structured-output**: JSON output enforcement with Zod schemas
4. **04-tools**: Tool creation and calling
5. **05-memory**: Conversation history with RunnableWithMessageHistory
6. **06-rag**: Basic retrieval with custom retrievers (no external vector DB)
7. **07-agent-basics**: Minimal agent with tools
8. **08-agent-routing**: LLM-based tool selection for routing
9. **09-agent-multi-tools**: Agents that call multiple tools
10. **10-web-search**: Web search integration via @langchain/community

## Notes

- No testing framework is currently configured
- Each lesson has its own README.md explaining concepts
- All lesson code is in TypeScript under `lessons/*/index.ts`
