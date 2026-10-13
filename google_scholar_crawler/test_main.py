import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

import main


def table(citations="1,234", hindex="15", i10index="25"):
    return f'''<table id="gsc_rsb_st"><thead><tr><th></th><th>All</th><th>Since 2021</th></tr></thead>
    <tbody><tr><td><a>Citations</a></td><td>{citations}</td><td>516</td></tr>
    <tr><td>h-index</td><td>{hindex}</td><td>12</td></tr>
    <tr><td>i10-index</td><td>{i10index}</td><td>20</td></tr></tbody></table>'''


class ScholarTests(unittest.TestCase):
    def test_extracts_all_time_column_not_recent(self):
        self.assertEqual(main.parse_metrics(table()), {"citedby": 1234, "hindex": 15, "i10index": 25})

    def test_rejects_block_missing_column_and_inconsistent_metrics(self):
        for html in ["<html>CAPTCHA</html>", table().replace("<th>All</th>", "<th>Recent</th>"),
                     table().replace("i10-index", "unknown"), table(citations="—"), table(citations="10")]:
            with self.subTest(html=html), self.assertRaises(ValueError):
                main.parse_metrics(html)

    def test_accepts_actual_zero_values(self):
        self.assertEqual(main.parse_metrics(table("0", "0", "0")), {"citedby": 0, "hindex": 0, "i10index": 0})

    def test_http_denial_is_not_retried(self):
        with patch.object(main, "urlopen", side_effect=HTTPError("url", 403, "Forbidden", {}, None)) as fetch:
            with self.assertRaises(HTTPError):
                main.fetch_snapshot(main.DEFAULT_SCHOLAR_ID)
            self.assertEqual(fetch.call_count, 1)

    def test_failed_refresh_preserves_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "gs_data.json"
            previous = '{"citedby": 537, "updated": "2026-10-12T00:10:00Z"}'
            output.write_text(previous)
            with patch.object(main, "fetch_snapshot", side_effect=ValueError("blocked")), \
                 patch("sys.argv", ["main.py", "--output-dir", directory]), \
                 contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(main.main(), 1)
            self.assertEqual(output.read_text(), previous)

    def test_output_has_compatible_shield_and_utc_timestamp(self):
        snapshot = {"schema_version": 1, "scholar_id": main.DEFAULT_SCHOLAR_ID,
                    "citedby": 537, "hindex": 15, "i10index": 25, "updated": "2026-10-14T00:00:00+00:00"}
        with tempfile.TemporaryDirectory() as directory:
            main.write_snapshot(snapshot, Path(directory))
            self.assertEqual(json.loads((Path(directory) / "gs_data.json").read_text()), snapshot)
            self.assertEqual(json.loads((Path(directory) / "gs_data_shieldsio.json").read_text())["message"], "537")


if __name__ == "__main__":
    unittest.main()
