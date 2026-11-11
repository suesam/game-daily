# Agent / Harness 系统学习课程导航

> 2026-11-11 对原计划实施课程资源核查、教学文件补齐。**资料补齐不代表已完成学习。**

原始大纲：[10 天系统学习计划](../00-10-day-agent-course.md)；[课程资源审计](Course-Resources-2026-11-11.md)。

## 课程目录

| 课程 | 主教材 | 本仓课程 | 状态 |
|---|---|---|---|
| Day 00 模型基础（选修） | [Karpathy GPT](https://github.com/karpathy/nn-zero-to-hero) | [查看](Day00-模型基础选修.md) | 未开始 |
| Day 01 Agent 基础与核心循环 | [主课](https://huggingface.co/learn/agents-course/en/unit1/introduction) | [教学讲义](Day01-Agent基础与核心循环.md) | 未开始 |
| Day 02 Tool 与 Function Calling / MCP | [主课](https://huggingface.co/learn/mcp-course/unit0/introduction) | [教学讲义](Day02-Tools与FunctionCalling.md) | 未开始 |
| Day 03 Context、State 与 Memory | [主课](https://docs.langchain.com/oss/python/langgraph/persistence) | [教学讲义](Day03-Context-State-Memory.md) | 未开始 |
| Day 04 Planning、ReAct 与 Reflection | [主课](https://www.deeplearning.ai/courses/agentic-ai) | [教学讲义](Day04-Planning与控制策略.md) | 未开始 |
| Day 05 Harness、Runtime 与 Model Adapter | [主课](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.zh.md) | [教学讲义](Day05-Harness与Runtime.md) | 未开始 |
| Day 06 可靠性、Checkpoint 与恢复 | [主课](https://docs.langchain.com/oss/python/langgraph/persistence) | [教学讲义](Day06-Reliability与Recovery.md) | 未开始 |
| Day 07 Observability 与 Evaluation | [主课](https://github.com/Arize-ai/phoenix/blob/main/js/examples/apps/tracing-tutorial/README.md) | [教学讲义](Day07-Observability与Evaluation.md) | 未开始 |
| Day 08 Multi-Agent 与 Supervisor | [主课](https://github.com/microsoft/ai-agents-for-beginners) | [教学讲义](Day08-Multi-Agent.md) | 未开始 |
| Day 09 Production Agent Engineering | [主课](https://github.com/microsoft/ai-agents-for-beginners) | [教学讲义](Day09-Production-Agent-Engineering.md) | 未开始 |
| Day 10 Agent System 集成与源码对照 | [主课](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) | [教学讲义](Day10-Production-Agent-System.md) | 未开始 |

## 统一学习协议

1. 一个阶段只保留一个 Main Quest，Day 是学习阶段不是自然日。
2. 先学习概念并做主动回忆，再独立实现最小 Runtime 增量。
3. 每阶段至少三个边界测试，允许 Mock 模型，必须保存实际输出。
4. 写清 Done、阻塞与恢复点；可选深挖不得无限阻塞主线。
5. 课程状态不能因资料补齐、AI 自动生成代码而自动变为已掌握。

## 学习产物目录建议（未自动创建空文件）

- lab/：版本化 Agent Runtime 示例与 pytest 测试。
- notes/：自己写的课堂笔记、问题、回答和心智模型。
- runs/：每阶段实验的真实环境/模型/运行 ID/指标。
- reviews/：Day07 和 Day10 的评估与最终项目复盘。
