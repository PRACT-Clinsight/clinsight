/**
 * ClinSight Static Page & SEO Asset Generator
 * Generates programmatic static HTML pages for each trial, sitemap.xml, robots.txt, and llms.txt
 */

const fs = require('fs');
const path = require('path');

const TRIALS_DATA_PATH = path.join(__dirname, '../data/trials.json');
const TRIALS_DIR = path.join(__dirname, '../trials');
const ROOT_DIR = path.join(__dirname, '..');

const BASE_URL = 'https://clinsight.pract.eu';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTrialPage(trial, allTrials) {
  const nctId = escapeHtml(trial.nctId);
  const title = escapeHtml(trial.briefTitle);
  const officialTitle = escapeHtml(trial.officialTitle || trial.briefTitle);
  const acronym = escapeHtml(trial.acronym || trial.nctId);
  const phase = escapeHtml(trial.phase);
  const status = escapeHtml(trial.status);
  const sponsor = escapeHtml(trial.sponsor);
  const category = escapeHtml(trial.category);
  const subtype = escapeHtml(trial.subtype);
  const modality = escapeHtml(trial.modality);
  const regions = trial.regions ? trial.regions.map(escapeHtml).join(', ') : 'Global';
  const enrollment = trial.enrollment ? trial.enrollment.toLocaleString() : 'N/A';
  const completionDate = escapeHtml(trial.completionDate);
  const conditions = (trial.conditions || []).map(escapeHtml).join(', ');
  const interventions = (trial.interventions || []).map(escapeHtml).join(', ');

  // Verified Evidence Card Data
  const ev = trial.verifiedEvidence || {};
  const primaryEndpoint = escapeHtml(ev.primaryEndpoint || 'Primary Efficacy Endpoint');
  const benchmarkMetric = escapeHtml(ev.benchmarkMetric || 'Outcome recorded in trial registry.');
  const secondaryMetric = escapeHtml(ev.secondaryMetric || 'Secondary clinical observations documented.');
  const journal = escapeHtml(ev.publishedJournal || 'Peer-Reviewed Clinical Literature');
  const doi = ev.publicationDoi ? escapeHtml(ev.publicationDoi) : null;
  const fdaStatus = escapeHtml(ev.fdaApprovalStatus || 'US FDA Investigational Application');
  const euStatus = escapeHtml(ev.euApprovalStatus || 'EU CTIS Regulatory Register');

  // Related trials (same category or modality, excluding self)
  const related = allTrials
    .filter(t => t.nctId !== trial.nctId && (t.modality === trial.modality || t.category === trial.category))
    .slice(0, 4);

  // SEO schema
  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalStudy",
        "name": `${acronym} (${nctId}): ${title}`,
        "url": `${BASE_URL}/trials/${nctId}/`,
        "studySubject": {
          "@type": "MedicalCondition",
          "name": trial.conditions[0] || "Target Clinical Indication"
        },
        "sponsor": sponsor,
        "status": status,
        "phase": phase
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What is the primary endpoint and result of ${nctId} (${acronym})?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${acronym} evaluated ${primaryEndpoint}. ${benchmarkMetric}`
            }
          },
          {
            "@type": "Question",
            "name": `What drug modality and phase is ${nctId}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${nctId} is a ${phase} study evaluating ${modality} in ${subtype || category}.`
            }
          }
        ]
      }
    ]
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nctId} ${acronym !== nctId ? acronym + ' — ' : ''}Trial Results, Endpoints & Protocol | ClinSight</title>
    <meta name="description" content="Verified clinical evidence, primary endpoints (${primaryEndpoint}), and protocol benchmarks for ${nctId} (${acronym}). Published in ${journal}. Free, no login.">
    <link rel="canonical" href="${BASE_URL}/trials/${nctId}/">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${nctId} ${acronym} — Clinical Evidence & Protocol Summary">
    <meta property="og:description" content="Primary benchmark: ${benchmarkMetric}. Phase: ${phase} · ${modality}">
    <meta property="og:url" content="${BASE_URL}/trials/${nctId}/">
    <meta property="og:type" content="article">
    
    <!-- Google Fonts & FontAwesome -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Structured Data Schema -->
    <script type="application/ld+json">
    ${schemaJson}
    </script>

    <style>
        :root {
            --navy: #0B192C;
            --navy-light: #1E3E62;
            --accent: #1B4332;
            --accent-light: #2D6E47;
            --gold: #DDA853;
            --bg: #F4F6F9;
            --card-bg: #FFFFFF;
            --text-main: #1C2430;
            --text-muted: #5A6A80;
            --border: #E2E8F0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text-main); line-height: 1.6; }
        .topbar { background: var(--navy); color: #FFF; padding: 12px 24px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
        .topbar a { color: #FFF; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .topbar a:hover { color: var(--gold); }
        .container { max-width: 1000px; margin: 32px auto; padding: 0 20px; }
        .breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
        .breadcrumb a { color: var(--navy-light); text-decoration: none; }
        .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .badge { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: #E2E8F0; color: var(--navy); }
        .badge.nct { background: var(--navy); color: #FFF; }
        .badge.phase { background: #EAF3EA; color: var(--accent); }
        .badge.status { background: #FEF3C7; color: #92400E; }
        .badge.status.completed { background: #DCFCE7; color: #166534; }
        .badge.modality { background: #EDE9FE; color: #5B21B6; }
        h1 { font-family: 'Merriweather', serif; font-size: 28px; line-height: 1.3; color: var(--navy); margin-bottom: 14px; }
        .lead { font-size: 15px; color: var(--text-muted); margin-bottom: 24px; }
        
        .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
        .card-header { font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
        
        .evidence-card { border-left: 4px solid var(--accent); background: #FAFDFB; }
        .evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .ev-item h4 { font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 4px; }
        .ev-item p { font-size: 15px; font-weight: 600; color: var(--navy); }
        .ev-highlight { background: #EAF3EA; padding: 14px 16px; border-radius: 8px; margin-top: 10px; font-size: 14.5px; color: #14532D; }
        
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .meta-item h4 { font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; }
        .meta-item p { font-size: 14px; font-weight: 500; color: var(--text-main); }
        
        .criteria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .criteria-grid { grid-template-columns: 1fr; } }
        .criteria-box h4 { font-size: 14px; margin-bottom: 10px; color: var(--navy); }
        .criteria-box ul { padding-left: 20px; font-size: 13.5px; color: var(--text-muted); }
        .criteria-box li { margin-bottom: 6px; }
        
        .actions-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer; border: 1px solid transparent; }
        .btn-primary { background: var(--navy); color: #FFF; }
        .btn-primary:hover { background: var(--navy-light); }
        .btn-outline { background: #FFF; border-color: var(--border); color: var(--navy); }
        .btn-outline:hover { background: #F8FAFC; border-color: var(--navy-light); }
        
        .cta-banner { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%); color: #FFF; border-radius: 12px; padding: 28px; text-align: center; margin-top: 36px; }
        .cta-banner h3 { font-family: 'Merriweather', serif; font-size: 20px; margin-bottom: 10px; }
        .cta-banner p { font-size: 14px; color: #CBD5E1; max-width: 600px; margin: 0 auto 18px; }
        .cta-banner a { background: var(--gold); color: var(--navy); padding: 11px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; }
        
        .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 14px; }
        .related-card { background: #FFF; border: 1px solid var(--border); border-radius: 8px; padding: 14px; text-decoration: none; color: inherit; display: block; transition: border-color 0.2s; }
        .related-card:hover { border-color: var(--navy-light); }
        .related-card .rel-id { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; color: var(--accent); }
        .related-card .rel-title { font-size: 13px; font-weight: 600; color: var(--navy); margin: 4px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        footer { margin-top: 60px; padding: 24px 0; text-align: center; font-size: 13px; color: var(--text-muted); border-top: 1px solid var(--border); }
    </style>
</head>
<body>
    <div class="topbar">
        <a href="../../"><i class="fa-solid fa-arrow-left"></i> ClinSight™ Clinical Trials Explorer</a>
        <span>Part of the <a href="https://pract.eu" target="_blank" style="text-decoration: underline;">PRACT™ Ecosystem</a></span>
    </div>

    <div class="container">
        <div class="breadcrumb">
            <a href="../../">ClinSight</a> / <a href="../../?category=${encodeURIComponent(trial.category)}">${category}</a> / <span>${nctId}</span>
        </div>

        <div class="badge-row">
            <span class="badge nct">${nctId}</span>
            <span class="badge phase">${phase}</span>
            <span class="badge status ${trial.isCompleted ? 'completed' : ''}">${status}</span>
            <span class="badge modality">${modality}</span>
        </div>

        <h1>${acronym !== nctId ? acronym + ': ' : ''}${title}</h1>
        <p class="lead">${officialTitle}</p>

        <!-- The Verified Evidence Card (Information Gain) -->
        <div class="card evidence-card">
            <div class="card-header"><i class="fa-solid fa-square-poll-vertical"></i> Verified Clinical Evidence & Efficacy Benchmarks</div>
            <div class="evidence-grid">
                <div class="ev-item">
                    <h4>Primary Endpoint</h4>
                    <p>${primaryEndpoint}</p>
                </div>
                <div class="ev-item">
                    <h4>Peer-Reviewed Publication</h4>
                    <p>${journal} ${doi ? `<a href="https://doi.org/${doi}" target="_blank" style="color:var(--accent-light); font-size:12px; text-decoration:none;"><i class="fa-solid fa-arrow-up-right-from-square"></i> DOI</a>` : ''}</p>
                </div>
                <div class="ev-item">
                    <h4>US FDA Regulatory Status</h4>
                    <p>${fdaStatus}</p>
                </div>
                <div class="ev-item">
                    <h4>EU CTIS / EMA Status</h4>
                    <p>${euStatus}</p>
                </div>
            </div>
            <div class="ev-highlight">
                <strong><i class="fa-solid fa-circle-check"></i> Benchmark Readout:</strong> ${benchmarkMetric}
                ${ev.secondaryMetric ? `<div style="margin-top:6px; font-size:13px; opacity:0.9;"><strong>Secondary Observations:</strong> ${secondaryMetric}</div>` : ''}
            </div>
        </div>

        <!-- Trial Architecture & Demographics -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-dna"></i> Study Design & Global Scope</div>
            <div class="meta-grid">
                <div class="meta-item">
                    <h4>Lead Sponsor</h4>
                    <p>${sponsor}</p>
                </div>
                <div class="meta-item">
                    <h4>Therapeutic Indication</h4>
                    <p>${conditions || subtype}</p>
                </div>
                <div class="meta-item">
                    <h4>Intervention / Drug</h4>
                    <p>${interventions || modality}</p>
                </div>
                <div class="meta-item">
                    <h4>Patient Enrollment</h4>
                    <p>${enrollment} participants</p>
                </div>
                <div class="meta-item">
                    <h4>Completion / Horizon</h4>
                    <p>${completionDate}</p>
                </div>
                <div class="meta-item">
                    <h4>Regulatory Jurisdictions</h4>
                    <p>${regions}</p>
                </div>
            </div>

            <div class="actions-row">
                <a href="https://clinicaltrials.gov/study/${nctId}" target="_blank" class="btn btn-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i> ClinicalTrials.gov Source</a>
                <a href="javascript:window.print()" class="btn btn-outline"><i class="fa-solid fa-print"></i> Print / PDF Summary</a>
                <a href="../../data/trials.json" download class="btn btn-outline"><i class="fa-solid fa-download"></i> Raw Dataset JSON</a>
            </div>
        </div>

        <!-- Structured Eligibility Checklist -->
        ${(trial.inclusionCriteria && trial.inclusionCriteria.length > 0) || (trial.exclusionCriteria && trial.exclusionCriteria.length > 0) ? `
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-list-check"></i> Structured Eligibility Criteria Checklist</div>
            <div class="criteria-grid">
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-check" style="color:var(--accent);"></i> Key Inclusion Criteria</h4>
                    <ul>
                        ${trial.inclusionCriteria.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-xmark" style="color:#DC2626;"></i> Key Exclusion Criteria</h4>
                    <ul>
                        ${trial.exclusionCriteria.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Related Trials in Same Class -->
        ${related.length > 0 ? `
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-network-wired"></i> Related ${modality} Trials</div>
            <div class="related-grid">
                ${related.map(r => `
                <a href="../${r.nctId}/" class="related-card">
                    <div class="rel-id">${r.nctId} · ${r.phase}</div>
                    <div class="rel-title">${escapeHtml(r.acronym || r.briefTitle)}</div>
                    <div style="font-size:11.5px; color:var(--text-muted);">${escapeHtml(r.subtype || r.category)}</div>
                </a>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- The PRACT Advisory Funnel -->
        <div class="cta-banner">
            <h3>Need Target Trial Emulation (TTE) or Clinical Evaluation?</h3>
            <p>Deploy the PRACT methodology to bridge complex clinical datasets into accelerated regulatory strategy, comparative effectiveness models, and PMCF compliance.</p>
            <a href="https://pract.eu#contact">Consult the PRACT Team →</a>
        </div>

        <footer>
            <p>&copy; 2026 ClinSight™. A PRACT Business Unit. Primary data sourced from ClinicalTrials.gov and verified medical literature.</p>
        </footer>
    </div>
</body>
</html>`;
}

function buildIndexHtml(trials) {
  // Extract distinct filter values
  const categories = Array.from(new Set(trials.map(t => t.category).filter(Boolean))).sort();
  const modalities = Array.from(new Set(trials.map(t => t.modality).filter(Boolean))).sort();
  const phases = ['Phase 3', 'Phase 2', 'Phase 1', 'Phase 4'];

  const trialsJson = JSON.stringify(trials.map(t => ({
    id: t.nctId,
    acronym: t.acronym || t.nctId,
    title: t.briefTitle,
    phase: t.phase,
    status: t.status,
    isCompleted: t.isCompleted,
    category: t.category,
    subtype: t.subtype,
    modality: t.modality,
    regions: t.regions || [],
    year: t.year,
    enrollment: t.enrollment,
    sponsor: t.sponsor,
    hasBenchmark: t.verifiedEvidence?.hasBenchmark || false,
    benchmark: t.verifiedEvidence?.benchmarkMetric || ''
  })));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClinSight™ | Clinical Trials Intelligence & Evidence Explorer</title>
    <meta name="description" content="Explore ${trials.length}+ verified clinical trials across Oncology, ADCs, CAR-T, and GLP-1. Relevance-ranked with verified benchmark metrics and peer-reviewed paper links.">
    <link rel="canonical" href="${BASE_URL}/">
    
    <!-- Open Graph -->
    <meta property="og:title" content="ClinSight™ Clinical Trials Explorer">
    <meta property="og:description" content="Fast, structured clinical evidence search across pivotal trials. 1-click downloads, published results, and protocol summaries.">
    <meta property="og:url" content="${BASE_URL}/">
    <meta property="og:type" content="website">

    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --navy: #0B192C;
            --navy-light: #1E3E62;
            --accent: #1B4332;
            --accent-light: #2D6E47;
            --gold: #DDA853;
            --bg: #F4F6F9;
            --card-bg: #FFFFFF;
            --text-main: #1C2430;
            --text-muted: #5A6A80;
            --border: #E2E8F0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text-main); line-height: 1.5; }
        .topbar { background: var(--navy); color: #FFF; padding: 12px 24px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
        .topbar a { color: #FFF; text-decoration: none; font-weight: 600; }
        .topbar a:hover { color: var(--gold); }
        .hero { background: linear-gradient(135deg, var(--navy) 0%, #102A43 100%); color: #FFF; padding: 48px 24px 36px; text-align: center; }
        .hero h1 { font-family: 'Merriweather', serif; font-size: 34px; margin-bottom: 12px; font-weight: 700; }
        .hero p { font-size: 16px; color: #CBD5E1; max-width: 760px; margin: 0 auto; line-height: 1.6; }
        .container { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }
        
        /* Search Box */
        .search-panel { background: #FFF; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(11,25,44,0.08); margin-top: -24px; border: 1px solid var(--border); }
        .search-input-wrap { display: flex; gap: 12px; margin-bottom: 16px; }
        .search-input { flex: 1; padding: 14px 18px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 15px; font-family: inherit; }
        .search-input:focus { outline: none; border-color: var(--navy-light); box-shadow: 0 0 0 3px rgba(30,62,98,0.1); }
        .btn-search { background: var(--navy); color: #FFF; border: none; padding: 0 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-search:hover { background: var(--navy-light); }
        
        /* Filter Grid */
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .filter-select { width: 100%; padding: 10px 12px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 13.5px; background: #FFF; color: var(--text-main); }
        
        /* Quick Chips */
        .chips-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; align-items: center; }
        .chips-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-right: 4px; }
        .chip { background: #E2E8F0; color: var(--navy); border: none; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .chip:hover, .chip.active { background: var(--navy); color: #FFF; }
        
        /* Controls & Counter */
        .ctrl-row { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 16px; font-size: 14px; color: var(--text-muted); }
        .ctrl-row b { color: var(--navy); }
        
        /* Study Cards */
        .study-list { display: grid; gap: 14px; }
        .study-card { background: #FFF; border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; text-decoration: none; color: inherit; display: block; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
        .study-card:hover { transform: translateY(-2px); border-color: var(--navy-light); box-shadow: 0 6px 14px rgba(0,0,0,0.05); }
        .card-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; margin-bottom: 8px; gap: 8px; }
        .badges-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .badge { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 5px; }
        .badge.nct { background: var(--navy); color: #FFF; }
        .badge.phase { background: #EAF3EA; color: var(--accent); }
        .badge.modality { background: #EDE9FE; color: #5B21B6; }
        .badge.completed { background: #DCFCE7; color: #166534; }
        .card-year { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .card-title { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 6px; line-height: 1.35; }
        .card-meta { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
        .card-ev { background: #FAFDFB; border-left: 3px solid var(--accent); padding: 8px 12px; font-size: 12.5px; color: #166534; border-radius: 0 6px 6px 0; }
        
        footer { text-align: center; font-size: 13px; color: var(--text-muted); padding: 30px 0; border-top: 1px solid var(--border); margin-top: 40px; }
    </style>
</head>
<body>
    <div class="topbar">
        <span><strong>ClinSight™</strong> Clinical Evidence Engine</span>
        <span>Part of <a href="https://pract.eu" target="_blank">PRACT™ Regulatory Intelligence</a></span>
    </div>

    <section class="hero">
        <h1>Clinical Trials Intelligence & Evidence Explorer</h1>
        <p>Pre-rendered, relevance-ranked clinical trial readouts across Oncology, ADCs, CAR-T, and Incretin mimetics. Direct links to peer-reviewed papers and primary statutory endpoints.</p>
    </section>

    <div class="container">
        <!-- Search & Filter Controls -->
        <div class="search-panel">
            <div class="search-input-wrap">
                <input type="text" id="searchInput" class="search-input" placeholder="Search by NCT, Acronym (e.g. DESTINY-Breast04), Drug, or Condition..." autofocus>
                <button class="btn-search" onclick="applyFilters()"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
            </div>
            
            <div class="filter-grid">
                <select id="filterCategory" class="filter-select" onchange="applyFilters()">
                    <option value="">All Therapeutic Areas</option>
                    ${categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
                </select>

                <select id="filterModality" class="filter-select" onchange="applyFilters()">
                    <option value="">All Drug Modalities</option>
                    ${modalities.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
                </select>

                <select id="filterPhase" class="filter-select" onchange="applyFilters()">
                    <option value="">All Study Phases</option>
                    ${phases.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
                </select>

                <select id="filterStatus" class="filter-select" onchange="applyFilters()">
                    <option value="">All Statuses</option>
                    <option value="completed">Completed (Has Results)</option>
                    <option value="recruiting">Active & Recruiting</option>
                </select>
            </div>

            <!-- Preset Quick Chips -->
            <div class="chips-row">
                <span class="chips-label">Quick Filters:</span>
                <button class="chip" onclick="quickFilter('adc')">🏷️ ADCs (Antibody-Drug Conjugates)</button>
                <button class="chip" onclick="quickFilter('cart')">🏷️ CAR-T & Cell Therapy</button>
                <button class="chip" onclick="quickFilter('glp1')">🏷️ GLP-1 & Incretins</button>
                <button class="chip" onclick="quickFilter('phase3')">🏷️ Phase 3 Pivotal</button>
                <button class="chip" onclick="quickFilter('completed')">🏷️ Completed with Results</button>
                <button class="chip" onclick="clearFilters()" style="background:#FEE2E2; color:#991B1B;">✕ Reset</button>
            </div>
        </div>

        <div class="ctrl-row">
            <span id="counterText">Showing <b>${trials.length}</b> verified trials</span>
            <div style="display:flex; align-items:center; gap:8px;">
                <label style="font-size:12px; font-weight:600;">Sort By:</label>
                <select id="sortSelect" class="filter-select" style="width:auto; padding:6px 10px; font-size:13px;" onchange="applyFilters()">
                    <option value="relevance">Relevance / Key Landmarks</option>
                    <option value="year-desc">Completion Year (Newest)</option>
                    <option value="enrollment-desc">Enrollment Size (Largest)</option>
                </select>
            </div>
        </div>

        <!-- Dynamic Study Listing -->
        <div id="studyList" class="study-list"></div>

        <footer>
            <p>&copy; 2026 ClinSight™. A PRACT Business Unit. Primary data sourced from ClinicalTrials.gov and verified medical literature.</p>
        </footer>
    </div>

    <!-- Client-Side Filter Engine Script -->
    <script>
        const ALL_TRIALS = ${trialsJson};

        function renderList(trials) {
            const listEl = document.getElementById('studyList');
            const counterEl = document.getElementById('counterText');
            counterEl.innerHTML = \`Showing <b>\${trials.length}</b> verified trials\`;

            if (trials.length === 0) {
                listEl.innerHTML = \`
                    <div style="text-align:center; padding:48px; background:#FFF; border-radius:10px; border:1px solid #E2E8F0;">
                        <i class="fa-solid fa-folder-open" style="font-size:32px; color:#94A3B8; margin-bottom:12px;"></i>
                        <h3 style="color:#0B192C;">No clinical studies matched your filters</h3>
                        <p style="color:#64748B; font-size:14px; margin-top:6px;">Try clearing search terms or selecting 'All Therapeutic Areas'.</p>
                        <button onclick="clearFilters()" style="margin-top:16px; padding:8px 16px; background:#0B192C; color:#FFF; border:none; border-radius:6px; cursor:pointer;">Reset Filters</button>
                    </div>
                \`;
                return;
            }

            listEl.innerHTML = trials.map(t => \`
                <a href="trials/\${t.id}/" class="study-card">
                    <div class="card-top">
                        <div class="badges-wrap">
                            <span class="badge nct">\${t.id}</span>
                            <span class="badge phase">\${t.phase}</span>
                            <span class="badge modality">\${t.modality}</span>
                            \${t.isCompleted ? '<span class="badge completed"><i class="fa-solid fa-circle-check"></i> Completed</span>' : ''}
                        </div>
                        <span class="card-year">Readout: \${t.year}</span>
                    </div>
                    <div class="card-title">\${t.acronym !== t.id ? t.acronym + ': ' : ''}\${t.title}</div>
                    <div class="card-meta">
                        <span><i class="fa-solid fa-building"></i> \${t.sponsor}</span> · 
                        <span><i class="fa-solid fa-disease"></i> \${t.subtype || t.category}</span> · 
                        <span><i class="fa-solid fa-users"></i> \${t.enrollment ? t.enrollment.toLocaleString() : 'N/A'} patients</span>
                    </div>
                    \${t.hasBenchmark ? \`
                    <div class="card-ev">
                        <strong><i class="fa-solid fa-star" style="color:#DDA853;"></i> Verified Landmark Benchmark:</strong> \${t.benchmark}
                    </div>
                    \` : ''}
                </a>
            \`).join('');
        }

        function applyFilters() {
            const q = document.getElementById('searchInput').value.trim().toLowerCase();
            const cat = document.getElementById('filterCategory').value;
            const mod = document.getElementById('filterModality').value;
            const phase = document.getElementById('filterPhase').value;
            const status = document.getElementById('filterStatus').value;
            const sort = document.getElementById('sortSelect').value;

            let filtered = ALL_TRIALS.filter(t => {
                if (q) {
                    const matchStr = (t.id + ' ' + t.acronym + ' ' + t.title + ' ' + (t.subtype || '') + ' ' + (t.modality || '')).toLowerCase();
                    if (!matchStr.includes(q)) return false;
                }
                if (cat && t.category !== cat) return false;
                if (mod && t.modality !== mod) return false;
                if (phase && !t.phase.includes(phase)) return false;
                if (status === 'completed' && !t.isCompleted) return false;
                if (status === 'recruiting' && !t.status.toLowerCase().includes('recruiting')) return false;
                return true;
            });

            // Sorting
            if (sort === 'year-desc') {
                filtered.sort((a, b) => b.year - a.year);
            } else if (sort === 'enrollment-desc') {
                filtered.sort((a, b) => (b.enrollment || 0) - (a.enrollment || 0));
            } else {
                // Relevance: prioritize landmark benchmarks
                filtered.sort((a, b) => (b.hasBenchmark ? 1 : 0) - (a.hasBenchmark ? 1 : 0));
            }

            renderList(filtered);
        }

        function quickFilter(type) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');

            if (type === 'adc') {
                document.getElementById('filterModality').value = 'Antibody-Drug Conjugates (ADC)';
            } else if (type === 'cart') {
                document.getElementById('filterModality').value = 'Cell & Gene Therapy (CAR-T)';
            } else if (type === 'glp1') {
                document.getElementById('filterModality').value = 'Incretin Mimetics (GLP-1 / GIP)';
            } else if (type === 'phase3') {
                document.getElementById('filterPhase').value = 'Phase 3';
            } else if (type === 'completed') {
                document.getElementById('filterStatus').value = 'completed';
            }
            applyFilters();
        }

        function clearFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('filterCategory').value = '';
            document.getElementById('filterModality').value = '';
            document.getElementById('filterPhase').value = '';
            document.getElementById('filterStatus').value = '';
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            applyFilters();
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            applyFilters();
        });
    </script>
</body>
</html>`;
}

function buildSitemapXml(trials) {
  const urls = [
    `  <url>\n    <loc>${BASE_URL}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`
  ];

  trials.forEach(t => {
    urls.push(`  <url>\n    <loc>${BASE_URL}/trials/${t.nctId}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

function buildRobotsTxt() {
  return `# ClinSight Robots.txt - Permissive Crawling for Google & AI Engines
User-agent: *
Allow: /

# Explicit AI Search Bot Permissions (GEO Optimization)
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
}

function buildLlmsTxt(trials) {
  const lines = [
    `# ClinSight Clinical Evidence Registry`,
    ``,
    `> Primary Source Clinical Trial Benchmarks, Endpoints & Peer-Reviewed Publications`,
    `> Canonical URL: ${BASE_URL}`,
    ``,
    `## Indexed Clinical Studies Directory`,
    ``
  ];

  trials.forEach(t => {
    const acronym = t.acronym || t.nctId;
    const bench = t.verifiedEvidence?.benchmarkMetric ? ` — ${t.verifiedEvidence.benchmarkMetric}` : '';
    lines.push(`- [${t.nctId} (${acronym})](${BASE_URL}/trials/${t.nctId}/): ${t.phase} ${t.modality} in ${t.subtype || t.category}${bench}`);
  });

  return lines.join('\n');
}

async function main() {
  console.log('=== ClinSight Static Page & SEO Asset Generator ===');
  if (!fs.existsSync(TRIALS_DATA_PATH)) {
    console.error('Missing trials data at:', TRIALS_DATA_PATH);
    return;
  }

  const rawData = fs.readFileSync(TRIALS_DATA_PATH, 'utf8');
  const trials = JSON.parse(rawData);
  console.log(`Loaded ${trials.length} trials from dataset.`);

  // 1. Generate Individual Trial Static Pages
  console.log(`Generating programmatic static pages in: ${TRIALS_DIR}`);
  if (!fs.existsSync(TRIALS_DIR)) fs.mkdirSync(TRIALS_DIR, { recursive: true });

  trials.forEach((trial, idx) => {
    const trialFolder = path.join(TRIALS_DIR, trial.nctId);
    if (!fs.existsSync(trialFolder)) fs.mkdirSync(trialFolder, { recursive: true });
    const html = renderTrialPage(trial, trials);
    fs.writeFileSync(path.join(trialFolder, 'index.html'), html, 'utf8');
  });
  console.log(`Rendered ${trials.length} individual static trial pages.`);

  // 2. Generate Search Hub index.html
  const indexHtml = buildIndexHtml(trials);
  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), indexHtml, 'utf8');
  console.log(`Rendered interactive search hub at: ${path.join(ROOT_DIR, 'index.html')}`);

  // 3. Generate sitemap.xml
  const sitemapXml = buildSitemapXml(trials);
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`Generated sitemap.xml with ${trials.length + 1} URLs.`);

  // 4. Generate robots.txt
  const robotsTxt = buildRobotsTxt();
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTxt, 'utf8');
  console.log(`Generated robots.txt.`);

  // 5. Generate llms.txt
  const llmsTxt = buildLlmsTxt(trials);
  fs.writeFileSync(path.join(ROOT_DIR, 'llms.txt'), llmsTxt, 'utf8');
  console.log(`Generated llms.txt.`);

  // Mirror everything to OneDrive
  const oneDriveClinSight = 'c:/Users/xthomk/OneDrive/Antigravity/Monetization/ClinSight-Website';
  console.log(`\nMirroring build to OneDrive: ${oneDriveClinSight}...`);
  try {
    fs.cpSync(ROOT_DIR, oneDriveClinSight, { recursive: true, force: true });
    console.log('Successfully mirrored entire ClinSight-Website build to OneDrive.');
  } catch (e) {
    console.warn('OneDrive mirror warning:', e.message);
  }

  console.log('\nAll Phase 1 assets built and ready for zero-charge static deployment!');
}

main().catch(console.error);
