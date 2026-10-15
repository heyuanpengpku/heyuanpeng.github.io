from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import tempfile
import unittest

from main import DEFAULT_SCHOLAR_ID
from publish_fallback import write_fallback


class HomepageFallbackTests(unittest.TestCase):
    def snapshot(self, **changes):
        data = dict(schema_version=1, scholar_id=DEFAULT_SCHOLAR_ID, citedby=539,
                    hindex=15, i10index=25,
                    updated=datetime.now(timezone.utc).isoformat(timespec='seconds'))
        data.update(changes)
        return data

    def test_embedded_html_data_and_same_origin_json_use_the_same_snapshot(self):
        snapshot = self.snapshot()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_fallback(snapshot, root)
            self.assertEqual(json.loads((root / 'assets/data/scholar.json').read_text()), snapshot)
            yaml = (root / '_data/gs.yml').read_text()
            self.assertIn('citedby: 539\n', yaml)
            self.assertIn(json.dumps(snapshot['updated']), yaml)

    def test_invalid_snapshot_cannot_replace_good_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_fallback(self.snapshot(), root)
            before = (root / '_data/gs.yml').read_text()
            for invalid in [self.snapshot(scholar_id='wrong-profile'), self.snapshot(hindex=None),
                            self.snapshot(citedby=10), self.snapshot(updated='not-a-time')]:
                with self.subTest(snapshot=invalid), self.assertRaises(ValueError):
                    write_fallback(invalid, root)
                self.assertEqual((root / '_data/gs.yml').read_text(), before)

    def test_old_snapshot_cannot_overwrite_a_newer_published_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            recent = self.snapshot()
            write_fallback(recent, root)
            older = self.snapshot(citedby=538, updated=(datetime.now(timezone.utc)-timedelta(days=1)).isoformat())
            self.assertFalse(write_fallback(older, root))
            self.assertEqual(json.loads((root / 'assets/data/scholar.json').read_text()), recent)


if __name__ == '__main__':
    unittest.main()
