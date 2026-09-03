#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

URL_RE = re.compile(r"https?://[^\s<>]+")
H1_RE = re.compile(r"^# AI 游戏每日简报｜(\d{4}-\d{2}-\d{2})｜Day\s*(\d+)(?:：.*)?$")
ATTACHMENT_RE = re.compile(r"^AI游戏每日简报_(\d{4}-\d{2}-\d{2})_Day(\d+)\.md$")
ARCHIVE_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})\.md$")
SOURCE_BLOCK_RE = re.compile(
    r"(?m)^>\s*\*\*\[(\d+)\]\s+.*?\*\*\s*$"
    r"\n^>\s*<(https?://[^>]+)>\s*$"
)
REF_LINE_RE = re.compile(r"(?m)^>\s*\*\*来源引用｜([^\n*]+(?:\[[0-9]+\][^\n*]*)?)\*\*\s*$")
NUM_RE = re.compile(r"\[(\d+)\]")

REQUIRED_H2 = [
    "## 一、今日核心动态",
    "## 二、平台热榜：大家现在在玩什么",
    "## 三、AI 游戏进展：AI 今天真正改变了什么？",
    "## 四、研究雷达：实验室里在试什么？",
    "## 五、社交讨论：玩家和开发者最近在聊什么？",
    "## 六、今天怎么看？",
    "## 七、今天留一个问题",
    "## 八、来源链接",
]


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate a Game Daily canonical Markdown file.")
    ap.add_argument("path")
    args = ap.parse_args()

    path = Path(args.path)
    errors: list[str] = []

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print("FAIL: file is not valid UTF-8", file=sys.stderr)
        return 1

    lines = text.splitlines()
    if not lines:
        print("FAIL: empty report", file=sys.stderr)
        return 1

    h1 = lines[0].lstrip("\ufeff")
    match = H1_RE.fullmatch(h1)
    if not match:
        fail(errors, "H1 does not match Game Daily format")
        report_date = None
        day = None
    else:
        report_date, day = match.groups()

    name_match = ATTACHMENT_RE.fullmatch(path.name)
    if not name_match:
        name_match = ARCHIVE_RE.fullmatch(path.name)
        if name_match and report_date and name_match.group(1) != report_date:
            fail(errors, "archive filename date does not match H1")
    elif report_date:
        if name_match.group(1) != report_date:
            fail(errors, "attachment filename date does not match H1")
        if day and name_match.group(2) != day:
            fail(errors, "attachment Day N does not match H1")

    for heading in REQUIRED_H2:
        if heading not in text:
            fail(errors, f"missing heading: {heading}")

    h2_lines = [line.strip() for line in lines if line.startswith("## ")]
    if not h2_lines or h2_lines[-1] != "## 八、来源链接":
        fail(errors, "source section must be the final H2 section")

    marker = "\n## 八、来源链接"
    if marker not in text:
        before_sources = text
        source_text = ""
    else:
        before_sources, source_text = text.split(marker, 1)

    leaked = URL_RE.findall(before_sources)
    if leaked:
        fail(errors, f"{len(leaked)} URL(s) found before source section")

    source_pairs = [(int(n), url) for n, url in SOURCE_BLOCK_RE.findall(source_text)]
    if not source_pairs:
        fail(errors, "no parseable source entries found")
        source_numbers: list[int] = []
        source_urls: list[str] = []
    else:
        source_numbers = [n for n, _ in source_pairs]
        source_urls = [u for _, u in source_pairs]

        expected = list(range(1, len(source_numbers) + 1))
        if source_numbers != expected:
            fail(errors, f"source numbering is not continuous: {source_numbers}")

        if len(source_urls) != len(set(source_urls)):
            fail(errors, "duplicate source URL detected")

    used_refs: list[int] = []
    for line_match in REF_LINE_RE.finditer(before_sources):
        used_refs.extend(int(x) for x in NUM_RE.findall(line_match.group(0)))

    if used_refs:
        source_set = set(source_numbers)
        missing = sorted(set(used_refs) - source_set)
        if missing:
            fail(errors, f"body references missing from source section: {missing}")

        unused = sorted(source_set - set(used_refs))
        if unused:
            fail(errors, f"source entries never referenced in body: {unused}")
    elif source_numbers:
        fail(errors, "source entries exist but no body source-reference blocks were found")

    source_urls_all = re.findall(r"<(https?://[^>]+)>", source_text)
    if source_pairs and len(source_urls_all) != len(source_pairs):
        fail(errors, "source section contains URL(s) outside the canonical source-entry format")

    if errors:
        print("FAIL")
        for item in errors:
            print(f"- {item}")
        return 1

    print(
        f"PASS: date={report_date} Day={day} "
        f"sources={len(source_pairs)} body_refs={len(set(used_refs))}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
