# Migration Guide / 从 ChatGPT 定时任务迁出

## 迁移目标

减少 ChatGPT/Codex 套餐额度消耗，同时保留：
- 每日自动研究与生成
- 来源可追溯和 URL QA
- GitHub 历史归档
- GitHub Pages
- 微信公众号草稿
- 后续扩展为 Skill / 网站 / Agent 系统的能力

不建议一次性重写全部链路。现有下游已经工作，应把迁移拆成三个阶段。

---

## Phase 0：冻结接口

先把下面两个接口视为不可破坏契约：

### Artifact contract

最终文件：
`AI游戏每日简报_YYYY-MM-DD_DayN.md`

归档文件：
`reports/YYYY/MM/YYYY-MM-DD.md`

H1：
`# AI 游戏每日简报｜YYYY-MM-DD｜Day N：...`

正文遵循 `prompts/game-daily-contract.md`。

### Delivery contract（现网兼容模式）

如果继续走 Gmail：
- 从 Gmail 账户自身发给自身
- 顶层 MIME：`multipart/mixed`
- 正文：UTF-8 `text/markdown`
- 附件：UTF-8 `text/markdown`
- filename 必须严格匹配 artifact contract
- 正文与附件来自同一个 final_markdown

只要新生成端满足这两个 contract，现有 GitHub/Pages/公众号都不需要知道模型换了。

---

## Phase 1：只迁移 Research + Generate + Validate

### 推荐部署位置

优先推荐现有 Linux 服务器，原因：
- 已经长期在线
- 已经承载 watchdog 和公众号 publisher
- systemd timer 已有运维习惯
- 更适合多次网络请求、缓存、重试和本地 state
- 不受 GitHub Actions 单次 runner 生命周期限制

GitHub Actions 也可作为备选，适合全无状态实现。

### 新 runner 建议分层

```text
scheduler
  -> collector
  -> researcher
  -> generator
  -> validator
  -> deliverer
```

接口建议：

```python
class SearchAdapter:
    def search(self, query, *, recency=None, domains=None): ...

class FetchAdapter:
    def fetch(self, url): ...

class ModelAdapter:
    def generate(self, messages, *, model=None): ...

class ReportValidator:
    def validate(self, markdown, metadata): ...

class Deliverer:
    def deliver(self, markdown, metadata): ...
```

其中 SearchAdapter / ModelAdapter 必须可替换。Kimi、GLM、OpenAI API、Gemini、Claude 等只应是 adapter，不应写死到业务规则中。

### Phase 1 最稳妥输出

仍然使用 Gmail SMTP 发送到同一 Gmail 账户自身。

这样：
`new runner -> Gmail Sent -> 现有 import Action -> 现有 Pages -> 现有 WeChat`

切换当天只需：
1. 新 runner dry-run
2. 用 `tests/validate_report.py` 验收
3. 手动发一份测试日报到 Gmail
4. 手动 dispatch import workflow
5. 检查 GitHub report
6. 检查 Pages
7. 检查公众号 dry-run
8. 启用新 timer
9. **最后**禁用 ChatGPT 的 `AI游戏每日趋势` 定时任务

不要先停旧任务再调试新链路。

---

## Phase 2：删除 Gmail 中转

当新 runner 连续稳定后，推荐最终改成：

```text
server timer
  -> research/generate/validate
  -> git commit reports/YYYY/MM/YYYY-MM-DD.md
  -> GitHub push
  -> build/index/pages
  -> server wechat publisher
```

### GitHub 侧需要改动

`build-game-daily-index-and-site.yml` 需要支持：

```yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - "reports/**/*.md"
```

然后：
- 停用/删除 `import-game-daily.yml`
- 删除 GitHub Secrets `GMAIL_USERNAME` / `GMAIL_APP_PASSWORD`
- 停用服务器 watchdog，因为直接写 GitHub 后不再需要“重新触发 Gmail 导入”
- 保留 WeChat publisher

注意：迁移期间不要同时保留 `workflow_run` 与 report push 而不做去重，否则一次导入可能触发两次 build。可以在正式切换时一次性改触发方式。

---

## Phase 3：Skill / 网站 / 多 Agent 产品化

建议把“日报”从一个大 Prompt 拆成模块：

1. **Source Registry**：平台、媒体、论文、社区源定义。
2. **Explosion Detector**：爆发监测。
3. **Trend Comparator**：与历史日报对比，判断首次出现/连续出现/升温/降温。
4. **AI-native Classifier**：区分 AI-native 玩法与仅 AI 生产工具。
5. **Research Radar**：论文检索与限制说明。
6. **Community Sampler**：社区样本与证据等级。
7. **Claim-Evidence Mapper**：事实 -> 来源映射。
8. **URL Verifier**：链接、实体、日期、ID、事实支持关系验证。
9. **Report Composer**：生成文章。
10. **Report Validator**：硬性结构/URL/引用 gate。
11. **Publish Adapters**：GitHub / Gmail / Pages / WeChat。

网站化时可以把这些做成可开关模块，用户选择关注：
- 全行业
- AI-native games
- indie / lightweight games
- Steam
- Roblox
- UGC platforms
- papers
- China mini games
- community signals

日报内容扩充时，只扩 Source Registry 和 section config，不要继续膨胀一个不可维护的大 Prompt。

---

## Cutover checklist

- [ ] 新生成端能在不依赖 ChatGPT 定时任务的情况下运行
- [ ] 生成结果通过 `validate_report.py`
- [ ] Day N 计算与现有历史连续
- [ ] 所有正文 URL 只出现在最后来源章节
- [ ] 引用编号闭合、无跳号、无重复 URL
- [ ] Gmail 兼容模式下附件 MIME 正确
- [ ] GitHub 能归档到当天路径
- [ ] Pages 能出现当天文章
- [ ] WeChat `--dry-run` 成功
- [ ] 微信草稿实际创建/更新成功
- [ ] 新调度至少完成一次真实端到端运行
- [ ] 再禁用 ChatGPT scheduled task
- [ ] 如进入 Phase 2，再移除 Gmail import 和 watchdog

## Rollback

Phase 1 的回滚非常简单：停掉新 runner，重新启用 ChatGPT `AI游戏每日趋势` 任务。因为下游接口未变，不需要恢复 GitHub/Pages/公众号代码。

Phase 2 后回滚时，可手动把一份合格 Markdown commit 到 `reports/YYYY/MM/`，因此 canonical artifact contract 是最重要的灾备接口。
