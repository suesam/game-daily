#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, re, subprocess
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
from dotenv import load_dotenv
from md_to_wechat import split_title, short_title, make_digest, markdown_to_wechat_html
from wechat_api import get_access_token, add_draft, update_draft

REPORT_RE=re.compile(r'^\d{4}-\d{2}-\d{2}\.md$')

def git_pull(repo):
    subprocess.run(['git','-C',str(repo),'reset','--hard','HEAD'],check=True,stdout=subprocess.DEVNULL)
    subprocess.run(['git','-C',str(repo),'pull','--ff-only','origin','main'],check=True)

def latest_report(repo):
    items=[p for p in repo.glob('reports/????/??/*.md') if REPORT_RE.fullmatch(p.name)]
    if not items: raise FileNotFoundError('没有找到正式日报')
    return max(items,key=lambda p:p.stem)

def file_sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def load_state(path):
    if not path.exists(): return {}
    try: return json.loads(path.read_text(encoding='utf-8'))
    except Exception: return {}
def save_state(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

def main():
    load_dotenv('/opt/wechat-publisher/.env')
    ap=argparse.ArgumentParser()
    ap.add_argument('--report'); ap.add_argument('--no-pull',action='store_true')
    ap.add_argument('--dry-run',action='store_true'); ap.add_argument('--force',action='store_true')
    args=ap.parse_args()
    repo=Path(os.getenv('GAME_DAILY_REPO','/opt/game-daily')).resolve()
    if not args.no_pull: git_pull(repo)
    report=Path(args.report).resolve() if args.report else latest_report(repo)
    if not args.report:
        today_bj = datetime.now(ZoneInfo('Asia/Shanghai')).date().isoformat()
        if report.stem != today_bj:
            print(f'SKIP: 尚未发现北京时间今天的正式日报（today={today_bj}, latest={report.stem}）')
            return
    text=report.read_text(encoding='utf-8')
    full_title,body=split_title(text)
    if not full_title: raise SystemExit('日报缺少 H1')
    title=short_title(full_title,int(os.getenv('WECHAT_TITLE_MAX','32')))
    digest=make_digest(body,int(os.getenv('WECHAT_DIGEST_MAX','0')))
    html=markdown_to_wechat_html(body)
    Path(__file__).with_name('preview.html').write_text("<!doctype html><meta charset='utf-8'>"+html,encoding='utf-8')
    sha=file_sha(report)
    state_path=Path(os.getenv('WECHAT_STATE_FILE','/opt/wechat-publisher/state.json'))
    state=load_state(state_path)
    same_report=state.get('last_report')==str(report)
    if not args.force and same_report and state.get('last_sha256')==sha:
        print('SKIP: 当前版本已同步到公众号草稿'); return
    print('日报:',report); print('标题:',title)
    if args.dry_run: print('✅ dry-run 完成，没有调用微信 API'); return
    appid=os.getenv('WECHAT_APP_ID','').strip(); secret=os.getenv('WECHAT_APP_SECRET','').strip(); thumb=os.getenv('WECHAT_THUMB_MEDIA_ID','').strip()
    if not appid or not secret or not thumb: raise SystemExit('缺少微信凭证或封面 media_id')
    base=os.getenv('WECHAT_SOURCE_BASE','https://suesam.github.io/game-daily').rstrip('/')
    y,m,_=report.stem.split('-'); source=f'{base}/reports/{y}/{m}/{report.stem}.html'
    kwargs=dict(title=title,author=os.getenv('WECHAT_AUTHOR','').strip(),digest=digest,content=html,content_source_url=source,thumb_media_id=thumb,need_open_comment=int(os.getenv('WECHAT_OPEN_COMMENT','0')),only_fans_can_comment=int(os.getenv('WECHAT_FANS_ONLY_COMMENT','0')))
    token=get_access_token(appid,secret)
    old_media=state.get('last_media_id') if same_report else None
    if old_media:
        update_draft(token,old_media,**kwargs); media_id=old_media; action='updated'
        print('✅ 已更新同一天现有公众号草稿')
    else:
        result=add_draft(token,**kwargs); media_id=result['media_id']; action='created'
        print('✅ 已创建微信公众号草稿')
    save_state(state_path,{'last_report':str(report),'last_sha256':sha,'last_media_id':media_id,'updated_at':datetime.now(timezone.utc).isoformat(),'source_url':source,'title':title,'action':action})

if __name__=='__main__': main()
