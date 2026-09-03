# Current Pipeline / 当前生产链路

> 快照日期：2026-09-04。时区除特别说明外均为 Asia/Shanghai（北京时间）。

## 1. 生成端：ChatGPT Scheduled Task

当前启用任务名称：`AI游戏每日趋势`。

- 调度：每天 08:00。
- 主要职责：公开 Web 扫描、日报生成、来源核验、结构 QA、生成最终 Markdown、投递 Gmail。
- 当前任务明确要求：**先生成/核验/修订/自检，全部通过后才允许发送 Gmail**。
- 最终 artifact 文件名：`AI游戏每日简报_YYYY-MM-DD_DayN.md`。
- 邮件主题：Markdown 第一行 H1 去掉 `# `。
- 投递：发送到已连接 Gmail 账户自身；正文和附件必须来自同一个 `final_markdown`。
- Gmail 是后续 GitHub 导入的输入源，当前任务被明确禁止直接写 GitHub。

当前并没有一个独立、可导出的“Game Daily Skill”。核心业务规则主要写在 Scheduled Task prompt 中。Gmail 是连接器/外部依赖；Web research 是生成端能力。因此本迁移包把这些规则抽出为：
- `prompts/game-daily-contract.md`
- `skill/SKILL.md`

## 2. Gmail -> GitHub：Import Game Daily from Gmail

Canonical workflow：
`.github/workflows/import-game-daily.yml`

触发：
- 手动 `workflow_dispatch`
- GitHub cron：`27 0-4 * * *`
- 对应北京时间每日 08:27、09:27、10:27、11:27、12:27

所需 GitHub Secrets：
- `GMAIL_USERNAME`
- `GMAIL_APP_PASSWORD`

处理逻辑：
1. IMAP 登录 Gmail。
2. 根据 Gmail `\\Sent` special-use flag 找“已发送”文件夹，不依赖中文/英文 UI 名称。
3. 只扫描最近 200 封。
4. 只接受文件名匹配：
   `^AI游戏每日简报_(YYYY-MM-DD)_DayN.md$`
5. 同一天如有多封，以最新一封附件为准。
6. 附件必须能按 UTF-8 解码。
7. H1 必须以 `# AI 游戏每日简报｜` 开头，且日期与文件名一致。
8. 原始附件字节写入 `reports/YYYY/MM/YYYY-MM-DD.md`。
9. 内容变化后自动 commit/push。

这一层本质上是 **transport adapter（传输适配器）**，并不负责生成日报。

## 3. GitHub -> README / Index / Pages

Canonical workflow：
`.github/workflows/build-game-daily-index-and-site.yml`

当前触发：
- 手动 `workflow_dispatch`
- `Import Game Daily from Gmail` workflow 成功完成后

职责：
- 扫描 `reports/YYYY/MM/*.md`
- 重建根 README 最新一期和最近 10 期
- 重建 `reports/INDEX.md`
- 重建月度 README
- 生成 `docs/index.html`
- 为每篇 Markdown 生成 `docs/reports/YYYY/MM/YYYY-MM-DD.html`
- 上传 Pages artifact
- 部署 GitHub Pages

站点：
`https://suesam.github.io/game-daily/`

注意：这个 workflow 当前只跟 Gmail import 的 `workflow_run` 绑定。未来如果 runner 直接 commit report，需要增加 report push 触发，或者由 runner 显式 dispatch build workflow。

## 4. Server watchdog：GitHub 导入补救

服务器目录：
`/home/ubuntu/game-daily-watchdog`

主要文件：
- `check_daily.sh`
- `env`（运行态，不提交）
- `env.example`
- `watchdog.log`
- `dispatch-response.txt`

逻辑：
1. 按北京时间计算今天日期。
2. 检查 raw GitHub URL 是否已有今天的 report。
3. 若存在，直接成功退出。
4. 若缺失，用 `GITHUB_TOKEN` dispatch `import-game-daily.yml`。
5. 等 180 秒。
6. 再检查 report 是否出现；否则报错退出。

服务器上存在两组 watchdog timer 配置：
- early：11:45 Asia/Shanghai
- standard：13:10 Beijing（unit 中用 05:10 UTC 表达）

这层只修复 **Gmail 已有日报但 GitHub 尚未归档** 的情况。它无法修复“生成端根本没有生成/发送日报”。

## 5. Server -> WeChat draft

生产代码位置：
`/opt/wechat-publisher`

本仓库迁移快照：
`automation/server/wechat-publisher/`

systemd unit：
- `game-daily-wechat.service`
- `game-daily-wechat.timer`

timer 配置：
- 每天 08:40–23:40 每小时检查一次
- 额外 11:50 检查一次

执行入口：
`publish_latest.py`

流程：
1. `git -C /opt/game-daily pull --ff-only origin main`
2. 找 `reports/YYYY/MM/*.md` 中最新 report
3. 无显式 `--report` 时，只接受北京时间今天的 report
4. Markdown -> 微信兼容 HTML
5. 计算 report SHA-256
6. 与 `state.json` 比较；相同版本跳过
7. 获取微信 access token
8. 同一天已有草稿则 update，否则 add draft
9. 写新的 runtime state

公众号配置依赖：
- App ID / App Secret
- 永久素材封面 `thumb_media_id`
- 标题/摘要长度
- 评论开关
- Pages source URL

## 6. Canonical artifact

整个系统最重要的接口不是 Gmail，也不是 ChatGPT，而是：

```text
reports/YYYY/MM/YYYY-MM-DD.md
```

它应被视为 canonical artifact（唯一正式内容源）。

推荐所有未来实现都遵守：
- Generator 只负责产出候选 Markdown
- Validator 负责决定是否可进入 canonical path
- Publisher 只读取 canonical Markdown，不自行改写事实与来源结构

这样模型、搜索服务、调度平台、Gmail、Pages、公众号都可以独立替换。
