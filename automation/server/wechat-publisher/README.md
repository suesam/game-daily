# WeChat Publisher deployment

这是服务器 `/opt/wechat-publisher` 当前生产代码的文本快照。运行态密钥、虚拟环境、state 和封面二进制未提交。

## Files

- `publish_latest.py`：主入口。
- `wechat_api.py`：微信 access token / draft add / draft update / permanent image API。
- `md_to_wechat.py`：Markdown -> 微信兼容 inline-style HTML。
- `normalize_sources.py`：历史/手动来源结构归一化工具；publisher 主入口不会自动调用它。
- `upload_cover.py`：首次上传永久封面素材。
- `requirements.txt`
- `.env.example`

## New server setup

示例路径保持与现网一致：

```bash
git clone https://github.com/suesam/game-daily.git /opt/game-daily

mkdir -p /opt/wechat-publisher
cp automation/server/wechat-publisher/*.py /opt/wechat-publisher/
cp automation/server/wechat-publisher/requirements.txt /opt/wechat-publisher/
cp automation/server/wechat-publisher/.env.example /opt/wechat-publisher/.env

python3 -m venv /opt/wechat-publisher/.venv
/opt/wechat-publisher/.venv/bin/pip install -r /opt/wechat-publisher/requirements.txt
```

然后填写 `/opt/wechat-publisher/.env`。

## Cover

如果继续使用原公众号并保留现有永久素材，可以直接配置已有 `WECHAT_THUMB_MEDIA_ID`，运行时不需要本地 `cover.jpg`。

如果需要重新上传：

```bash
cd /opt/wechat-publisher
.venv/bin/python upload_cover.py /path/to/cover.jpg
```

把返回的 media_id 写入 `WECHAT_THUMB_MEDIA_ID`。

## Test

先 dry-run：

```bash
cd /opt/wechat-publisher
.venv/bin/python publish_latest.py --dry-run
```

指定某篇：

```bash
.venv/bin/python publish_latest.py \
  --report /opt/game-daily/reports/2026/09/2026-09-03.md \
  --no-pull \
  --dry-run
```

实际创建/更新草稿时去掉 `--dry-run`。

`state.json` 不需要手工创建。首次成功发布后会自动生成；同一天内容 hash 变化时会更新原草稿。

## systemd

安装 unit 参考：
`../../systemd/README.md`

现网 service 默认：
- WorkingDirectory：`/opt/wechat-publisher`
- Python：`/opt/wechat-publisher/.venv/bin/python`
- Repo：`/opt/game-daily`

如果迁移到不同目录，必须同步修改 unit 与 `.env`。
