from __future__ import annotations
import json
import requests
from pathlib import Path

API="https://api.weixin.qq.com"
class WeChatAPIError(RuntimeError): pass

def _check(data,action):
    if data.get("errcode") not in (None,0):
        raise WeChatAPIError(f"{action} failed: errcode={data.get('errcode')} errmsg={data.get('errmsg','')}")
    return data

def _post_json(path,access_token,payload,action):
    body=json.dumps(payload,ensure_ascii=False).encode("utf-8")
    r=requests.post(f"{API}{path}",params={"access_token":access_token},data=body,headers={"Content-Type":"application/json; charset=utf-8"},timeout=60)
    r.raise_for_status()
    return _check(json.loads(r.content.decode("utf-8")),action)

def get_access_token(app_id,app_secret):
    r=requests.get(f"{API}/cgi-bin/token",params={"grant_type":"client_credential","appid":app_id,"secret":app_secret},timeout=20)
    r.raise_for_status(); data=_check(json.loads(r.content.decode("utf-8")),"get_access_token")
    token=data.get("access_token")
    if not token: raise WeChatAPIError("get_access_token returned no access_token")
    return token

def upload_permanent_image(access_token,image_path):
    path=Path(image_path)
    mime={".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".gif":"image/gif",".bmp":"image/bmp"}.get(path.suffix.lower())
    if not mime: raise ValueError("Cover must be jpg/jpeg/png/gif/bmp")
    with path.open("rb") as f:
        r=requests.post(f"{API}/cgi-bin/material/add_material",params={"access_token":access_token,"type":"image"},files={"media":(path.name,f,mime)},timeout=60)
    r.raise_for_status(); data=_check(json.loads(r.content.decode("utf-8")),"upload_permanent_image")
    if not data.get("media_id"): raise WeChatAPIError("upload_permanent_image returned no media_id")
    return data

def article_payload(*,title,content,thumb_media_id,author="",digest="",content_source_url="",need_open_comment=0,only_fans_can_comment=0):
    return {"article_type":"news","title":title,"author":author,"digest":digest,"content":content,"content_source_url":content_source_url,"thumb_media_id":thumb_media_id,"need_open_comment":int(bool(need_open_comment)),"only_fans_can_comment":int(bool(only_fans_can_comment))}

def add_draft(access_token,**kwargs):
    data=_post_json("/cgi-bin/draft/add",access_token,{"articles":[article_payload(**kwargs)]},"draft/add")
    if not data.get("media_id"): raise WeChatAPIError("draft/add returned no media_id")
    return data

def update_draft(access_token,media_id,**kwargs):
    payload={"media_id":media_id,"index":0,"articles":article_payload(**kwargs)}
    return _post_json("/cgi-bin/draft/update",access_token,payload,"draft/update")
