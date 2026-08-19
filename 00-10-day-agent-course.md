# 10 天 Agent 系统学习课程大纲

> 目标：用 10 个学习阶段完成 Agent 的第一轮系统学习，从核心概念、Tool、Memory、Planning，一直走到 Harness、可靠性、评估、多 Agent、生产部署与完整 Agent System。
>
> 原则：核心机制尽量自己实现，不直接依赖 LangChain、LangGraph、CrewAI 等 Agent 框架；在理解并实现关键机制之后，再对照主流框架源码和设计。
>
> 节奏：Day 1–Day 10 是“学习阶段”，不是自然日强制锁定。某一天的必修线提前完成，可以当天继续进入下一阶段。

---

## 一、课程总目标

10 天后，应能够独立回答并实践以下问题：

- 什么是 Agent？Agent 与 LLM、Workflow、状态机有什么区别？
- Model、Environment、State、Observation、Action 分别是什么？
- Tool / Function Calling / MCP 分别解决什么问题？
- Context、State、History、Memory、Working Memory 有什么区别？
- Agent 为什么需要 Planning？什么时候不应该 Planning？
- `Agent = Model + Harness` 应如何理解？
- Harness 是否需要针对不同模型适配？
- Agent 中断、超时、重复执行、工具失败时如何恢复？
- Agent 为什么需要 Trace、Log、Metric 和 Eval？
- Agent 评估如何拆分 Model、Harness、Tool 和 End-to-End？
- 什么时候需要 Multi-Agent？什么时候单 Agent + 多工具更好？
- Demo Agent 与 Production Agent 的差别在哪里？
- 如何把 Agent 作为真实服务部署并持续运行？

最终产出：

1. 一个从零逐步演化出的 Agent Runtime / Harness；
2. 一套可靠性与评估实验；
3. 一个可部署的 Production Agent Service；
4. 一份 10 天完整学习文档；
5. 一份最终 Agent Mental Model / 系统知识手册；
6. 后续可接入真实产品作为持续演化的 Agent 基建项目。

---

# Day 1：Agent 本质、环境与核心循环

## 今日核心问题

- 什么是 Agent？
- Agent 与普通 LLM 调用有什么区别？
- Agent 与 Workflow 有什么区别？
- Agent 与状态机是什么关系？
- Model 在 Agent 中是什么角色？
- Environment、State、Observation、Action 分别是什么？
- Tool Call 与 Action 的关系是什么？
- Memory 是否属于 State？
- `Agent = Model + Harness` 这个说法是否准确？

## 核心结构

```text
             ┌───────────┐
             │   Agent   │
 Observation │   Model   │ Action
      ┌─────→│     +     │─────┐
      │      │  Harness  │     │
      │      └───────────┘     │
      │                        ↓
      │                  Environment
      │                        │
      └────────────────────────┘
```

```text
State_t
   ↓
Observation_t
   ↓
Decision
   ↓
Action_t
   ↓
Environment changes
   ↓
State_(t+1)
```

## 动手实现

```python
while not done:
    observation = observe()
    action = decide(observation, state)
    result = act(action)
    state = update(state, result)
```

产物：`Minimal Agent v0.1`

## 必修完成线

能够对任意简单 Agent 系统指出 Model、Harness、Environment、State、Observation、Action，并能自己写出最小 Agent Loop。

---

# Day 2：Tool、Function Calling 与 MCP

## 今日核心问题

- Tool 是什么？Action 与 Tool Call 是否等价？
- 为什么模型自己不能真正执行 API？
- Function Calling 到底是谁调用函数？
- JSON Schema、Tool Contract、Tool Registry、Tool Dispatcher 分别解决什么问题？
- Tool 返回值为什么会变成 Observation？
- MCP 与 Tool Calling 有什么区别？

## 核心结构

```text
Tool
 ├── name
 ├── description
 ├── input_schema
 └── execute()

        ↓

Tool Registry

        ↓

LLM → tool_call → Dispatcher → Tool → result → Observation → LLM
```

## 实验

故意制造 Tool 不存在、参数错误、Tool 超时、Tool 返回错误、非法参数、Tool Schema 变化等问题，观察 Harness 应该承担什么责任。

## 动手实现

- Tool Contract
- Tool Registry
- Tool Dispatcher
- 参数校验
- 多工具调用

产物：`Multi-Tool Agent v0.2`

---

# Day 3：Context、State 与 Memory

## 今日核心问题

彻底区分：

- Context
- State
- History
- Conversation
- Observation
- Memory
- Short-term Memory
- Long-term Memory
- Working Memory

重点解决：

- Context Window ≠ Memory
- State ≠ Memory
- Memory ≠ Database
- 聊天历史 ≠ 长期记忆

## Memory 三个核心过程

```text
Write：什么时候记？
Retrieve：什么时候想起来？
Forget：什么时候忘？
```

## 动手实现

- Context Manager
- State Store
- Memory Store
- Memory Policy

最小接口：

```python
memory.write(...)
memory.retrieve(...)
memory.forget(...)
```

重点不是 API，而是回答：谁决定什么时候写入、读取和遗忘？

产物：`Stateful Agent v0.3`

---

# Day 4：Planning、Reasoning 与 Agent 控制策略

## 今日核心问题

比较：

- Direct Execution
- ReAct
- Plan-and-Execute
- Plan → Execute → Replan
- Reflection
- Critic
- Self-correction
- Task Decomposition

重点理解这些方法究竟改变了 Agent Loop 的哪一部分。

## 核心结构

```text
普通 Agent：Observe → Decide → Act
```

加入 Planning：

```text
Goal → Plan → Step 1 → Observation → Replan? → Step 2
```

同时讨论：Planning 什么时候有价值？什么时候反而降低性能？规划粒度如何决定？Plan 是否属于 State？Executor 是否必须使用 LLM？

## 动手实现

- Planner
- Executor
- Replanner

对照实验：`Direct vs ReAct vs Plan-and-Execute`

比较成功率、Token、延迟和错误传播。

产物：`Planning Agent v0.4`

---

# Day 5：Harness / Runtime / Model Adaptation

> 课程的重要转折点：从 Agent Behavior 进入 Agent Engineering。

## 今日核心问题

- `Agent = Model + Harness` 到底意味着什么？
- Harness 包含哪些部分？
- Agent Runtime 与 Agent 本身是什么关系？
- Model 与 Harness 是否需要适配？
- 哪些抽象可以模型无关？哪些行为实际上高度依赖模型能力？

## Harness 拆解

```text
Agent
│
├── Model
│
└── Harness
    ├── prompt assembly
    ├── context
    ├── state
    ├── tools
    ├── execution loop
    ├── planning
    └── memory
```

进一步设计：

- ModelAdapter
- AgentRuntime
- ExecutionContext
- Run
- Step
- Event

## 模型适配实验

```text
               Harness
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
    Model A    Model B    Model C
```

比较 Tool protocol、Structured output、Prompt structure、Context strategy、Retry behavior 和 Planning behavior。

产物：`Agent Runtime v0.5`

---

# Day 6：可靠性、Checkpoint 与 Recovery

> 从这里开始直接进入 Production Agent / AI 基建问题。

## 今日核心问题

处理：

- LLM timeout
- API timeout
- Tool 失败
- Agent 死循环
- 重复调用同一个 Tool
- 程序进程突然死亡
- 服务器重启
- 长任务中间失败
- 重复收到同一个任务
- Tool 已产生副作用但 Agent 不知道
- 邮件已发送但程序误判失败
- 模型输出非法 JSON

## 核心机制

- Timeout
- Retry
- Exponential Backoff
- Fallback
- Circuit Breaker
- Budget
- Max Steps
- Idempotency
- Checkpoint
- Resume

重点理解：LLM 是非确定性的，而外部世界往往具有不可逆副作用。

## 动手实现

- Checkpoint Store
- Run State Machine
- Retry Policy
- Recovery
- Idempotency Key
- Loop Guard
- Budget Control

产物：`Reliable Agent Runtime v0.6`

---

# Day 7：Observability 与 Evaluation

## Part A：Observability

核心概念：

- Log
- Trace
- Metric
- Event

需要跟踪：Run ID、Step、输入输出、Tool Calls、Retry、Error、Latency、Tokens、Cost。

```text
Run
 ├── Step 1
 │    ├── input
 │    ├── output
 │    ├── latency
 │    └── token
 ├── Step 2
 │    ├── tool
 │    ├── retry
 │    └── result
 └── Step 3
```

## Part B：Agent Evaluation

正式回答：如果 Agent = Model + Harness，评估是否应该把 Model 与 Harness 分开？

```text
Agent Eval
│
├── Task
├── Model
├── Harness
├── Tool
├── System
└── End-to-End
```

进一步学习：Offline Eval、Regression Eval、Fault Injection、Online Metrics、Golden Cases，以及 Model / Prompt / Harness 版本对比。

重点实验：换模型、换 Prompt、修改 Harness、修改 Tool 后，到底是谁导致性能下降？

产物：

- `Agent Eval Harness v0.7`
- `Reliability Benchmark v1`

---

# Day 8：Multi-Agent

> 前 7 天先把单 Agent 学明白，再进入多 Agent。

## 今日核心问题

首先比较：

```text
Single Agent + Multi Tool
vs
Multi-Agent
```

学习结构：

- Supervisor → Workers
- Peer-to-Peer
- Pipeline
- Debate / Critic
- Hierarchical Agent
- Blackboard / Shared State

真正困难的问题包括：Agent 之间传什么？是否应该传整个 Context？State / Memory 是否共享？谁拥有 Tool？谁负责最终决策？冲突怎么办？如何减少重复上下文？如何并行和合并？子 Agent 失败如何恢复？

重点讨论：什么时候 Multi-Agent 是过度设计？

## 动手实现

```text
Supervisor
├── Research Worker
├── Analysis Worker
└── Writer Worker
```

同时与 `Single Agent + 3 Tools` 做对照实验。

产物：`Multi-Agent Runtime v0.8`

---

# Day 9：Production Agent Engineering

> 把传统软件工程完整接回 Agent。

## 今日核心内容

- HTTP / API
- Database
- Queue
- Worker
- Scheduler
- Concurrency
- Transaction
- Cache
- Secrets
- Authentication
- Authorization
- Rate Limit
- Docker
- CI/CD
- Linux
- Monitoring

典型结构：

```text
            API
             │
             ↓
         Task Queue
             │
       ┌─────┼─────┐
       ↓     ↓     ↓
     Worker Worker Worker
       │
       ↓
 Agent Runtime
       │
       ↓
     Database
```

进一步讨论：长任务、异步任务、Agent 并发、数据隔离、Secret 管理、Prompt / Model Version、灰度升级、回滚、Scheduler、Worker crash、Human-in-the-loop。

## 动手实现

把 Runtime 变成真实服务，并部署到 Linux / Docker 环境。

产物：`Production Agent Service v0.9`

---

# Day 10：完整 Agent System、框架对照与产品化

> 最后一天不继续堆新名词，而是整合和验证。

## Part A：构建自己的 Agent Mental Model

不看笔记重新回答：Agent、Harness、State、Observation、Memory、Planning、Runtime、Eval、Multi-Agent 和 Production Agent 分别是什么，以及它们之间如何连接。

整合前 9 天代码：

- Model
- Tool
- State
- Context
- Memory
- Planning
- Runtime
- Checkpoint
- Reliability
- Trace
- Eval
- Multi-Agent
- Deployment

产物：`Agent Runtime v1.0`

## Part B：反向阅读主流 Agent 框架

原则：先自己实现，再看框架如何解决同样的问题。

对照关注：State、Node / Step、Edge / Control Flow、Checkpoint、Runtime、Tool System、Model Adapter、Memory、Trace、Eval、Multi-Agent。

问题不再是“这个 API 怎么调用？”，而是“它为什么这样设计？解决了什么问题？付出了什么代价？”

## Part C：接入真实产品

将 Runtime 接入真实业务，例如：

- AI Game Daily
- Research Agent
- 海外 Web 产品的数据 / 内容流程
- 其他真实自动化工作流

形成：

```text
理论 → 自己实现 → Agent Runtime → Production → 真实产品
```

---

# 二、每天固定学习流程

每个阶段开始时先看“今日地图”。

## 1. 今日地图

包含：

- 今天要解决的问题
- 今天的知识结构
- 今天的代码目标
- 今天的实验目标
- 今天的必修线
- 可选深挖线

## 2. 原理学习

不断追问：

- 为什么需要这个概念？
- 如果没有它会发生什么？
- 它和相邻概念区别在哪里？
- 它改变了 Agent 系统的哪一层？

## 3. 自己实现

可以使用基础工程工具，例如 Python、FastAPI、Pydantic、SQLite / PostgreSQL、pytest、Docker，但核心 Agent 机制优先自己实现：Agent Loop、Tool Registry、State、Memory、Planning、Runtime、Checkpoint、Retry、Trace、Eval。

## 4. 故障 / 对照实验

不只验证“能跑”，还故意让它失败，例如 Tool timeout、Model timeout、非法 JSON、进程被 kill、重复提交任务、修改 Prompt、更换模型、Agent 死循环、Tool 副作用重复执行。

## 5. 知识检查

学习完成不是“看完”，而是能：

- 用自己的语言解释；
- 独立画出结构；
- 写出最小实现；
- 分析边界；
- 解释为什么这样设计。

## 6. 当日文档整理

每天学习结束后，生成独立 Markdown 文档，固定包含：

1. 当天课程主线
2. 核心概念讲解
3. 用户当天提问与岔题
4. 对应回答与关键结论
5. 概念辨析
6. 代码与实验
7. 工程 / FDE / 产品联系
8. 纠偏与补充
9. 当天形成的知识模型
10. 未解决问题
11. Day N → Day N+1 衔接

---

# 三、进度机制：允许提前进入下一阶段

Day 1–Day 10 代表阶段，而不是强制自然日。

## 必修线

完成后即可进入下一阶段。

例如 Day 1：

```text
理解核心概念
+
能够分析实际 Agent
+
自己实现 Agent Loop
```

完成后，当天即可进入 Day 2。

## 深挖线

不阻塞主线，例如：理论边界、经典论文、复杂异常、框架源码、更多实验、高级实现。

原则：主线快速推进，深挖问题记录下来，必要时当场回答，但不让岔题导致主线丢失。

---

# 四、课程阶段划分

```text
Part A：Agent 是什么
Day 1  Agent 基础模型与核心循环
Day 2  Tool / Function Calling / MCP
Day 3  Context / State / Memory

               ↓

Part B：Agent 怎么思考和运行
Day 4  Planning / Reasoning / Control
Day 5  Harness / Runtime / Model Adaptation

               ↓

Part C：Agent 怎么变得可靠
Day 6  Reliability / Checkpoint / Recovery
Day 7  Observability / Evaluation

               ↓

Part D：复杂 Agent System
Day 8  Multi-Agent
Day 9  Production Engineering

               ↓

Part E：融会贯通
Day 10 Production Agent System
       + 框架源码对照
       + 产品化
```

---

# 五、10 天结束后的下一阶段

完成 Day 10 后，不继续无限“学教程”，而是进入真实产品阶段：

```text
真实产品
   ↓
遇到问题
   ↓
回到 Agent 知识树
   ↓
针对性补深
   ↓
继续产品
```

后续可沿两条作品路线推进：

## 方向 A：AI 基建 / Agent Engineering

持续强化 Agent Runtime、Reliability、Observability、Eval、Deployment、Production Workload，形成可用于 AI 基建 / FDE 求职的真实工程证据。

## 方向 B：AI 产品 / 海外 Web 产品

重点证明需求发现、MVP、上线、用户、流量、转化、收入和持续迭代。

最终形成：能找需求、能做产品、能自己实现，也能把 Agent 稳定运行到生产环境的复合型能力。

---

# 六、课程文档目录建议

```text
agent-learning/
├── 00-10-day-agent-course.md
├── Day01-Agent基础与核心循环.md
├── Day02-Tools与FunctionCalling.md
├── Day03-Context-State-Memory.md
├── Day04-Planning与控制策略.md
├── Day05-Harness与Runtime.md
├── Day06-Reliability与Recovery.md
├── Day07-Observability与Evaluation.md
├── Day08-Multi-Agent.md
├── Day09-Production-Agent-Engineering.md
├── Day10-Production-Agent-System.md
├── Agent-Learning-Index.md
└── Agent-Systematic-Notes.md
```

其中：

- `00-10-day-agent-course.md`：课程总纲；
- `DayXX-*.md`：每天课程、提问、回答、代码与实验；
- `Agent-Learning-Index.md`：知识树 + 问题索引；
- `Agent-Systematic-Notes.md`：10 天结束后去重整理出的最终个人 Agent 知识手册。

---

**版本：v1.0**  
**创建日期：2026-08-19**
