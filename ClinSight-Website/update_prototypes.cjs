const fs = require('fs');
const path = require('path');

// 6 Master Clinical Jobs covering Hospital CTUs, Biopharma, and MedTech in Sweden and Denmark
const jobs = [
  {
    id: "job-1",
    sector: "pharma",
    sectorLabel: "Pharma & Biologics (ICH-GCP)",
    roleTrack: "coord",
    roleTrackLabel: "Hospital CTU / Study Coordinator",
    country: "se",
    countryLabel: "Sweden",
    title: "Projektledare / Monitor – Kliniska Prövningar Onkologi",
    badge: "Hospital CTU · Phase 1–3",
    employer: "Sahlgrenska University Hospital / VGR",
    location: "Gothenburg, Sweden",
    deadline: "23 Oct 2026",
    summary: "Verksamhetsområde Onkologi vid Sahlgrenska Universitetssjukhuset bedriver ett stort antal kliniska läkemedelsprövningar (Fas I–III). Du leder och monitorerar studier i enlighet med ICH-GCP och svensk lagstiftning, i nära samarbete med prövningsledare och forskningssköterskor.",
    mandatory: [
      "University degree in Life Science, Biomedicine, or Nursing",
      "Certified ICH-GCP competence & Swedish clinical trial regulations",
      "Documented experience coordinating or monitoring Phase 1–3 trials",
      "Professional working proficiency in Swedish and English"
    ],
    desirable: [
      "Oncology or Immuno-Oncology clinical trial experience",
      "Previous study lead / monitor experience within an academic CTU",
      "Familiarity with EDC platforms (Medidata RAVE, Viedoc)",
      "Clinical biobank handling and research sample logistics"
    ],
    protocol: {
      code: "NCT03734029",
      desc: "Phase 3 Solid Tumor Protocol",
      url: "https://clinsight.pract.eu/trials/NCT03734029/"
    },
    source: "Västra Götalandsregionen (VGR) · Varbi Req 976098",
    applyUrl: "https://vgregion.varbi.com/se/what:job/jobID:976098/type:job/where:125/apply:1"
  },
  {
    id: "job-2",
    sector: "pharma",
    sectorLabel: "Pharma & Biologics (ICH-GCP)",
    roleTrack: "data",
    roleTrackLabel: "Data & Biometrics",
    country: "se",
    countryLabel: "Sweden",
    title: "Director – Medical & Payer Evidence Statistics (Late-Stage Trials)",
    badge: "Sponsor Biopharma · Phase 3",
    employer: "AstraZeneca AB",
    location: "Gothenburg, Sweden (R&D Hub)",
    deadline: "02 Nov 2026",
    summary: "Lead strategic biostatistical deliverables for late-stage clinical development programs and real-world payer evidence packages. Drive statistical methodology for global regulatory filings across oncology and biopharmaceuticals in compliance with ICH E9.",
    mandatory: [
      "PhD or Master's in Biostatistics, Statistics, or Applied Mathematics",
      "7+ years biostatistics experience in Phase 2/3 clinical drug development",
      "Demonstrated FDA and EMA briefing dossier contribution",
      "Statistical programming in validated environments (SAS / R)"
    ],
    desirable: [
      "Payer / HTA evidence and indirect treatment comparisons (ITC)",
      "Oncology or Cardiovascular outcome trials experience",
      "External FSP and vendor oversight management",
      "Causal inference and real-world evidence (registry / EHR) modeling"
    ],
    protocol: {
      code: "NCT04526990",
      desc: "Phase 3 Oncology Protocol",
      url: "https://clinsight.pract.eu/trials/NCT04526990/"
    },
    source: "AstraZeneca Career Portal · Workday R-261632",
    applyUrl: "https://astrazeneca.wd3.myworkdayjobs.com/en-US/Careers/job/Sweden---Gothenburg/Director--Medical---Payer-Evidence-Statistics_R-261632-2"
  },
  {
    id: "job-3",
    sector: "pharma",
    sectorLabel: "Pharma & Biologics (ICH-GCP)",
    roleTrack: "ctm",
    roleTrackLabel: "Trial Manager (CTM / CPM)",
    country: "se",
    countryLabel: "Sweden",
    title: "Director Clinical Operations – Early Phase Development",
    badge: "Clinical Biotech · Phase 1/2",
    employer: "Dicot Pharma AB",
    location: "Uppsala, Sweden",
    deadline: "28 Oct 2026",
    summary: "Overall operational accountability for ongoing Phase 1 clinical safety trials and planning the international Phase 2a proof-of-concept trial program for LIB-01. Lead CRO oversight, budget forecasting, and clinical site feasibility across European clinical hubs under EU CTR 536/2014.",
    mandatory: [
      "University degree in Life Science, Pharmacy, or Medicine",
      "8+ years clinical operations with lead role in Phase 1/2 clinical trials",
      "Experience with CRO selection, contract negotiation, and study KPIs",
      "Working knowledge of EU CTR 536/2014 & CTIS submission workflow"
    ],
    desirable: [
      "Experience in clinical-stage biotech startup environments",
      "First-in-Human (FIH) transition into Phase 2a design",
      "Familiarity with Etikprövningsmyndigheten processes",
      "Therapeutic background in urology or metabolic indications"
    ],
    protocol: {
      code: "EU-CT-2023-0018",
      desc: "Phase 1 FIH Safety & PK Trial",
      url: "https://clinsight.pract.eu/"
    },
    source: "Dicot Pharma AB · Uppsala Hub (Teamtailor)",
    applyUrl: "https://winrowrekrytering.teamtailor.com/jobs/8268902-director-clinical-operations-till-dicot-pharma-i-uppsala/applications/new"
  },
  {
    id: "job-4",
    sector: "medtech",
    sectorLabel: "MedTech & Devices (ISO 14155 / MDR)",
    roleTrack: "ctm",
    roleTrackLabel: "Trial Manager (CTM / CPM)",
    country: "se",
    countryLabel: "Sweden",
    title: "Clinical Project Manager – Medical Device Investigations (EU MDR)",
    badge: "MedTech · Class IIb / III",
    employer: "Getinge AB",
    location: "Gothenburg, Sweden",
    deadline: "30 Oct 2026",
    summary: "Lead pre-market clinical investigations and post-market clinical follow-up (PMCF) studies for acute care and cardiopulmonary devices. Drive protocol development, ethical board submissions with Läkemedelsverket, and hospital site operations across Nordic and European surgical centers.",
    mandatory: [
      "Degree in Biomedical Engineering, Life Science, or Nursing",
      "Certified ISO 14155 (Clinical investigation of medical devices for human subjects)",
      "4+ years managing prospective medical device clinical investigations",
      "In-depth knowledge of EU MDR 2017/745 (Clinical evaluation & PMCF requirements)"
    ],
    desirable: [
      "Class III or implantable / life-support device trial experience (e.g. ECMO, ventilation)",
      "Prior interaction with Notified Bodies (e.g. TÜV, BSI, DNV) and Läkemedelsverket",
      "Operating room (OR) or intensive care unit (ICU) clinical study monitoring",
      "Experience with electronic data capture for MedTech (Castor EDC, SMART-TRIAL)"
    ],
    protocol: {
      code: "MDR-2017/745",
      desc: "Class III PMCF Surgical Study",
      url: "https://clinsight.pract.eu/"
    },
    source: "Getinge Career Hub · Direct Corporate ATS",
    applyUrl: "https://www.getinge.com/careers/"
  },
  {
    id: "job-5",
    sector: "medtech",
    sectorLabel: "MedTech & Devices (ISO 14155 / MDR)",
    roleTrack: "cra",
    roleTrackLabel: "Monitor (CRA)",
    country: "se",
    countryLabel: "Sweden",
    title: "Clinical Research Associate (CRA) – Medical Devices",
    badge: "MedTech · ISO 14155",
    employer: "Atos Medical (Coloplast Group)",
    location: "Malmö, Sweden (Hybrid)",
    deadline: "05 Nov 2026",
    summary: "Manage the end-to-end operational execution of clinical investigations and Post-Market Clinical Follow-Up (PMCF) studies. Oversee hospital monitoring visits across Nordic clinical sites and co-author Clinical Investigation Reports (CIR) in accordance with ISO 14155 and EU MDR.",
    mandatory: [
      "Master's or Bachelor's in Life Sciences, Biomedicine, or Health Science",
      "Demonstrated experience monitoring clinical investigations under ISO 14155",
      "Knowledge of EU MDR 2017/745 clinical evidence standards",
      "Fluency in English and Swedish or Danish"
    ],
    desirable: [
      "ENT, pulmonary, or respiratory clinical study background",
      "Experience with electronic Trial Master Files (eTMF) and GCP site auditing",
      "Experience drafting Clinical Evaluation Plans (CEP)",
      "Proficiency with decentralized / home clinical trial monitoring"
    ],
    protocol: {
      code: "ISO-14155:2020",
      desc: "Post-Market Clinical Investigation (PMCF)",
      url: "https://clinsight.pract.eu/"
    },
    source: "Coloplast Group / Atos Medical ATS",
    applyUrl: "https://www.atosmedical.com/career"
  },
  {
    id: "job-6",
    sector: "pharma",
    sectorLabel: "Pharma & Biologics (ICH-GCP)",
    roleTrack: "cra",
    roleTrackLabel: "Monitor (CRA)",
    country: "dk",
    countryLabel: "Denmark",
    title: "Senior Clinical Research Associate (CRA) – Nordic Trial Sites",
    badge: "Sponsor Biopharma · Phase 2/3",
    employer: "Genmab A/S",
    location: "Copenhagen, Denmark",
    deadline: "12 Nov 2026",
    summary: "Perform independent hospital site qualification, initiation, routine monitoring, and close-out visits for international antibody-based oncology trials across Rigshospitalet, Herlev, and Aarhus Universitetshospital. Ensure 100% adherence to ICH-GCP E6(R2) and Danish Medicines Agency (Lægemiddelstyrelsen) requirements.",
    mandatory: [
      "Degree in Life Sciences, Medicine, or Pharmacy",
      "3+ years independent onsite CRA monitoring experience in Oncology",
      "Expertise in ICH-GCP E6(R2) and EU CTR 536/2014 clinical trials",
      "Fluent professional English; Danish or Scandinavian language proficiency"
    ],
    desirable: [
      "Bispecific antibody or Immuno-Oncology clinical trial monitoring",
      "Experience interacting directly with Nordic Trial Nation clinical network",
      "Site-level risk-based monitoring (RBM) and central monitoring",
      "Phase 1 FIH dose-escalation site protocol management"
    ],
    protocol: {
      code: "NCT04826094",
      desc: "Phase 2 Bispecific Antibody Protocol",
      url: "https://clinsight.pract.eu/"
    },
    source: "Genmab Careers · Workday Direct ATS",
    applyUrl: "https://genmab.wd3.myworkdayjobs.com/en-US/Genmab_Careers"
  }
];

// Generate CRUK Markup
function generateCrukHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClinSight — Clinical Trials & MedTech Investigations (Cancer Research UK Style)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --cruk-navy: #2E008B;
            --cruk-navy-dark: #00006B;
            --cruk-magenta: #E40087;
            --cruk-magenta-hover: #CC006C;
            --cruk-magenta-tint: #FFF0F8;
            --cruk-cyan: #009CEE;
            --cruk-cyan-light: #E2F4FD;
            --cruk-white: #FFFFFF;
            --cruk-black: #000000;
            --cruk-grey-100: #F4F4F6;
            --cruk-grey-200: #E2E2E6;
            --cruk-grey-shadow: #E2E2E6;
            --cruk-grey-shadow-hover: #000000;
            --cruk-text-muted: #52627A;
            --font-main: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--font-main);
            background-color: var(--cruk-white);
            color: var(--cruk-black);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        /* Top Header - CRUK Style with Signature 4px Solid Black Border */
        .cruk-header {
            background: var(--cruk-white);
            border-bottom: 4px solid var(--cruk-black);
            padding: 16px 24px;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header-inner {
            max-width: 1080px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--cruk-black);
        }
        .brand-logo {
            font-size: 22px;
            font-weight: 800;
            color: var(--cruk-navy);
            letter-spacing: -0.03em;
        }
        .brand-tag {
            font-size: 11px;
            font-weight: 700;
            color: var(--cruk-magenta);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-left: 2px solid var(--cruk-grey-200);
            padding-left: 12px;
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .style-switch-btn {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            background: var(--cruk-cyan-light);
            color: var(--cruk-navy);
            border: 2px solid var(--cruk-black);
            padding: 5px 12px;
            text-decoration: none;
            transition: all 0.1s;
        }
        .style-switch-btn:hover {
            background: var(--cruk-magenta);
            color: var(--cruk-white);
            border-color: var(--cruk-black);
        }

        .container {
            max-width: 1080px;
            margin: 0 auto;
            padding: 28px 24px 80px;
        }

        /* Breadcrumbs */
        .breadcrumbs {
            font-size: 12px;
            font-weight: 600;
            color: var(--cruk-text-muted);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .breadcrumbs a {
            color: var(--cruk-navy);
            text-decoration: underline;
        }

        /* Hero Section */
        .cruk-hero {
            padding-bottom: 24px;
            margin-bottom: 24px;
            border-bottom: 2px solid var(--cruk-black);
        }
        .cruk-hero h1 {
            font-size: clamp(24px, 3.5vw, 36px);
            font-weight: 800;
            line-height: 1.2;
            color: var(--cruk-navy);
            letter-spacing: -0.02em;
            margin-bottom: 10px;
        }
        .cruk-hero p {
            font-size: 15px;
            color: var(--cruk-text-muted);
            max-width: 800px;
        }

        /* Search Input Bar (Architectural Matching) */
        .search-container {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
        }
        .search-input {
            flex: 1;
            font-family: var(--font-main);
            font-size: 14px;
            font-weight: 500;
            padding: 12px 16px;
            border: 2px solid var(--cruk-black);
            background: var(--cruk-white);
            color: var(--cruk-black);
            outline: none;
            transition: border-color 0.1s;
        }
        .search-input:focus {
            border-color: var(--cruk-magenta);
            box-shadow: 4px 4px 0 0 var(--cruk-grey-shadow);
        }
        .search-reset {
            background: var(--cruk-grey-100);
            border: 2px solid var(--cruk-black);
            font-family: var(--font-main);
            font-size: 13px;
            font-weight: 700;
            padding: 0 16px;
            cursor: pointer;
            transition: background 0.1s;
        }
        .search-reset:hover {
            background: var(--cruk-grey-200);
        }

        /* Filter Chips */
        .filter-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: var(--cruk-grey-100);
            border: 2px solid var(--cruk-black);
            padding: 16px 20px;
            margin-bottom: 24px;
        }
        .filter-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
        }
        .filter-title {
            font-size: 11.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--cruk-black);
            min-width: 90px;
        }
        .cruk-chip {
            background: var(--cruk-white);
            border: 2px solid var(--cruk-black);
            color: var(--cruk-black);
            font-size: 12.5px;
            font-weight: 600;
            padding: 5px 12px;
            cursor: pointer;
            user-select: none;
            transition: all 0.1s;
        }
        .cruk-chip:hover {
            background: var(--cruk-magenta-tint);
            border-color: var(--cruk-magenta);
            color: var(--cruk-magenta);
        }
        .cruk-chip.active {
            background: var(--cruk-navy);
            color: var(--cruk-white);
            border-color: var(--cruk-navy);
        }

        /* Results Counter Strip */
        .results-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: 600;
            color: var(--cruk-text-muted);
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--cruk-grey-200);
        }
        .results-count {
            font-weight: 800;
            color: var(--cruk-navy);
        }

        /* Job Cards - Neo-Brutalist 8px Hard Shadows (CRUK Core Style) */
        .job-feed {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .cruk-card {
            background: var(--cruk-white);
            border: 2px solid var(--cruk-black);
            padding: 24px;
            box-shadow: 8px 8px 0px 0px var(--cruk-grey-shadow);
            transition: all 0.12s ease-in-out;
        }
        .cruk-card:hover {
            transform: translate(2px, 2px);
            box-shadow: 6px 6px 0px 0px var(--cruk-grey-shadow-hover);
        }

        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 8px;
        }
        .job-title {
            font-size: 19px;
            font-weight: 800;
            color: var(--cruk-navy);
            line-height: 1.3;
            flex: 1;
            min-width: 280px;
        }
        .badge-group {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .cruk-badge {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 10px;
            border: 1px solid var(--cruk-black);
            background: var(--cruk-cyan-light);
            color: var(--cruk-navy);
        }
        .cruk-badge.badge-geo {
            background: var(--cruk-grey-100);
            color: var(--cruk-black);
        }

        .job-meta-row {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 13px;
            color: var(--cruk-text-muted);
            margin-bottom: 14px;
        }
        .meta-emp {
            font-weight: 700;
            color: var(--cruk-black);
        }

        .job-desc {
            font-size: 14px;
            color: var(--cruk-black);
            line-height: 1.6;
            margin-bottom: 16px;
        }

        /* Signature Requirements Table - Clean, High Contrast */
        .cruk-req-table {
            border: 2px solid var(--cruk-black);
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin: 16px 0 20px;
            background: var(--cruk-white);
        }
        @media (max-width: 680px) {
            .cruk-req-table { grid-template-columns: 1fr; }
        }
        .cruk-req-col {
            padding: 14px 16px;
        }
        .cruk-req-mandatory {
            border-right: 2px solid var(--cruk-black);
            background: #FFF8F8;
        }
        @media (max-width: 680px) {
            .cruk-req-mandatory {
                border-right: none;
                border-bottom: 2px solid var(--cruk-black);
            }
        }
        .cruk-req-desirable {
            background: #F8FFF9;
        }
        .req-head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--cruk-black);
        }
        .req-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        .cruk-req-mandatory .req-title { color: #9C0006; }
        .cruk-req-desirable .req-title { color: #006100; }
        .req-lang {
            font-size: 11px;
            font-weight: 700;
            color: var(--cruk-text-muted);
            font-family: var(--font-mono);
        }
        .req-list {
            list-style: none;
        }
        .req-list li {
            font-size: 12.5px;
            line-height: 1.45;
            margin-bottom: 6px;
            padding-left: 14px;
            position: relative;
            color: var(--cruk-black);
        }
        .cruk-req-mandatory .req-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #9C0006;
            font-weight: 800;
        }
        .cruk-req-desirable .req-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #006100;
            font-weight: 800;
        }

        /* Trial Reference Banner */
        .trial-strip {
            background: var(--cruk-cyan-light);
            border: 1px solid var(--cruk-cyan);
            padding: 10px 14px;
            font-size: 12.5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .trial-code {
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--cruk-navy);
        }
        .trial-link {
            color: var(--cruk-magenta);
            text-decoration: underline;
            font-weight: 700;
            font-size: 12px;
        }

        /* Card Action Bottom */
        .card-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--cruk-grey-200);
            padding-top: 16px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .req-source {
            font-size: 11.5px;
            color: var(--cruk-text-muted);
            font-family: var(--font-mono);
        }
        .cruk-btn-apply {
            background: var(--cruk-magenta);
            color: var(--cruk-white);
            border: 2px solid var(--cruk-magenta);
            font-size: 13px;
            font-weight: 700;
            padding: 8px 18px;
            text-decoration: none;
            display: inline-block;
            transition: all 0.1s;
        }
        .cruk-btn-apply:hover {
            background: var(--cruk-magenta-hover);
            border-color: var(--cruk-black);
            box-shadow: 3px 3px 0 0 var(--cruk-black);
            color: var(--cruk-white);
        }

        .no-results {
            background: var(--cruk-grey-100);
            border: 2px dashed var(--cruk-black);
            padding: 40px 20px;
            text-align: center;
            font-size: 14px;
            color: var(--cruk-text-muted);
        }

        footer {
            margin-top: 60px;
            border-top: 4px solid var(--cruk-black);
            padding-top: 24px;
            font-size: 12px;
            color: var(--cruk-text-muted);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
    </style>
</head>
<body>

    <!-- CRUK Style Top Navigation -->
    <header class="cruk-header">
        <div class="header-inner">
            <a href="https://clinsight.pract.eu/" class="brand">
                <span class="brand-logo">ClinSight</span>
                <span class="brand-tag">Clinical Research &amp; Trials</span>
            </a>
            <div class="header-actions">
                <a href="http://192.168.0.135:8082/" class="style-switch-btn">Switch to Codecademy Style →</a>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs">
            <a href="https://clinsight.pract.eu/">ClinSight Home</a>
            <span>/</span>
            <span>Clinical Trials &amp; MedTech Job Engine</span>
        </nav>

        <!-- Hero -->
        <section class="cruk-hero">
            <h1>Clinical Trials &amp; Research Site Positions</h1>
            <p>Phase 1–3 trial positions and clinical investigations in Sweden and Denmark. Direct applications to hospital clinical trial units, biopharma sponsors, and accredited MedTech manufacturers.</p>
        </section>

        <!-- Search Bar -->
        <div class="search-container">
            <input type="text" id="jobSearch" class="search-input" placeholder="Search by title, hospital, medical device, sponsor, or location (e.g. Sahlgrenska, Getinge, Oncology, Malmö)...">
            <button id="searchReset" class="search-reset" onclick="resetFilters()">Reset All</button>
        </div>

        <!-- Filters Section -->
        <div class="filter-section">
            <div class="filter-group">
                <span class="filter-title">Sector:</span>
                <button class="cruk-chip active" onclick="setSector('all', this)">All Sectors</button>
                <button class="cruk-chip" onclick="setSector('pharma', this)">Pharma &amp; Biologics (ICH-GCP)</button>
                <button class="cruk-chip" onclick="setSector('medtech', this)">MedTech &amp; Devices (ISO 14155 / MDR)</button>
            </div>
            <div class="filter-group">
                <span class="filter-title">Role Track:</span>
                <button class="cruk-chip active" onclick="setRole('all', this)">All Roles</button>
                <button class="cruk-chip" onclick="setRole('ctm', this)">Trial Manager (CTM / CPM)</button>
                <button class="cruk-chip" onclick="setRole('cra', this)">Monitor (CRA)</button>
                <button class="cruk-chip" onclick="setRole('coord', this)">Study Coordinator (CTC)</button>
                <button class="cruk-chip" onclick="setRole('data', this)">Data &amp; Biometrics</button>
            </div>
            <div class="filter-group">
                <span class="filter-title">Country:</span>
                <button class="cruk-chip active" onclick="setCountry('all', this)">All Nordics</button>
                <button class="cruk-chip" onclick="setCountry('se', this)">Sweden (Sverige)</button>
                <button class="cruk-chip" onclick="setCountry('dk', this)">Denmark (Danmark)</button>
            </div>
        </div>

        <!-- Results Counter Strip -->
        <div class="results-bar">
            <span>Showing <span id="jobCount" class="results-count">6</span> verified clinical trial positions</span>
            <span>Direct Primary Source Postings · Zero Recruiter Clutter</span>
        </div>

        <!-- Job Feed -->
        <div id="jobFeed" class="job-feed">
            <!-- Cards rendered via JS -->
        </div>

        <footer>
            <span>ClinSight · PRACT Ecosystem</span>
            <span>Cancer Research UK Digital Design Architecture</span>
        </footer>
    </div>

    <script>
        const JOBS = ${JSON.stringify(jobs, null, 2)};

        let currentSector = 'all';
        let currentRole = 'all';
        let currentCountry = 'all';
        let currentQuery = '';

        function renderJobs() {
            const container = document.getElementById('jobFeed');
            const filtered = JOBS.filter(j => {
                const matchSector = currentSector === 'all' || j.sector === currentSector;
                const matchRole = currentRole === 'all' || j.roleTrack === currentRole;
                const matchCountry = currentCountry === 'all' || j.country === currentCountry;
                const queryText = (j.title + ' ' + j.employer + ' ' + j.location + ' ' + j.summary + ' ' + j.badge).toLowerCase();
                const matchQuery = !currentQuery || queryText.includes(currentQuery.toLowerCase());
                return matchSector && matchRole && matchCountry && matchQuery;
            });

            document.getElementById('jobCount').innerText = filtered.length;

            if (filtered.length === 0) {
                container.innerHTML = '<div class="no-results">No clinical positions match your selected filter criteria. Try resetting filters.</div>';
                return;
            }

            container.innerHTML = filtered.map(j => \`
                <article class="cruk-card">
                    <div class="card-top">
                        <h2 class="job-title">\${j.title}</h2>
                        <div class="badge-group">
                            <span class="cruk-badge">\${j.badge}</span>
                            <span class="cruk-badge badge-geo">\${j.countryLabel}</span>
                        </div>
                    </div>
                    <div class="job-meta-row">
                        <span class="meta-emp">\${j.employer}</span>
                        <span>\${j.location}</span>
                        <span>Deadline: \${j.deadline}</span>
                    </div>
                    <p class="job-desc">\${j.summary}</p>

                    <div class="cruk-req-table">
                        <div class="cruk-req-col cruk-req-mandatory">
                            <div class="req-head">
                                <span class="req-title">Mandatory</span>
                                <span class="req-lang">Krav</span>
                            </div>
                            <ul class="req-list">
                                \${j.mandatory.map(m => \`<li>\${m}</li>\`).join('')}
                            </ul>
                        </div>
                        <div class="cruk-req-col cruk-req-desirable">
                            <div class="req-head">
                                <span class="req-title">Desirable</span>
                                <span class="req-lang">Meriterande</span>
                            </div>
                            <ul class="req-list">
                                \${j.desirable.map(d => \`<li>\${d}</li>\`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="trial-strip">
                        <span>Protocol reference on ClinSight: <strong class="trial-code">\${j.protocol.code}</strong> (\${j.protocol.desc})</span>
                        <a href="\${j.protocol.url}" target="_blank" class="trial-link">View protocol details →</a>
                    </div>

                    <div class="card-bottom">
                        <span class="req-source">\${j.source}</span>
                        <a href="\${j.applyUrl}" target="_blank" rel="noopener" class="cruk-btn-apply">Direct Apply →</a>
                    </div>
                </article>
            \`).join('');
        }

        function setSector(val, btn) {
            currentSector = val;
            btn.parentElement.querySelectorAll('.cruk-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderJobs();
        }

        function setRole(val, btn) {
            currentRole = val;
            btn.parentElement.querySelectorAll('.cruk-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderJobs();
        }

        function setCountry(val, btn) {
            currentCountry = val;
            btn.parentElement.querySelectorAll('.cruk-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderJobs();
        }

        function resetFilters() {
            currentSector = 'all';
            currentRole = 'all';
            currentCountry = 'all';
            currentQuery = '';
            document.getElementById('jobSearch').value = '';
            document.querySelectorAll('.cruk-chip').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.filter-group').forEach(grp => {
                grp.querySelector('.cruk-chip').classList.add('active');
            });
            renderJobs();
        }

        document.getElementById('jobSearch').addEventListener('input', (e) => {
            currentQuery = e.target.value.trim();
            renderJobs();
        });

        // Initial render
        renderJobs();
    </script>
</body>
</html>`;
}

// Generate Codecademy Markup
function generateCodecademyHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClinSight — Clinical Trials & MedTech Engine (Codecademy Gamut Style)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            /* Codecademy Gamut Official Color Tokens */
            --color-navy-900: #0A0D1C;
            --color-navy-800: #10162F;
            --color-navy-700: rgba(16, 22, 47, 0.86);
            --color-navy-600: rgba(16, 22, 47, 0.75);
            --color-navy-300: rgba(16, 22, 47, 0.28);
            --color-navy-200: rgba(16, 22, 47, 0.12);
            --color-navy-100: rgba(16, 22, 47, 0.04);
            
            --color-hyper-500: #3A10E5;
            --color-hyper-400: #5533FF;
            --color-yellow-500: #FFD300;
            --color-yellow-400: #CCA900;
            --color-yellow-0: #FFFAE5;
            
            --color-beige-100: #FFF0E5;
            --color-blue-0: #F5FCFF;
            --color-green-700: #008A27;
            --color-green-0: #F0FFF4;
            --color-red-500: #E91C11;
            --color-red-0: #FFF5F5;
            
            --color-white: #FFFFFF;
            --color-border: rgba(16, 22, 47, 0.18);
            --color-border-focus: var(--color-navy-800);
            
            --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--font-display);
            background-color: var(--color-white);
            color: var(--color-navy-800);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        /* Top Bar - Signature Codecademy Deep Navy Header */
        .gamut-header {
            background: var(--color-navy-800);
            color: var(--color-white);
            padding: 16px 28px;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 2px solid var(--color-navy-900);
        }
        .header-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--color-white);
        }
        .brand-logo {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .brand-pill {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 600;
            background: rgba(255, 211, 0, 0.15);
            color: var(--color-yellow-500);
            border: 1px solid rgba(255, 211, 0, 0.4);
            padding: 2px 8px;
            border-radius: 4px;
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .style-switch-btn {
            font-family: var(--font-mono);
            font-size: 11.5px;
            font-weight: 600;
            background: var(--color-yellow-500);
            color: var(--color-navy-800);
            border: 2px solid var(--color-navy-800);
            border-radius: 6px;
            padding: 5px 12px;
            text-decoration: none;
            transition: all 0.15s;
        }
        .style-switch-btn:hover {
            background: var(--color-white);
            color: var(--color-navy-800);
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 28px 24px 80px;
        }

        /* Breadcrumbs */
        .breadcrumbs {
            font-family: var(--font-mono);
            font-size: 11.5px;
            font-weight: 600;
            color: var(--color-navy-600);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .breadcrumbs a {
            color: var(--color-hyper-500);
            text-decoration: none;
        }
        .breadcrumbs a:hover { text-decoration: underline; }

        /* Codecademy Style Hero with Warm Beige Card */
        .hero {
            background: var(--color-beige-100);
            border: 2px solid var(--color-navy-800);
            border-radius: 12px;
            padding: 28px 32px;
            margin-bottom: 24px;
            position: relative;
        }
        .hero-tag {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            color: var(--color-hyper-500);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .hero h1 {
            font-size: clamp(24px, 3.5vw, 36px);
            font-weight: 800;
            color: var(--color-navy-800);
            letter-spacing: -0.03em;
            line-height: 1.2;
            margin-bottom: 10px;
        }
        .hero p {
            font-size: 14.5px;
            color: var(--color-navy-700);
            max-width: 780px;
            line-height: 1.6;
        }

        /* Search Bar (Architectural Matching) */
        .search-container {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .search-input {
            flex: 1;
            font-family: var(--font-display);
            font-size: 14px;
            font-weight: 500;
            padding: 12px 18px;
            border: 2px solid var(--color-navy-800);
            border-radius: 8px;
            background: var(--color-white);
            color: var(--color-navy-800);
            outline: none;
            transition: box-shadow 0.15s;
        }
        .search-input:focus {
            box-shadow: 0 4px 0 0 var(--color-navy-800);
        }
        .search-reset {
            background: var(--color-white);
            border: 2px solid var(--color-navy-800);
            border-radius: 8px;
            font-family: var(--font-display);
            font-size: 13px;
            font-weight: 700;
            padding: 0 16px;
            cursor: pointer;
            transition: background 0.15s;
        }
        .search-reset:hover {
            background: var(--color-navy-100);
        }

        /* Filter Panel (Codecademy Style Module) */
        .filter-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: var(--color-navy-100);
            border: 2px solid var(--color-border);
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 24px;
        }
        .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
        }
        .filter-label {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-navy-600);
            min-width: 90px;
        }
        .gamut-chip {
            background: var(--color-white);
            border: 1px solid var(--color-border);
            color: var(--color-navy-800);
            font-size: 12.5px;
            font-weight: 600;
            padding: 5px 13px;
            border-radius: 6px;
            cursor: pointer;
            user-select: none;
            transition: all 0.15s;
        }
        .gamut-chip:hover {
            border-color: var(--color-navy-800);
            color: var(--color-navy-800);
        }
        .gamut-chip.active {
            background: var(--color-navy-800);
            color: var(--color-white);
            border-color: var(--color-navy-800);
        }

        /* Results Counter Strip */
        .results-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: 600;
            color: var(--color-navy-600);
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--color-navy-200);
        }
        .results-count {
            font-family: var(--font-mono);
            font-weight: 800;
            color: var(--color-hyper-500);
        }

        /* Feed */
        .job-feed {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* Codecademy Style Card: Clean 2px border, rounded corners, solid bottom shadow */
        .gamut-card {
            background: var(--color-white);
            border: 2px solid var(--color-navy-800);
            border-radius: 10px;
            padding: 24px 28px;
            transition: transform 0.12s, box-shadow 0.12s;
            position: relative;
        }
        .gamut-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 0 0 var(--color-navy-800);
        }

        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 8px;
        }
        .job-title {
            font-size: 19px;
            font-weight: 800;
            color: var(--color-navy-800);
            line-height: 1.3;
            letter-spacing: -0.01em;
            flex: 1;
            min-width: 280px;
        }
        .badge-group {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .track-badge {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 600;
            padding: 3px 10px;
            background: var(--color-yellow-0);
            border: 1px solid var(--color-yellow-400);
            color: var(--color-navy-800);
            border-radius: 4px;
            text-transform: uppercase;
        }
        .track-badge.badge-geo {
            background: var(--color-blue-0);
            border-color: var(--color-border);
            color: var(--color-navy-800);
        }

        .meta-strip {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            font-size: 13px;
            color: var(--color-navy-600);
            margin-bottom: 14px;
        }
        .meta-emp {
            font-weight: 700;
            color: var(--color-navy-800);
        }

        .job-desc {
            font-size: 14px;
            color: var(--color-navy-700);
            line-height: 1.6;
            margin-bottom: 16px;
        }

        /* Requirements Matrix Container */
        .req-matrix {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            overflow: hidden;
            margin: 16px 0 20px;
        }
        @media (max-width: 680px) {
            .req-matrix { grid-template-columns: 1fr; }
        }
        .req-col {
            padding: 16px 18px;
        }
        .req-col-mandatory {
            background: var(--color-red-0);
            border-right: 1px solid var(--color-border);
        }
        @media (max-width: 680px) {
            .req-col-mandatory {
                border-right: none;
                border-bottom: 1px solid var(--color-border);
            }
        }
        .req-col-desirable {
            background: var(--color-green-0);
        }
        .req-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 10px;
            padding-bottom: 4px;
            border-bottom: 1px dashed var(--color-border);
        }
        .req-name {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .req-col-mandatory .req-name { color: var(--color-red-500); }
        .req-col-desirable .req-name { color: var(--color-green-700); }
        .req-sv {
            font-size: 11px;
            font-weight: 600;
            color: var(--color-navy-600);
            font-family: var(--font-mono);
        }
        .req-list {
            list-style: none;
        }
        .req-list li {
            font-size: 12.5px;
            line-height: 1.5;
            margin-bottom: 6px;
            padding-left: 14px;
            position: relative;
            color: var(--color-navy-800);
        }
        .req-col-mandatory .req-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--color-red-500);
            font-weight: bold;
        }
        .req-col-desirable .req-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--color-green-700);
            font-weight: bold;
        }

        /* Protocol Strip */
        .protocol-box {
            background: var(--color-blue-0);
            border: 1px solid rgba(58, 16, 229, 0.2);
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .protocol-code {
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--color-hyper-500);
        }
        .protocol-link {
            color: var(--color-hyper-500);
            font-weight: 700;
            text-decoration: underline;
        }

        /* Card Footer */
        .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--color-border);
            padding-top: 16px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .source-tag {
            font-family: var(--font-mono);
            font-size: 11.5px;
            color: var(--color-navy-600);
        }
        .btn-apply {
            background: var(--color-hyper-500);
            color: var(--color-white);
            border: 2px solid var(--color-hyper-500);
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            padding: 8px 18px;
            text-decoration: none;
            display: inline-block;
            transition: all 0.15s;
        }
        .btn-apply:hover {
            background: var(--color-hyper-400);
            border-color: var(--color-navy-800);
            box-shadow: 0 4px 0 0 var(--color-navy-800);
            transform: translateY(-2px);
            color: var(--color-white);
        }

        .no-results {
            background: var(--color-beige-100);
            border: 2px dashed var(--color-navy-800);
            border-radius: 10px;
            padding: 40px 20px;
            text-align: center;
            font-size: 14px;
            color: var(--color-navy-700);
        }

        footer {
            margin-top: 60px;
            border-top: 2px solid var(--color-navy-800);
            padding-top: 24px;
            font-size: 12px;
            color: var(--color-navy-600);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
    </style>
</head>
<body>

    <!-- Top Bar -->
    <header class="gamut-header">
        <div class="header-inner">
            <a href="https://clinsight.pract.eu/" class="brand">
                <span class="brand-logo">&lt;ClinSight /&gt;</span>
                <span class="brand-pill">TRIAL ENGINE</span>
            </a>
            <div class="header-actions">
                <a href="http://192.168.0.135:8081/" class="style-switch-btn">Switch to CRUK Style →</a>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs">
            <a href="https://clinsight.pract.eu/">clinsight.pract.eu</a>
            <span>/</span>
            <span>clinical-trials-and-medtech-engine</span>
        </nav>

        <!-- Hero -->
        <section class="hero">
            <div class="hero-tag">
                <span>●</span> DIRECT ATS INGEST · NORDICS
            </div>
            <h1>Clinical Trials &amp; MedTech Investigation Engine</h1>
            <p>Direct verified positions in Phase 1–3 clinical drug development and ISO 14155 / EU MDR medical device clinical investigations across Sweden and Denmark.</p>
        </section>

        <!-- Search Bar -->
        <div class="search-container">
            <input type="text" id="jobSearch" class="search-input" placeholder="Search by title, hospital, medical device, sponsor, or location (e.g. Sahlgrenska, Getinge, Oncology, Malmö)...">
            <button id="searchReset" class="search-reset" onclick="resetFilters()">Reset All</button>
        </div>

        <!-- Filter Panel -->
        <div class="filter-section">
            <div class="filter-row">
                <span class="filter-label">Sector:</span>
                <button class="gamut-chip active" onclick="setSector('all', this)">All Sectors</button>
                <button class="gamut-chip" onclick="setSector('pharma', this)">Pharma &amp; Biologics (ICH-GCP)</button>
                <button class="gamut-chip" onclick="setSector('medtech', this)">MedTech &amp; Devices (ISO 14155 / MDR)</button>
            </div>
            <div class="filter-row">
                <span class="filter-label">Role Track:</span>
                <button class="gamut-chip active" onclick="setRole('all', this)">All Roles</button>
                <button class="gamut-chip" onclick="setRole('ctm', this)">Trial Manager (CTM / CPM)</button>
                <button class="gamut-chip" onclick="setRole('cra', this)">Monitor (CRA)</button>
                <button class="gamut-chip" onclick="setRole('coord', this)">Study Coordinator (CTC)</button>
                <button class="gamut-chip" onclick="setRole('data', this)">Data &amp; Biometrics</button>
            </div>
            <div class="filter-row">
                <span class="filter-label">Country:</span>
                <button class="gamut-chip active" onclick="setCountry('all', this)">All Nordics</button>
                <button class="gamut-chip" onclick="setCountry('se', this)">Sweden (Sverige)</button>
                <button class="gamut-chip" onclick="setCountry('dk', this)">Denmark (Danmark)</button>
            </div>
        </div>

        <!-- Results Counter Strip -->
        <div class="results-bar">
            <span>Showing <span id="jobCount" class="results-count">6</span> verified clinical trial positions</span>
            <span>Direct Primary Source Postings · Zero Recruiter Clutter</span>
        </div>

        <!-- Job Feed -->
        <div id="jobFeed" class="job-feed">
            <!-- Cards rendered via JS -->
        </div>

        <footer>
            <span>ClinSight · PRACT</span>
            <span>Codecademy Gamut Design Architecture</span>
        </footer>
    </div>

    <script>
        const JOBS = ${JSON.stringify(jobs, null, 2)};

        let currentSector = 'all';
        let currentRole = 'all';
        let currentCountry = 'all';
        let currentQuery = '';

        function renderJobs() {
            const container = document.getElementById('jobFeed');
            const filtered = JOBS.filter(j => {
                const matchSector = currentSector === 'all' || j.sector === currentSector;
                const matchRole = currentRole === 'all' || j.roleTrack === currentRole;
                const matchCountry = currentCountry === 'all' || j.country === currentCountry;
                const queryText = (j.title + ' ' + j.employer + ' ' + j.location + ' ' + j.summary + ' ' + j.badge).toLowerCase();
                const matchQuery = !currentQuery || queryText.includes(currentQuery.toLowerCase());
                return matchSector && matchRole && matchCountry && matchQuery;
            });

            document.getElementById('jobCount').innerText = filtered.length;

            if (filtered.length === 0) {
                container.innerHTML = '<div class="no-results">No clinical positions match your selected filter criteria. Try resetting filters.</div>';
                return;
            }

            container.innerHTML = filtered.map(j => \`
                <article class="gamut-card">
                    <div class="card-top">
                        <h2 class="job-title">\${j.title}</h2>
                        <div class="badge-group">
                            <span class="track-badge">\${j.badge}</span>
                            <span class="track-badge badge-geo">\${j.countryLabel}</span>
                        </div>
                    </div>
                    <div class="meta-strip">
                        <span class="meta-emp">\${j.employer}</span>
                        <span>\${j.location}</span>
                        <span>Deadline: \${j.deadline}</span>
                    </div>
                    <p class="job-desc">\${j.summary}</p>

                    <div class="req-matrix">
                        <div class="req-col req-col-mandatory">
                            <div class="req-header">
                                <span class="req-name">Mandatory</span>
                                <span class="req-sv">Krav</span>
                            </div>
                            <ul class="req-list">
                                \${j.mandatory.map(m => \`<li>\${m}</li>\`).join('')}
                            </ul>
                        </div>
                        <div class="req-col req-col-desirable">
                            <div class="req-header">
                                <span class="req-name">Desirable</span>
                                <span class="req-sv">Meriterande</span>
                            </div>
                            <ul class="req-list">
                                \${j.desirable.map(d => \`<li>\${d}</li>\`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="protocol-box">
                        <span>Protocol reference on ClinSight: <strong class="protocol-code">\${j.protocol.code}</strong> (\${j.protocol.desc})</span>
                        <a href="\${j.protocol.url}" target="_blank" class="protocol-link">View protocol details →</a>
                    </div>

                    <div class="card-footer">
                        <span class="source-tag">\${j.source}</span>
                        <a href="\${j.applyUrl}" target="_blank" rel="noopener" class="btn-apply">Direct Apply →</a>
                    </div>
                </article>
            \`).join('');
        }

        function setSector(val, btn) {
            currentSector = val;
            btn.parentElement.querySelectorAll('.gamut-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderJobs();
        }

        function setRole(val, btn) {
            currentRole = val;
            btn.parentElement.querySelectorAll('.gamut-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderJobs();
        }

        function setCountry(val, btn) {
            currentCountry = val;
            btn.parentElement.querySelectorAll('.gamut-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            renderJobs();
        }

        function resetFilters() {
            currentSector = 'all';
            currentRole = 'all';
            currentCountry = 'all';
            currentQuery = '';
            document.getElementById('jobSearch').value = '';
            document.querySelectorAll('.gamut-chip').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.filter-row').forEach(grp => {
                grp.querySelector('.gamut-chip').classList.add('active');
            });
            renderJobs();
        }

        document.getElementById('jobSearch').addEventListener('input', (e) => {
            currentQuery = e.target.value.trim();
            renderJobs();
        });

        // Initial render
        renderJobs();
    </script>
</body>
</html>`;
}

fs.writeFileSync(path.join(__dirname, 'draft_jobs_cruk_style.html'), generateCrukHTML(), 'utf8');
fs.writeFileSync(path.join(__dirname, 'draft_jobs_codecademy_style.html'), generateCodecademyHTML(), 'utf8');
console.log('Both prototypes updated with 100% architectural parity!');
