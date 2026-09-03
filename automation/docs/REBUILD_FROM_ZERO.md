# Rebuild From Zero / 从零重建 Game Daily

> 用途：换服务器、系统重装、几年后重新启动项目时，从一个干净环境恢复完整日报系统。

---

## 0. 决定恢复哪种架构

### A. Legacy / Phase 1 compatible

```text
Generator
 -> Gmail
 -> GitHub Action import
 -> reports/
 -> Pages
 -> WeChat
```

优点：和当前生产链路兼容，恢复风险最低。

### B. Phase 2 target

```text
Generator
 -> validate
 -> direct GitHub commit
 -> reports/
 -> Pages
 -> WeChat
```

优点：去掉 Gmail 和 watchdog，更干净。

如果目标只是“先恢复能跑”，优先 A；稳定后再迁 B。

---

# 1. GitHub 是第一恢复源

仓库：

<https://github.com/suesam/game-daily>

新服务器：

```bash
git clone https://github.com/suesam/game-daily.git /opt/game-daily
cd /opt/game-daily
```

先确认：

```bash
python3 automation/tests/validate_report.py \
  "$(find reports -type f -name '*.md' | sort | tail -1)"
```

必须看到 PASS。

---

# 2. 恢复 Gmail import（仅 Legacy / Phase 1）

## 2.1 创建 Google App Password

按：

[CREDENTIAL_RECOVERY.md](CREDENTIAL_RECOVERY.md#gmail-gmail_app_password)

执行。

## 2.2 配 GitHub repository secrets

进入：

<https://github.com/suesam/game-daily/settings/secrets/actions>

设置：

```text
GMAIL_USERNAME
GMAIL_APP_PASSWORD
```

## 2.3 验证 GitHub Action

进入 Actions：

<https://github.com/suesam/game-daily/actions>

手工执行：

`Import Game Daily from Gmail`

验收：
- workflow success
- 没有 UTF-8 / IMAP 登录错误
- 如果 Gmail 里有新的合法附件，能进入 `reports/YYYY/MM/`

---

# 3. 恢复 WeChat Publisher

## 3.1 安装代码

```bash
mkdir -p /opt/wechat-publisher

cp automation/server/wechat-publisher/*.py \
  /opt/wechat-publisher/

cp automation/server/wechat-publisher/requirements.txt \
  /opt/wechat-publisher/

cp automation/server/wechat-publisher/.env.example \
  /opt/wechat-publisher/.env

python3 -m venv /opt/wechat-publisher/.venv

/opt/wechat-publisher/.venv/bin/pip install \
  -r /opt/wechat-publisher/requirements.txt
```

## 3.2 获取公众号凭证

按：

[CREDENTIAL_RECOVERY.md](CREDENTIAL_RECOVERY.md#微信公众号appid--appsecret--ip-白名单)

恢复：
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- IP whitelist

## 3.3 获取封面 media_id

如果没有旧 `WECHAT_THUMB_MEDIA_ID`：

```bash
cd /opt/wechat-publisher
.venv/bin/python upload_cover.py /path/to/cover.jpg
```

把返回的 media_id 写入：

`/opt/wechat-publisher/.env`

## 3.4 填完整 env

至少：

```dotenv
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_THUMB_MEDIA_ID=

GAME_DAILY_REPO=/opt/game-daily
WECHAT_SOURCE_BASE=https://suesam.github.io/game-daily
WECHAT_STATE_FILE=/opt/wechat-publisher/state.json
```

## 3.5 Dry run

```bash
cd /opt/wechat-publisher
.venv/bin/python publish_latest.py --dry-run
```

然后再执行一次真实草稿创建。

---

# 4. 恢复 watchdog（仅 Legacy / Phase 1）

```bash
mkdir -p /home/ubuntu/game-daily-watchdog

cp automation/server/watchdog/check_daily.sh \
  /home/ubuntu/game-daily-watchdog/

cp automation/server/watchdog/env.example \
  /home/ubuntu/game-daily-watchdog/env

chmod +x /home/ubuntu/game-daily-watchdog/check_daily.sh
chmod 600 /home/ubuntu/game-daily-watchdog/env
```

按：

[CREDENTIAL_RECOVERY.md](CREDENTIAL_RECOVERY.md#server-watchdogfine-grained-github-pat)

创建 watchdog PAT。

写入：

```dotenv
GITHUB_TOKEN=...
```

测试：

```bash
/home/ubuntu/game-daily-watchdog/check_daily.sh
```

---

# 5. 恢复 systemd timers

```bash
mkdir -p ~/.config/systemd/user

cp automation/systemd/game-daily-*.service \
  ~/.config/systemd/user/

cp automation/systemd/game-daily-*.timer \
  ~/.config/systemd/user/

systemctl --user daemon-reload
```

Legacy / Phase 1：

```bash
systemctl --user enable --now game-daily-wechat.timer
systemctl --user enable --now game-daily-watchdog.timer
systemctl --user enable --now game-daily-watchdog-early.timer
```

Phase 2：

只保留公众号 timer：

```bash
systemctl --user enable --now game-daily-wechat.timer
```

检查：

```bash
systemctl --user list-timers --all
```

如果 SSH 退出后 user timer 不运行，需要检查该 Linux 发行版的 user lingering 设置。

---

# 6. 恢复 Generator

当前 ChatGPT Scheduled Task 的业务规则已经抽离为：

`automation/prompts/game-daily-contract.md`

Skill 草案：

`automation/skill/SKILL.md`

供应商无关配置：

`automation/config/pipeline.example.yaml`

## Kimi

按：

[CREDENTIAL_RECOVERY.md](CREDENTIAL_RECOVERY.md#kimi-api-key推荐作为新-generator-候选)

创建 API Key。

## GLM

按：

[CREDENTIAL_RECOVERY.md](CREDENTIAL_RECOVERY.md#智谱--glm-bigmodel-api-key备用-generator)

创建 API Key。

无论换什么模型，都必须通过：

```bash
python3 automation/tests/validate_report.py <candidate.md>
```

才能 delivery。

---

# 7. GitHub Pages

当前 Pages 是 GitHub Actions 管理，不需要额外人工 Key。

workflow：

`.github/workflows/build-game-daily-index-and-site.yml`

手工验证：

1. GitHub Actions 里运行 `Build Game Daily Index and Site`
2. 检查：
   <https://suesam.github.io/game-daily/>

如果换成 Phase 2 direct commit，需要按 `MIGRATION.md` 修改 build trigger。

---

# 8. 全链路验收

不要只看“命令没报错”。

## Generator

- [ ] target date 正确
- [ ] Day N 正确
- [ ] validator PASS
- [ ] URL / 引用闭合

## Gmail（Phase 1）

- [ ] Sent 中有邮件
- [ ] 有真实 `.md` attachment
- [ ] 文件名严格正确
- [ ] UTF-8

## GitHub

- [ ] `reports/YYYY/MM/YYYY-MM-DD.md` 存在
- [ ] 内容与 final Markdown 一致

## Pages

- [ ] 首页出现今天日报
- [ ] 单篇 HTML 可打开

## WeChat

- [ ] dry-run 成功
- [ ] access_token 可获取
- [ ] 草稿创建/更新成功
- [ ] source URL 指向正确 Pages 页面

## Timers

- [ ] generator timer
- [ ] WeChat timer
- [ ] watchdog timer（仅 Phase 1）

---

# 9. 最终原则

恢复时永远从：

`Contract -> Code -> Config names -> Credentials -> Validator -> Delivery`

这个顺序走。

不要从“找当年的 Key”开始。

真正不可替代的资产是：
- GitHub 历史日报
- generation contract
- pipeline code
- validator
- migration docs

所有 Key 都应该被视为**可轮换依赖**。
