#!/bin/sh
# Small wrapper to run cloudflared with a token stored in /etc/cloudflared/token.txt
set -e
if [ ! -f /etc/cloudflared/token.txt ]; then
  echo "Missing /etc/cloudflared/token.txt"
  exit 1
fi
TOKEN=$(cat /etc/cloudflared/token.txt)
exec cloudflared tunnel --config /etc/cloudflared/config.yml run --token "$TOKEN"