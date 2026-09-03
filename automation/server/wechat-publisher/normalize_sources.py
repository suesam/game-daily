#!/usr/bin/env python3
from pathlib import Path
import re
import sys

URL_RE = re.compile(r'https?://[^\s<>]+')
AUTOLINK_RE = re.compile(r'<(https?://[^>]+)>')

GENERIC = {'原始链接','链接','游戏页','排行榜','畅销榜','新游榜','Build','Agentic Studio','IF:CARGO','Pharos Night','讨论样本（具体帖子）'}

def clean_line(s):
    s=s.strip()
    if s.startswith('>'): s=s[1:].strip()
    s=s.rstrip('  ')
    return s

def clean_label(s):
    s=re.sub(r'<https?://[^>]+>|https?://\S+','',s).strip()
    s=s.rstrip('：:').strip()
    for prefix in ('来源：','来源:'):
        if s.startswith(prefix): s=s[len(prefix):].strip()
    return s or '来源'

def normalize(text):
    # Remove an existing final source section for idempotence.
    text=re.split(r'\n## 八、来源链接\s*\n', text, maxsplit=1)[0].rstrip()+"\n"
    blocks=re.split(r'(\n\s*\n)', text)
    sources=[]
    url_to_num={}
    out=[]
    current_section=''

    for part in blocks:
        stripped=part.strip()
        if stripped.startswith('### '):
            current_section=stripped.splitlines()[0][4:].strip()
        urls=[]
        for m in AUTOLINK_RE.finditer(part): urls.append(m.group(1))
        tmp=AUTOLINK_RE.sub('',part)
        urls += [m.group(0).rstrip('.,;，。；）)]}') for m in URL_RE.finditer(tmp)]
        if not urls:
            out.append(part); continue

        lines=[clean_line(x) for x in part.splitlines() if clean_line(x)]
        context=''
        entries=[]
        for line in lines:
            lm_urls=AUTOLINK_RE.findall(line)
            bare_tmp=AUTOLINK_RE.sub('',line)
            lm_urls += [m.group(0).rstrip('.,;，。；）)]}') for m in URL_RE.finditer(bare_tmp)]
            if not lm_urls:
                context=clean_label(line)
                continue
            for url in lm_urls:
                before=line.split(url,1)[0].replace('<','').strip().rstrip('：:').strip()
                label=clean_label(before)
                if label in ('原始链接','链接','来源') or not label:
                    label=context or current_section or '来源'
                elif label in GENERIC and current_section:
                    label=f'{current_section}｜{label}'
                if url not in url_to_num:
                    num=len(sources)+1
                    url_to_num[url]=num
                    sources.append((num,label,url))
                entries.append((url_to_num[url],label))
        seen=set(); refs=[]; labels=[]
        for num,label in entries:
            if num in seen: continue
            seen.add(num); refs.append(num); labels.append(label)
        ref_text=''.join(f'[{n}]' for n in refs)
        label_text='；'.join(dict.fromkeys(labels))
        replacement=f'> **来源引用｜{ref_text}**\n> {label_text}'
        out.append(replacement)

    body=''.join(out).rstrip()
    source_lines=['','', '## 八、来源链接','']
    for num,label,url in sources:
        source_lines += [f'> **[{num}] {label}**  ', f'> <{url}>', '']
    return body+'\n'+'\n'.join(source_lines).rstrip()+'\n', sources

if __name__=='__main__':
    p=Path(sys.argv[1])
    text=p.read_text(encoding='utf-8')
    new,sources=normalize(text)
    p.write_text(new,encoding='utf-8')
    before,after=new.split('\n## 八、来源链接\n',1)
    print('sources:',len(sources))
    print('urls_before_sources_section:',len(URL_RE.findall(before)))
    print('urls_in_sources_section:',len(URL_RE.findall(after)))
