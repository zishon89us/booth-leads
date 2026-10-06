#!/usr/bin/env bash
# Usage: ./make-qr.sh <site-url> [output-folder]
#   ./make-qr.sh https://connect.zaavya.com
# Writes print-ready QR codes (PNG + SVG) for the two visitor forms.
set -euo pipefail

base="${1:?Usage: ./make-qr.sh <site-url> [output-folder]}"
base="${base%/}/dir-connect-26"
out="${2:-$(dirname "$0")/qr}"
mkdir -p "$out"

for path in general healthcare; do
  url="$base/$path/"
  # -l H: high error correction, survives glare and smudged prints.
  qrencode -l H -s 20 -m 4 -o "$out/$path.png" "$url"
  qrencode -l H -m 4 -t SVG -o "$out/$path.svg" "$url"
  echo "$path -> $url"
done
echo "booth staff (open on your own phone, do not print) -> $base/?staff=1"
