window.AGENT_DEEP = Object.assign(window.AGENT_DEEP || {}, {
  "4": [
    {
      "goal": "选择合适的决策策略，并通过同任务对照衡量规划成本。",
      "sections": [
        [
          "Direct 策略不是低级版本",
          "Direct 方法表示当前观察足以确定下一动作，立即执行，不先生成复杂计划。例如工具已知为 read_file、路径已知，调用工具比请模型规划五步更便宜。只有任务需要多次反馈或包含未知依赖时，ReAct/Planner 才可能带来额外价值。复杂度应该由任务的不确定性决定，而非追求更多 Agent 名称。"
        ],
        [
          "ReAct 的核心是交替反馈",
          "ReAct 把行动、工具观察与后续决策组成闭环。模型先决定搜索哪个关键词，搜索返回空结果后，再据此修改关键词。其关键不是对模型隐藏思考的展示，而是外部反馈的使用：没有真正执行工具和观察结果，就只是预测式文字叙事。"
        ],
        [
          "三种策略的代价对照",
          "Direct 通常步骤少但面对未知环境容易失效；ReAct 可在反馈中修正，代价是每步多一次模型调用；Plan-and-Execute 先设里程碑，适合多阶段工作，但需要维护计划状态与重规划。部署前应在同样输入、工具环境和模型版本下比较成功率、动作数、费用与失败恢复，而不是仅看 Demo。"
        ],
        [
          "何时可以引入混合策略",
          "一个科研文献调查可以由外层 Workflow 指定“检索→证据→声明→报告”的验收顺序；具体在检索阶段由 ReAct 自主调整关键词；报告阶段由固定校验规则保证每条结论有来源。这样的设计兼有过程灵活性与可验证边界，比完全无约束的自由规划更容易测评。"
        ]
      ],
      "walk": [
        "把任务分成已知动作与未知动作：已知用 Direct，未知需要反馈。",
        "用同一组工具 Fixture 运行三种策略，保存决策和观察。",
        "模型提出下一动作；只有成功/失败反馈回来后才能继续。",
        "比较成功率、Steps、模型请求数与总体 Token。",
        "判断 Planner 额外花费是否带来了足够完成率提升。"
      ],
      "code": "strategies = {\n 'direct': ['read_config'],\n 'react': ['search','observe','read_config'],\n 'plan_execute': ['make_plan','search','observe','read_config'],\n}\ncost={k:len(v) for k,v in strategies.items()}\nfor k in strategies:\n    print(k,'estimated operations=',cost[k])\n# 这仅是动作数示例；质量要使用同任务执行结果测量",
      "kind": "可运行的策略成本示意。真实 Model Token 与任务成功率不能由动作数直接代替。",
      "traps": "不要把固定多步 Prompt 叫做 ReAct；有真实的工具反馈和可变下一步，才存在行动—观察闭环。",
      "exercise": "你要读取一个已知路径的 JSON 文件并输出字段列表，是否需要 Plan-and-Execute？",
      "answer": "大多不需要。直接读文件和解析即可，额外规划只会增加步骤；若文件不存在或格式未知，可在失败后转为反馈驱动策略。"
    },
    {
      "goal": "设计可追踪的 Plan 状态机，把意图、承诺和成功证据分开。",
      "sections": [
        [
          "Plan 是未来假设",
          "Planner 提出步骤列表和预期依赖，不能把 step.status=planned 自动等同于 completed。执行结果必须与外部工具/测试的证据绑定。尤其是创建 PR、发送邮件或部署服务等任务，模型输出的“已完成”不是可信的状态变更。"
        ],
        [
          "把计划拆成可验收动作",
          "模糊的“完善网站”很难测试。可以拆为：更新特定文件、运行静态检查、截图核查、触发部署并检查目标 URL。每一步有 input、precondition、action、postcondition、failure_policy。Plan 是管理单元，Agent 的 ToolCall 才是实际动作入口。"
        ],
        [
          "重规划不应覆盖已发生事实",
          "搜索工具返回 403 后，Replanner 可以选择替代来源或申请权限，但不应该重写历史记录为“已检索成功”。Plan Version 需要能追溯，已提交的副作用事件不能被新的自然语言摘要删除。"
        ],
        [
          "依赖结构和动态调整",
          "在 DAG 中，分析依赖数据搜集、发布依赖分析验收。当前置任务失败，后置任务应该 blocked 或 pending。为了避免模型随意打破依赖，可让 Supervisor 负责合法状态迁移，Planner 只能提出变更建议，由 Runtime 验证后应用。"
        ]
      ],
      "walk": [
        "创建初版 Plan：搜集 → 提取证据 → 写报告 → 发布。",
        "执行搜集，记录工具结果和证据，只有通过校验才标 completed。",
        "如果搜集失败，重新规划替代路径并生成新版本。",
        "任何未获证据的步骤保持 pending/failed/blocked。",
        "直到所有关键 Postcondition 成立，才允许 Run 标记成功。"
      ],
      "code": "plan={'search':'pending','extract':'pending','publish':'pending'}\nresult={'search':'permission_denied'}\nplan['search']='failed'\nplan['extract']='blocked'\nplan['publish']='blocked'\nassert plan['publish']!='completed'\n# Replanner 可以新增 search_alternative，不能篡改失败日志\nplan['search_alternative']='pending'\nprint(plan)",
      "kind": "可运行的简单 Plan 状态模型，生产中应使用受控枚举和带版本的原子提交。",
      "traps": "计划是“我们想做什么”，不是“工具证明做到了什么”；模型自评不能提交 PR 状态。",
      "exercise": "计划里写“检查 GitHub Actions 通过”，但 Actions 仍在 running。应该把这一节点标记成 completed 吗？",
      "answer": "不能。它只能是 ongoing/pending；通过条件是目标 Actions Run 的结论为 success，并且目标提交/分支匹配。"
    },
    {
      "goal": "用客观验证与预算约束设计 Reflection，而不是让 Agent 无限自我肯定。",
      "sections": [
        [
          "Critic 的价值取决于反馈信号",
          "Reflection 可以从失败的代码测试和工具异常中归纳修复建议；如果只有模型读自己的回答再说“很好”，可能放大错误和幻觉。最有效的 Critic 是把具体 Test Failure、Diff、Constraint Violation 或用户反馈作为输入，而不只是让模型凭感觉评分。"
        ],
        [
          "内部批评与外部验证的区别",
          "Critic 可以建议修改算法，但验证代码是否正确应交给 pytest、编译器、环境状态或 Golden Case。开放式文章质量可用人评或校准过的 LLM Judge 辅助，但需要给出依据，不能只输出分数。"
        ],
        [
          "设置反思轮数和升级路径",
          "连续三次修复都产生同一错误，应记录失败簇，切换诊断策略、要求人工检查或停止。需要有 max_retries、max_steps、cost_budget 和 abort signal。把“继续尝试”定义为无条件循环，往往会烧掉模型额度还无法解释进度。"
        ],
        [
          "Reflection 不应覆盖权威任务状态",
          "模型可能回顾说“我们完成了前五项”，但 Run State 里第三项仍失败。Updater 只能把经验证的新发现提炼为任务建议，不能修改已经提交的工具历史和外部资源状态。这样的分离才是可恢复 Harness 的基础。"
        ]
      ],
      "walk": [
        "Executor 收到测试失败：assert 预期 3，实际 5。",
        "Critic 阅读失败位置、最近 Diff 和输入约束，提出一个最小修复。",
        "Executor 应用修复并运行相同测试，不让 Critic 直接宣称成功。",
        "若同类错误重复或预算耗尽，生成 root cause summary 并停止。",
        "只有外部验证通过，才更新对应任务状态为 completed。"
      ],
      "code": "def repair_loop(fix, test, max_attempts=3):\n    attempts=[]\n    for _ in range(max_attempts):\n        result=test()\n        if result['passed']:\n            return {'status':'success','history':attempts}\n        attempts.append(result['error'])\n        fix(result['error'])\n    return {'status':'blocked','history':attempts}\n# 这里 fix/test 是注入的回调，禁止无限自评。",
      "kind": "Python 控制结构示例，需要为 fix/test 注入 Mock 函数后运行。",
      "traps": "模型觉得方案更好 ≠ 真实任务更好；没有外部测试时不要把“自我反思”当作可靠评估。",
      "exercise": "一个 LLM Judge 给代码修复打 9/10，pytest 仍然失败。任务的最终状态是什么？",
      "answer": "失败或未通过验收；Judge 分数只是一项观察，确定性测试给出了具体且优先的证据。"
    }
  ],
  "5": [
    {
      "goal": "画出 Agent Runtime 的主要子系统，知道在哪一层扩展功能而不必改核心。",
      "sections": [
        [
          "Agent Loop 只是 Harness 的一部分",
          "Harness 将 ModelAdapter、Prompt/Context Composer、Tool Registry、Executor、Session Store、Permission/Sandbox、Tracing 与 Agent Loop 组合。Agent Loop 管每一步是否请求模型、执行工具、等待结果、继续或终止；它不应该自己直接实现每个第三方工具。这样可以分别替换模型、记忆库或工具而不破坏运行时。"
        ],
        [
          "Run、Turn、Step 的层级",
          "Run 表示一次任务的整体执行实例，一个 Run 可含多个用户 Turn；Turn 可以由多次 Step 组成。Step 可能涵盖一次模型请求与随后工具交互，不同 Harness 事件粒度会略有差异。设计 Trace 时应保留各层 ID，并标注每个事件的父节点，才能解释成本和故障发生的位置。"
        ],
        [
          "Session Log 为什么是恢复核心",
          "DSH 的 Session 采用仅追加事件记录。工具请求、结果与模型输出成为可回放的事实；当前上下文只是这些事件加上当前配置生成的投影。这样 UI 可以断开重连、Agent 可以分析历史，但日志本身并不能保证重放外部副作用安全，后者还需要幂等与效果记录。"
        ],
        [
          "哪里应该挂插件",
          "增加工具应注册到 Tool Registry；改变模型请求策略使用 ModelAdapter/Prompt/Context 扩展；加入观测则监听事件；自定义前端工作台使用 UI 插槽；只有需要改变执行状态机语义时才考虑改 Agent Loop。选错扩展点会造成合并冲突、HMR 泄漏或升级不兼容。"
        ]
      ],
      "walk": [
        "应用启动时 Profile 组装 Cordis 插件依赖图。",
        "用户 Turn 进入 Agent Registry，创建或恢复指定 Agent Session。",
        "Agent Loop 在 Step 中请求 Prompt/ModelAdapter，接收工具调用。",
        "Tool Registry 检查/执行，向 Session Store 写入事件并广播。",
        "Trace/Client 消费事件，状态机决定是否继续或终止。"
      ],
      "code": "class Runtime:\n    def __init__(self, model, tools, sessions, policy):\n        self.model = model\n        self.tools = tools\n        self.sessions = sessions\n        self.policy = policy\n    def run_step(self, state):\n        prompt = state.build_context()\n        decision = self.model.generate(prompt)\n        if decision.kind == 'tool':\n            result = self.tools.execute(decision, self.policy)\n            self.sessions.append(result.to_event())\n        return state\n# 教学接口，不对应 DSH 的具体 Python 实现",
      "kind": "Harness 组件分层伪代码。DSH 实际实现使用 TypeScript 和 Cordis 服务，并非这里的 Python 类。",
      "traps": "不要把 Prompt、Agent Loop、Tool Executor 混成一个巨大函数；它会阻碍测试、替换和故障归因。",
      "exercise": "你想让 DSH 支持一个新的模型服务商，应该先改哪个层？如果只是增加 OCR 工具呢？",
      "answer": "模型服务商优先新建/修改 LLM Provider/ModelAdapter；OCR 优先注册 Tool 和相关 Service，通常都不需要直接修改核心 Agent Loop。"
    },
    {
      "goal": "实现跨模型的结构化事件 Adapter，并处理流式输出与不兼容能力。",
      "sections": [
        [
          "为什么 HTTP 接口一致还不够",
          "很多 Provider 都提供 OpenAI 兼容 API，但 ToolCall ID、流式事件、错误码、structured output 严格度、取消与重试语义并不完全相同。Adapter 必须接收供应商原始响应并输出稳定的模型事件，而不是仅替换 baseURL 和 API Key。"
        ],
        [
          "流式 ToolCall 不能逐 chunk 执行",
          "模型可能把一个工具的 arguments 分成多个 delta 返回，例如先返回“{\\\"pa”，后返回“th\\\":...}”。Harness 必须依据 call_index/call_id 缓存片段，等待工具调用的完整边界，再解析 JSON 并通过 Schema。过早执行不仅会解析失败，还可能在重连后造成重复工具操作。"
        ],
        [
          "能力声明和降级策略",
          "Adapter 可声明 supports_tools、supports_parallel_calls、supports_strict_json、max_context 等。没有支持的能力时，应该限制工具、切换 Provider 或明确失败；不应悄悄把自由文本当成真实 ToolCall。对于模型特有的 reasoning/usage 字段，建议保留 raw payload 的安全摘要。"
        ],
        [
          "模型错误与工具错误分开",
          "429/网络超时发生在 ModelAdapter，invalid_arguments 发生在 Tool 层，permission_denied 属于授权层。统一的 Runner 可以根据错误类型进行 Retry/Repair/Abort，但不应给所有异常一个笼统的“模型失败”。"
        ]
      ],
      "walk": [
        "Provider A 流式输出工具名、ID 和参数 chunks。",
        "Adapter 按一个 ToolCall ID 聚合并校验完整的 JSON。",
        "转换成统一 ToolInvocation，保留原始 Provider metadata。",
        "Executor 根据 Registry 和权限执行，而不是由 Adapter 执行。",
        "工具结果以统一事件进入 Session，下一步模型可以来自其他 Provider。"
      ],
      "code": "import json\nchunks=['{\"path\":','\"notes.md\"','}']\nraw=''.join(chunks)\nargs=json.loads(raw)\nnormalized={'kind':'tool_call','id':'call_17',\n            'name':'read_file','args':args,\n            'provider':'mock-A'}\nassert normalized['args']['path']=='notes.md'\nprint(normalized)\n# 只有收到 complete event 后才执行",
      "kind": "可运行的流式参数重组示例；简化为同一个工具调用，实际 Provider 会有 index/call_id 等更复杂字段。",
      "traps": "流式片段不是完整 JSON；只要某个 Provider 不支持某能力，就应显式降级而不是模拟成功。",
      "exercise": "两个 Provider 都叫同一个 Tool，但一个返回 JSON 字符串参数，另一个返回字典。Tool Executor 应该知道这种区别吗？",
      "answer": "不应该。Adapter 将不同协议统一成规范 ToolInvocation，Executor 只接收已解析/验证的结构化输入。"
    },
    {
      "goal": "读懂 Cordis 插件依赖、生命周期、事件与隔离边界，并能复现最小插件。",
      "sections": [
        [
          "Cordis 的核心抽象",
          "Cordis 把 Service、Plugin、Context、Inject、Typed Events、Effects 组合成运行时插件树。Plugin 声明依赖的服务（例如 tools），依赖不满足时不能安全地提供工具；Provider 在 Context 中发布能力，Consumer 通过注入使用。运行顺序应基于依赖而不是导入文件的偶然顺序。"
        ],
        [
          "注册的可逆性",
          "通过 `ctx.tools.register(...)` 之类的注册接口，插件可以在卸载时撤销对 Registry 的贡献。对外部计时器、文件 Watcher、WebSocket 连接则还需显式绑定 Effect/Disposer。否则 HMR 后旧插件实例可能留下定时器继续发消息或重复执行工具。"
        ],
        [
          "事件与持久化不是同一件事",
          "Cordis 事件可以通知“工具执行结果已经生成”，消费者可以在不直接依赖工具插件的情况下监听；但只有写入 Session/Event Store 的数据才具有明确的重放/恢复语义。实时 Event 监听器无法替代数据库里的提交记录。"
        ],
        [
          "插件安全边界",
          "一个插件可被停用并不意味着它在沙箱里。DSH 的 Host 插件通常运行于 Node 宿主的高权限环境，工作区 Shell 沙箱不能自动约束插件自己的 Node 代码。安装第三方插件需要审查依赖脚本、网络流量与敏感数据访问，最小权限优先。"
        ]
      ],
      "walk": [
        "Profile/Bundle 加载工具服务 Provider，再加载声明 inject=['tools'] 的插件。",
        "Plugin 的 apply() 注册带 Schema 的 greet Tool 和可选 logger。",
        "调用 ctx.tools.execute(...) 测试工具管线，不必真实消费模型 Token。",
        "tools/result 事件用于观察结果，Tool Registry 返回结构化内容。",
        "卸载 Plugin 后 Registry 删除 greet；监听/外部资源均释放。"
      ],
      "code": "// 官方 DSH Cordis 教程核心形式（节选）\nimport type { Context } from '@deepseek-ai/cordis'\nimport { defineTool } from '@deepseek-ai/dsh-tools'\nexport const name = 'greet-tool'\nexport const inject = ['tools']\nexport function apply(ctx: Context) {\n  ctx.tools.register(defineTool({\n    name: 'greet',\n    description: 'Greet user',\n    parameters: {who:{type:'string',required:true}},\n    output: {\n      schema:{type:'string'},\n      render:(_args,value)=>[{type:'text',text:value}],\n    },\n    async execute(args) { return 'Hello, '+args.who },\n  }))\n}",
      "kind": "参考 DSH 官方 Cordis 第 7 章的 Tool 注册形式；需在官方仓库和相应 Cordis 组合配置中执行，并非独立粘贴即可运行的程序。",
      "traps": "Cordis Effect 负责卸载清理，不能代替安全沙箱；工具权限与插件宿主权限仍是两个边界。",
      "exercise": "一个插件卸载后侧边栏消失，但后台定时器仍在向服务器发消息。哪种机制缺失？",
      "answer": "外部 Timer/Socket 未绑定插件 Effect/Disposer；UI 卸载不能保证资源生命周期清理。"
    }
  ],
  "6": [
    {
      "goal": "区分可重试、不可重试和结果未知的操作，避免重复副作用。",
      "sections": [
        [
          "重试是有条件的决策",
          "HTTP GET 失败通常可重新查询；但创建订单、发送邮件或部署版本是有外部副作用的写操作。客户端超时不代表服务端没收到请求。若用户再次触发同一动作，没有幂等 Key 或查询确认，就可能产生重复执行。"
        ],
        [
          "幂等键如何工作",
          "对可控制的服务端，客户端为同一业务动作使用稳定的 idempotency_key。服务端持久记录该键对应的效果，重复请求返回相同结果或明确冲突。键应稳定绑定到业务动作，而不是每次 Retry 生成新 UUID；否则完全失去去重意义。"
        ],
        [
          "失败状态必须细分",
          "Network Timeout 可能是 transient 或 unknown；invalid_arguments 是确定的输入错误；permission_denied 通常需要用户修正权限；rate_limit 可以有等待策略。Agent Runtime 不能把所有失败都交给模型“再试一次”，尤其不能对未知写操作盲重试。"
        ],
        [
          "工具层与业务层的协作",
          "通用 Harness 能标记 ToolCall、超时、重试预算，但外部业务系统是否真正幂等，由服务的 API 或代理层保证。如果远程服务不支持请求去重，需要先查询真实状态、提供人工确认，或放弃自动重试。"
        ]
      ],
      "walk": [
        "Run 准备执行 send_message，生成稳定 effect_key=run23:message7。",
        "写入 Intent Event，然后调用外部发送 API。",
        "如果 API 返回成功并确认，提交 effect result 与 checkpoint。",
        "如果连接断开且结果未知，查询服务端该 effect_key 的执行结果。",
        "无法确定时停止或请求人工处理，而不是无条件再次发送。"
      ],
      "code": "sent={}\ndef send_once(key,payload):\n    if key in sent: return sent[key]\n    # 模拟原子提交；真实网络需要服务端配合\n    sent[key]={'id':'msg-1','payload':payload}\n    return sent[key]\nfirst=send_once('run23:message7','Hello')\nretry=send_once('run23:message7','Hello')\nassert first is retry\nassert len(sent)==1",
      "kind": "可直接运行的内存模拟；不能用它证明真实网络/多个 Worker 的 exactly-once 副作用。",
      "traps": "“请求没有返回”与“请求没有执行”不是同一个命题；重试策略必须考虑结果未知状态。",
      "exercise": "邮件 API 完成发送但返回超时，Agent 已消耗两次重试预算。你会直接第三次发送吗？",
      "answer": "不直接发送。先按稳定消息 ID/幂等 Key 查询结果或查可靠日志；若无法确认，标记 unknown 并人工处理。"
    },
    {
      "goal": "理解事件记录、Checkpoint 与真实外部状态各自能保证什么。",
      "sections": [
        [
          "Checkpoint 是运行时快照",
          "它可以保存当前节点、模型消息引用、待执行动作、Retry Count 和局部状态；崩溃恢复时读取最近已提交快照。Checkpoint 要足够完整，但不用每步保存所有重复文本。"
        ],
        [
          "Event Log 保存的是序列化的事实",
          "Append-only 事件记录 turn/start、tool/call、tool/result、step/end 等已经发生的状态变化，可以用于审计和重放。它与单个当前状态快照互补：Snapshot 便于快速恢复，Event 解释变化过程。若 Event Log 未做原子提交或去重，也可能产生重复/缺失事件。"
        ],
        [
          "外部副作用不是事件的附属品",
          "假设数据库记录“开始发送邮件”，进程崩溃后邮件服务可能已经发送。恢复时仅重放 Event Log 无法自动确认外部 API 的事实，需要 Effect Log、幂等接口或查询确认。很多框架提供 Durable Execution，但业务动作可否安全重试仍是工程责任。"
        ],
        [
          "一致性与数据所有权",
          "如果多个 Worker 恢复同一任务，必须使用租约/版本号/事务约束避免并发执行。Checkpoint 也应记录模型/工具/Prompt 的版本，否则重放历史时可能在不同代码下产生不同结果。"
        ]
      ],
      "walk": [
        "Step 4 开始，写 tool/call 事件与 effect intent。",
        "外部服务可能提交副作用，进程随后异常退出。",
        "重启加载 checkpoint 和事件序列，识别尚未确认的 tool/call。",
        "按幂等键查询外部效果后补写 result 或标记 unknown。",
        "在确认状态后推进 Step 5，避免重复执行 Step 4。"
      ],
      "code": "events=[\n {'seq':1,'type':'step/start','step':4},\n {'seq':2,'type':'tool/call','id':'c42'},\n {'seq':3,'type':'effect/committed','id':'c42'},\n]\ncheckpoint={'step':4,'version':1}\ncommitted={e['id'] for e in events\n           if e['type']=='effect/committed'}\nassert 'c42' in committed\n# 重启后不能盲目执行 c42 对应的写操作",
      "kind": "可运行的日志检查示例。真实 Checkpoint/Event 写入需要持久事务与并发控制。",
      "traps": "重放日志不等于重跑所有工具；对于文件写入、网络请求应优先补偿或确认效果。",
      "exercise": "系统有 checkpoint=step5，但 Event Log 最后一个事件是 step4 的 tool/call，没找到 result。你能断定 Step4 没发生吗？",
      "answer": "不能。需要查询外部效果和写入原子性，明确该调用是失败、已成功但日志丢失，还是结果未知。"
    },
    {
      "goal": "设计可以停止、可以恢复、不会无限烧费的执行状态机。",
      "sections": [
        [
          "预算是防止失控的第一道闸",
          "Agent 循环应提前定义 max_steps、max_output_tokens、total_cost、wall_time、tool_timeout 和 retry_budget。每次 Step 之前检查预算，ToolExecutor 在执行过程中也需要取消/超时信号。某些调用无法瞬时取消，但必须停止后续动作。"
        ],
        [
          "Backoff 和 Circuit Breaker 解决不同问题",
          "指数退避用于缓解暂时的限流和抖动；Circuit Breaker 在持续失败时短期拒绝调用，避免放大故障。永久性错误（例如非法参数）不应走退避，而应修正输入或停止。"
        ],
        [
          "恢复路径必须写给下一轮执行者",
          "当任务被中断，不要只保存一句“出错了”。应留下目标、已完成与未完成节点、最后可信事件、失败分类、相关文件或工具版本，以及下一步恢复建议。这样新的 Agent Session 才能继续，而不是重复扫描全部历史。"
        ],
        [
          "怎样验收可靠性",
          "通过 Fault Injection 验证：第三次工具调用抛异常、重启 Worker、对相同幂等键重复请求、模型重复返回非法 JSON、超过预算。每个场景应检查不会重复副作用、不会误报 Success、错误可追溯。"
        ]
      ],
      "walk": [
        "Runner 准备下一 Step，检查 AbortSignal 与剩余 Token/时间/工具预算。",
        "执行 Tool 时启动 timeout，区分只读失败与未知写入效果。",
        "依据错误分类选择 retry、repair、replan、manual_approval 或 stop。",
        "保存 checkpoint/事件并输出下一步恢复点。",
        "直到 Success 条件或明确 Failed/Blocked/Cancelled 状态。"
      ],
      "code": "def should_retry(error, attempts, max_attempts=3):\n    if attempts >= max_attempts: return False\n    if error in {'invalid_arguments','permission_denied'}:\n        return False\n    if error == 'unknown_write_outcome':\n        return False  # 要先查询外部真实状态\n    return error in {'rate_limit','temporary_network'}\nassert should_retry('rate_limit',1)\nassert not should_retry('permission_denied',1)\nassert not should_retry('unknown_write_outcome',1)",
      "kind": "可直接运行的 Retry 分类示例，生产还需要 Retry-After、背压与预算统一管理。",
      "traps": "简单的 while retry 往往无法满足生产可靠性；优雅失败也是系统能力。",
      "exercise": "一个 Agent 连续 5 次把同一个文件路径传错。你会继续指数退避吗？",
      "answer": "不会，参数错误不是临时网络问题。应修复路径/Schema，超出尝试预算则停止并记录具体问题。"
    }
  ],
  "7": [
    {
      "goal": "能区分 Logs、Traces、Metrics 和 Evals，并为失败归因保留证据。",
      "sections": [
        [
          "四种观察方式不同",
          "Log 是单个事件的记录；Trace 通过关联的 Span 把一次 Run 的模型调用、工具执行、重试和并行节点连起来；Metric 是按时间或任务聚合的统计，例如 p95 延迟；Eval 则判断行为是否符合目标与约束。把它们混成“有日志就能评估”会遗漏评价标准和因果结构。"
        ],
        [
          "Span 应该记录哪些字段",
          "建议保存 trace_id、run_id、step_id、parent_span、tool_call_id、model_id、prompt_version、tool_version、latency、token_usage、outcome/error_code。私密 Prompt/工具参数应脱敏或只存 Hash/摘要，不能因为要调试就无限收集密钥。"
        ],
        [
          "成本归因不是总 Token 一个数字",
          "在 Tool-rich Agent 中，一次 Tool Call 可能导致模型重新组装历史、等待外部 API、重试网络。耗费应按模型调用、工具等待、检索和队列延迟分别统计。两个方案都成功时，才有意义比较平均费用、p95 时延和步骤数。"
        ],
        [
          "日志上的成功不等于任务成功",
          "一次 Request HTTP 200、工具调用 status=ok，只代表这些子步骤成功；任务可能依然没有完成目标。例如读取到文件并不意味着修复了 bug。需要另设 Outcome Eval 判断最终可验证状态。"
        ]
      ],
      "walk": [
        "用户任务启动，创建 trace_id 和 run_span。",
        "模型调用生成 step_span，记录 token 与 model ID。",
        "ToolCall 生成 child span，记录权限审查、执行耗时和结果。",
        "执行结束后再记录最终目标验证结果，不仅仅是工具响应。",
        "聚合多次 Run 的成功率、Token、延迟和失败类型。"
      ],
      "code": "trace={'run_id':'r12','spans':[\n {'name':'model','ms':900,'tokens':800},\n {'name':'tool.read_file','ms':180,'tokens':0},\n {'name':'model','ms':750,'tokens':500},\n]}\nlatency=sum(s['ms'] for s in trace['spans'])\ntokens=sum(s['tokens'] for s in trace['spans'])\nprint({'latency_ms':latency,'tokens':tokens})\n# 真实 trace 还需 parent_span、时间戳、状态与隐私控制",
      "kind": "可运行的追踪聚合示例，数值为教学模拟。",
      "traps": "HTTP 200 不等于 Outcome 成功；Trace 也不是天然的代码正确性证明。",
      "exercise": "一次 Agent 花了 9 步才完成，另一个 4 步完成。只看最终完成率能判定谁更好？",
      "answer": "不能。应同时比较 Token、时延、工具误调用、重试次数与稳定性，并在同样任务集下测量。"
    },
    {
      "goal": "把 Golden Cases 设计成可重复、可归因的 Agent 回归测试集。",
      "sections": [
        [
          "Golden Case 至少要包含什么",
          "最小 Case 应记录 input、environment fixture、expected outcome、allowed variation、expected tool constraints 和 evaluation method。对于网页搜索问题，不能只保存“一句话正确答案”，还要锁定或记录检索结果的时点和来源。"
        ],
        [
          "Component、Trajectory、Outcome 分别测什么",
          "Component Eval 检查单个工具或模型节点是否按合同工作；Trajectory Eval 检查工具选择顺序、非法调用及步骤效率；Outcome Eval 判断最终目标是否达成。例如网格任务：Outcome 是到达目标，Trajectory 是无越墙/无无限循环。"
        ],
        [
          "控制变量才能知道原因",
          "若同时换模型、Prompt、工具 Schema 和网页数据，成功率变化无法归因。至少为每次 Run 固定 Git SHA、模型版本、数据 Fixture、温度/采样参数和工具权限。对非确定性模型需要多次抽样并给出波动范围。"
        ],
        [
          "失败案例比总体平均分更能指导改进",
          "把错误按 ToolName Hallucination、Permission Denied、Context Loss、Repeated Actions、Wrong Answer、Timeout 分类。某版本总体分数提升 5%，但把原本 0 次越权尝试变成 3 次，就可能不值得上线。"
        ]
      ],
      "walk": [
        "准备 20 个覆盖正常/边界/安全的固定任务实例。",
        "每条 Case 定义可执行的 Expected State 和允许行为。",
        "旧版与新版分别在相同 Fixture 下运行，记录 Trace 和 Token。",
        "对比 Outcome、Trajectory、Component 指标以及 Failure Clusters。",
        "对回归项关联到具体模型/工具/Context/Runtime 变更。"
      ],
      "code": "cases=[\n {'id':'c1','goal':(2,0),'final':(2,0),'illegal':0},\n {'id':'c2','goal':(2,0),'final':(1,0),'illegal':0},\n {'id':'c3','goal':(2,0),'final':(2,0),'illegal':1},\n]\ndef evaluate(case):\n    return {'outcome':case['final']==case['goal'],\n            'trajectory':case['illegal']==0}\nprint([evaluate(c) for c in cases])\n# c3 终局成功但轨迹违规",
      "kind": "可直接运行的 Outcome/Trajectory 分离演示；真实 Eval 需包含更多规则。",
      "traps": "单一 LLM Judge 分数会掩盖误用工具与权限风险；先做确定性可验证的断言。",
      "exercise": "模型 A 20 个测试完成 18 个，但 4 次越权调用；模型 B 完成 17 个、没有越权。能只按完成数选 A 吗？",
      "answer": "不能。要按风险和业务权重比较不同指标，并分析越权是否被权限层阻断、是否不可接受。"
    },
    {
      "goal": "把 LLM-as-Judge 放在适当的位置，并设计可校准的评估流程。",
      "sections": [
        [
          "Judge 是带噪声的测量仪",
          "自然语言质量、总结完整度等难以写成绝对规则的任务，可以让 Judge 基于 Rubric、输入和证据打分。Judge 也会受到顺序、措辞、长度、模型偏好的影响，因此分数应配理由并定期与人工标注对照。"
        ],
        [
          "哪些地方不应该用 Judge",
          "算术、JSON Schema、权限拒绝、文件是否存在、游戏状态是否到目标等可确定性验证的事实，不应交给 Judge 推测。能从环境直接读取真实状态，代码断言更便宜、更稳定也更透明。"
        ],
        [
          "如何设计 Rubric 和多维指标",
          "对资讯总结可以分事实准确性、来源覆盖、时间敏感性、可读性。每一维有 1–5 分行为锚点，例如“所有关键声明对应可访问来源”得高分，“出现无证据新事实”得低分。保留 Judge 版本和输入，以便发现评价漂移。"
        ],
        [
          "评估自身也需要评价",
          "定期构造 Judge Calibration Set：人工先标注好/坏/边缘案例，然后测 Judge 与人工的一致性、误报、漏报。若更换 Judge 模型，要重新跑 Calibration；不能把评价器替换后的分数变化当作被测 Agent 进步。"
        ]
      ],
      "walk": [
        "确定本 Case 是否可以直接用代码断言；如果可以，优先 deterministic Eval。",
        "开放式结果按 Rubric 分拆为多个可解释维度。",
        "Judge 读取固定输入与证据，输出每维评分和引用理由。",
        "人工抽查边界案例，统计 Judge disagreement。",
        "保存 Judge 版本、Rubric 和批次编号，再比较模型/Prompt 变更效果。"
      ],
      "code": "def deterministic_eval(state,expected):\n    return state == expected\n\nactual={'position':(2,0),'illegal_moves':0}\nexpected={'position':(2,0),'illegal_moves':0}\nassert deterministic_eval(actual,expected)\n\nrubric={'factuality':'source-backed claims',\n        'coverage':'required questions answered',\n        'clarity':'readable structure'}\nprint('Use rubric only for non-deterministic dimensions:',rubric)",
      "kind": "可运行的确定性评价演示。Rubric 仅为结构示例，没有调用 LLM Judge。",
      "traps": "Judge 给 10 分并不证明任务达到环境目标；也不应由同一模型在无校准条件下评价自己的结果。",
      "exercise": "一个摘要是否涵盖用户要求的全部 6 个主题，能否不使用 LLM Judge 检查？",
      "answer": "若六主题有明确结构化清单，可以先用 Schema/规则检查字段覆盖；语义是否准确和深度是否足够再借助人工/校准 Judge。"
    }
  ]
});
