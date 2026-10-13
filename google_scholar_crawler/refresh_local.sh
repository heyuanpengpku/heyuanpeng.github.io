#!/usr/bin/env bash
# Manually publish a validated snapshot using the same parser as GitHub Actions.
# No force-push, dependencies, or changes to the working tree/main branch.
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_URL="$(git -C "$REPO_DIR" remote get-url origin)"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/scholar-refresh.XXXXXX")"
trap 'rm -rf "$TEMP_DIR"' EXIT

python3 "$REPO_DIR/google_scholar_crawler/main.py" --output-dir "$TEMP_DIR/results"
if [ -n "$(git ls-remote --heads "$REMOTE_URL" refs/heads/google-scholar-stats)" ]; then
  git clone --quiet --depth 1 --single-branch --branch google-scholar-stats "$REMOTE_URL" "$TEMP_DIR/publish"
else
  git init --quiet -b google-scholar-stats "$TEMP_DIR/publish"
  git -C "$TEMP_DIR/publish" remote add origin "$REMOTE_URL"
fi
cp "$TEMP_DIR/results/gs_data.json" "$TEMP_DIR/results/gs_data_shieldsio.json" "$TEMP_DIR/publish/"
git -C "$TEMP_DIR/publish" add gs_data.json gs_data_shieldsio.json
git -C "$TEMP_DIR/publish" -c user.name='heyuanpengpku' -c user.email='heyuanpeng@stu.pku.edu.cn' commit --quiet -m 'chore: refresh verified Google Scholar stats'
git -C "$TEMP_DIR/publish" push --quiet origin HEAD:google-scholar-stats
echo 'Published a verified Scholar snapshot; the homepage will read it automatically.'
