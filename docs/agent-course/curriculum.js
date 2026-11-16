window.AGENT_COURSE = {
  "version": "1.0.0",
  "published": "2026-11-16",
  "source": "suesam/game-daily/agent-learning",
  "days": [
    {
      "day": 0,
      "title": "模型基础：理解 Harness 的成本边界",
      "subtitle": "选修 · Token、上下文和模型输出协议",
      "level": "基础补全",
      "outcome": "能解释模型为什么不是无限上下文数据库，并能评估工具 Schema 对成本的影响。",
      "topics": [
        [
          "Token 与模型看到的文本",
          "Tokenizer 将文字转换成 token 序列，字符数与 token 数并不相等。消息角色、系统提示词、工具定义和历史对话都会占用上下文预算。",
          "同一个工具介绍从 30 字扩充为 3000 字，会在每次模型请求时增加输入负担；是否可缓存取决于供应商规则。",
          "优化前先量测：避免只根据中文字符数估算费用。"
        ],
        [
          "Transformer 与 KV Cache",
          "自回归模型逐 token 预测后续输出；KV Cache 可以复用已处理前缀的注意力中间结果，降低重复计算。它存在于推理执行阶段，而不是跨会话的长期知识仓库。",
          "一个对话重启后，数据库可能保留事实，但模型 KV Cache 完全可能不存在；二者职责不同。",
          "KV Cache ≠ Memory Store，Prefix Cache 也不承诺事实持久性。"
        ],
        [
          "结构化输出与适配",
          "不同模型支持的工具协议、JSON 严格性、思考模式、输出 token 限制和错误格式并不相同。Harness 的 ModelAdapter 要屏蔽这些差异，但不应假装所有模型行为完全一致。",
          "模型 A 返回结构化 tool_call，模型 B 可能把看似 JSON 的文本写在回答中；解析与验证必须分开。",
          "只有解析成功且通过 Schema 与权限审查，才能进入执行层。"
        ]
      ],
      "quiz": [
        [
          "KV Cache 主要解决哪类问题？",
          [
            "跨进程保存用户习惯",
            "复用生成过程中的注意力计算",
            "维护工具权限列表",
            "保证回答事实正确"
          ],
          1,
          "它属于推理优化，而非持久记忆或安全机制。"
        ],
        [
          "工具 Schema 很长，最直接的影响是什么？",
          [
            "模型权限提高",
            "输入 token/上下文占用增加",
            "工具自动执行",
            "模型必然拒绝调用"
          ],
          1,
          "描述越长，通常增加输入 token；缓存能否改善须看供应商规则。"
        ],
        [
          "模型返回 JSON 文本就代表工具调用已经执行了吗？",
          [
            "是",
            "只有 JSON Schema 存在时是",
            "不是，仍需解析、校验和实际调度",
            "只有生产环境是"
          ],
          2,
          "文本只是模型输出；副作用由 Harness/Environment 实施。"
        ],
        [
          "Memory Store 和 Context Window 的关系是？",
          [
            "同一概念",
            "数据库的完整内容都自动进入窗口",
            "记忆系统可以有选择地向有限的上下文窗口提供材料",
            "上下文越长越不需要记忆"
          ],
          2,
          "存储与模型当次输入是两个系统，需要检索和选择。"
        ]
      ],
      "lab": {
        "goal": "解释一次 LLM 请求的真实构成和成本",
        "task": "画出 system + history + tool schemas + user 的消息组合，并估算为什么工具定义变长后输入成本上升。",
        "tests": [
          "区分 token/字符",
          "区分 KV Cache/Memory Store",
          "列出至少两种模型适配差异"
        ],
        "demo": "context"
      },
      "sources": [
        [
          "Karpathy: Zero to Hero",
          "https://github.com/karpathy/nn-zero-to-hero"
        ],
        [
          "Hugging Face Agents Course",
          "https://huggingface.co/learn/agents-course/en/unit1/introduction"
        ]
      ]
    },
    {
      "day": 1,
      "title": "Agent 本质与核心循环",
      "subtitle": "Agent、环境、状态、观察与行动",
      "level": "基础模型",
      "outcome": "不依赖框架实现最小 Agent Loop，能指出每个状态和动作的所有权。",
      "topics": [
        [
          "Agent 与 Workflow 的边界",
          "Agent 是使用策略（可以是模型）观察环境并选择行动的系统。Workflow 是事先确定的流程；两者不是截然对立，Agent 可以嵌在工作流中，工作流也可以是 Agent 的安全外壳。",
          "“读取一份固定日报并按格式发送”多半是 Workflow；“在未知信息源中自主决定搜索与检查步骤”更需要 Agent。",
          "辨别关键：谁决定下一步动作？规则、用户还是模型？"
        ],
        [
          "State、Observation 和 Action",
          "Environment State 是外部世界的真实状态；Observation 是本轮允许 Agent 看到的投影；Agent State 保存内部目标、记录等信息。Action 是行动提案，不能视为已经成功的世界变化。",
          "游戏角色在坐标 (0,0)，模型提交 move_right，墙壁使动作被拒绝，坐标仍保持 (0,0)。",
          "模型输出 ≠ 环境状态更新；观察不一定等于完整事实。"
        ],
        [
          "Agent Loop 与终止",
          "最小闭环是 observe → decide → validate → execute → observe。除了成功完成，必须明确失败、预算耗尽、取消和无法观察这些终止条件。没有终止条件就可能陷入无限工具循环。",
          "规则 Agent 遇到终点立即停止；若无可观察数据，应返回 observation_unavailable，不能宣称任务完成。",
          "正确的循环首先是可控、可测、可停止，而不是足够聪明。"
        ]
      ],
      "quiz": [
        [
          "LLM 输出 move_right 后，谁改变坐标？",
          [
            "LLM 自行改变",
            "Harness/Environment 验证并执行后提交状态",
            "Prompt 模板改变",
            "用户必须亲手编辑数据库"
          ],
          1,
          "模型提出 Action 意图，Environment 的有效规则决定实际 State。"
        ],
        [
          "Agent 和 Workflow 最好的区别标准是？",
          [
            "是否有 LLM",
            "是否用 Python",
            "下一步控制决策由何种策略决定",
            "是否具备对话框"
          ],
          2,
          "有 LLM 也可能只是固定 Workflow；不使用 LLM 的程序也可能是 Agent。"
        ],
        [
          "Observation 应如何理解？",
          [
            "完整环境真实状态",
            "可见且通常有限的环境信息",
            "模型的隐藏推理",
            "任务队列"
          ],
          1,
          "观察是受权限与感知边界限制的投影。"
        ],
        [
          "何时应停止 Agent Loop？",
          [
            "只有用户手动关闭",
            "达到目标、不可恢复错误、预算/取消等终止条件",
            "只要模型持续输出就继续",
            "只有 Tool Call 返回空字符串"
          ],
          1,
          "生产系统必须定义成功、失败、预算、超时等边界。"
        ]
      ],
      "lab": {
        "goal": "Minimal Agent v0.1",
        "task": "实现 observe→decide→act→update，并让 3×3 网格角色从 (0,0) 到 (2,0)，中央 (1,1) 为墙。至少提供正常/非法动作/观察失败三个自动测试。",
        "tests": [
          "目标达成后停止",
          "非法动作被拒绝且 State 不改变",
          "无法观察时明确失败"
        ],
        "demo": "grid"
      },
      "sources": [
        [
          "Hugging Face Agents Unit 1",
          "https://huggingface.co/learn/agents-course/en/unit1/introduction"
        ],
        [
          "Microsoft AI Agents for Beginners",
          "https://github.com/microsoft/ai-agents-for-beginners"
        ]
      ]
    },
    {
      "day": 2,
      "title": "Tool / Function Calling / MCP",
      "subtitle": "模型意图如何变成真实的可控操作",
      "level": "执行接口",
      "outcome": "实现 Tool Registry、参数校验、错误处理和最小 MCP 客户端。",
      "topics": [
        [
          "Tool Call 是提案，不是执行",
          "模型收到工具名称、描述和参数 Schema，可能生成结构化调用。Harness 解析并验证后，才调用本地函数或远端服务。工具执行结果再作为下一轮的 Observation 进入上下文。",
          "工具 read_file(path='/etc/shadow') 即使格式正确，也应该因为权限范围而被拒绝；Schema 验证不等于授权。",
          "Schema、Permission、Execution、Result 是四道不同边界。"
        ],
        [
          "Registry、Dispatcher 与结果归一化",
          "Registry 管理工具定义和 Scope；Dispatcher 匹配名称、验证入参、调用执行器并把成功或错误统一返回。对重试、超时、并行工具和取消都应有明确语义。",
          "read_file 参数缺 path 时返回 invalid_arguments，而不是把工具函数异常直接注入模型。",
          "错误也是结构化结果，不能偷偷变成“完成”。"
        ],
        [
          "MCP 与 Function Calling 的关系",
          "MCP 解决工具/资源/提示词在 Client 与 Server 之间的标准发现和调用，Function Calling 主要是模型输出调用意图的接口。MCP Server 并不自动获得信任，也不等于 Agent Runtime。",
          "DSH 使用 Tool Registry 执行 MCP Client 暴露的工具；工具仍受执行权限和不可信返回值约束。",
          "MCP 是能力接入协议，不是安全沙箱。"
        ]
      ],
      "quiz": [
        [
          "Function Calling 后真正执行函数的是？",
          [
            "模型推理芯片",
            "宿主 Dispatcher 或远端服务",
            "Tokenzier",
            "向量检索器"
          ],
          1,
          "模型生成调用请求，执行属于程序/系统。"
        ],
        [
          "参数通过 JSON Schema 校验，是否意味着调用被授权？",
          [
            "是",
            "不是，还需要 Scope 与权限策略",
            "只有 GET 请求是",
            "只有本地函数是"
          ],
          1,
          "类型校验、策略授权和实际副作用不同。"
        ],
        [
          "MCP 的主要职责是？",
          [
            "替代所有 LLM",
            "统一外部能力发现/交互协议",
            "自动审查所有代码",
            "进行模型训练"
          ],
          1,
          "它标准化能力接口，不替代 Agent Loop 与安全策略。"
        ],
        [
          "一个工具超时，Harness 的正确做法是？",
          [
            "假定成功",
            "让模型无限重试",
            "返回结构化超时或未知结果，按策略处理",
            "删掉调用记录"
          ],
          2,
          "超时不能直接等同于工具没有产生副作用。"
        ]
      ],
      "lab": {
        "goal": "Multi-tool Agent v0.2",
        "task": "实现 calculator、mock_search、只读 read_file 的 Registry + Dispatcher；在临时目录内接一个 MCP Server/Client。",
        "tests": [
          "未知工具显式报错",
          "缺参或类型错被拦截",
          "超时与越权路径被拒绝"
        ],
        "demo": "tools"
      },
      "sources": [
        [
          "Hugging Face MCP Course",
          "https://huggingface.co/learn/mcp-course/unit0/introduction"
        ],
        [
          "MCP Quickstart Resources",
          "https://github.com/modelcontextprotocol/quickstart-resources"
        ],
        [
          "DSH Tools Source",
          "https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/tools"
        ]
      ]
    },
    {
      "day": 3,
      "title": "Context、State 与 Memory",
      "subtitle": "模型看见什么，系统记住什么",
      "level": "状态与记忆",
      "outcome": "建立有来源与时间语义的短长期记忆，并能正确分配模型上下文预算。",
      "topics": [
        [
          "Context 不是 Memory",
          "Context 是某次模型请求输入的内容集合，State 是系统的持久/瞬时内部状态，History 是事件记录，Memory 是有写入、检索和遗忘策略的信息系统。数据库里有某条事实，并不代表模型当前看到它。",
          "一个月前用户说预算 100 元；今天改为 50 元。只拼接旧聊天可能导致冲突；Memory 应保存时间和覆盖规则。",
          "历史不是权威事实；检索必须有来源和版本。"
        ],
        [
          "短期状态与长期记忆",
          "线程内状态/Checkpoint 记录运行进度，跨会话长期 Memory 可以在新任务中检索。长期记忆不是所有对话都写入，应选择与未来决策有关、可解释且可更新的事实。",
          "可将 project、subject、claim、source、observed_at、valid_until 分开存储；用户撤销约束后旧声明应失效。",
          "保留事实出处才能纠错、追溯和删除。"
        ],
        [
          "上下文预算与压缩",
          "有限窗口中需要分配系统指令、任务、近期事件、相关记忆、工具定义和输出空间。压缩会丢失信息，因此关键状态不能只保存在自由文本摘要里。",
          "把“尚未发送邮件”摘要成“邮件任务已处理”会造成不可逆错误；应把任务状态作为结构化字段保存。",
          "摘要是模型上下文的投影，不是事务日志。"
        ]
      ],
      "quiz": [
        [
          "数据库中有一条用户偏好，模型当次必然看到吗？",
          [
            "必然",
            "只有被查询/注入上下文时才可能看到",
            "看模型参数量",
            "KV Cache 会自动读"
          ],
          1,
          "Memory Store 和 Context Composer 是独立部分。"
        ],
        [
          "Checkpoint 更接近什么？",
          [
            "跨用户共享百科",
            "运行状态恢复点",
            "工具权限白名单",
            "Token 压缩缓存"
          ],
          1,
          "Checkpoint 用于恢复运行，不自动成为长期语义记忆。"
        ],
        [
          "一条已过期的用户偏好应该如何处理？",
          [
            "永远保留且优先使用",
            "带时间和来源更新/失效，检索策略排除旧事实",
            "只增加模型温度",
            "删掉所有对话"
          ],
          1,
          "时间有效性与事实来源是记忆正确性的关键。"
        ],
        [
          "为什么不能只依赖摘要作为任务状态？",
          [
            "摘要比较慢",
            "可能遗漏关键事实或错误改写事务状态",
            "摘要不能压缩文字",
            "数据库太贵"
          ],
          1,
          "权威任务状态应结构化保存且可追溯。"
        ]
      ],
      "lab": {
        "goal": "Stateful Agent v0.3",
        "task": "SQLite facts + Session history + policy：write/retrieve/forget。为事实增加 source、project、时间范围；限制上下文预算。",
        "tests": [
          "项目 A 记忆不能泄漏到 B",
          "更新后旧事实不覆盖新事实",
          "摘要后未完成事项仍保持未完成"
        ],
        "demo": "memory"
      },
      "sources": [
        [
          "LangGraph Persistence",
          "https://docs.langchain.com/oss/python/langgraph/persistence"
        ],
        [
          "DSH Session Store",
          "https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/session"
        ]
      ]
    },
    {
      "day": 4,
      "title": "Planning、ReAct 与反思",
      "subtitle": "如何控制下一步而不是无限思考",
      "level": "决策策略",
      "outcome": "对照 Direct/ReAct/Plan-and-Execute，知道规划何时是收益、何时是负担。",
      "topics": [
        [
          "Direct 与 ReAct",
          "Direct Strategy 尽量立刻执行；ReAct 交替结合当前观察与工具调用。它们区别在控制流程，不在于模型是否“思考得深”。对简单确定性任务，复杂 Planner 往往只会增加调用和失败概率。",
          "查一个已知配置文件的字段直接 read_file 即可；模糊多步调查才可能需要先规划搜索路径。",
          "规划不是越多越好，而是成本与不确定性平衡。"
        ],
        [
          "Plan 与状态的分离",
          "Plan 是未来执行的意图，不是完成证据。Executor 执行每步后返回真实观察，再由 Replanner 判断是否需要更新计划。失败不应偷偷写成已完成。",
          "计划写“上传 GitHub”；工具返回 403 后必须标注 blocked/failed，不能继续假设下一步部署成功。",
          "计划状态（planned）与事实状态（committed）严格区分。"
        ],
        [
          "Critic、停止条件与修复",
          "Reflection/Critic 可用于检查可验证错误，但反复自评容易引入回路和自我肯定。有效设计需要显式的停止条件、预算、外部标准和失败升级策略。",
          "同一个代码报错连续修复三次仍失败，应返回根因摘要并更换诊断策略，而不是无限自我重试。",
          "没有客观反馈时，模型自评不等于质量提升。"
        ]
      ],
      "quiz": [
        [
          "短且确定的任务为何未必需要 Planner？",
          [
            "模型无法规划",
            "可能额外耗时和引入故障，收益小",
            "Planner 不能调用工具",
            "规划会删除状态"
          ],
          1,
          "应根据任务复杂度和反馈不确定性选择策略。"
        ],
        [
          "Plan 里标记上传成功是否表示文件真的已上传？",
          [
            "是",
            "不是，需要工具成功和状态记录",
            "只有使用 LLM 时是",
            "只要说了“Done”就是"
          ],
          1,
          "计划是意图，工具返回和远端状态是证据。"
        ],
        [
          "Replanning 的正确触发依据是？",
          [
            "每秒定时",
            "实际环境反馈与计划预期的差异",
            "模型越自信越好",
            "只有用户要求"
          ],
          1,
          "应根据已观察的失败/变化采取控制。"
        ],
        [
          "无限 Reflection 最常见的工程缺口是？",
          [
            "缺少漂亮 UI",
            "没有预算、外部标准和停止条件",
            "没有向量数据库",
            "工具太少"
          ],
          1,
          "Critic 必须可验证且受控。"
        ]
      ],
      "lab": {
        "goal": "Planning Agent v0.4",
        "task": "同 10 个模拟资料任务运行 Direct、ReAct、Planner-Executor，记录完成率、步骤、Token、延迟；遇到失败必须重规划/终止。",
        "tests": [
          "无搜索结果时重规划",
          "循环 Critic 被预算阻断",
          "计划完成不等于工具完成"
        ],
        "demo": "planning"
      },
      "sources": [
        [
          "DeepLearning.AI Agentic AI",
          "https://www.deeplearning.ai/courses/agentic-ai"
        ],
        [
          "ReAct Paper",
          "https://arxiv.org/abs/2210.03629"
        ]
      ]
    },
    {
      "day": 5,
      "title": "Harness 与 Runtime 实现",
      "subtitle": "ModelAdapter、Tool、Loop、插件架构",
      "level": "系统核心",
      "outcome": "把 v0.4 拆成可替换模块，并实现一个可注册和卸载工具的 Cordis 插件。",
      "topics": [
        [
          "Agent Loop 与 Runtime",
          "Runtime 组织 ModelAdapter、Prompt Composer、Tool Registry、Agent Loop、Session Store、Permission 和 Telemetry。Loop 决定每次请求、工具调用和下一步；它不应该把第三方模型 SDK、文件系统和用户界面硬编码在一起。",
          "DSH 使用 Core Agent Loop+Event-sourced Session；修改工具的实现一般应注册 Provider，而不是直接改 Agent Loop。",
          "Run、Turn、Step 的定义必须固定：一个 Turn 可能包含多次模型 Step。"
        ],
        [
          "ModelAdapter 的真实适配",
          "统一 API 只解决表面差异。模型工具调用 ID、streaming chunk、JSON 格式、错误、上下文长度、推理模式各异。适配层应该把多种模型输出转成同构事件，再由统一执行层处理。",
          "某模型的 tool_call ID 可用于重放关联；另一个 Provider 不提供 ID 时需要安全生成和去重规则。",
          "统一结果模型，保留原始事件以便调试。"
        ],
        [
          "插件生命周期与权限",
          "Cordis 通过 Service/Inject/Event/Effect 协调插件依赖与卸载清理。插件可能以 Tool、Provider、Hook、UI 为入口。能够热插拔不等于运行在安全沙箱里：Host 扩展需要视为可信代码。",
          "Tool Plugin 卸载时既要注销工具，也要释放 timer、socket 和 watcher，避免 HMR 旧实例继续运行。",
          "扩展能力应优先使用公开 Service/Hook，而不是侵入核心。"
        ]
      ],
      "quiz": [
        [
          "Run、Turn、Step 最合理的关系是？",
          [
            "一个 Turn 永远只有一个 Step",
            "一个 Run 可含 Turn，一个 Turn 可含多个 Step",
            "全部是相同名称",
            "Step 必须是一天"
          ],
          1,
          "DSH 等系统将用户交互轮次与内部模型/工具步骤区分。"
        ],
        [
          "ModelAdapter 的核心职责是什么？",
          [
            "改变用户需求",
            "规范不同模型协议和事件，而不接管工具权限",
            "永久存储 Memory",
            "负责 Git 部署"
          ],
          1,
          "Adapter 解决模型协议问题，Permission/ToolExecutor 独立负责执行。"
        ],
        [
          "Cordis 的 Effect 有什么用？",
          [
            "训练模型",
            "在插件卸载时清理注册、连接、定时器等资源",
            "把 JSX 编译为 CSS",
            "自动给模型增加长期记忆"
          ],
          1,
          "可逆生命周期是安全动态扩展的基础。"
        ],
        [
          "Host 插件可以被热卸载，是否自动意味着它没有本地文件权限？",
          [
            "是",
            "不是，生命周期与沙箱隔离属于不同机制",
            "只有公开仓库才有权限",
            "由模型温度决定"
          ],
          1,
          "DSH Host 插件可运行在 workspace sandbox 之外。"
        ]
      ],
      "lab": {
        "goal": "Agent Runtime v0.5",
        "task": "定义 ModelAdapter、ExecutionContext、Run/Turn/Step/Event 类型；提供两个 mock Adapter；使用 Cordis 教程注册一个 greet Tool 并验证卸载。",
        "tests": [
          "Adapter A/B 转同构事件",
          "插件卸载后工具消失",
          "外部资源在 HMR 期间释放"
        ],
        "demo": "runtime"
      },
      "sources": [
        [
          "DSH Cordis 中文教程",
          "https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.zh.md"
        ],
        [
          "DSH Architecture",
          "https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md"
        ],
        [
          "DSH Agent Loop",
          "https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/agent-loop"
        ]
      ]
    },
    {
      "day": 6,
      "title": "可靠性、Checkpoint 与恢复",
      "subtitle": "幂等、重试、故障恢复、外部副作用",
      "level": "生产可靠性",
      "outcome": "能够对崩溃、超时、重复提交和未知副作用结果做安全决策。",
      "topics": [
        [
          "重试与幂等不是一回事",
          "调用超时后不能认定外部操作没有发生。重复发送邮件、重复转账、重复部署都是典型问题。重试策略必须区分临时失败、不可恢复参数错误与结果未知。",
          "邮件 API 已接受请求，但返回包丢失；Harness 再次发送就会造成重复邮件。",
          "外部副作用要有幂等 Key 和确认协议，未知结果要查证。"
        ],
        [
          "Checkpoint 与 Event Log",
          "Checkpoint 保存可恢复的执行状态，Event Log 记录发生过的事实和转移。恢复时需要核对最后已提交的 Tool Result 与外部 Effect，不可只根据最近一句模型输出继续执行。",
          "状态机器记录 tool_call_requested、effect_committed、result_observed；即使 crash 也能判断是否应该重试。",
          "事件日志和快照互补，不能替代外部真实状态查询。"
        ],
        [
          "预算、超时与安全停止",
          "Max Steps、Token Budget、Timeout、Cancel、Circuit Breaker、Backoff 是 Runtime 可靠性的常规控制。失败后应提供恢复点和不可恢复原因，不要静默无限循环。",
          "模型两次返回相同非法 JSON，应停止/换修复策略，而非将所有异常都走指数退避。",
          "一套好的 Agent 不只会成功，还会正确失败。"
        ]
      ],
      "quiz": [
        [
          "工具超时最危险的错误假设是？",
          [
            "认为可能有网络问题",
            "断定工具没执行因此无条件重试",
            "保留请求 ID",
            "记录未知结果"
          ],
          1,
          "超时后外部副作用可能已经生效。"
        ],
        [
          "Checkpoint 与 Event Log 的最佳关系是？",
          [
            "完全相同",
            "快照加事实事件用于恢复和重放",
            "二者都是模型 Prompt",
            "都由用户输入代替"
          ],
          1,
          "二者互补。"
        ],
        [
          "遇到永久性参数错误应该怎么做？",
          [
            "无限退避重试",
            "返回明确错误/修改入参或停止",
            "偷偷忽略",
            "多 Agent 自动解决"
          ],
          1,
          "永久性错误不适合盲目重试。"
        ],
        [
          "已经确认副作用成功，重放时应该？",
          [
            "再执行一次",
            "根据幂等键与 Effect Log 复用确认结果",
            "清空所有记录",
            "换模型就可重复"
          ],
          1,
          "避免重复副作用是可靠 Harness 核心。"
        ]
      ],
      "lab": {
        "goal": "Reliable Agent v0.6",
        "task": "用 mock send_message 模拟副作用确认丢失、Worker Crash、幂等键重复请求和预算耗尽，构造恢复状态机。",
        "tests": [
          "副作用成功但 ACK 丢失",
          "Crash/Resume 不重复执行",
          "永久失败不走无限 Retry"
        ],
        "demo": "recovery"
      },
      "sources": [
        [
          "LangGraph Persistence",
          "https://docs.langchain.com/oss/python/langgraph/persistence"
        ],
        [
          "DSH Session Source",
          "https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/session"
        ]
      ]
    },
    {
      "day": 7,
      "title": "Observability 与 Evaluation",
      "subtitle": "Trace、日志、Golden Cases 与归因",
      "level": "评价与诊断",
      "outcome": "设计可复现的测试集，知道是模型、工具、Prompt 还是 Harness 引发性能变化。",
      "topics": [
        [
          "Trace、Log、Metric 的差别",
          "Log 是事件记录，Trace 关联一条任务内的 Run/Step/Tool 因果关系，Metric 是在大量执行中聚合的量化指标。Eval 将行为与预先定义的标准比较，不能等于所有输出都交给一个 LLM Judge。",
          "一次 Agent 完成任务花费 9 步，Trace 能定位第 6 步 Tool 超时；Metric 才能显示最近 100 次超时率。",
          "要能追溯错误位置、版本和根因，而不只是得到“7/10 分”。"
        ],
        [
          "Golden Cases、故障注入与对照",
          "Golden Set 需要输入、正确性判据、期望工具行为和允许差异。比较模型/Prompt/Harness/Tool 时每次只改变一个主要变量，记录模型版本、seed、工具 fixture 与预算。",
          "模型输出更流畅但工具调用错误更多，任务成功率下降，不能只看语言 Judge 的印象分。",
          "评估任务结果、轨迹正确性与成本，不建议先压成单分。"
        ],
        [
          "Judge 校准与在线观察",
          "LLM-as-Judge 对开放结果有用，但存在偏见、误报和模型自评偏差。能用代码验证的状态/权限/事实，优先确定性断言；不能形式化的质量则使用人工偏好与证据化 Judge。",
          "“机器人已走到终点”应直接检查环境 state，而不是请语言模型猜是不是到达终点。",
          "评价系统本身也要有校准集和回归测试。"
        ]
      ],
      "quiz": [
        [
          "能定位第 7 步为何错误的是？",
          [
            "总体平均分",
            "关联事件与 Span 的 Trace",
            "营销文案",
            "模型参数表"
          ],
          1,
          "Trace 保留执行因果；聚合 Metric 用于趋势。"
        ],
        [
          "比较两个 Harness 版本的实验最需要？",
          [
            "更长 Prompt",
            "相同任务/模型/预算/基线并记录差异",
            "只测一个例子",
            "让 Judge 评价自己"
          ],
          1,
          "控制变量才能归因。"
        ],
        [
          "结构化环境状态是否达成目标最好怎么评？",
          [
            "只用 LLM Judge",
            "确定性状态断言",
            "看模型说“成功”",
            "按输出长度"
          ],
          1,
          "可形式化的事实优先代码检查。"
        ],
        [
          "Trace 中含 API Token 时应该？",
          [
            "保留以便排障",
            "脱敏、限制权限、避免上传公共平台",
            "直接作为案例公开",
            "交给模型自己决定"
          ],
          1,
          "Observability 也存在敏感数据边界。"
        ]
      ],
      "lab": {
        "goal": "Eval Harness v0.7",
        "task": "构建至少 20 条 Golden Cases 和 Run/Step/Tool Trace；比较成功率、错误位置、步骤、Token、延迟；加五种故障注入。",
        "tests": [
          "工具 Schema 修改回归",
          "成功率与 token 分别统计",
          "Trace 隐私信息脱敏"
        ],
        "demo": "eval"
      },
      "sources": [
        [
          "Arize Phoenix",
          "https://github.com/Arize-ai/phoenix"
        ],
        [
          "DeepEval",
          "https://github.com/confident-ai/deepeval"
        ],
        [
          "OpenAI Agent Tracing",
          "https://openai.github.io/openai-agents-python/tracing/"
        ]
      ]
    },
    {
      "day": 8,
      "title": "Multi-Agent 与 Supervisor",
      "subtitle": "任务 DAG、角色委派、信息边界与成本",
      "level": "复杂协作",
      "outcome": "判断何时多 Agent 才值得，并能实现一个具备任务依赖和失败处理的 Supervisor。",
      "topics": [
        [
          "单 Agent 多工具 vs 多 Agent",
          "多 Agent 不是固定更好。若任务互相独立、需要专门能力或不同权限，拆分有价值；若共享上下文和依赖密集，协调开销可能超过收益。",
          "搜集两类独立资料可以并行；多名 Agent 同时改一个配置文件会引入冲突和合并成本。",
          "先建立 single-agent baseline，再证明 multi-agent 收益。"
        ],
        [
          "Agent-as-Tool 与 Handoff",
          "Agent-as-Tool 返回结果给父 Agent，父级保有最终控制权；Handoff 通常把接续处理权转交其它 Agent。消息内容、共享 State 和可见性要明确，不应该默认复制整个父 Context。",
          "Research Worker 只返回来源与结论，Writer 只接收审核过的资料卡片，避免泄露无关记忆。",
          "委派边界最重要的是输入契约、输出证据和最终责任归属。"
        ],
        [
          "调度、任务所有权与失败",
          "Supervisor 负责 DAG、角色职责、任务状态、取消和汇总。任务写范围声明未必提供真实文件锁；并行编辑时应独立 Worktree 或给资源加排他策略。",
          "Worker A 失败后依赖 A 的任务不得自动标记完成；Supervisor 应等待/重试/改派并说明状态。",
          "复杂编排需要可恢复状态机，不是简单多发几条 Prompt。"
        ]
      ],
      "quiz": [
        [
          "什么时候多 Agent 比单 Agent 多工具更有价值？",
          [
            "任何任务",
            "可并行且职责/权限明确的独立任务",
            "工具越少越好",
            "只有聊天机器人"
          ],
          1,
          "并行收益和隔离价值应覆盖协调成本。"
        ],
        [
          "Agent-as-Tool 的最终答案控制通常在谁手中？",
          [
            "子 Agent",
            "父 Agent",
            "第三方网页",
            "数据库"
          ],
          1,
          "子 Agent 产出是父级可验证的输入。"
        ],
        [
          "两个 Worker 同时写同一文件最可靠的隔离手段？",
          [
            "只写 Prompt 不要冲突",
            "Worktree/锁或独立资源加合并策略",
            "加一个 Judge",
            "增加温度"
          ],
          1,
          "声明 writeScopes 不必然构成系统锁。"
        ],
        [
          "Worker 失败时最不应该？",
          [
            "记录失败原因",
            "把所有依赖任务标记完成",
            "返回可恢复状态",
            "停止依赖节点"
          ],
          1,
          "DAG 必须遵守依赖完成条件。"
        ]
      ],
      "lab": {
        "goal": "Multi-Agent Runtime v0.8",
        "task": "建立 Supervisor→Research/Analysis/Writer 的 DAG，设计结构化消息、取消和任务失败；与单 Agent 三 Tool 比较成本和完成率。",
        "tests": [
          "Worker 失败不污染下游",
          "并发写入资源隔离",
          "无关上下文不泄露"
        ],
        "demo": "team"
      },
      "sources": [
        [
          "Microsoft Agents Course",
          "https://github.com/microsoft/ai-agents-for-beginners"
        ],
        [
          "OpenAI SDK Agent Patterns",
          "https://github.com/openai/openai-agents-python/tree/main/examples/agent_patterns"
        ],
        [
          "DSH Team Source",
          "https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/team"
        ]
      ]
    },
    {
      "day": 9,
      "title": "Production Agent Engineering",
      "subtitle": "API、队列、Worker、安全、部署",
      "level": "生产工程",
      "outcome": "把学习用 Runtime 变成可查询、可取消、可恢复且用户隔离的 Agent 服务。",
      "topics": [
        [
          "请求服务与 Agent 执行分离",
          "API 接收请求和授权、持久化任务状态并放入 Queue；Worker 按租约执行 Agent Runtime。HTTP 请求不应长时间占用直到所有模型步骤结束。",
          "POST /runs 返回 run_id，GET /runs/:id 获取状态，POST /runs/:id/cancel 发出取消信号；Worker 可故障恢复。",
          "API、Queue、Worker、Runtime 是不同生命周期和故障域。"
        ],
        [
          "认证、授权与安全沙箱",
          "身份认证确认用户是谁，授权决定该用户能读/写什么。模型工具输入是潜在不可信内容，文件操作、网络、Shell 和插件安装需要最小权限。Workspace Sandbox 不等于宿主扩展插件隔离。",
          "远程用户 A 的请求不能读取 B 的会话；工具从网页读取的“请删除配置”必须当内容不是命令。",
          "Prompt Injection 防护、权限和隔离是不同层次。"
        ],
        [
          "可运维的成本与发布",
          "生产需要速率限制、预算、重试、告警、健康检查、指标、版本回滚和密钥保护。Docker 化让环境可复现，但并不保证模型结果确定。",
          "Deploy v1.0 后如果某 Provider 请求错误激增，监控能定位并回退；日志不能打印私钥。",
          "可持续运行和安全地失败才是生产阶段 Done。"
        ]
      ],
      "quiz": [
        [
          "生产中 Queue 与 Agent Loop 的关系是？",
          [
            "完全同一个东西",
            "Queue 管任务调度，Loop 管单任务内部决策",
            "Queue 替代全部工具",
            "Loop 负责 API 登录"
          ],
          1,
          "分离工作流控制和单任务执行。"
        ],
        [
          "用户 A 的 Token 能否用于访问用户 B 的会话？",
          [
            "可以只要知道 id",
            "必须由服务端授权策略拒绝",
            "由 LLM 判断",
            "只有私人环境可以"
          ],
          1,
          "认证不等于授权，服务端必须校验资源归属。"
        ],
        [
          "Prompt Injection 最合理的应对？",
          [
            "只在 Prompt 写“不要被骗”",
            "对不可信内容隔离、工具最小权限及执行审批",
            "提高温度",
            "让模型永远不看网页"
          ],
          1,
          "安全是分层策略，不靠一句提示词。"
        ],
        [
          "Worker 崩溃后恢复最需要哪些数据？",
          [
            "上一个漂亮回答",
            "已持久化任务状态、租约、Checkpoint 和 Effect Log",
            "模型名称就够",
            "浏览器历史"
          ],
          1,
          "需要明确任务是否执行、外部副作用是否提交。"
        ]
      ],
      "lab": {
        "goal": "Production Agent Service v0.9",
        "task": "用 FastAPI + SQLite/Queue + Worker + Docker 提供 POST/GET/cancel Runs；实现租约、幂等、授权和崩溃恢复。",
        "tests": [
          "重复任务只处理一次",
          "跨用户资源隔离",
          "Worker Crash 后恢复"
        ],
        "demo": "production"
      },
      "sources": [
        [
          "Microsoft Agent Production",
          "https://github.com/microsoft/ai-agents-for-beginners"
        ],
        [
          "DSH Sandbox",
          "https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/sandbox"
        ]
      ]
    },
    {
      "day": 10,
      "title": "Agent System 集成与源码对照",
      "subtitle": "将知识转化为可复验的真实系统",
      "level": "综合验收",
      "outcome": "交付 Agent Runtime v1.0、可重复的端到端任务与可靠评估报告。",
      "topics": [
        [
          "构建完整 Mental Model",
          "Agent = 决策策略 + 可控执行环境；LLM 只是一种策略实现。Runtime 将模型、工具、上下文、状态、记忆、计划、可靠性、评估与生产入口组合起来。清楚哪些能力是独立服务，哪些需要共享生命周期。",
          "自己画出从 API 到 Queue/Worker，再到 Agent Loop/Tool/Session/Eval 的数据与权限流。",
          "不要把“框架 API 会调用”错当系统原理理解。"
        ],
        [
          "反向阅读成熟 Harness",
          "先有自研最小实现，才知道 DSH Cordis 插件、OpenAI Agents SDK 的 Tool/Handoff/Guardrail/Tracing 或 OpenHands 的 Runtime 机制解决了什么问题。比较扩展边界、状态恢复、成本与复杂度。",
          "同一任务分别通过自研 Runtime 与成熟 SDK 完成，记录功能差距，不必为“完全自研”拒绝成熟可靠组件。",
          "把取舍写成工程决策记录，不追求框架数量。"
        ],
        [
          "真实项目与迭代闭环",
          "选一个可评价的实际工作流，例如 AI Game Daily 的信息源检索/审核，加入明确输入、约束、输出、Trace 和 Eval；使用版本化 Dataset 做回归，记录用户反馈和下一轮改进。",
          "每次 Run 生成包含 run_id、model、tool events、cost、case eval 的工件；出现失败可定位并重复验证。",
          "最终产物是可部署、可理解、可验证的系统，而非 10 份学习笔记。"
        ]
      ],
      "quiz": [
        [
          "一个生产 Agent 的可靠架构主要靠什么？",
          [
            "只换最强模型",
            "明确 Run/State/Tool/Permission/Checkpoint/Eval 的职责",
            "尽量堆多个 Agent",
            "只提高 Prompt 长度"
          ],
          1,
          "可靠性来自系统边界与可验证的执行。"
        ],
        [
          "学习完自己的 Runtime 后看 DSH 源码目的是什么？",
          [
            "复制每个文件",
            "解释成熟设计如何处理相同问题并比较取舍",
            "把所有代码换成 Cordis",
            "彻底忘记自己的设计"
          ],
          1,
          "逆向工程是比较抽象与权衡。"
        ],
        [
          "哪类交付最能证明 Day 10 完成？",
          [
            "漂亮架构图",
            "端到端运行、真实 Trace、评估与可重现命令",
            "下载很多插件",
            "阅读 100 个论文"
          ],
          1,
          "真实证据重于抽象数量。"
        ],
        [
          "修改 ModelAdapter 后应该怎样确认没有回归？",
          [
            "模型说更好就算好",
            "对固定 Golden Cases 重跑并比较任务/轨迹/成本",
            "只看 UI",
            "删除旧结果"
          ],
          1,
          "回归集必须覆盖系统行为并保留对照。"
        ]
      ],
      "lab": {
        "goal": "Agent Runtime v1.0 Capstone",
        "task": "挑选 Research Agent 或 AI Game Daily 的一条真实任务，完整连接任务、工具、Trace、Eval、存储与错误恢复；写一份 DSH/OpenAI SDK 取舍报告。",
        "tests": [
          "全新环境能复现端到端",
          "变更模型后可跑回归",
          "失败能定位到 Run/Step/Tool"
        ],
        "demo": "capstone"
      },
      "sources": [
        [
          "DSH Architecture",
          "https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md"
        ],
        [
          "OpenAI Agents SDK",
          "https://developers.openai.com/api/docs/guides/agents/sdk"
        ],
        [
          "DeepEval",
          "https://github.com/confident-ai/deepeval"
        ]
      ]
    }
  ]
};
