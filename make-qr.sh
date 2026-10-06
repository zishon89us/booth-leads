#!/usr/bin/env bash
# Usage: ./make-qr.sh <site-url> [tracking-query] [output-folder]
#   ./make-qr.sh https://connect.zaavya.com "utm_source=dir-connect&utm_medium=print&utm_campaign=2026"
# Writes print-ready QR codes (PNG + SVG) for the two visitor forms.
set -euo pipefail

base="${1:?Usage: ./make-qr.sh <site-url> [tracking-query] [output-folder]}"
base="${base%/}"
query="${2:-}"
out="${3:-$(dirname "$0")/qr}"
mkdir -p "$out"

for path in assessment healthcare; do
  url="$base/$path/${query:+?$query}"
  # -l H: high error correction, survives glare and smudged prints.
  qrencode -l H -s 20 -m 4 -o "$out/$path.png" "$url"
  qrencode -l H -m 4 -t SVG -o "$out/$path.svg" "$url"
  echo "$path -> $url"
done
echo "booth app (open on your own phone, do not print) -> $base/booth/"
