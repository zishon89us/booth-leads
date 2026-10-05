#!/usr/bin/env bash
# Usage: ./make-qr.sh https://forms.example.com
# Writes print-ready QR codes (PNG + SVG) for both forms into qr/.
set -euo pipefail

base="${1:?Usage: ./make-qr.sh <base-url-where-index.html-is-hosted>}"
base="${base%/}"
out="$(dirname "$0")/qr"
mkdir -p "$out"

for form in general healthcare; do
  url="$base/?f=$form&src=expo"
  # -l H: high error correction, survives glare and smudged prints.
  qrencode -l H -s 20 -m 4 -o "$out/$form.png" "$url"
  qrencode -l H -m 4 -t SVG -o "$out/$form.svg" "$url"
  echo "$form -> $url"
done
echo "booth staff (open on your own phone, do not print) -> $base/?staff=1"
