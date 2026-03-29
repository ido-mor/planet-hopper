#!/bin/zsh
set -euo pipefail

PORT="${1:-8000}"

get_ip() {
  local ip
  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  if [[ -n "$ip" ]]; then
    echo "$ip"
    return 0
  fi
  ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  if [[ -n "$ip" ]]; then
    echo "$ip"
    return 0
  fi
  echo "127.0.0.1"
}

IP_ADDR="$(get_ip)"

echo ""
echo "Starting local game server on port $PORT"
echo "On your iPhone (same Wi-Fi), open:"
echo "http://$IP_ADDR:$PORT"
echo ""
echo "Press Ctrl+C to stop."
echo ""

python3 -m http.server "$PORT" --bind 0.0.0.0
