import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('/mnt/c/Users/xthomk/OneDrive/Antigravity/Monetization/ClinSight-Website/data/clinical_jobs.json', 'r') as f:
    jobs = json.load(f)

print(f"Testing {len(jobs)} job links directly...")
for j in jobs:
    url = j['apply_url']
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=12)
        print(f"[{resp.status} OK] {j['id']} -> {url}")
    except Exception as e:
        print(f"[FAIL] {j['id']} -> {e} | URL: {url}")
