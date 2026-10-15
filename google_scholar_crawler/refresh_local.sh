#!/usr/bin/env bash
# Manually publish a validated snapshot using the same parser as GitHub Actions.
# Updates the data branch and two generated fallback files on main using temporary
# checkouts. Never changes the user checkout or force-pushes.
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
if ! git -C "$TEMP_DIR/publish" diff --cached --quiet; then
  git -C "$TEMP_DIR/publish" -c user.name='heyuanpengpku' -c user.email='heyuanpeng@stu.pku.edu.cn' commit --quiet -m 'chore: refresh verified Google Scholar stats'
fi
git -C "$TEMP_DIR/publish" push --quiet origin HEAD:google-scholar-stats
echo 'Published the verified Scholar data snapshot.'

# Refresh the server-rendered numbers and same-origin JSON as well, so visitors
# do not depend on being able to reach GitHub Raw or jsDelivr from their network.
git clone --quiet --depth 1 --single-branch --branch main "$REMOTE_URL" "$TEMP_DIR/homepage"
python3 "$REPO_DIR/google_scholar_crawler/publish_fallback.py" \
  --snapshot-file "$TEMP_DIR/results/gs_data.json" --root "$TEMP_DIR/homepage"
git -C "$TEMP_DIR/homepage" add _data/gs.yml assets/data/scholar.json
if ! git -C "$TEMP_DIR/homepage" diff --cached --quiet; then
  git -C "$TEMP_DIR/homepage" -c user.name='heyuanpengpku' -c user.email='heyuanpeng@stu.pku.edu.cn' \
    commit --quiet -m 'chore: refresh homepage Scholar fallback snapshot'
  # A concurrent homepage edit must never be overwritten. Rebase the isolated
  # data-only commit once; a conflict fails safely without force-pushing.
  if ! git -C "$TEMP_DIR/homepage" push --quiet origin HEAD:main; then
    git -C "$TEMP_DIR/homepage" -c user.name='heyuanpengpku' -c user.email='heyuanpeng@stu.pku.edu.cn' pull --rebase --quiet origin main
    git -C "$TEMP_DIR/homepage" push --quiet origin HEAD:main
  fi
fi
echo 'Published the homepage fallback snapshot; GitHub Pages will rebuild automatically.'
