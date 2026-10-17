import json
import os
import re
import hashlib
import urllib.request
from datetime import datetime, timezone

RAW_DIR = "ClinSight-Website/data/raw_api_v2"
EXTRACTED_FILE = "ClinSight-Website/data/phase1_2_mettl3_extracted.json"
REPORT_FILE = "ClinSight-Website/data/registry_drift_report.json"

# §2. Partition protocolSection sub-modules into Class A (Protocol-Content / Gating) vs Class B (Metadata / Refresh-Only)
CLASS_A_PROTOCOL_MODULES = [
    "designModule",
    "armsInterventionsModule",
    "outcomesModule",
    "eligibilityModule",
    "descriptionModule"
]

CLASS_B_METADATA_MODULES = [
    "identificationModule",
    "statusModule",
    "sponsorCollaboratorsModule",
    "contactsLocationsModule",
    "referencesModule"
]

def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()

def normalize_node(obj):
    """
    §1. Canonicalize JSON before hashing:
    Recursively normalize whitespace in strings and sort dictionary keys so API key-order
    or whitespace jitter never triggers false amendment alarms.
    """
    if isinstance(obj, dict):
        return {k: normalize_node(v) for k, v in sorted(obj.items())}
    elif isinstance(obj, list):
        return [normalize_node(x) for x in obj]
    elif isinstance(obj, str):
        return re.sub(r"\s+", " ", obj).strip()
    return obj

def canonical_module_hash(obj):
    norm = normalize_node(obj)
    payload = json.dumps(norm, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def find_stale_fields_for_dossier(dossier, drifted_class_a_modules, arch_date, live_date):
    """
    §3. Surgical source_field-driven gating:
    Only fields whose source_field starts with a drifted Class A module flip to STALE.
    Fields sourced from unchanged Class A modules remain verified.
    """
    if not drifted_class_a_modules or not dossier:
        return []

    prefixes = tuple(f"protocolSection.{m}" for m in drifted_class_a_modules)
    stale_fields = []

    # Check Module 1, Module 2, Module 3 fields
    for mod_key in ["module1", "module2", "module3"]:
        mod_obj = dossier.get(mod_key, {})
        for field_key, f_data in mod_obj.items():
            if not isinstance(f_data, dict):
                continue
            s_field = f_data.get("source_field") or ""
            # Module 2 items are always sourced from protocolSection.eligibilityModule.eligibilityCriteria
            if mod_key == "module2" and f_data.get("state") == "STATED" and not s_field:
                s_field = "protocolSection.eligibilityModule.eligibilityCriteria"

            if s_field.startswith(prefixes) and f_data.get("state") in ("STATED", "STATED-structural", "INFERRED"):
                superseded_val = f_data.get("render") or f_data.get("value") or ""
                stale_fields.append({
                    "module": mod_key,
                    "field": field_key,
                    "prior_state": f_data.get("state"),
                    "source_field": s_field,
                    "superseded_value": superseded_val,
                    "archived_last_update_post_date": arch_date,
                    "live_last_update_post_date": live_date
                })
                # §4. Transition field in-memory to 4th display state: STALE
                f_data["prior_state"] = f_data["state"]
                f_data["state"] = "STALE"
                f_data["archived_post_date"] = arch_date
                f_data["live_post_date"] = live_date

    return stale_fields

def check_drift():
    if not os.path.exists(RAW_DIR):
        print(f"Error: {RAW_DIR} not found.")
        return

    extracted_map = {}
    extracted_list = []
    if os.path.exists(EXTRACTED_FILE):
        with open(EXTRACTED_FILE, "r", encoding="utf-8") as ef:
            extracted_list = json.load(ef)
            for d in extracted_list:
                extracted_map[d["identity"]["nctId"]] = d

    files = sorted([f for f in os.listdir(RAW_DIR) if f.endswith(".json")])
    report = {
        "spec_version": "ClinSight_Registry_Drift_Monitor_Spec_v1.0",
        "checked_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_trials_monitored": len(files),
        "protocol_drift_detected_count": 0,
        "metadata_refresh_count": 0,
        "trials": []
    }

    any_stale_applied = False

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

            drifted_class_a = []
            for mod in CLASS_A_PROTOCOL_MODULES:
                if canonical_module_hash(arch_ps.get(mod)) != canonical_module_hash(live_ps.get(mod)):
                    drifted_class_a.append(mod)

            drifted_class_b = []
            for mod in CLASS_B_METADATA_MODULES:
                if canonical_module_hash(arch_ps.get(mod)) != canonical_module_hash(live_ps.get(mod)):
                    drifted_class_b.append(mod)

            dossier = extracted_map.get(nct_id)
            stale_fields = find_stale_fields_for_dossier(dossier, drifted_class_a, arch_last_update, live_last_update)
            if stale_fields:
                any_stale_applied = True

            if archived_sha == live_sha:
                drift_status = "NO_DRIFT_BYTE_IDENTICAL"
            elif not drifted_class_a and not drifted_class_b:
                drift_status = "NO_DRIFT_CANONICAL_IDENTICAL"
            elif not drifted_class_a and drifted_class_b:
                drift_status = "METADATA_REFRESH_ONLY_NO_STALE_GATE"
                report["metadata_refresh_count"] += 1
            else:
                drift_status = "PROTOCOL_CONTENT_DRIFT_SURGICAL_STALE_GATED"
                report["protocol_drift_detected_count"] += 1

            # §5. Sitemap & SEO Integrity: drop from sitemap if any core Module 1-3 field is STALE
            sitemap_eligible = len(stale_fields) == 0

            module_hashes = {
                mod: canonical_module_hash(arch_ps.get(mod))[:16]
                for mod in CLASS_A_PROTOCOL_MODULES
            }

            entry = {
                "nct_id": nct_id,
                "drift_status": drift_status,
                "sitemap_eligible": sitemap_eligible,
                "archived_sha256": archived_sha,
                "live_sha256": live_sha,
                "archived_last_update_post_date": arch_last_update,
                "live_last_update_post_date": live_last_update,
                "class_a_protocol_modules_drifted": drifted_class_a,
                "class_b_metadata_modules_drifted": drifted_class_b,
                "stale_gated_fields_count": len(stale_fields),
                "stale_gated_fields": stale_fields,
                "canonical_class_a_hashes_16": module_hashes
            }
            print(f"[{nct_id}] {drift_status} | sitemap_eligible={sitemap_eligible} | stale_fields={len(stale_fields)} | LastUpdatePostDate: {live_last_update}")
        except Exception as e:
            entry = {
                "nct_id": nct_id,
                "drift_status": "LIVE_FETCH_TRANSIENT_ERROR",
                "sitemap_eligible": True,
                "archived_sha256": archived_sha,
                "archived_last_update_post_date": arch_last_update,
                "error": str(e)
            }
            print(f"[{nct_id}] LIVE_FETCH_TRANSIENT_ERROR: {e}")

        report["trials"].append(entry)

    if any_stale_applied and extracted_list:
        with open(EXTRACTED_FILE, "w", encoding="utf-8") as ef:
            json.dump(extracted_list, ef, indent=2, ensure_ascii=False)
        print(f"Updated {EXTRACTED_FILE} with surgical STALE field states.")

    with open(REPORT_FILE, "w", encoding="utf-8") as out_f:
        json.dump(report, out_f, indent=2)
    print(f"Saved drift report to {REPORT_FILE}")

if __name__ == "__main__":
    check_drift()
