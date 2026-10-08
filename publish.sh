#!/usr/bin/env bash
# Usage: ./publish.sh "what changed"
# Stamps the pages with a new version so browsers fetch the latest files instead of a
# cached copy, then commits and pushes. Use this instead of a bare git push.
set -euo pipefail
cd "$(dirname "$0")"

stamp="$(date +%s)"
sed -i -E "s/\\?v=[0-9]+\"/?v=$stamp\"/g" assessment/index.html healthcare/index.html booth/index.html
git add -A
git commit -q -m "${1:?Usage: ./publish.sh \"what changed\"}"
git push
echo "Published as version $stamp. Pages can take up to 10 minutes to update in an open browser."
