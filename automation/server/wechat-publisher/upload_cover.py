#!/usr/bin/env python3
import argparse, os
from dotenv import load_dotenv
from wechat_api import get_access_token, upload_permanent_image

load_dotenv()
p = argparse.ArgumentParser()
p.add_argument("image")
a = p.parse_args()
appid = os.getenv("WECHAT_APP_ID","").strip()
secret = os.getenv("WECHAT_APP_SECRET","").strip()
if not appid or not secret:
    raise SystemExit("请先在 .env 中设置 WECHAT_APP_ID / WECHAT_APP_SECRET")
token = get_access_token(appid, secret)
result = upload_permanent_image(token, a.image)
print("✅ 永久封面上传成功")
print(result["media_id"])
