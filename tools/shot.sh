#!/usr/bin/env bash
# uso: tools/shot.sh <url> <saida.png> [LxA]
# Tira um print headless (WebGL via SwiftShader) de uma página servida pelo `npm run dev`.
set -euo pipefail
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --default-background-color=00000000 --window-size="${3:-1600,1150}" --virtual-time-budget=12000 \
  --screenshot="$2" "$1" 2>/dev/null
echo "salvo em $2"
