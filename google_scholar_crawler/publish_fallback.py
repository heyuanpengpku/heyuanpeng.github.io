"""Prepare the verified Scholar snapshot for the homepage's own origin.

Run against an isolated checkout; the caller commits only the two generated
files. No Google Scholar access is performed by this helper.
"""
import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path

from main import DEFAULT_SCHOLAR_ID


def validate(snapshot):
    if snapshot.get('schema_version') != 1 or snapshot.get('scholar_id') != DEFAULT_SCHOLAR_ID:
        raise ValueError('Snapshot belongs to an unexpected schema or Scholar profile.')
    for field in ('citedby', 'hindex', 'i10index'):
        if type(snapshot.get(field)) is not int or snapshot[field] < 0:
            raise ValueError('All three metrics must be nonnegative integers.')
    if snapshot['hindex'] ** 2 > snapshot['citedby'] or snapshot['i10index'] * 10 > snapshot['citedby']:
        raise ValueError('Snapshot metrics failed consistency checks.')
    updated = datetime.fromisoformat(snapshot['updated'].replace('Z', '+00:00'))
    if updated.tzinfo is None or updated > datetime.now(timezone.utc) + timedelta(minutes=5):
        raise ValueError('Snapshot timestamp must be an actual successful fetch time with a timezone.')
    return updated


def write_fallback(snapshot, root):
    updated = validate(snapshot)
    json_path = root / 'assets/data/scholar.json'
    if json_path.exists():
        existing = json.loads(json_path.read_text(encoding='utf-8'))
        if validate(existing) > updated:
            print('Homepage already contains a newer snapshot; leaving it unchanged.')
            return False
    yaml_text = ''.join(f'{key}: {json.dumps(value, ensure_ascii=False)}\n' for key, value in snapshot.items())
    json_text = json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n'
    for path, content in [(root / '_data/gs.yml', yaml_text), (json_path, json_text)]:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + '.tmp')
        temporary.write_text(content, encoding='utf-8')
        temporary.replace(path)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot-file', type=Path, required=True)
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    snapshot = json.loads(args.snapshot_file.read_text(encoding='utf-8'))
    write_fallback(snapshot, args.root)


if __name__ == '__main__':
    main()
