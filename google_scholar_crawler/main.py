"""Fetch the three all-time metrics from a public Google Scholar profile.

Uses only the standard library. CAPTCHA, rate limits, incomplete HTML, and
invalid metrics fail the job; they never replace the last successful snapshot.
"""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

DEFAULT_SCHOLAR_ID = "HaefBCQAAAAJ"
METRICS = {"Citations": "citedby", "h-index": "hindex", "i10-index": "i10index"}


class MetricsTable(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_table = False
        self.cell = None
        self.row = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == "table" and dict(attrs).get("id") == "gsc_rsb_st":
            self.in_table = True
        if not self.in_table:
            return
        if tag == "tr":
            self.row = []
        elif tag in ("td", "th"):
            self.cell = []

    def handle_data(self, data):
        if self.in_table and self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if not self.in_table:
            return
        if tag in ("td", "th") and self.cell is not None:
            self.row.append("".join(self.cell).strip())
            self.cell = None
        elif tag == "tr":
            self.rows.append(self.row)
        elif tag == "table":
            self.in_table = False


def parse_metrics(html):
    parser = MetricsTable()
    parser.feed(html)
    # Require the labeled All column so a changed table cannot silently supply
    # recent-only counts or values from an unrelated table.
    if not parser.rows or len(parser.rows[0]) < 3 or parser.rows[0][1] != "All":
        raise ValueError("Scholar's all-time metrics table is missing (possibly a block or CAPTCHA).")
    result = {}
    for row in parser.rows[1:]:
        if not row or row[0] not in METRICS:
            continue
        key = METRICS[row[0]]
        if key in result or len(row) != 3:
            raise ValueError("Unexpected or duplicate Scholar metrics row.")
        number = row[1].replace(",", "").replace("\u00a0", "").replace(" ", "")
        if not re.fullmatch(r"[0-9]+", number):
            raise ValueError("Scholar returned a non-numeric metric.")
        result[key] = int(number)
    if set(result) != set(METRICS.values()):
        raise ValueError("Scholar did not return all three metrics.")
    if result["hindex"] ** 2 > result["citedby"] or result["i10index"] * 10 > result["citedby"]:
        raise ValueError("Scholar metrics failed consistency checks.")
    return result


def fetch_snapshot(scholar_id):
    if not re.fullmatch(r"[A-Za-z0-9_-]+", scholar_id):
        raise ValueError("Invalid public Scholar profile ID.")
    url = "https://scholar.google.com/citations?" + urlencode({"user": scholar_id, "hl": "en"})
    request = Request(url, headers={"Accept-Language": "en-US,en;q=0.9"})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=20) as response:
                html = response.read().decode(response.headers.get_content_charset() or "utf-8", errors="replace")
            values = parse_metrics(html)
            return {
                "schema_version": 1,
                "scholar_id": scholar_id,
                **values,
                "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "source": url,
            }
        except HTTPError as error:
            # Never retry access denials/rate limits or attempt to bypass them.
            if error.code < 500 or attempt == 2:
                raise
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2 ** attempt)


def write_snapshot(snapshot, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    files = {
        "gs_data.json": snapshot,
        "gs_data_shieldsio.json": {
            "schemaVersion": 1, "label": "citations", "message": str(snapshot["citedby"])
        },
    }
    for name, data in files.items():
        temporary = output_dir / (name + ".tmp")
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(output_dir / name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scholar-id", default=os.environ.get("GOOGLE_SCHOLAR_ID", "").strip() or DEFAULT_SCHOLAR_ID)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).parent / "results")
    args = parser.parse_args()
    try:
        snapshot = fetch_snapshot(args.scholar_id)
        write_snapshot(snapshot, args.output_dir)
    except (OSError, ValueError) as error:
        print(f"Scholar refresh failed; previous snapshot is unchanged: {error}", file=sys.stderr)
        return 1
    print(f"Scholar refreshed: {snapshot['citedby']} / {snapshot['hindex']} / {snapshot['i10index']} at {snapshot['updated']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
