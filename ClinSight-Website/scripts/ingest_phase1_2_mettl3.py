import urllib.request
import json
import os
import sys

def fetch_study(nct_id):
    url = f"https://clinicaltrials.gov/api/v2/studies/{nct_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "ClinSight-Intelligence/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching {nct_id}: {e}")
        return None

def extract_mw_fields(raw_study):
    proto = raw_study.get("protocolSection", {})
    ident = proto.get("identificationModule", {})
    status_m = proto.get("statusModule", {})
    design_m = proto.get("designModule", {})
    elig_m = proto.get("eligibilityModule", {})
    sponsor_m = proto.get("sponsorCollaboratorsModule", {})
    outcomes_m = proto.get("outcomesModule", {})
    conditions_m = proto.get("conditionsModule", {})
    arms_m = proto.get("armsInterventionsModule", {})
    
    nct_id = ident.get("nctId")
    brief_title = ident.get("briefTitle", "")
    official_title = ident.get("officialTitle", brief_title)
    acronym = ident.get("acronym")
    
    phases = design_m.get("phases", [])
    phase_str = "/".join(phases) if phases else "Phase Not Specified"
    
    design_info = design_m.get("designInfo", {})
    allocation = design_info.get("allocation", "Non-Randomized")
    intervention_model = design_info.get("interventionModel", "Single Group Assignment")
    masking_info = design_info.get("maskingInfo", {})
    masking = masking_info.get("masking", "Open Label")
    
    sponsor = sponsor_m.get("leadSponsor", {}).get("name", "Unknown Sponsor")
    conditions = conditions_m.get("conditions", [])
    
    interventions = []
    for inter in arms_m.get("interventions", []):
        interventions.append(inter.get("name", ""))
        
    primary_outcomes = []
    for po in outcomes_m.get("primaryOutcomes", []):
        measure = po.get("measure", "")
        time_frame = po.get("timeFrame", "")
        primary_outcomes.append(f"{measure} (Time Frame: {time_frame})" if time_frame else measure)
        
    secondary_outcomes = []
    for so in outcomes_m.get("secondaryOutcomes", [])[:6]:
        measure = so.get("measure", "")
        time_frame = so.get("timeFrame", "")
        secondary_outcomes.append(f"{measure} (Time Frame: {time_frame})" if time_frame else measure)
        
    crit_text = elig_m.get("eligibilityCriteria", "")
    inclusion = []
    exclusion = []
    if "Inclusion Criteria:" in crit_text and "Exclusion Criteria:" in crit_text:
        parts = crit_text.split("Exclusion Criteria:")
        inc_part = parts[0].replace("Inclusion Criteria:", "").strip()
        exc_part = parts[1].strip()
        inclusion = [c.strip("- *• \t\r\n") for c in inc_part.split("\n\n") if c.strip("- *• \t\r\n")]
        exclusion = [c.strip("- *• \t\r\n") for c in exc_part.split("\n\n") if c.strip("- *• \t\r\n")]
    elif crit_text:
        inclusion = [crit_text[:1000]]
        
    start_date = status_m.get("startDateStruct", {}).get("date", "Not Reported")
    completion_date = status_m.get("completionDateStruct", {}).get("date", "Ongoing")
    enrollment = design_m.get("enrollmentInfo", {}).get("count", 0)
    status = status_m.get("overallStatus", "UNKNOWN")
    
    return {
        "nctId": nct_id,
        "acronym": acronym,
        "briefTitle": brief_title,
        "officialTitle": official_title,
        "phase": phase_str,
        "status": status,
        "isCompleted": status.upper() == "COMPLETED",
        "sponsor": sponsor,
        "conditions": conditions,
        "interventions": interventions,
        "category": "Translational Oncology & Early Phase",
        "modality": "RNA Epigenetics / METTL3 Inhibitor",
        "subtype": "Phase 1/2 Targeted Therapeutics",
        "year": int(start_date[:4]) if len(start_date) >= 4 and start_date[:4].isdigit() else 2026,
        "enrollment": enrollment,
        "primaryOutcomes": primary_outcomes,
        "secondaryOutcomes": secondary_outcomes,
        "inclusionCriteria": inclusion[:15],
        "exclusionCriteria": exclusion[:15],
        "allocation": allocation,
        "interventionModel": intervention_model,
        "masking": masking,
        "protocolUrl": f"https://clinicaltrials.gov/study/{nct_id}",
        "resultsUrl": f"https://clinicaltrials.gov/study/{nct_id}?tab=results",
        "primaryPmid": None,
        "hasResults": False,
        "isResultsVacant": False,
        "completionDate": completion_date
    }

if __name__ == "__main__":
    ncts = ["NCT06975293", "NCT07163325", "NCT05584111"]
    records = []
    for nct in ncts:
        print(f"Fetching {nct}...")
        raw = fetch_study(nct)
        if raw:
            mw_obj = extract_mw_fields(raw)
            records.append(mw_obj)
            print(f"Successfully processed {nct}: {mw_obj['briefTitle'][:60]} | Phase: {mw_obj['phase']}")
            
    out_path = "ClinSight-Website/data/phase1_2_showcase.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records)} Phase 1/2 showcase dossiers to {out_path}")
