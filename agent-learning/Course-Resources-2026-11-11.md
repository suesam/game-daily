# Agent / Harness 学习课程覆盖审计与外部教材清单（2026-11-11）

## 核查结论

- 原有仓库存在根目录《10 天 Agent 系统学习课程大纲》，但规划中的 agent-learning/Day01–Day10 课程文件当时不存在。
- 大纲有知识问题、实践产物和部分 Done，但没有系统外部课程链接、独立讲义、练习题和可执行故障测试矩阵。
- 本次新增十阶段教学讲义、课程索引与 Day00 模型基础；它们是学习材料不是已验证运行的项目。
- 外部资源根据官方可访问说明核对；没有逐节看完视频、安装所有第三方平台或测试全部代码。

## 逐章覆盖与教材

| 阶段 | 主课 / 官方实现 | 补充教材 | 独立实践补齐内容 |
|---|---|---|---|
| Day 01 Agent 基础与核心循环 | [主教材](https://huggingface.co/learn/agents-course/en/unit1/introduction) | [补充](https://github.com/microsoft/ai-agents-for-beginners) | 构建纯 Python 的 observe-decide-act-update 循环，先不使用 Agent 框架 |
| Day 02 Tool 与 Function Calling / MCP | [主教材](https://huggingface.co/learn/mcp-course/unit0/introduction) | [补充](https://github.com/modelcontextprotocol/quickstart-resources) | 创建 calculator、read_file 与 mock_search 工具，并接入最小 MCP Server/Client |
| Day 03 Context、State 与 Memory | [主教材](https://docs.langchain.com/oss/python/langgraph/persistence) | [补充](https://github.com/microsoft/ai-agents-for-beginners) | 使用 SQLite 构造会话状态、事实记忆、检索/更新/遗忘策略和可配置上下文预算 |
| Day 04 Planning、ReAct 与 Reflection | [主教材](https://www.deeplearning.ai/courses/agentic-ai) | [补充](https://github.com/microsoft/ai-agents-for-beginners) | 为相同模拟研究任务实现 Direct、ReAct、Planner-Executor，对照成功率、耗时与 Token |
| Day 05 Harness、Runtime 与 Model Adapter | [主教材](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.zh.md) | [补充](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) | 重构 Agent Runtime，创建两个模拟模型 Adapter，并按 Cordis 七章实现可注册、卸载的工具插件 |
| Day 06 可靠性、Checkpoint 与恢复 | [主教材](https://docs.langchain.com/oss/python/langgraph/persistence) | [补充](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/session/src/index.ts) | 添加 SQLite Checkpoint、Run 状态机、幂等键和预算上限，全部副作用先使用 Mock |
| Day 07 Observability 与 Evaluation | [主教材](https://github.com/Arize-ai/phoenix/blob/main/js/examples/apps/tracing-tutorial/README.md) | [补充](https://github.com/confident-ai/deepeval/blob/main/docs/content/guides/guides-ai-agent-evaluation.mdx) | 采集 Run/Step/Tool Trace，创建至少 20 个 Golden Cases，分别比较 Model/Prompt/Tool/Harness 的影响 |
| Day 08 Multi-Agent 与 Supervisor | [主教材](https://github.com/microsoft/ai-agents-for-beginners) | [补充](https://github.com/openai/openai-agents-python/tree/main/examples/agent_patterns) | 做一个研究/分析/写作三 Worker 系统，与单 Agent 三工具流程作对照 |
| Day 09 Production Agent Engineering | [主教材](https://github.com/microsoft/ai-agents-for-beginners) | [补充](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/README.md) | 用 FastAPI、SQLite、队列与 Docker 封装独立 Run API，并提供停止、查询与恢复 |
| Day 10 Agent System 集成与源码对照 | [主教材](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) | [补充](https://developers.openai.com/api/docs/guides/agents/sdk) | 整合前 9 阶段构建的 v1.0，把单一可评价工作流接到 AI 游戏日报或 Research Agent |

## 教材形态与注意事项

- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction)：教学单元、实操与测验，偏 Agent 入门与框架应用。
- [Hugging Face MCP Course](https://huggingface.co/learn/mcp-course/unit0/introduction)：MCP 概念、开发与任务，提供开源学习材料。
- [Microsoft AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners)：18 节有文字、视频和代码；部分示例要求 Microsoft Agent Framework/Azure，不把示例可运行性当成零成本保证。
- [Andrew Ng Agentic AI](https://www.deeplearning.ai/courses/agentic-ai)：7h45m，覆盖反思、工具、规划、多 Agent 与评价；其部分评分作业/证书依赖付费 PRO。
- [DeepSeek Harness Cordis 中文教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.zh.md)：七章可动手实现，官方说明不需 API Key；最适合作为 Harness 插件机制正式源码课。
- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)：区分线程 Checkpointer 与长期 Store；是框架文档而非完整可靠性课程。
- [Phoenix TypeScript tracing tutorial](https://github.com/Arize-ai/phoenix/blob/main/js/examples/apps/tracing-tutorial/README.md)：三个章节关于 Trace、Annotations/Evaluation、Sessions。
- [DeepEval Agent Evaluation](https://github.com/confident-ai/deepeval/blob/main/docs/content/guides/guides-ai-agent-evaluation.mdx)：E2E、Trajectory、Component 的指标与示例。
- [OpenAI Agents SDK Guide](https://developers.openai.com/api/docs/guides/agents/sdk)：用于 Runtime、Handoff、Guardrail、Trace 的源码/架构对照。

## 课程缺口与补齐原则

- 模型基础：原计划未单列 Transformer、Tokenizer、KV Cache → 新增 Day00。
- Harness 实现：Day05 加入插件依赖注入、生命周期、Hook/Effect、权限与 Model Adapter 实验。
- 生产可靠性：Day06 使用 Mock 副作用演示重复调用和未知结果，避免对真实账号执行危险测试。
- 评估：Day07 加入 Golden Cases、Trace、模型/Prompt/Tool/Harness 单变量回归。
- 部署和安全：Day09 增加认证、授权、Prompt Injection、Sandbox、Worker Crash 与 Secrets。
- 最终验证：Day10 要求真实业务的端到端流程与可复验的评估，不只整理概念。

## 学习和使用成本

首轮尽量使用 Python、pytest、SQLite 和 Mock Model；Cordis 实验使用 TypeScript。公共课程阅读不代表其所有在线视频、认证、云资源和 API 调用免费。外部在线观测服务不得默认上传真实私密工作区内容。
