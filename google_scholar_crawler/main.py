from scholarly import scholarly, ProxyGenerator
import json
from datetime import datetime
import os

pg = ProxyGenerator()
if pg.FreeProxies():
    scholarly.use_proxy(pg)
    print("Using FreeProxies.", flush=True)
else:
    print("FreeProxies setup failed, falling back to direct (likely throttled).", flush=True)

author: dict = scholarly.search_author_id(os.environ['GOOGLE_SCHOLAR_ID'])
scholarly.fill(author, sections=['basics', 'indices', 'counts'])
author['updated'] = str(datetime.now())
author['publications'] = {v['author_pub_id']: v for v in author.get('publications', [])}
print(json.dumps(author, indent=2, default=str))

os.makedirs('results', exist_ok=True)
with open('results/gs_data.json', 'w') as outfile:
    json.dump(author, outfile, ensure_ascii=False, default=str)

shieldio_data = {
    "schemaVersion": 1,
    "label": "citations",
    "message": f"{author['citedby']}",
}
with open('results/gs_data_shieldsio.json', 'w') as outfile:
    json.dump(shieldio_data, outfile, ensure_ascii=False)
