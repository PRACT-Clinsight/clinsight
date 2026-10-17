import json
import os
import hashlib
import urllib.request
from datetime import datetime, timezone

RAW_DIR = "ClinSight-Website/data/raw_api_v2"
REPORT_FILE = "ClinSight-Website/data/registry_drift_report.json"

WATCHED_MODULES = [
    "identificationModule",
    "statusModule",
    "sponsorCollaboratorsModule",
    "descriptionModule",
    "designModule",
    "armsInterventionsModule",
    "outcomesModule",
    "eligibilityModule",
    "contactsLocationsModule",
    "referencesModule"
]

def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()

def canonical_json_hash(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()

def check_drift():
    if not os.path.exists(RAW_DIR):
        print(f"Error: {RAW_DIR} not found.")
        return

    files = sorted([f for f in os.listdir(RAW_DIR) if f.endswith(".json")])
    report = {
        "checked_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_trials_monitored": len(files),
        "drift_detected_count": 0,
        "trials": []
    }

    for fname in files:
        nct_id = fname.replace(".json", "")
        local_path = os.path.join(RAW_DIR, fname)
        with open(local_path, "rb") as f:
            archived_bytes = f.read()
        archived_sha = sha256_bytes(archived_bytes)
        archived_json = json.loads(archived_bytes.decode("utf-8"))
        arch_ps = archived_json.get("protocolSection", {})
        arch_last_update = arch_ps.get("statusModule", {}).get("lastUpdatePostDateStruct", {}).get("date", "Unknown")

        url = f"https://clinicaltrials.gov/api/v2/studies/{nct_id}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ClinSight-Drift-Monitor/1.0)"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                live_bytes = resp.read()
            live_sha = sha256_bytes(live_bytes)
            live_json = json.loads(live_bytes.decode("utf-8"))
            live_ps = live_json.get("protocolSection", {})
            live_last_update = live_ps.get("statusModule", {}).get("lastUpdatePostDateStruct", {}).get("date", "Unknown")

            drifted_modules = []
            for mod in WATCHED_MODULES:
                if canonical_json_hash(arch_ps.get(mod)) != canonical_json_hash(live_ps.get(mod)):
                    drifted_modules.append(mod)

            if archived_sha == live_sha:
                drift_status = "NO_DRIFT_BYTE_IDENTICAL"
            elif not drifted_modules:
                drift_status = "METADATA_ONLY_NO_PROTOCOL_DRIFT"
            else:
                drift_status = "PROTOCOL_AMENDMENT_DRIFT_DETECTED"
                report["drift_detected_count"] += 1

            entry = {
                "nct_id": nct_id,
                "drift_status": drift_status,
                "archived_sha256": archived_sha,
                "live_sha256": live_sha,
                "archived_last_update_post_date": arch_last_update,
                "live_last_update_post_date": live_last_update,
                "drifted_protocol_modules": drifted_modules
            }
            print(f"[{nct_id}] {drift_status} | SHA-256: {live_sha[:16]}... | LastUpdatePostDate: {live_last_update}")
        except Exception as e:
            entry = {
                "nct_id": nct_id,
                "drift_status": "LIVE_FETCH_TRANSIENT_ERROR",
                "archived_sha256": archived_sha,
                "archived_last_update_post_date": arch_last_update,
                "error": str(e)
            }
            print(f"[{nct_id}] LIVE_FETCH_TRANSIENT_ERROR: {e}")

        report["trials"].append(entry)

    with open(REPORT_FILE, "w", encoding="utf-8") as out_f:
        json.dump(report, out_f, indent=2)
    print(f"Saved drift report to {REPORT_FILE}")

if __name__ == "__main__":
    check_drift()
