#!/usr/bin/env bash
set -euo pipefail

export TZ=Asia/Shanghai
BASE_DIR="/home/ubuntu/game-daily-watchdog"
ENV_FILE="$BASE_DIR/env"
LOG_PREFIX="[game-daily-watchdog]"

DATE="$(date +%F)"
YEAR="$(date +%Y)"
MONTH="$(date +%m)"
REPORT_URL="https://raw.githubusercontent.com/suesam/game-daily/main/reports/${YEAR}/${MONTH}/${DATE}.md"
DISPATCH_URL="https://api.github.com/repos/suesam/game-daily/actions/workflows/import-game-daily.yml/dispatches"

log() {
  printf '%s %s %s\n' "$LOG_PREFIX" "$(date '+%F %T %Z')" "$*"
}

if curl -fsS --max-time 20 "$REPORT_URL" >/dev/null; then
  log "OK: report already exists for $DATE"
  exit 0
fi

log "WARN: report missing for $DATE"
if [[ ! -f "$ENV_FILE" ]]; then
  log "ERROR: missing $ENV_FILE; cannot trigger repair"
  exit 2
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  log "ERROR: GITHUB_TOKEN is empty; cannot trigger repair"
  exit 2
fi

log "Triggering Import Game Daily from Gmail"
http_code="$(curl -sS -o "$BASE_DIR/dispatch-response.txt" -w '%{http_code}' \
  --max-time 30 \
  -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "$DISPATCH_URL" \
  -d '{"ref":"main"}')"

if [[ "$http_code" != "204" ]]; then
  log "ERROR: workflow dispatch failed with HTTP $http_code"
  exit 3
fi

log "Dispatch accepted; waiting 180 seconds before verification"
sleep 180
if curl -fsS --max-time 20 "$REPORT_URL" >/dev/null; then
  log "REPAIRED: report appeared for $DATE"
  exit 0
fi

log "ERROR: report still missing after repair attempt"
exit 4
