#!/usr/bin/env python3
"""
Fast Multi-Threaded Ingestion Engine for ClinSight 54 Waves
Fetches study records from ClinicalTrials.gov API v2 with rate-limiting and caching.
"""

import os
import glob
import json
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WAVES_DIR = os.path.join(BASE_DIR, 'waves')
DATA_DIR = os.path.join(BASE_DIR, 'data')
CACHE_DIR = os.path.join(DATA_DIR, 'cache')
TRIALS_JSON = os.path.join(DATA_DIR, 'trials.json')

os.makedirs(CACHE_DIR, exist_ok=True)

def get_all_nct_ids():
    wave_files = sorted(glob.glob(os.path.join(WAVES_DIR, '*.json')))
    ncts = set()
    for wf in wave_files:
        try:
            with open(wf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    if isinstance(item, str):
                        ncts.add(item.strip())
                    elif isinstance(item, dict):
                        nct = item.get('nct_id') or item.get('nctId') or item.get('id')
                        if nct:
                            ncts.add(nct.strip())
        except Exception as e:
            print(f"Error reading {wf}: {e}")
    return sorted(list(ncts))

def fetch_trial(nct_id):
    cache_path = os.path.join(CACHE_DIR, f"{nct_id}.json")
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 100:
        return nct_id, True, "cached"

    url = f"https://clinicaltrials.gov/api/v2/studies/{nct_id}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ClinSight-Data-Engine/2.0"}
    )
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200:
                    data = resp.read()
                    with open(cache_path, "wb") as f:
                        f.write(data)
                    return nct_id, True, "downloaded"
                elif resp.status == 404:
                    return nct_id, False, "not_found"
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return nct_id, False, "not_found"
            elif e.code == 429:
                time.sleep(2 * (attempt + 1))
            else:
                time.sleep(1)
        except Exception:
            time.sleep(1)

    return nct_id, False, "failed"

def main():
    ncts = get_all_nct_ids()
    print(f"Total NCT IDs in all 54 waves: {len(ncts)}")
    
    # Check already cached
    cached = [nct for nct in ncts if os.path.exists(os.path.join(CACHE_DIR, f"{nct}.json")) and os.path.getsize(os.path.join(CACHE_DIR, f"{nct}.json")) > 100]
    to_fetch = [nct for nct in ncts if nct not in cached]
    print(f"Already cached: {len(cached)}")
    print(f"Remaining to fetch: {len(to_fetch)}")

    if not to_fetch:
        print("All records already cached!")
        return

    print("Starting multi-threaded download (Concurrency: 8)...")
    success_count = 0
    fail_count = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_trial, nct): nct for nct in to_fetch}
        for i, future in enumerate(as_completed(futures), 1):
            nct_id, success, status = future.result()
            if success:
                success_count += 1
            else:
                fail_count += 1
            
            if i % 100 == 0 or i == len(to_fetch):
                elapsed = time.time() - start_time
                rate = i / elapsed if elapsed > 0 else 0
                eta_sec = (len(to_fetch) - i) / rate if rate > 0 else 0
                print(f"[{i}/{len(to_fetch)}] {success_count} ok, {fail_count} failed | Speed: {rate:.1f} req/s | ETA: {eta_sec/60:.1f}m")

    print(f"Finished. Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    main()
