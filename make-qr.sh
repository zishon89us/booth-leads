#!/usr/bin/env bash
# Usage: ./make-qr.sh <site-url> [source-tag] [output-folder]
#   ./make-qr.sh https://zaavya.us poster qr/zaavya-us
# Writes print-ready QR codes (PNG + SVG) for both visitor forms.
set -euo pipefail

base="${1:?Usage: ./make-qr.sh <site-url> [source-tag] [output-folder]}"
base="${base%/}/dir-connect-26"
src="${2:-expo}"
out="${3:-$(dirname "$0")/qr}"
mkdir -p "$out"

for path in general unifhi-healthcare; do
  url="$base/$path/?src=$src"
  # -l H: high error correction, survives glare and smudged prints.
  qrencode -l H -s 20 -m 4 -o "$out/$src-$path.png" "$url"
  qrencode -l H -m 4 -t SVG -o "$out/$src-$path.svg" "$url"
  echo "$path -> $url"
done
echo "booth staff (open on your own phone, do not print) -> $base/?staff=1"
