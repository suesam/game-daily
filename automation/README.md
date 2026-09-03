# Game Daily Automation / 迁移包

这个目录保存 AI 游戏每日简报的**完整自动化链路说明、迁移方案、服务器运行代码、systemd 配置、生成契约、凭证恢复手册和 Skill 草案**。

目标不是把现有流程永久绑定在 ChatGPT / Codex 上，而是把它拆成可替换组件：

```text
Scheduler
  -> Research + Generate
  -> Validate
  -> Canonical Markdown
  -> Archive
  -> Site / Pages
  -> WeChat draft
```

## 当前生产链路

截至 2026-09-04，实际链路是：

```text
ChatGPT Scheduled Task (08:00 Asia/Shanghai)
  -> Web research + report generation + URL QA
  -> Gmail Sent (Markdown body + .md attachment)
  -> GitHub Actions: import-game-daily.yml
  -> reports/YYYY/MM/YYYY-MM-DD.md
  -> GitHub Actions: build-game-daily-index-and-site.yml
  -> README / indexes / docs/
  -> GitHub Pages

Server side:
  -> watchdog timers: if today's report is missing, dispatch Gmail import workflow
  -> wechat timer: git pull repo -> Markdown to HTML -> WeChat draft API
```

## 目录

- [docs/CURRENT_PIPELINE.md](docs/CURRENT_PIPELINE.md)：现网链路与每个组件职责。
- [docs/MIGRATION.md](docs/MIGRATION.md)：推荐的分阶段迁移步骤。
- [docs/SECRETS_AND_CONFIG.md](docs/SECRETS_AND_CONFIG.md)：Secrets / 环境变量索引。
- [docs/CREDENTIAL_RECOVERY.md](docs/CREDENTIAL_RECOVERY.md)：**Google App Password、GitHub PAT、微信公众号 AppSecret / media_id、Kimi / GLM API Key 的申请、轮换与恢复。**
- [docs/REBUILD_FROM_ZERO.md](docs/REBUILD_FROM_ZERO.md)：**换服务器或几年后重新部署时，从零恢复的执行顺序。**
- [prompts/game-daily-contract.md](prompts/game-daily-contract.md)：从当前定时任务抽离出的日报生成契约。
- [skill/SKILL.md](skill/SKILL.md)：未来包装为 Skill / Agent 能力时可直接改造的草案。
- [config/pipeline.example.yaml](config/pipeline.example.yaml)：供应商无关的流水线配置示例。
- [server/watchdog/](server/watchdog/)：服务器 GitHub 导入补救脚本。
- [server/wechat-publisher/](server/wechat-publisher/)：公众号草稿发布器。
- [systemd/](systemd/)：服务器定时器和 service 快照。
- [tests/validate_report.py](tests/validate_report.py)：模型切换后用于阻止坏日报进入下游的静态验收器。

GitHub 现有两条生产 Workflow 继续以仓库原路径为 canonical source：

- `.github/workflows/import-game-daily.yml`
- `.github/workflows/build-game-daily-index-and-site.yml`

## 推荐迁移顺序

**Phase 1：只替换生成端。** 新 runner 仍把同名 `.md` 发到 Gmail Sent，后面所有流程零改动。这是最低风险切换。

**Phase 2：去掉 Gmail 中转。** runner 验收后直接 commit `reports/YYYY/MM/YYYY-MM-DD.md`，Pages 构建改为监听 report push；届时可删除 Gmail import workflow 和 watchdog。

**Phase 3：产品化。** 把 Research / Generator / Validator / Publisher 拆成 adapter；同一核心可以包装为 Skill、网站、CLI 或多 Agent workflow。

## 安全原则

真实密钥不会提交进仓库。仓库只保留：
- 变量名
- `.env.example`
- 获取方式
- 最小权限
- 轮换方法
- 从零重建步骤

当前服务器上的运行态 `.env`、PAT、Gmail App Password、微信公众号 Secret、state.json、封面 media_id 均不在迁移包中。
