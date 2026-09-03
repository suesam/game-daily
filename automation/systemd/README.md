# systemd deployment

这些 unit 是 2026-09-04 服务器上的配置快照。它们使用的是 **user systemd**，不是 system-level unit。

## Current units

- `game-daily-wechat.service/timer`
- `game-daily-watchdog.service/timer`
- `game-daily-watchdog-early.service/timer`

## Install on another server

按新机器路径调整 `ExecStart` / `WorkingDirectory` 后：

```bash
mkdir -p ~/.config/systemd/user
cp automation/systemd/game-daily-*.service ~/.config/systemd/user/
cp automation/systemd/game-daily-*.timer ~/.config/systemd/user/

systemctl --user daemon-reload
systemctl --user enable --now game-daily-wechat.timer
systemctl --user enable --now game-daily-watchdog.timer
systemctl --user enable --now game-daily-watchdog-early.timer
```

服务器若需要在 SSH 退出后继续运行 user timer，需要按该服务器发行版配置 user lingering。

检查：

```bash
systemctl --user list-timers --all
journalctl --user -u game-daily-wechat.service
journalctl --user -u game-daily-watchdog.service
```

## Migration note

进入 Phase 2（生成器直接写 GitHub）后：
- `game-daily-watchdog*.service/timer` 应停用，因为它们只服务于 Gmail -> GitHub 导入补救。
- `game-daily-wechat.service/timer` 继续保留。
- 新的 generator 建议单独创建 `game-daily-generator.service/timer`，不要把生成、Pages、公众号全部塞进同一个 unit。
