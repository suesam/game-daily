---
name: game-daily
description: 研究、生成、核验并交付 AI 游戏每日简报。适用于每日游戏行业趋势扫描、爆发监测、AI-native 游戏进展、研究雷达、社区讨论与可追溯 Markdown 归档。
---

# Game Daily Skill

## Goal

产出一个经过 evidence gate 的 canonical Markdown，而不是直接“写一篇看起来像日报的文章”。

业务规范以：
`../prompts/game-daily-contract.md`
为准。

## Inputs

至少需要：
- target_date
- day_number
- timezone（默认 Asia/Shanghai）
- source_registry
- historical_reports（用于趋势/连续性判断）
- search/fetch tools
- model adapter

可选：
- section enable/disable
- focus topics
- source budget
- token/cost budget
- delivery mode

## Required workflow

1. **Load history**
   - 读取最近日报，只提取真正需要的历史快照。
   - 不把历史判断当成今天的事实。

2. **Collect**
   - 多源扫描。
   - 单独执行 explosion detection。
   - 记录 candidate claim 和 candidate source。

3. **Verify**
   - 每个高影响 claim 建立 claim -> evidence 映射。
   - 核对实体、日期、数字、ID、上下文。
   - 失败来源不得进入最终稿。

4. **Compose**
   - 按固定结构生成候选 Markdown。
   - 结论先行；无新信息时允许缩短。

5. **Normalize sources**
   - 正文只保留来源编号。
   - URL 全部移动/生成在最终“来源链接”章节。

6. **Validate**
   - 执行硬性结构 gate。
   - 执行 `automation/tests/validate_report.py` 或等价 validator。
   - 失败则回到修订，不得 delivery。

7. **Deliver**
   - delivery adapter 只能读取已通过验证的 final_markdown。
   - Gmail / GitHub / WeChat 不得分别维护不同事实版本。

## Stop condition

只有当：
- canonical Markdown 已存在
- validator 通过
- 目标 delivery 返回成功/可验证状态

才允许报告完成。

“模型已经生成文本”不等于完成。

## Adapter boundaries

### SearchAdapter
只负责搜索结果，不负责判断事实成立。

### FetchAdapter
只负责取得页面/文档内容和元数据。

### ModelAdapter
负责提取、分类、比较、写作和修订，但不能绕过 validator。

### Validator
必须尽量 deterministic。结构、编号、URL、日期、文件名等不应依赖模型自我声明。

### Publisher
不得重写事实。允许格式渲染，例如 Markdown -> HTML。

## Failure policy

- 搜索失败：降级来源或减少该条，不伪造。
- URL 验证失败：替换、弱化或删除 claim。
- 模型输出不合规：修订并重新 validator。
- delivery 失败：保留 final_markdown，允许重试 delivery，不重新生成事实内容。
- 同一天重跑：默认产生同日期新版并覆盖/更新下游，而不是创建多份 canonical report。

## Future extensions

这个 Skill 可以扩展为可配置的栏目插件：
- steam
- roblox
- indie
- ai-native
- research
- community
- china-mini-games
- uefn
- minecraft
- mobile

栏目插件负责 candidate gathering；最终 evidence/validator 仍由核心层统一控制。
