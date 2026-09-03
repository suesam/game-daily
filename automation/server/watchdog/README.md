# Gmail Import Watchdog deployment

这个组件只属于**当前 Gmail 中转架构**。它发现 GitHub 当天日报缺失时，会 dispatch `import-game-daily.yml` 再尝试从 Gmail Sent 导入。

## Setup

```bash
mkdir -p /home/ubuntu/game-daily-watchdog
cp automation/server/watchdog/check_daily.sh /home/ubuntu/game-daily-watchdog/
cp automation/server/watchdog/env.example /home/ubuntu/game-daily-watchdog/env
chmod +x /home/ubuntu/game-daily-watchdog/check_daily.sh
```

填写 Fine-grained PAT：

```dotenv
GITHUB_TOKEN=...
```

测试：

```bash
/home/ubuntu/game-daily-watchdog/check_daily.sh
```

如果当天 report 已存在，应立即输出 `OK`，不会 dispatch workflow。

## What it can and cannot repair

能修：
- ChatGPT/新 generator 已经把附件放进 Gmail Sent
- GitHub scheduled import 没跑或延迟

不能修：
- 没生成日报
- Gmail 没收到/没保存附件
- Markdown 文件名不匹配
- 附件不是 UTF-8
- H1/日期验证失败
- Gmail credentials 失效

因此它不是生成端高可用方案，只是 transport repair。

## Removal

当迁移到 Phase 2：
`generator -> validated Markdown -> direct Git commit`

应停用并删除：
- `game-daily-watchdog.service/timer`
- `game-daily-watchdog-early.service/timer`
- 该用途的 GitHub PAT
- 本目录在服务器上的运行实例

仓库中的快照可以继续保留用于历史追溯。
