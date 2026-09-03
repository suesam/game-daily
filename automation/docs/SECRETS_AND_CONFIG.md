# Secrets and Configuration

此文件是**凭证索引**。真实值禁止提交 Git。

详细“去哪里申请 / 怎么获取 / 丢了怎么恢复”请看：

- [CREDENTIAL_RECOVERY.md](CREDENTIAL_RECOVERY.md)
- 整套环境重装：[REBUILD_FROM_ZERO.md](REBUILD_FROM_ZERO.md)

## Credential matrix

| 变量 / 凭证 | 存储位置 | 获取方式 |
|---|---|---|
| `GMAIL_USERNAME` | GitHub Actions Secret | Gmail 地址本身 |
| `GMAIL_APP_PASSWORD` | GitHub Actions Secret | Google Account -> 2-Step Verification -> App Passwords |
| watchdog `GITHUB_TOKEN` | `/home/ubuntu/game-daily-watchdog/env` | GitHub Fine-grained PAT；当前仅需 Actions write |
| `WECHAT_APP_ID` | `/opt/wechat-publisher/.env` | 微信公众平台开发设置 |
| `WECHAT_APP_SECRET` | `/opt/wechat-publisher/.env` | 微信公众平台生成/重置 |
| `WECHAT_THUMB_MEDIA_ID` | `/opt/wechat-publisher/.env` | 永久封面上传后返回 |
| Kimi API Key | 新 generator env | Kimi API 开放平台 API Keys |
| GLM API Key | 新 generator env | 智谱 BigModel API Keys |

## GitHub Actions

### import-game-daily.yml

GitHub repository secrets：

- `GMAIL_USERNAME`
- `GMAIL_APP_PASSWORD`

配置入口：

<https://github.com/suesam/game-daily/settings/secrets/actions>

Phase 2 直接写 GitHub 后，这两个 secrets 可以删除。

## Server watchdog

文件：

`/home/ubuntu/game-daily-watchdog/env`

变量：

`GITHUB_TOKEN`

当前用途仅为 dispatch `import-game-daily.yml`。

Fine-grained PAT 最小权限按当前 API 实际需要：

- repository：`suesam/game-daily`
- Actions：Read and write

Phase 2 去掉 Gmail import 后，watchdog 和这个 PAT 都应停用。

## WeChat publisher

生产环境：

`/opt/wechat-publisher/.env`

模板：

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

注意：

- 微信 `access_token` 是运行时短期 token，不要作为长期 Secret 手工保存。
- `WECHAT_THUMB_MEDIA_ID` 不是密码，丢失可以重新上传永久封面获取。
- `state.json` 是 runtime state，不是凭证。

## Future generator

推荐独立 env：

```dotenv
GAME_DAILY_MODEL_PROVIDER=
GAME_DAILY_MODEL=
GAME_DAILY_API_KEY=

# provider-specific alternative
MOONSHOT_API_KEY=
ZHIPU_API_KEY=

GAME_DAILY_SEARCH_PROVIDER=
GAME_DAILY_SEARCH_API_KEY=

GAME_DAILY_REPO_PATH=/opt/game-daily
GAME_DAILY_TIMEZONE=Asia/Shanghai
GAME_DAILY_DELIVERY_MODE=gmail

# Phase 1 only
GMAIL_SMTP_USERNAME=
GMAIL_SMTP_APP_PASSWORD=
```

Phase 2 direct git push 时，再选择：
- GitHub App
- SSH deploy key with write access
- Fine-grained PAT

不要把 provider API Key 写进 `pipeline.example.yaml`；YAML 只保存变量名或逻辑配置。
