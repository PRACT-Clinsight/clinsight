# ClinSight -> Utility Engine: Detailed Build Plan

**For execution by the coding agent (Antigravity).**
**Model:** utility over public data — the BioTransfer playbook, applied to ClinicalTrials.gov.
**Governing principle:** every feature is a **link** or a **filter**. Nothing transcribes a clinical number. A link to a primary source is never wrong; a copied number can be. This is what makes the build both useful *and* liability-free.

---

## 0. THE ONE RULE (read before writing any code)

> **ClinSight never displays a clinical result it transcribed. It displays links to where the result lives, and filters over facts the registry itself returns.**

BioTransfer ranks #1 for GEO datasets and makes **zero** scientific claims — it just gets you to the data in one click. We copy that exactly. The "download link" is the product. Build the trial equivalent of the download link.

Everything below is downstream of this rule. If a feature would require a human to read a paper and type a number, it is out of scope for this plan (that is the separate, slow, verified-efficacy track and is not what drives traffic).

---

## 1. WHAT WE ARE BUILDING, IN ONE SENTENCE

The fastest path from *"I want trials matching X"* to *"here are the protocol, the SAP, the results, and the paper — one click each"* — plus the filters (modality, results-status) the registry cannot do, and a clean CSV export of the result.

Four utilities, in priority order:
1. **One-click primary-document links** per trial (the killer feature)
2. **Modality filter** (the filter the registry lacks)
3. **Results-status filter** (has posted results / has publication / results-vacant)
4. **CSV export** of the filtered cohort

---

## 2. DATA SOURCE — ClinicalTrials.gov API v2

Single source. One fetch per NCT, keyed on the NCT. No side-lists, no second source, no joins.

**Endpoint:** `https://clinicaltrials.gov/api/v2/studies/{NCT}`

**Fields:**
- `protocolSection.identificationModule`
- `protocolSection.statusModule`
- `protocolSection.sponsorCollaboratorsModule`
- `protocolSection.conditionsModule`
- `protocolSection.armsInterventionsModule`
- `protocolSection.designModule`
- `protocolSection.referencesModule`
- `documentSection.largeDocumentModule`
- `hasResults`

---

## 3. FEATURE 1 — ONE-CLICK PRIMARY-DOCUMENT LINKS

Buttons surfaced directly from the registry:
- **📄 Protocol (PDF):** CDN link if `hasProtocol=true` (`https://cdn.clinicaltrials.gov/large-docs/{suffix}/{NCT}/{filename}`)
- **📊 SAP (PDF):** CDN link if `hasSap=true`
- **📋 Results:** `https://clinicaltrials.gov/study/{NCT}?tab=results` if `hasResults=true`
- **📎 Paper / PubMed:** `https://pubmed.ncbi.nlm.nih.gov/{pmid}/` for RESULT/DERIVED references
- **↗ Registry Page:** `https://clinicaltrials.gov/study/{NCT}`

---

## 4. FEATURE 2 — MODALITY FILTER

Derivation strictly from registry intervention names and types:
- ADC, CAR-T, Bispecific, Checkpoint, GLP-1, TKI, mAb, Unclassified.

---

## 5. FEATURE 3 — RESULTS-STATUS FILTER

- **Has posted results:** `hasResults === true`
- **Has publication:** references with PMID exist
- **Results-vacant:** completed/terminated AND neither of above

---

## 6. FEATURE 4 — CSV EXPORT

Export currently filtered cohort with one-click direct links.
