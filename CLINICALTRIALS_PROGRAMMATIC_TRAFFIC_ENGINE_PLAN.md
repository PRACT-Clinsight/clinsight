# Clinical Trials Programmatic Traffic Engine: Master Execution Plan

> **Domain:** `https://clinsight.pract.eu/`  
> **Parent Hub:** `https://pract.eu/`  
> **Sister Portals:** `https://regsight.pract.eu/` · `https://vigisight.pract.eu/`  
> **Core Model:** Programmatic SEO & Generative Engine Optimization (GEO) Arbitrage  
> **Benchmark Reference:** BioTransfer GEO Finder (`usebiotransfer.org`) ~5,000 daily visits  
> **Target Public Source:** ClinicalTrials.gov REST API v2 (480,000+ Studies)  
> **Date:** October 2026  

---

## 📑 Table of Contents
1. [Executive Summary & Strategic Rationale](#1-executive-summary--strategic-rationale)
2. [Forensic Audit: The ClinicalTrials.gov Vulnerabilities](#2-forensic-audit-the-clinicaltrialsgov-vulnerabilities)
3. [The PRACT Subdomain Ecosystem Architecture](#3-the-pract-subdomain-ecosystem-architecture)
4. [Exhaustive Filter & Taxonomy Specification](#4-exhaustive-filter--taxonomy-specification)
5. [The Programmatic Page Anatomy (`/trials/[nct-id]/`)](#5-the-programmatic-page-anatomy)
6. [Generative Engine Optimization (GEO) & Bot Ingestion](#6-generative-engine-optimization-geo--bot-ingestion)
7. [Technical Pipeline & Ingestion Architecture](#7-technical-pipeline--ingestion-architecture)
8. [Phased Implementation Roadmap](#8-phased-implementation-roadmap)

---

## 1. Executive Summary & Strategic Rationale

The objective of this project is to build an organic, institutional traffic flywheel for **`clinsight.pract.eu`** by turning public clinical trial registries into high-speed, programmatic web utilities.

### The Proven Model: BioTransfer's Playbook
* **What BioTransfer Did:** Built `usebiotransfer.org/tools/geo-finder/`, creating dedicated static pages for individual NCBI GEO series (`GSE...`). They provided 1-click downloads that the official NCBI website buried.
* **The Result:** Over **5,000 daily organic visits**, top Google rankings, and persistent citations from AI bots (ChatGPT, Claude, Perplexity), funneled into their jobs board and specialized services.
* **Our Evolution:** We apply this exact formula to **ClinicalTrials.gov** on `clinsight.pract.eu`. Because clinical trial queries represent massive commercial intent (biotech executives, clinical operations, pharma researchers, and life science investors), this traffic carries unmatched conversion value for the **PRACT** intelligence ecosystem.

---

## 2. Forensic Audit: The ClinicalTrials.gov Vulnerabilities

Google and AI bots struggle with the official ClinicalTrials.gov portal due to five structural design flaws:

```
┌───────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ ClinicalTrials.gov Defect             │ ClinSight Solution (Our Competitive Moat)              │
├───────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. Dynamic SPA / Angular Rendering    │ Lightning-fast pre-rendered static HTML (instant TTFB) │
│ 2. Unindexed Natural Language Queries │ Long-tail programmatic pages targeting drug+disease    │
│ 3. Buried / Missing Results           │ Immediate verified benchmark card (PFS, OS, HR, p-val) │
│ 4. No Drug Modality Filters           │ Dedicated filters: ADCs, CAR-T, GLP-1, mRNA, PROTACs   │
│ 5. US vs. EU (CTIS) Fragmentation     │ Unified cross-registry mapping (NCT ↔ EudraCT)         │
└───────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

1. **The Single Page Application (SPA) Barrier:** In 2023–2024, ClinicalTrials.gov transitioned to client-side dynamic rendering (`/study/NCT...`), hiding deep tabular data behind client-side JSON API requests that search crawlers frequently miss or penalize.
2. **The Natural Language Query Disconnect:** Users search for *"Phase 3 HER2-low breast cancer ADC trials"*, not *"NCT03732703"*. ClinicalTrials.gov cannot effectively serve multi-attribute semantic queries.
3. **The Results Vacuum:** Over 65% of completed trials on ClinicalTrials.gov have no tabular results posted, or bury them in dense XML. ClinSight bridges the study directly to its peer-reviewed paper in *NEJM*, *Lancet*, or *JCO*.

---

## 3. The PRACT Subdomain Ecosystem Architecture

Each pillar of PRACT operates as an independent, high-authority intelligence node:

```
                                      ┌────────────────────────┐
                                      │       pract.eu         │
                                      │ (Institutional Anchor) │
                                      └───────────┬────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
   ┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
   │   clinsight.pract.eu    │       │    regsight.pract.eu    │       │   vigisight.pract.eu    │
   ├─────────────────────────┤       ├─────────────────────────┤       ├─────────────────────────┤
   │ 🔬 Clinical Trials &    │       │ 📘 Regulatory Affairs   │       │ 🛡️ Pharmacovigilance    │
   │    Evidence Generation  │       │    & Statutory Guidance │       │    & Safety Signals     │
   │ • ClinicalTrials.gov    │       │ • FDA, EMA, MDCG, MHRA  │       │ • FAERS Disproportio-   │
   │ • Target Trial Emulat.  │       │ • 12k Guidance Records  │       │   nality Signals (ROR)  │
   │ • PMCF Protocols        │       │ • QARA Checklists       │       │ • ADC & ICI Toxicities  │
   └─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

---

## 4. Exhaustive Filter & Taxonomy Specification

To give users an experience vastly superior to ClinicalTrials.gov, the search interface on `clinsight.pract.eu` features an 8-dimensional filter matrix:

### 1. 🔍 Universal Search Bar
* Real-time query matching across **NCT ID**, **Trial Acronym**, **Intervention/Drug Name**, and **Disease Indication**.

### 2. 🌍 Regulatory Jurisdiction & Geographic Region
* `Global (All Regions)`
* `United States (US FDA / IND)`
* `European Union (EU CTIS / EMA / EudraCT)`
* `United Kingdom (MHRA)`
* `Nordic Cluster (Sweden, Denmark, Norway, Finland)`
* `Asia-Pacific (Japan PMDA, China NMPA, Australia TGA)`
* `Global Multi-Center (US + EU Dual Registration)`

### 3. 🏥 Therapeutic Category & Granular Disease Subtypes

```
├── Oncology & Hematology
│   ├── Breast Cancer (HER2+, HER2-Low, HR+/HER2-, TNBC)
│   ├── Lung Cancer (NSCLC EGFR, KRAS G12C, ALK, Small Cell)
│   ├── Gastrointestinal (Colorectal, Gastric, Pancreatic, HCC)
│   ├── Hematologic Malignancies (Multiple Myeloma, DLBCL, AML, CLL)
│   ├── Gynecologic (Ovarian, Cervical, Endometrial)
│   ├── Genitourinary (Prostate, Renal Cell, Urothelial)
│   └── Central Nervous System (Glioblastoma, Astrocytoma)
├── Cardiovascular & Metabolic (Cardiometabolic)
│   ├── Heart Failure (HFpEF, HFrEF)
│   ├── Obesity & Weight Management
│   ├── Type 2 Diabetes
│   ├── MASH / NASH (Metabolic Liver Disease)
│   └── Atherosclerosis & Dyslipidemia
├── Immunology & Autoimmune (RA, IBD, Psoriasis, Lupus)
├── Neurology & CNS (Alzheimer's, Parkinson's, ALS)
├── Rare & Orphan Diseases
└── Ophthalmology
```

### 4. 🧪 Study Phase
* `All Phases`
* `Phase 3 / Pivotal (Registration Enablers)`
* `Phase 2 (Proof of Concept & Efficacy Signals)`
* `Phase 1 / Phase 1b (Dose Escalation & FIH)`
* `Phase 4 / Post-Marketing (PMCF & Real-World Evidence)`

### 5. ⚡ Study Status & Readout Horizons
* `All Statuses`
* `Completed (Has Results / Readouts)` 🔥
* `Active & Recruiting`
* `Active, Not Recruiting (Awaiting Readout)`
* `Terminated / Suspended / Withdrawn (Safety Audit)`

### 6. 🧬 Modern Modality & Mechanism of Action *(The Core Moat)*
* `Antibody-Drug Conjugates (ADC)`
* `Cell & Gene Therapy (CAR-T, TCR, CRISPR)`
* `Immune Checkpoint Inhibitors (PD-1/L1, CTLA-4, LAG-3)`
* `Incretin Mimetics (GLP-1 / GIP / Glucagon Tri-Agonists)`
* `RNA Therapeutics (mRNA, siRNA, ASO)`
* `Targeted Small Molecules (TKIs, PROTAC Degraders)`
* `Bispecific & Multispecific Antibodies`
* `AI & Software as a Medical Device (SaMD)`

### 7. 📅 Completion & Readout Years
* `All Years` · `2026 (Active Horizons)` · `2025 (Recent Completions)` · `2024` · `2020–2023` · `Historical`

### 8. 📑 Evidence & Data Toggles
* ☑ **Has Peer-Reviewed Publication** *(Direct link to NEJM, Lancet, JCO)*
* ☑ **Has Regulatory Approval Milestone** *(FDA/EMA approval mapped)*
* ☑ **Has Downloadable Protocol / SAP**

---

## 5. The Programmatic Page Anatomy (`/trials/[nct-id]/`)

Each programmatic page is statically rendered with semantic HTML to maximize dwell time and search rankings:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔬 NCT03732703 · DESTINY-Breast04                                      │
│ Phase 3 · Trastuzumab Deruxtecan vs TPC (HER2-Low Breast Cancer)       │
│ Status: Completed · US FDA Approved · EU CTIS Linked                   │
├────────────────────────────────────────────────────────────────────────┤
│ 📊 THE VERIFIED EVIDENCE CARD                                          │
│ • Primary Endpoint: Progression-Free Survival (HR = 0.50, p < 0.001)   │
│ • Key Secondary: Overall Survival (23.4 mo vs 16.8 mo, HR = 0.64)      │
│ • Publication: New England Journal of Medicine (NEJM) [DOI Link ↗]     │
│ • Sponsor: Daiichi Sankyo / AstraZeneca                                │
├────────────────────────────────────────────────────────────────────────┤
│ 📋 STRUCTURED ELIGIBILITY CHECKLIST                                    │
│ [Key Inclusion] HER2-Low (IHC 1+ or IHC 2+/ISH-), ≥1 prior chemo line  │
│ [Key Exclusion] Active CNS metastases, history of drug-induced ILD     │
├────────────────────────────────────────────────────────────────────────┤
│ ⚡ FAST 1-CLICK UTILITY ACTIONS                                        │
│ [ Download Protocol Summary ↓ ]  [ Official ClinicalTrials.gov ↗ ]     │
│ [ Cross-Reference EU CTIS ↗ ]    [ View FAERS Safety Signals ↗ ]       │
├────────────────────────────────────────────────────────────────────────┤
│ 📥 CONTEXTUAL PRACT CONVERSION HOOK                                    │
│ "Designing a Target Trial Emulation (TTE) or PMCF Registry?            │
│ Consult the PRACT Clinical Team → contact@pract.eu"                    │
└────────────────────────────────────────────────────────────────────────┘
```

### JSON-LD Structured Data (Google Schema)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalStudy",
      "name": "DESTINY-Breast04 (NCT03732703)",
      "url": "https://clinsight.pract.eu/trials/nct03732703/",
      "studySubject": {"@type": "MedicalCondition", "name": "HER2-Low Breast Cancer"},
      "healthCondition": "Metastatic Breast Cancer",
      "sponsor": "Daiichi Sankyo / AstraZeneca",
      "status": "Completed"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What were the primary results of DESTINY-Breast04 (NCT03732703)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "DESTINY-Breast04 demonstrated a median progression-free survival of 9.9 months with trastuzumab deruxtecan versus 5.1 months with physician's choice chemotherapy (Hazard Ratio 0.50; P < 0.001)."
          }
        }
      ]
    }
  ]
}
```

---

## 6. Generative Engine Optimization (GEO) & Bot Ingestion

To ensure ChatGPT, Claude, Perplexity, and Gemini cite `clinsight.pract.eu` as their primary source:

1. **`llms.txt` at Domain Root (`clinsight.pract.eu/llms.txt`):**
   * A clean markdown summary file cataloging all indexed trials with their core findings and canonical URLs.
2. **Explicit AI Permissions in `robots.txt`:**
   ```txt
   User-agent: *
   Allow: /

   User-agent: GPTBot
   User-agent: ClaudeBot
   User-agent: PerplexityBot
   User-agent: Google-Extended
   Allow: /trials/
   ```
3. **Verbatim Metric Anchors:**
   * LLMs prioritize citations that include concrete mathematical metrics (Hazard Ratios, confidence intervals, sample sizes). By displaying structured outcome tables, ClinSight becomes the primary citation node.

---

## 7. Technical Pipeline & Ingestion Architecture

```
[ClinicalTrials.gov REST API v2]
             ↓
    [fetch_trials.js] (Filters by High-Value Oncology / ADCs / GLP-1)
             ↓
    [enrich_publications.js] (Fetches PubMed DOIs, NEJM/Lancet links)
             ↓
   [data/trials.json] (Normalized Local Database)
             ↓
    [build_engine.js]
    ├── Generates: clinsight.pract.eu/index.html (Interactive Filter UI)
    ├── Generates: clinsight.pract.eu/trials/[nct-id]/index.html (Static Pages)
    ├── Generates: clinsight.pract.eu/sitemap.xml (All Programmatic URLs)
    └── Generates: clinsight.pract.eu/llms.txt (AI Bot Map)
```

---

## 8. Phased Implementation Roadmap

### Phase 1: Prototype Pilot (Days 1–3)
- Build the Node.js API ingest script (`fetch_trials.js`) targeting the **first 100 pivotal Phase 3 Oncology & ADC studies**.
- Cross-reference PubMed IDs for primary published papers.
- Generate the static trial card template (`template.html`).

### Phase 2: Live Filter UI Engine (Days 4–5)
- Upgrade `ClinSight-Website/index.html` with the universal search bar, quick chips, and multi-tier filter dropdowns.
- Implement URL parameter persistence (`?category=oncology&modality=adc`).

### Phase 3: SEO, Sitemap & AI Bot Deployment (Days 6–7)
- Generate `sitemap.xml`, `robots.txt`, and `llms.txt`.
- Verify mobile responsiveness and JSON-LD schema validity via Google Rich Results Test.
- Connect the contact form directly to `contact@pract.eu`.

### Phase 4: Hosting & Search Console Onboarding (Week 2)
- Deploy build artifacts to hosting (`clinsight.pract.eu`).
- Submit `sitemap.xml` to Google Search Console to trigger indexation.
- Track initial impressions, click-through rates, and AI search referral logs.

### Phase 5: Scale to 5,000+ Trials & Replicate across Sister Sites (Weeks 3–4)
- Scale the trial generator to 5,000+ registered studies.
- Replicate this exact programmatic build pipeline across:
  - **`regsight.pract.eu`:** 12,000+ FDA/EMA/MDCG guidance documents.
  - **`vigisight.pract.eu`:** FAERS adverse event signal profiles.

---

*Plan compiled and verified for immediate technical execution.*
