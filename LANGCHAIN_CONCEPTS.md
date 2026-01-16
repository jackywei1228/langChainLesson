# LangChain v1.0 核心概念和类详解

基于项目代码分析，整理 LangChain v1.0 的主要概念和类。

## 📦 包结构

LangChain v1.0 采用模块化设计，主要包包括：

- **`@langchain/core`**: 核心抽象和基础类
- **`@langchain/openai`**: OpenAI 兼容的模型集成
- **`@langchain/community`**: 社区贡献的工具和集成
- **`langchain`**: 高级 API（如 `createAgent`）

---

## 🎯 核心概念

### 1. **Runnable（可运行对象）**

**概念**: LangChain 的基础抽象，所有可执行组件都实现 `Runnable` 接口。

**特点**:
- 支持 `.pipe()` 链式组合
- 支持 `.invoke()` 同步调用
- 支持 `.stream()` 流式输出
- 支持 `.batch()` 批量处理

**示例**:
```typescript
const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke({ topic: "LCEL" });
```

**常见 Runnable 类型**:
- `PromptTemplate` (prompt → Runnable)
- `ChatOpenAI` (model → Runnable)
- `StringOutputParser` (parser → Runnable)
- `BaseRetriever` (retriever → Runnable)

---

### 2. **LCEL (LangChain Expression Language)**

**概念**: 使用 `.pipe()` 方法组合组件的声明式语言。

**语法**:
```typescript
const chain = prompt.pipe(model).pipe(parser);
```

**优势**:
- 声明式、易读
- 类型安全
- 支持流式处理
- 易于组合和复用

---

### 3. **Messages（消息）**

**概念**: LangChain 使用消息对象表示对话中的不同角色。

**消息类型**:
- `HumanMessage`: 用户输入
- `AIMessage`: AI 回复
- `SystemMessage`: 系统提示
- `ToolMessage`: 工具执行结果

**使用场景**:
- 对话历史管理
- Agent 状态维护
- 多轮对话

---

### 4. **Chains（链）**

**概念**: 将多个组件串联起来执行复杂任务。

**创建方式**:
```typescript
// 方式1: 使用 .pipe()
const chain = prompt.pipe(model).pipe(parser);

// 方式2: 使用 RunnableWithMessageHistory（带历史）
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getHistory
});
```

---

## 🔧 主要类和组件

### **Models（模型）**

#### `ChatOpenAI`
**位置**: `@langchain/openai`

**用途**: OpenAI 兼容的聊天模型封装

**示例**:
```typescript
const model = new ChatOpenAI({
  model: "glm-4.7",
  temperature: 0.2,
  apiKey: process.env.ZHIPU_API_KEY,
  configuration: { baseURL: "https://open.bigmodel.cn/api/paas/v4/" }
});
```

**主要方法**:
- `.invoke(messages)`: 调用模型
- `.bindTools(tools)`: 绑定工具（用于工具调用）
- `.stream()`: 流式输出

---

### **Prompts（提示词）**

#### `PromptTemplate`
**位置**: `@langchain/core/prompts`

**用途**: 字符串模板，支持变量替换

**示例**:
```typescript
const prompt = PromptTemplate.fromTemplate(
  "You are a tutor. Explain {topic} in 3 bullet points."
);
const formatted = await prompt.format({ topic: "LCEL" });
```

**方法**:
- `.fromTemplate()`: 从模板创建
- `.format()`: 格式化模板
- `.pipe()`: 链式组合

---

#### `ChatPromptTemplate`
**位置**: `@langchain/core/prompts`

**用途**: 多消息对话模板

**示例**:
```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant."],
  new MessagesPlaceholder("history"),  // 历史消息占位符
  ["human", "{question}"]
]);
```

**特殊组件**:
- `MessagesPlaceholder`: 消息历史占位符

---

### **Output Parsers（输出解析器）**

#### `StringOutputParser`
**位置**: `@langchain/core/output_parsers`

**用途**: 将 AI 消息转换为字符串

**示例**:
```typescript
const parser = new StringOutputParser();
const chain = model.pipe(parser);
const result = await chain.invoke("Hello"); // 返回字符串
```

---

#### `StructuredOutputParser`
**位置**: `@langchain/core/output_parsers`

**用途**: 将输出解析为结构化数据（JSON + Zod schema）

**示例**:
```typescript
const schema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).length(3)
});

const parser = StructuredOutputParser.fromZodSchema(schema);
const chain = prompt.pipe(model).pipe(parser);

// 获取格式指令（用于 prompt）
const formatInstructions = parser.getFormatInstructions();

// 解析输出
const result = await chain.invoke({ topic: "LCEL" });
// result: { title: "...", bullets: ["...", "...", "..."] }
```

**方法**:
- `.fromZodSchema()`: 从 Zod schema 创建
- `.getFormatInstructions()`: 获取格式说明（用于 prompt）

---

### **Tools（工具）**

#### `tool()`
**位置**: `@langchain/core/tools`

**用途**: 创建可被 Agent 调用的工具

**示例**:
```typescript
const glossaryTool = tool(
  async ({ term }) => {
    const glossary: Record<string, string> = {
      LCEL: "LangChain Expression Language for composable chains."
    };
    return glossary[term] ?? "No definition found.";
  },
  {
    name: "lookup_glossary",
    description: "Look up a LangChain glossary term",  // 重要：LLM 用它来选择工具
    schema: z.object({ term: z.string() })  // 参数定义
  }
);
```

**关键属性**:
- `name`: 工具名称
- `description`: 工具描述（**非常重要**，LLM 用它来选择工具）
- `schema`: 参数 schema（使用 Zod）

**使用方式**:
```typescript
// 方式1: 绑定到模型
const modelWithTools = model.bindTools([glossaryTool]);

// 方式2: 用于 Agent
const agent = createAgent({
  model,
  tools: [glossaryTool]
});
```

---

### **Agents（智能体）**

#### `createAgent()`
**位置**: `langchain`

**用途**: 创建 ReAct 风格的 Agent（可以调用工具）

**示例**:
```typescript
const agent = createAgent({
  model,
  tools: [glossaryTool, multiplyTool],
  systemPrompt: "You are a helpful agent. Use tools when necessary."
});

const result = await agent.invoke({
  messages: [{
    role: "human",
    content: "Define LCEL and compute 12 * 7."
  }]
});
```

**工作流程**:
1. 用户提问
2. LLM 分析并决定调用工具
3. 执行工具
4. 将结果返回给 LLM
5. LLM 生成最终答案

**返回结果**:
- `result.messages`: 完整的消息历史（包括工具调用和结果）

---

### **Retrievers（检索器）**

#### `BaseRetriever`
**位置**: `@langchain/core/retrievers`

**用途**: 检索器基类，用于 RAG（检索增强生成）

**自定义检索器示例**:
```typescript
class KeywordRetriever extends BaseRetriever {
  private docs: Document[];
  
  async _getRelevantDocuments(query: string): Promise<Document[]> {
    // 实现检索逻辑
    return this.docs.filter(/* ... */);
  }
}
```

**使用**:
```typescript
const retriever = new KeywordRetriever(docs);
const docs = await retriever.invoke("什么是 LCEL?");
```

---

#### `TavilySearchAPIRetriever`
**位置**: `@langchain/community/retrievers/tavily_search_api`

**用途**: 网络搜索检索器（需要 TAVILY_API_KEY）

**示例**:
```typescript
const retriever = new TavilySearchAPIRetriever({
  apiKey: process.env.TAVILY_API_KEY,
  k: 5  // 返回前 5 个结果
});

const docs = await retriever.invoke("What is LCEL?");
```

---

### **Documents（文档）**

#### `Document`
**位置**: `@langchain/core/documents`

**用途**: 表示文档对象（用于 RAG）

**示例**:
```typescript
const doc = new Document({
  pageContent: "LCEL lets you compose chains with .pipe().",
  metadata: { source: "lesson-02" }
});
```

**属性**:
- `pageContent`: 文档内容
- `metadata`: 元数据（如来源、标题等）

---

### **Memory（记忆）**

#### `RunnableWithMessageHistory`
**位置**: `@langchain/core/runnables`

**用途**: 为链添加对话历史功能

**示例**:
```typescript
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId: string) => {
    // 返回该会话的历史
    return store.get(sessionId) ?? new InMemoryChatMessageHistory();
  },
  inputMessagesKey: "question",
  historyMessagesKey: "history"
});

const result = await chainWithHistory.invoke(
  { question: "Explain LCEL" },
  { configurable: { sessionId: "user-123" } }
);
```

---

#### `InMemoryChatMessageHistory`
**位置**: `@langchain/core/chat_history`

**用途**: 内存中的消息历史存储

**示例**:
```typescript
const history = new InMemoryChatMessageHistory();
history.addUserMessage("Hello");
history.addAIChatMessage("Hi there!");
```

---

### **Callbacks（回调）**

#### `BaseCallbackHandler`
**位置**: `@langchain/core/callbacks/base`

**用途**: 监听和记录执行过程

**示例**:
```typescript
const logHandler = BaseCallbackHandler.fromMethods({
  handleChatModelStart(_llm, messages) {
    console.log("LLM 开始处理:", messages);
  },
  handleLLMEnd(output) {
    console.log("LLM 输出:", output);
  },
  handleLLMNewToken(token) {
    process.stdout.write(token);  // 流式输出
  },
  handleToolEnd(output) {
    console.log("工具返回:", output);
  }
});

await model.invoke("Hello", { callbacks: [logHandler] });
```

**常用回调方法**:
- `handleChatModelStart`: LLM 开始处理
- `handleLLMEnd`: LLM 处理完成
- `handleLLMNewToken`: 新 token 生成（流式）
- `handleToolStart`: 工具开始执行
- `handleToolEnd`: 工具执行完成

---

## 🔄 典型工作流程

### 1. **简单链式调用**
```typescript
const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke({ topic: "LCEL" });
```

### 2. **带历史的对话**
```typescript
const chain = prompt.pipe(model);
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getHistory
});
const result = await chainWithHistory.invoke(
  { question: "..." },
  { configurable: { sessionId: "user-123" } }
);
```

### 3. **Agent 调用工具**
```typescript
const agent = createAgent({ model, tools: [tool1, tool2] });
const result = await agent.invoke({
  messages: [{ role: "human", content: "..." }]
});
```

### 4. **RAG 流程**
```typescript
// 1. 检索相关文档
const docs = await retriever.invoke(question);

// 2. 构建上下文
const context = docs.map(d => d.pageContent).join("\n");

// 3. 生成答案
const prompt = PromptTemplate.fromTemplate(
  "Context: {context}\nQuestion: {question}"
);
const answer = await model.invoke(await prompt.format({ context, question }));
```

---

## 📚 学习路径建议

1. **基础**: `PromptTemplate` → `ChatOpenAI` → `.pipe()` 链式组合
2. **输出处理**: `StringOutputParser` → `StructuredOutputParser`
3. **工具**: `tool()` → `model.bindTools()` → 手动工具调用
4. **Agent**: `createAgent()` → 多工具调用 → 工具路由
5. **记忆**: `RunnableWithMessageHistory` → `InMemoryChatMessageHistory`
6. **RAG**: `Document` → `BaseRetriever` → 自定义检索器

---

## 🔗 相关资源

- **官方文档**: https://js.langchain.com/
- **核心包**: `@langchain/core`
- **社区工具**: `@langchain/community`
- **版本**: v1.2+ (项目中使用)

---

## 💡 最佳实践

1. **工具描述要清晰**: `description` 字段直接影响 LLM 的工具选择
2. **使用 Zod schema**: 确保工具参数类型安全
3. **合理使用 Callbacks**: 调试和监控执行过程
4. **消息历史管理**: 使用 `RunnableWithMessageHistory` 处理多轮对话
5. **链式组合**: 优先使用 `.pipe()` 而非手动调用
6. **错误处理**: 工具调用可能失败，需要适当的错误处理
