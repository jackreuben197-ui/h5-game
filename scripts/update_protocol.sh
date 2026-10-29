#!/usr/bin/env bash
# H5 协议同步脚本。
#
# protobuf 已统一由 @silenthill/agreement-web 提供，不再把生成文件复制进 src/。
# H5 收到 WebSocket 原始包后，一份直接交给 H5 业务解码，另一份原样透传给 Cocos。

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_MANAGER="$(node -p "require('${ROOT_DIR}/package.json').packageManager")"

if [[ ! "$PACKAGE_MANAGER" =~ ^pnpm@[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "# error: package.json 中缺少有效的 pnpm packageManager" >&2
  exit 1
fi

cd "$ROOT_DIR"
echo "# updating @silenthill/agreement-web ..."
corepack "$PACKAGE_MANAGER" update @silenthill/agreement-web
node scripts/check-protocol.mjs
echo "# done. protocol runtime and pnpm-lock.yaml are updated"
