#!/usr/bin/env bash
# H5 协议同步脚本
# 从 agreement-web 仓库拉取 H5 所需的 protobuf 生成文件（.js + .d.ts）。
#
# 使用方法：
#   bash scripts/update_protocol.sh
#
# 新增协议步骤：
#   1. 在下方 H5_RECV_FILES 数组中加入对应的 recv_g_*_pb 文件名（不含扩展名）。
#   2. 重新运行本脚本。
#   3. 在 src/bridge/ws/ 中新建对应的 *Notify.ts decoder 文件。
#   4. 在相应 store 中订阅新 code 并调用 decoder。

set -euo pipefail

REPO_URL="https://gitlab.com/darkalliance/agreement-web.git"
REPO_DIR="agreement-web"
HOLDEM_SRC="${REPO_DIR}/holdem/pb"
H5_PB_DST="src/bridge/ws/pb/protobuf/holdem"

# H5 目前订阅的协议（全部为大厅 / 全局通知，code < 1000）。
# 新增协议时在此追加文件名（不含扩展名）；不需要改其他地方。
H5_RECV_FILES=(
  "recv_g_todo_list_pb"                # 123  MSG_S_TODO_LIST
  "recv_g_user_order_audit_pb"         # 133  MSG_S_USER_ORDER_AUDIT
  "recv_g_room_change_notify_pb"       # 140  ROOM_CHANGE_NOTIFY
  "recv_g_tribe_black_user_pb"         # 142  MSG_S_TRIBE_BLACK_USER
  "recv_g_user_trader_order_notify_pb" # 143  MSG_S_USER_TRADER_ORDER_NOTIFY
  "recv_g_user_usdt_order_notify_pb"   # 145  MSG_S_USER_USDT_ORDER_NOTIFY
  "recv_g_user_mtt_change_notify_pb"   # 151  USER_MTT_CHANGE_NOTIFY
  "recv_g_user_sng_change_notify_pb"   # 152  USER_SNG_CHANGE_NOTIFY
  "recv_g_mtt_series_notify_pb"        # 153  MTT_SERIES_NOTIFY
)

# ── 拉取 / 更新仓库 ────────────────────────────────────────────────────────────

if [ ! -d "$REPO_DIR" ]; then
  echo "# cloning ${REPO_URL} ..."
  git clone "$REPO_URL" "$REPO_DIR"
else
  echo "# pulling ${REPO_DIR} ..."
  git -C "$REPO_DIR" pull origin
fi

# ── 确保目标目录存在 ────────────────────────────────────────────────────────────

mkdir -p "$H5_PB_DST"

# ── 复制 define_pb（共享类型，所有 recv 文件均依赖）──────────────────────────────

for ext in js d.ts; do
  src_file="${HOLDEM_SRC}/define_pb.${ext}"
  if [ -f "$src_file" ]; then
    cp "$src_file" "${H5_PB_DST}/define_pb.${ext}"
    echo "# copied define_pb.${ext}"
  else
    echo "# warning: ${src_file} not found, skipped"
  fi
done

# ── 按白名单复制 recv 文件 ─────────────────────────────────────────────────────

for name in "${H5_RECV_FILES[@]}"; do
  for ext in js d.ts; do
    src_file="${HOLDEM_SRC}/${name}.${ext}"
    if [ -f "$src_file" ]; then
      cp "$src_file" "${H5_PB_DST}/${name}.${ext}"
      echo "# copied ${name}.${ext}"
    else
      echo "# warning: ${src_file} not found, skipped"
    fi
  done
done

echo "# done. H5 pb files updated in ${H5_PB_DST}/"
