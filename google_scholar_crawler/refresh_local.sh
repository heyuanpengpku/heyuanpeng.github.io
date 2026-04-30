#!/usr/bin/env bash
# Refresh Google Scholar stats for the homepage.
#
# Why local: GitHub Actions runner IPs are blocked by Google Scholar.
# Your residential IP works fine, so we run the crawler locally and
# force-push the results to the `google-scholar-stats` orphan branch.
#
# Usage:
#   bash google_scholar_crawler/refresh_local.sh
#
# Override defaults via env vars:
#   GOOGLE_SCHOLAR_ID  scholar profile id (default: HaefBCQAAAAJ)
#   GS_VENV            venv path (default: /tmp/gs_venv)

set -euo pipefail

GS_ID="${GOOGLE_SCHOLAR_ID:-HaefBCQAAAAJ}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRAWLER_DIR="$REPO_DIR/google_scholar_crawler"
VENV_DIR="${GS_VENV:-/tmp/gs_venv}"

# 1. Bootstrap venv if missing. httpx is pinned because scholarly 1.7.x
#    is incompatible with httpx >= 0.28 (the `proxies` kwarg was removed).
if [ ! -x "$VENV_DIR/bin/python" ]; then
  echo "[refresh] Creating venv at $VENV_DIR ..."
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet 'scholarly>=1.7.11' 'httpx<0.28'
fi

# 2. Run the crawler from your residential IP (no proxy needed).
echo "[refresh] Fetching Scholar stats for $GS_ID ..."
cd "$CRAWLER_DIR"
GOOGLE_SCHOLAR_ID="$GS_ID" "$VENV_DIR/bin/python" - <<'PY'
from scholarly import scholarly
import json, os
from datetime import datetime
author = scholarly.search_author_id(os.environ["GOOGLE_SCHOLAR_ID"])
scholarly.fill(author, sections=["basics", "indices", "counts"])
author["updated"] = str(datetime.now())
author["publications"] = {v["author_pub_id"]: v for v in author.get("publications", [])}
os.makedirs("results", exist_ok=True)
with open("results/gs_data.json", "w") as f:
    json.dump(author, f, ensure_ascii=False, default=str)
shieldio = {"schemaVersion": 1, "label": "citations", "message": str(author["citedby"])}
with open("results/gs_data_shieldsio.json", "w") as f:
    json.dump(shieldio, f, ensure_ascii=False)
print(f"[refresh] OK citedby={author['citedby']} hindex={author['hindex']} i10index={author['i10index']}")
PY

# 3. Force-push results to the orphan `google-scholar-stats` branch
#    via a fresh temp directory (so we don't touch the main repo).
PUB_DIR="$(mktemp -d)"
cp "$CRAWLER_DIR/results/"* "$PUB_DIR/"
cd "$PUB_DIR"
git init -q
git checkout -q -b google-scholar-stats
git add .

EMAIL="$(cd "$REPO_DIR" && git config user.email 2>/dev/null || true)"
NAME="$(cd "$REPO_DIR" && git config user.name 2>/dev/null || true)"
EMAIL="${EMAIL:-heyuanpeng@stu.pku.edu.cn}"
NAME="${NAME:-heyuanpengpku}"

git -c user.email="$EMAIL" -c user.name="$NAME" \
    commit -qm "chore: refresh Google Scholar stats $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git remote add origin "$(cd "$REPO_DIR" && git config --get remote.origin.url)"
git push -qf origin google-scholar-stats

echo "[refresh] Pushed to google-scholar-stats. CDN may take 1-2 min to propagate."
