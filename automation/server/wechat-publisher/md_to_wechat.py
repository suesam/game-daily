from __future__ import annotations
import re
import markdown
from bs4 import BeautifulSoup

STYLE = {
    "h2":"margin:34px 0 16px;padding-left:12px;border-left:4px solid #222;font-size:21px;line-height:1.5;font-weight:700;color:#222;",
    "h3":"margin:26px 0 12px;font-size:18px;line-height:1.55;font-weight:700;color:#222;",
    "p":"margin:12px 0;font-size:16px;line-height:1.85;color:#333;letter-spacing:0.02em;",
    "blockquote":"margin:18px 0;padding:14px 16px;border-left:4px solid #999;background:#f7f7f7;color:#444;border-radius:4px;text-align:left;",
    "ul":"margin:12px 0 12px 1.4em;padding:0;",
    "ol":"margin:12px 0 12px 1.4em;padding:0;",
    "li":"margin:7px 0;font-size:16px;line-height:1.8;color:#333;",
    "strong":"font-weight:700;color:#111;",
    "a":"color:#576b95;text-decoration:underline;word-break:break-all;",
    "code":"font-family:Menlo,Consolas,monospace;font-size:.92em;background:#f2f2f2;padding:2px 5px;border-radius:4px;",
    "pre":"margin:16px 0;padding:14px;overflow:auto;background:#f4f4f4;border-radius:6px;font-size:13px;line-height:1.6;",
    "hr":"margin:28px 0;border:0;border-top:1px solid #e5e5e5;",
}

def split_title(text):
    lines=text.lstrip("\ufeff").splitlines()
    for i,line in enumerate(lines):
        if line.startswith("# "):
            return line[2:].strip(), "\n".join(lines[i+1:]).lstrip()
        if line.strip(): break
    return "", text

def short_title(full_title,max_len=32):
    if "：" in full_title:
        prefix=full_title.split("：",1)[0].strip()
        if 0 < len(prefix) <= max_len: return prefix
    return full_title if len(full_title)<=max_len else full_title[:max_len-1].rstrip()+"…"

def make_digest(body_markdown,max_len=120):
    if max_len <= 0: return ""
    for block in re.split(r"\n\s*\n",body_markdown):
        b=block.strip()
        if not b or b.startswith(("#",">","-","*","1.","2.","3.")): continue
        b=re.sub(r"https?://\S+","",b)
        b=re.sub(r"\[([^\]]+)\]\([^)]+\)",r"\1",b)
        b=re.sub(r"[*_`~]+","",b)
        b=re.sub(r"\s+"," ",b).strip()
        if b: return b[:max_len]
    return ""

def markdown_to_wechat_html(body_markdown):
    # Markdown 是唯一内容源：不重排来源、不移动链接，只做渲染和样式。
    raw=markdown.markdown(body_markdown,extensions=["extra","sane_lists","nl2br"],output_format="html5")
    soup=BeautifulSoup(raw,"html.parser")
    for node in soup.find_all(["script","iframe","object","embed","style"]): node.decompose()
    if soup.find_all("img"):
        raise ValueError("检测到正文图片；请先实现微信正文图片上传后再发布")
    for name,style in STYLE.items():
        for tag in soup.find_all(name):
            tag["style"]=((tag.get("style","")+";"+style).strip(";"))
    for quote in soup.find_all("blockquote"):
        for p in quote.find_all("p"):
            p["style"]=((p.get("style","")+";margin:4px 0;font-size:15px;line-height:1.75;color:#444;text-align:left;").strip(";"))
    wrapper=soup.new_tag("section")
    wrapper["style"]="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;max-width:100%;word-break:break-word;"
    for child in list(soup.contents): wrapper.append(child.extract())
    return str(wrapper)
