import urllib.request
import json

url = "https://clinicaltrials.gov/api/v2/studies?query.term=METTL3&format=json"
req = urllib.request.Request(url, headers={"User-Agent": "ClinSight-Intelligence/1.0"})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        studies = data.get("studies", [])
        print(f"Total METTL3 studies found: {len(studies)}")
        for s in studies:
            proto = s.get("protocolSection", {})
            ident = proto.get("identificationModule", {})
            status = proto.get("statusModule", {})
            design = proto.get("designModule", {})
            sponsor = proto.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name")
            nct = ident.get("nctId")
            title = ident.get("briefTitle")
            phases = design.get("phases", [])
            stat = status.get("overallStatus")
            print(f"- {nct} | {title} | Phase: {phases} | Status: {stat} | Sponsor: {sponsor}")
except Exception as e:
    print("Error:", e)
