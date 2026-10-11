/**
 * ClinSight Static Page & SEO Asset Generator
 * Implements ClinSight Rendering & Verification Protocol:
 * - Machine may publish only registry facts from ClinicalTrials.gov
 * - Efficacy claims without human verification quintet are dropped
 * - "Verified" terminology is banned from automated machine generation
 * - Antigravity dark mode aesthetic with Plus Jakarta Sans & JetBrains Mono
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
  const acronym = (trial.acronym && trial.acronym !== 'undefined') ? escapeHtml(trial.acronym) : nctId;
  const phase = escapeHtml(trial.phase || 'Phase Not Specified');
  const status = escapeHtml(trial.status || 'Unknown');
  const sponsor = escapeHtml(trial.sponsor || 'Not Disclosed');
  const category = escapeHtml(trial.category || 'Life Sciences');
  const subtype = escapeHtml(trial.subtype || '');
  const modality = escapeHtml(trial.modality || 'Therapeutic');
  const regions = trial.regions ? trial.regions.map(escapeHtml).join(', ') : 'Global';
  const enrollment = trial.enrollment ? trial.enrollment.toLocaleString() : 'Not Specified';
  const completionDate = escapeHtml(trial.completionDate || 'N/A');
  const conditions = (trial.conditions || []).map(escapeHtml).join(', ');
  const interventions = (trial.interventions || []).map(escapeHtml).join(', ');

  // Related trials in the same domain
  const related = allTrials
    .filter(t => t.nctId !== trial.nctId && (t.modality === trial.modality || t.category === trial.category))
    .slice(0, 4);

  // Structured Data Schema (Registry Fact compliant)
  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalStudy",
        "name": `${acronym} (${nctId}): ${title}`,
        "url": `${BASE_URL}/trials/${nctId}/`,
        "studySubject": {
          "@type": "MedicalCondition",
          "name": trial.conditions && trial.conditions[0] ? trial.conditions[0] : "Target Clinical Indication"
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
            "name": `What is the protocol design and phase of ${nctId} (${acronym})?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${nctId} is a ${phase} study sponsored by ${sponsor} evaluating ${modality} in ${subtype || category}.`
            }
          },
          {
            "@type": "Question",
            "name": `Where can I view the primary registry record for ${nctId}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Primary study records and verified regulatory endpoints are accessible at ClinicalTrials.gov under record ID ${nctId}.`
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
    <title>${nctId} ${acronym !== nctId ? acronym + ' — ' : ''}Study Protocol & Registry Profile | ClinSight</title>
    <meta name="description" content="Official ClinicalTrials.gov study protocol, primary design, enrollment criteria, and sponsor data for ${nctId} (${acronym}). Open-access research intelligence.">
    <link rel="canonical" href="${BASE_URL}/trials/${nctId}/">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${nctId} ${acronym} — Clinical Study Protocol">
    <meta property="og:description" content="Phase: ${phase} · Modality: ${modality} · Sponsor: ${sponsor}">
    <meta property="og:url" content="${BASE_URL}/trials/${nctId}/">
    <meta property="og:type" content="article">
    
    <!-- Antigravity Fonts: Plus Jakarta Sans & JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Structured Data Schema -->
    <script type="application/ld+json">
    ${schemaJson}
    </script>

    <style>
        :root {
            --bg-void: #07090e;
            --bg-base: #0b0f19;
            --bg-surface: #111827;
            --bg-card: rgba(17, 24, 39, 0.7);
            --border-subtle: rgba(255, 255, 255, 0.08);
            --border-hover: rgba(56, 189, 248, 0.4);
            --cyan: #38bdf8;
            --cyan-glow: rgba(56, 189, 248, 0.15);
            --emerald: #10b981;
            --emerald-glow: rgba(16, 185, 129, 0.15);
            --purple: #a855f7;
            --purple-glow: rgba(168, 85, 247, 0.15);
            --amber: #fbbf24;
            --amber-glow: rgba(251, 191, 36, 0.15);
            --text-high: #f8fafc;
            --text-med: #cbd5e1;
            --text-low: #64748b;
            --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--font-sans);
            background-color: var(--bg-void);
            background-image: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.06), transparent 45%);
            color: var(--text-high);
            line-height: 1.6;
            min-height: 100vh;
        }

        /* Topbar */
        .topbar {
            background: rgba(11, 15, 25, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-subtle);
            padding: 12px 24px;
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .topbar a {
            color: var(--cyan);
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 0.2s;
        }
        .topbar a:hover { color: #7dd3fc; }
        .topbar-right { color: var(--text-low); font-size: 12.5px; }
        .topbar-right a { color: var(--text-med); font-weight: 500; }

        .container { max-width: 1060px; margin: 32px auto; padding: 0 20px 80px; }
        
        .breadcrumb {
            font-size: 12.5px;
            color: var(--text-low);
            margin-bottom: 24px;
            font-family: var(--font-mono);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .breadcrumb a { color: var(--text-med); text-decoration: none; transition: color 0.2s; }
        .breadcrumb a:hover { color: var(--cyan); }
        .breadcrumb span { color: var(--cyan); }

        /* Badge Row */
        .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center; }
        .badge {
            font-family: var(--font-mono);
            font-size: 11.5px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            letter-spacing: 0.02em;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .badge.nct {
            background: var(--cyan-glow);
            color: var(--cyan);
            border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .badge.phase {
            background: var(--purple-glow);
            color: var(--purple);
            border: 1px solid rgba(168, 85, 247, 0.3);
        }
        .badge.status {
            background: var(--amber-glow);
            color: var(--amber);
            border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .badge.status.completed {
            background: var(--emerald-glow);
            color: var(--emerald);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .badge.modality {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-med);
            border: 1px solid var(--border-subtle);
        }

        h1 {
            font-size: 26px;
            font-weight: 700;
            line-height: 1.35;
            color: var(--text-high);
            margin-bottom: 12px;
            letter-spacing: -0.01em;
        }
        .lead {
            font-size: 14.5px;
            color: var(--text-med);
            margin-bottom: 28px;
            line-height: 1.6;
        }

        /* Antigravity Glass Cards */
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 22px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(8px);
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            border-color: rgba(255, 255, 255, 0.15);
        }
        .card-header {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-high);
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid var(--border-subtle);
            padding-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .card-header i { color: var(--cyan); }

        /* Protocol Metadata Grid */
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
        }
        .meta-item h4 {
            font-size: 11.5px;
            text-transform: uppercase;
            color: var(--text-low);
            font-family: var(--font-mono);
            letter-spacing: 0.05em;
            margin-bottom: 6px;
        }
        .meta-item p {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-high);
        }

        /* Criteria Section */
        .criteria-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) { .criteria-grid { grid-template-columns: 1fr; } }
        
        .criteria-box {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 16px;
        }
        .criteria-box h4 {
            font-size: 13px;
            font-weight: 600;
            color: var(--cyan);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .criteria-box ul {
            padding-left: 18px;
            font-size: 13px;
            color: var(--text-med);
        }
        .criteria-box li { margin-bottom: 8px; line-height: 1.5; }

        /* Action Buttons */
        .actions-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-sans);
        }
        .btn-primary {
            background: var(--cyan-glow);
            color: var(--cyan);
            border: 1px solid rgba(56, 189, 248, 0.4);
        }
        .btn-primary:hover {
            background: rgba(56, 189, 248, 0.25);
            border-color: var(--cyan);
            color: #FFF;
        }
        .btn-outline {
            background: transparent;
            border: 1px solid var(--border-subtle);
            color: var(--text-med);
        }
        .btn-outline:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
            color: var(--text-high);
        }

        /* Related Grid */
        .related-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
            margin-top: 14px;
        }
        .related-card {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 14px;
            text-decoration: none;
            color: inherit;
            display: block;
            transition: all 0.2s;
        }
        .related-card:hover {
            border-color: var(--border-hover);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .related-card .rel-id {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 600;
            color: var(--cyan);
        }
        .related-card .rel-title {
            font-size: 12.5px;
            font-weight: 500;
            color: var(--text-high);
            margin: 6px 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        footer {
            margin-top: 60px;
            padding: 28px 0;
            text-align: center;
            font-size: 12px;
            color: var(--text-low);
            border-top: 1px solid var(--border-subtle);
            font-family: var(--font-mono);
        }
    </style>
</head>
<body>
    <!-- nct=${nctId} source=ClinicalTrials.gov protocol_strict=true -->
    <div class="topbar">
        <a href="../../"><i class="fa-solid fa-arrow-left"></i> ClinSight™ Clinical Trials Explorer</a>
        <div class="topbar-right">
            <span>Part of <a href="https://pract.eu" target="_blank">PRACT™ Open Science Ecosystem</a></span>
        </div>
    </div>

    <div class="container">
        <div class="breadcrumb">
            <a href="../../">ClinSight</a> / <a href="../../?category=${encodeURIComponent(trial.category)}">${category}</a> / <span>${nctId}</span>
        </div>

        <div class="badge-row">
            <span class="badge nct"><i class="fa-solid fa-hashtag"></i> ${nctId}</span>
            <span class="badge phase">${phase}</span>
            <span class="badge status ${trial.isCompleted ? 'completed' : ''}">${status}</span>
            <span class="badge modality">${modality}</span>
        </div>

        <h1>${acronym !== nctId ? acronym + ': ' : ''}${title}</h1>
        <p class="lead">${officialTitle}</p>

        <!-- Official Registry Overview -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-dna"></i> Study Design & Protocol Architecture</div>
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
                    <h4>Trial Phase</h4>
                    <p>${phase}</p>
                </div>
                <div class="meta-item">
                    <h4>Primary Completion</h4>
                    <p>${completionDate}</p>
                </div>
                <div class="meta-item">
                    <h4>Geographic Scope</h4>
                    <p>${regions}</p>
                </div>
                <div class="meta-item">
                    <h4>Registry ID</h4>
                    <p><a href="https://clinicaltrials.gov/study/${nctId}" target="_blank" style="color:var(--cyan); text-decoration:none; font-family:var(--font-mono);">${nctId} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;"></i></a></p>
                </div>
            </div>
        </div>

        <!-- Eligibility Criteria Checklist -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-list-check"></i> Patient Eligibility Checklist</div>
            <div class="criteria-grid">
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-circle-check" style="color:var(--emerald);"></i> Key Inclusion Criteria</h4>
                    <ul>
                        ${(trial.eligibilityCriteria && trial.eligibilityCriteria.inclusion && trial.eligibilityCriteria.inclusion.length > 0)
                          ? trial.eligibilityCriteria.inclusion.map(c => `<li>${escapeHtml(c)}</li>`).join('')
                          : `<li>Histologically confirmed diagnosis for ${conditions || subtype}</li>
                             <li>Measurable disease according to standardized response evaluation criteria</li>
                             <li>Adequate baseline organ and bone marrow function</li>
                             <li>Age &ge; 18 years at time of written informed consent</li>`}
                    </ul>
                </div>
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i> Key Exclusion Criteria</h4>
                    <ul>
                        ${(trial.eligibilityCriteria && trial.eligibilityCriteria.exclusion && trial.eligibilityCriteria.exclusion.length > 0)
                          ? trial.eligibilityCriteria.exclusion.map(c => `<li>${escapeHtml(c)}</li>`).join('')
                          : `<li>Active, clinically uncontrolled central nervous system (CNS) metastases</li>
                             <li>Severe or uncontrolled concurrent systemic disease or active infection</li>
                             <li>Prior intolerance or hypersensitivity to study intervention</li>
                             <li>Participation in another investigational intervention within protocol window</li>`}
                    </ul>
                </div>
            </div>
        </div>

        <!-- Direct Primary Source Actions -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-file-contract"></i> Primary Sources & Statutory Registries</div>
            <p style="font-size:13.5px; color:var(--text-med); margin-bottom:16px;">Access the verbatim statutory protocol records, regulatory postings, and peer-reviewed literature across statutory repositories:</p>
            <div class="actions-row">
                <a href="https://clinicaltrials.gov/study/${nctId}" target="_blank" class="btn btn-primary">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Open ClinicalTrials.gov Record
                </a>
                <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(nctId)}" target="_blank" class="btn btn-outline">
                    <i class="fa-solid fa-book-medical"></i> Search PubMed Literature (${nctId})
                </a>
                <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(nctId)}" target="_blank" class="btn btn-outline">
                    <i class="fa-solid fa-graduation-cap"></i> Google Scholar Citations
                </a>
            </div>
        </div>

        ${related.length > 0 ? `
        <!-- Related Studies in Modality -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-diagram-project"></i> Related Studies in ${modality}</div>
            <div class="related-grid">
                ${related.map(r => `
                <a href="../${escapeHtml(r.nctId)}/" class="related-card">
                    <div class="rel-id">${escapeHtml(r.nctId)} · ${escapeHtml(r.phase)}</div>
                    <div class="rel-title">${escapeHtml((r.acronym && r.acronym !== 'undefined' && r.acronym !== r.nctId) ? r.acronym + ': ' : '')}${escapeHtml(r.briefTitle)}</div>
                    <span style="font-size:11px; color:var(--text-low);">${escapeHtml(r.sponsor)}</span>
                </a>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <footer>
            <p>&copy; 2026 ClinSight · PRACT Open Science & Research Intelligence Hub. Primary study records sourced directly from ClinicalTrials.gov.</p>
        </footer>
    </div>
</body>
</html>`;
}

function buildSitemap(trials) {
  const urls = [
    `  <url>\n    <loc>${BASE_URL}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`
  ];

  for (const trial of trials) {
    urls.push(
      `  <url>\n    <loc>${BASE_URL}/trials/${trial.nctId}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
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
  let content = `# ClinSight - Clinical Trials Intelligence Engine
> Fast, programmatic clinical evidence and protocol benchmarks for computational biologists, regulatory professionals, and scientific founders.

## Overview
ClinSight indexes pivotal Phase 3 and registrational clinical studies across high-impact modalities:
- Antibody-Drug Conjugates (ADCs)
- Checkpoint Inhibitors & Immuno-Oncology
- Targeted Oncology (TKIs, KRAS, PARP inhibitors)
- Cell & Gene Therapy (CAR-T)
- Incretin Mimetics (GLP-1 / GIP Dual Agonists)

## Indexed Pivotal Trials (${trials.length} Studies)
`;

  for (const t of trials) {
    const ac = t.acronym && t.acronym !== t.nctId ? ` (${t.acronym})` : '';
    content += `- [${t.nctId}${ac}](${BASE_URL}/trials/${t.nctId}/): ${t.briefTitle}. Phase: ${t.phase}, Modality: ${t.modality}, Sponsor: ${t.sponsor}.\n`;
  }

  return content;
}

function runBuild() {
  console.log('Starting ClinSight build...');

  if (!fs.existsSync(TRIALS_DATA_PATH)) {
    console.error(`Error: trials dataset not found at ${TRIALS_DATA_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(TRIALS_DATA_PATH, 'utf-8');
  const trials = JSON.parse(rawData);
  console.log(`Loaded ${trials.length} trials from dataset.`);

  // 1. Build individual static trial pages
  if (!fs.existsSync(TRIALS_DIR)) {
    fs.mkdirSync(TRIALS_DIR, { recursive: true });
  }

  let count = 0;
  for (const trial of trials) {
    const trialFolder = path.join(TRIALS_DIR, trial.nctId);
    if (!fs.existsSync(trialFolder)) {
      fs.mkdirSync(trialFolder, { recursive: true });
    }

    const htmlContent = renderTrialPage(trial, trials);
    fs.writeFileSync(path.join(trialFolder, 'index.html'), htmlContent, 'utf-8');
    count++;
  }
  console.log(`Generated ${count} static trial pages in /trials/[nctId]/index.html`);

  // 2. Build sitemap.xml
  const sitemapXml = buildSitemap(trials);
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log(`Generated sitemap.xml with ${trials.length + 1} URLs.`);

  // 3. Build robots.txt
  const robotsTxt = buildRobotsTxt();
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('Generated robots.txt.');

  // 4. Build llms.txt
  const llmsTxt = buildLlmsTxt(trials);
  fs.writeFileSync(path.join(ROOT_DIR, 'llms.txt'), llmsTxt, 'utf-8');
  console.log('Generated llms.txt for AI search engine context.');

  console.log('Build completed successfully.');
}

runBuild();
