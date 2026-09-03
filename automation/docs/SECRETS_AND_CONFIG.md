# Secrets and Configuration

此文件只记录**变量名和权限**。不要把真实值提交到 Git。

## GitHub Actions

### import-game-daily.yml

GitHub repository secrets：
- `GMAIL_USERNAME`：用于 IMAP 登录的 Gmail 地址。
- `GMAIL_APP_PASSWORD`：Google App Password。不要使用 Google 主密码。

迁移到 Phase 2 直接写 GitHub 后，这两个 secrets 可以删除。

## Server watchdog

文件：
`/home/ubuntu/game-daily-watchdog/env`

变量：
- `GITHUB_TOKEN`

当前脚本用途：dispatch `import-game-daily.yml`。

建议 Fine-grained PAT 最小权限：
- repository：`suesam/game-daily`
- Actions：Read and write
- Contents：Read

Phase 2 去掉 Gmail import 后，watchdog 可整体停用，PAT 也不再需要为这个用途保留。

## WeChat publisher

生产环境文件：
`/opt/wechat-publisher/.env`

模板见：
`automation/server/wechat-publisher/.env.example`

变量：
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_THUMB_MEDIA_ID`
- `WECHAT_AUTHOR`
- `WECHAT_TITLE_MAX`
- `WECHAT_DIGEST_MAX`
- `WECHAT_OPEN_COMMENT`
- `WECHAT_FANS_ONLY_COMMENT`
- `GAME_DAILY_REPO`
- `WECHAT_SOURCE_BASE`
- `WECHAT_STATE_FILE`

`WECHAT_THUMB_MEDIA_ID` 是永久素材封面的 media_id。服务器上的 `cover.jpg` 和运行态 `state.json` 没有提交到迁移包。

## Future generator

建议新 runner 使用独立 env，而不是复用公众号 env，例如：

```dotenv
GAME_DAILY_MODEL_PROVIDER=
GAME_DAILY_MODEL=
GAME_DAILY_API_KEY=

GAME_DAILY_SEARCH_PROVIDER=
GAME_DAILY_SEARCH_API_KEY=

GAME_DAILY_REPO_PATH=/opt/game-daily
GAME_DAILY_TIMEZONE=Asia/Shanghai
GAME_DAILY_DELIVERY_MODE=gmail

# Phase 1 only
GMAIL_SMTP_USERNAME=
GMAIL_SMTP_APP_PASSWORD=

# Phase 2 direct git push: prefer machine credential / GitHub App.
```

不要把 provider API key 写进 `pipeline.example.yaml`；YAML 只保存变量名或逻辑配置。
