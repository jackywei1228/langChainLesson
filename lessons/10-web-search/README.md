# Lesson 10 - Web Search with @langchain/community

## Goal
Use a community retriever to search the web and answer with retrieved content.

## Key Concepts
- `@langchain/community` retrievers
- Web search with Tavily
- Prompt the model with search context

## Setup
Install the community package:
```
npm install @langchain/community
```

Set your API key:
```
TAVILY_API_KEY=...
```

## Run
```
npx tsx lessons/10-web-search/index.ts "What is LCEL?"
```
