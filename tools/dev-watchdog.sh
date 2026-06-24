#!/usr/bin/env bash
# Vite dev server 看门狗：体现「网络断了就一直重试」准则。
# 每 10s 探测一次；掉线则自动重启并轮询直到恢复（最多等 60s），永不放弃。
# 用法： bash tools/dev-watchdog.sh   （Ctrl+C 退出）
set -u
cd "$(dirname "$0")/.."
URL="http://localhost:5173/"
LOG=/tmp/red-devil-web-dev.log

probe() { curl -s -o /dev/null -m 5 -w "%{http_code}" "$URL" 2>/dev/null; }
start() { FORCE_COLOR=1 pnpm --filter @red-devil/web dev >"$LOG" 2>&1 & }

echo "[watchdog] 守护 $URL（掉线自动重启重试）"
while true; do
  code=$(probe)
  if [ "$code" != "200" ]; then
    echo "$(date +%H:%M:%S) dev server 掉线 (HTTP=$code) → 重启重试"
    start
    for i in $(seq 1 30); do
      sleep 2
      [ "$(probe)" = "200" ] && { echo "$(date +%H:%M:%S) 已恢复 (200)"; break; }
    done
  fi
  sleep 10
done
