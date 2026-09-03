# Credential Recovery / Key 获取与重建手册

> 最后核对：2026-09-04。  
> 目标：即使几年后换电脑、换服务器、忘记当初怎么配，也能只靠本仓库把凭证重新申请并恢复整条链路。  
> **本文件永远不保存真实 Key / Secret / Password。**

---

## 0. 先分清：什么需要保存，什么可以重新生成

| 名称 | 类型 | 当前用途 | 丢失后怎么办 |
|---|---|---|---|
| `GMAIL_USERNAME` | 普通配置 | GitHub Action 读取 Gmail Sent | 重新填写 Gmail 地址 |
| `GMAIL_APP_PASSWORD` | **长期 Secret** | Gmail IMAP；Phase 1 也可用于 SMTP | Google 不能帮你“找回原值”，重新生成一个 App Password |
| Server `GITHUB_TOKEN` | **长期 Secret** | watchdog dispatch GitHub workflow | 新建 Fine-grained PAT，替换服务器 env |
| `WECHAT_APP_ID` | 标识符 | 微信公众号 API | 公众号后台重新查看 |
| `WECHAT_APP_SECRET` | **长期 Secret** | 换取微信 access_token | 无法确认旧值时，在公众号后台重置，再更新服务器 |
| 微信 `access_token` | **短期运行时 Token** | 调用微信 API | **不要长期保存/手工备份**；运行时用 AppID + AppSecret 获取 |
| `WECHAT_THUMB_MEDIA_ID` | 资源 ID，不是密码 | 微信草稿封面 | 重新上传永久图片素材，保存返回的 media_id |
| `state.json` | 运行状态，不是 Secret | 判断同一天是 update 还是 create | 可重新生成；丢失后下一次可能新建草稿而不是更新旧草稿 |
| Kimi / GLM API Key | **长期 Secret** | 新 Game Daily Generator | 在模型开放平台创建新 Key；丢失则轮换/重建 |
| GitHub Pages token | **不存在** | Pages 部署 | 不需要人工申请，workflow 使用 GitHub Actions 内建权限 |

原则：**能重新生成的凭证不要提交 Git；只把“如何重新生成”写进 Git。**

---

# 1. Gmail：`GMAIL_APP_PASSWORD`

当前 `.github/workflows/import-game-daily.yml` 通过：

- Server: `imap.gmail.com`
- Port: `993`
- SSL: yes

登录 Gmail Sent。

如果 Phase 1 的新 generator 继续“发 Gmail 给自己”，可以复用同一个 Google App Password 进行 SMTP：

- SMTP: `smtp.gmail.com`
- SSL: `465`
- STARTTLS: `587`

Google 官方协议说明：  
<https://developers.google.com/workspace/gmail/imap/imap-smtp>

## 1.1 前置条件：开启两步验证

进入：

<https://myaccount.google.com/security>

确保 Google Account 已开启 **2-Step Verification（两步验证）**。

Google 官方说明：App Password 需要先启用两步验证：  
<https://support.google.com/accounts/answer/185833>

## 1.2 创建 App Password

直接入口：

<https://myaccount.google.com/apppasswords>

登录后：

1. 创建新的 App Password。
2. 名称建议写：
   - `game-daily-github`
   - 或 `game-daily-server`
3. Google 会显示一段 App Password。
4. **当场复制并保存到密码管理器。**
5. 不要写到 Markdown、shell history、聊天记录或 Git。

然后在 GitHub 仓库中设置：

`suesam/game-daily -> Settings -> Secrets and variables -> Actions -> New repository secret`

创建：

```text
GMAIL_USERNAME=<你的 Gmail 地址>
GMAIL_APP_PASSWORD=<刚生成的 App Password>
```

GitHub 官方 repository secret 步骤：  
<https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets>

当前仓库 secrets 页面可直接进入：

<https://github.com/suesam/game-daily/settings/secrets/actions>

## 1.3 如果找不到 App Password 菜单

Google 官方列出的常见原因包括：

- 没有开启 2-Step Verification
- 账号只使用安全密钥进行两步验证
- 工作/学校/组织账号受管理员策略限制
- 开启了 Advanced Protection

不要改用 Google 主密码。

## 1.4 忘记 App Password

App Password 不应该靠“查看旧值”恢复。

处理方式：

1. 进入 App Password 页面。
2. 撤销旧的 `game-daily-...`。
3. 创建新的。
4. 覆盖 GitHub Actions secret。
5. 如果 server generator 也使用 Gmail SMTP，同时替换 server env。

Google Account 主密码修改后，已有 App Password 可能被撤销，需要重新生成。

## 1.5 快速测试 IMAP

在**本地或服务器临时终端**执行，避免把密码写入脚本：

```python
import imaplib
mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
mail.login("YOUR_GMAIL", "YOUR_APP_PASSWORD")
print("Gmail IMAP OK")
mail.logout()
```

测试完不要把真实值保存进文件。

---

# 2. GitHub Actions Repository Secrets

这不是另外一种 Key，而是**存放其他 Key 的安全位置**。

当前 Gmail import 需要：

```text
GMAIL_USERNAME
GMAIL_APP_PASSWORD
```

入口：

<https://github.com/suesam/game-daily/settings/secrets/actions>

步骤：

1. Repository -> Settings
2. Secrets and variables
3. Actions
4. Secrets
5. New repository secret
6. 填 Name
7. 填 Secret
8. Add secret

GitHub Secrets 创建后不应该依赖“以后再读取明文”；忘记上游 Secret 时，正确操作通常是**重新生成上游 Secret，然后覆盖 GitHub Secret**。

---

# 3. Server watchdog：Fine-grained GitHub PAT

当前服务器：

`/home/ubuntu/game-daily-watchdog/check_daily.sh`

使用：

```dotenv
GITHUB_TOKEN=...
```

注意：这里的 `GITHUB_TOKEN` 是**你自己创建的 Server PAT**，不是 GitHub Actions 每次 workflow 自动提供的内建 `GITHUB_TOKEN`。

## 3.1 创建入口

GitHub：

`头像 -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens -> Generate new token`

直接入口：

<https://github.com/settings/personal-access-tokens/new>

官方说明：

<https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens>

## 3.2 当前 watchdog 所需权限

建议：

```text
Token name:
  game-daily-watchdog

Resource owner:
  suesam

Repository access:
  Only select repositories
  -> game-daily

Repository permissions:
  Actions: Read and write
```

当前 watchdog 只是调用：

`POST /repos/suesam/game-daily/actions/workflows/import-game-daily.yml/dispatches`

GitHub 官方对 workflow dispatch 的 Fine-grained PAT 要求是：

`Actions repository permission: write`

官方 API 文档：

<https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event>

旧文档中的 `Contents: Read` 对 dispatch 本身不是硬性要求；如果今后脚本还读取私有 repo 内容，再按实际 API 增加最小权限。

## 3.3 Expiration

不要无脑创建无限期 PAT。

建议：
- 30 / 90 / 180 天，按维护习惯选择
- 在密码管理器里备注用途和过期日

如果以后真正产品化，长生命周期服务更适合 GitHub App，而不是个人 PAT。

## 3.4 写入服务器

服务器文件：

`/home/ubuntu/game-daily-watchdog/env`

内容：

```dotenv
GITHUB_TOKEN=github_pat_xxx
```

权限建议：

```bash
chmod 600 /home/ubuntu/game-daily-watchdog/env
```

不要把真实 PAT 写进：

- `env.example`
- Git
- systemd unit
- watchdog log

## 3.5 忘记 / 过期 / 泄露

1. GitHub Developer settings 中 revoke/delete 旧 token。
2. 创建新的 Fine-grained PAT。
3. 替换服务器 `env`。
4. 手工运行：

```bash
/home/ubuntu/game-daily-watchdog/check_daily.sh
```

Phase 2 去掉 Gmail import 后，这个 watchdog 和 PAT 都应该停用。

---

# 4. 微信公众号：AppID / AppSecret / IP 白名单

入口：

<https://mp.weixin.qq.com/>

使用公众号管理员扫码登录。

微信公众号后台 UI 名称可能调整；通常在：

`设置与开发 / 开发 -> 开发接口管理 / 开发设置 -> 开发者 ID`

附近可以看到：

- AppID
- AppSecret 的生成/重置入口
- IP 白名单

微信 access_token 官方文档入口：

<https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html>

## 4.1 获取 `WECHAT_APP_ID`

AppID 是标识符，不是密码。

登录公众号后台，在开发相关设置页复制 AppID：

```dotenv
WECHAT_APP_ID=...
```

写入：

`/opt/wechat-publisher/.env`

## 4.2 获取 / 重置 `WECHAT_APP_SECRET`

AppSecret 是高敏感长期 Secret。

如果后台没有显示原 Secret，或者已经忘记：

1. 不要猜。
2. 使用后台的“重置 / 生成 AppSecret”流程。
3. 按管理员扫码/身份验证完成重置。
4. **立即保存到密码管理器。**
5. 更新服务器：
   `/opt/wechat-publisher/.env`

```dotenv
WECHAT_APP_SECRET=...
```

AppSecret 重置后，旧 Secret 应视为失效。

## 4.3 配置服务器 IP 白名单

微信 API 常要求调用服务器公网出口 IP 在公众号 IP 白名单内。

在服务器查询当前公网 IPv4：

```bash
curl -4 https://api.ipify.org
echo
```

或者从云厂商控制台查看实例的公网 / Reserved Public IP。

把这个 IP 添加到公众号开发设置中的 **IP 白名单**。

如果未来：
- 换服务器
- 换公网 IP
- Oracle Cloud 实例重新分配公网地址

都要重新检查这一项。

因此“微信 API 突然 40164 / IP 不合法”时，第一检查项就是白名单。

## 4.4 测试 AppID + AppSecret

不要手工长期保存 access_token。

临时测试：

```bash
curl -sS \
  "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=YOUR_APP_ID&secret=YOUR_APP_SECRET"
```

成功会返回：
- `access_token`
- `expires_in`

当前 `wechat_api.py` 会在运行时自动获取 access_token，因此：

**需要备份的是 AppID/AppSecret，不是 access_token。**

---

# 5. 微信封面：`WECHAT_THUMB_MEDIA_ID`

它不是密码。

公众号草稿 API 要求封面素材 ID，所以当前代码保存：

```dotenv
WECHAT_THUMB_MEDIA_ID=...
```

## 5.1 丢失后的最简单恢复方式

准备一张封面图，例如：

`/path/to/cover.jpg`

确保 AppID/AppSecret 已配置，然后：

```bash
cd /opt/wechat-publisher
.venv/bin/python upload_cover.py /path/to/cover.jpg
```

脚本会调用永久素材 API，并输出：

```text
永久封面上传成功
<media_id>
```

把返回值写入：

`/opt/wechat-publisher/.env`

```dotenv
WECHAT_THUMB_MEDIA_ID=<media_id>
```

以后不必依赖记住旧 media_id：**重新上传永久封面即可恢复。**

---

# 6. Kimi API Key（推荐作为新 Generator 候选）

Kimi API 开放平台：

<https://platform.moonshot.cn/>

API Key 页面：

<https://platform.moonshot.cn/console/api-keys>

官方快速开始：

<https://platform.moonshot.cn/docs/guide/start-using-kimi-api>

官方 API 认证说明：

<https://platform.moonshot.cn/docs/api>

## 6.1 创建

1. 登录 Kimi API 开放平台。
2. 进入 API Key 管理。
3. 创建新的 API Key。
4. 给 Key 一个明确用途名，例如：
   `game-daily-prod`
5. 保存到密码管理器。
6. 写入新 generator 的 server env。

推荐标准变量：

```dotenv
GAME_DAILY_MODEL_PROVIDER=moonshot
GAME_DAILY_MODEL=kimi-k3
MOONSHOT_API_KEY=...
```

或者统一 adapter 接口：

```dotenv
GAME_DAILY_API_KEY=...
```

但代码中最好仍保留 provider-specific env 支持，便于排错。

Kimi 官方明确建议 API Key 放服务端环境变量，不要暴露在客户端代码、公开仓库或日志中。

## 6.2 丢失

不要从 Git 历史、日志或聊天里找 Key。

在控制台：
1. 创建新 Key。
2. 更新 server env。
3. 验证成功。
4. revoke 旧 Key。

---

# 7. 智谱 / GLM BigModel API Key（备用 Generator）

BigModel：

<https://open.bigmodel.cn/>

API Key 页面：

<https://open.bigmodel.cn/usercenter/apikeys>

建议：

```dotenv
GAME_DAILY_MODEL_PROVIDER=zhipu
ZHIPU_API_KEY=...
```

创建逻辑与 Kimi 相同：
1. 登录开放平台
2. 创建 API Key
3. 命名为 `game-daily-prod`
4. 保存到密码管理器
5. 仅写服务器 env / secret store
6. 丢失则轮换，不从公开文件恢复

---

# 8. Search Provider Key

截至本手册版本，**Game Daily 新 generator 的 SearchAdapter 尚未锁定某个付费搜索供应商**。

这是有意保留的 adapter boundary，不要为了“补齐配置”随便申请一个 Key。

未来确定使用某个 provider 后，需要同时补充：

1. 官方申请入口
2. API Key 名称
3. 免费额度 / 计费
4. Base URL
5. server env 名称
6. 最小测试
7. 丢失/轮换流程
8. provider outage 时的 fallback

配置占位：

```dotenv
GAME_DAILY_SEARCH_PROVIDER=
GAME_DAILY_SEARCH_API_KEY=
```

---

# 9. Phase 2：Server 直接 push GitHub 时的凭证

目前 `/opt/game-daily` 只是从公开 repo pull，所以拉取不需要 Secret。

如果 Phase 2 改成：

`generator -> git commit -> git push -> GitHub`

服务器才需要写权限。

推荐优先级：

1. **GitHub App**：长期产品化最佳
2. **SSH Deploy Key + write access**：单仓库服务器很好用
3. Fine-grained PAT：最容易配置，但属于个人凭证

如果暂时用 Fine-grained PAT：

```text
Repository:
  suesam/game-daily

Permissions:
  Contents: Read and write
```

如果 runner 还主动 dispatch Actions，再额外加：

```text
Actions: Read and write
```

不要复用 watchdog PAT 后无限扩大权限；最好为不同职责创建不同凭证。

---

# 10. 密码管理器应该记录什么

建议每个 Secret 记录：

```text
Name:
Game Daily / WeChat AppSecret

Account:
公众号名称 / GitHub suesam / Gmail / Moonshot

Purpose:
game-daily production

Stored in runtime:
服务器 /opt/wechat-publisher/.env

Creation date:
YYYY-MM-DD

Expiration:
如有

Rotation note:
重置后还要修改哪些地方
```

**密码管理器保存 Secret，本 GitHub 仓库保存重建知识。**

这两个职责不要混。

---

# 11. 凭证轮换影响表

## Gmail App Password 轮换

需要修改：
- GitHub Actions `GMAIL_APP_PASSWORD`
- Phase 1 server generator 的 SMTP App Password（如果使用）

不需要修改：
- WeChat
- GitHub Pages
- Kimi/GLM

## GitHub watchdog PAT 轮换

需要修改：
- `/home/ubuntu/game-daily-watchdog/env`

不需要修改：
- GitHub Actions Gmail secrets
- WeChat
- model API Key

## WeChat AppSecret 轮换

需要修改：
- `/opt/wechat-publisher/.env`

然后重新测试 access_token。

不需要重新上传封面；原 `WECHAT_THUMB_MEDIA_ID` 通常仍可继续使用。

## Kimi / GLM API Key 轮换

只修改新 generator 的 env / secret store。

canonical Markdown 与下游完全不受影响。

---

# 12. 从零恢复时先看这里

如果不是单独丢一个 Key，而是**整台服务器重装 / 整套系统重新部署**，不要逐项乱配。

按：

[REBUILD_FROM_ZERO.md](REBUILD_FROM_ZERO.md)

的顺序执行。
