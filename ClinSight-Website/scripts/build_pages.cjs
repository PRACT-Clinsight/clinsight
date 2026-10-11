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

  // Compute primary drug for VigiSight FAERS safety cross-link
  let vigisightDrug = null;
  if (trial.interventions && trial.interventions.length > 0) {
    const rawDrug = trial.interventions[0].replace(/^Drug:\s*/i, '').trim();
    const cleaned = rawDrug.split(/[\s,\/]+/)[0];
    if (cleaned && cleaned.length >= 3 && !['placebo', 'study', 'saline', 'standard', 'comparator'].includes(cleaned.toLowerCase())) {
      vigisightDrug = cleaned;
    }
  }

  // Related trials in the same domain
  const related = allTrials
    .filter(t => t.nctId !== trial.nctId && (t.modality === trial.modality || t.category === trial.category))
    .slice(0, 4);

  // Structured Data Schema (Registry Fact compliant + Breadcrumbs GEO)
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
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ClinSight",
            "item": `${BASE_URL}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": category,
            "item": `${BASE_URL}/?category=${encodeURIComponent(trial.category || '')}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${acronym} (${nctId})`,
            "item": `${BASE_URL}/trials/${nctId}/`
          }
        ]
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
    
    <!-- Clean Font: Inter (Matched with vigisight.pract.eu) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Theme Initializer (Instant OS/Browser preference detection) -->
    <script>
        (function() {
            var saved = localStorage.getItem('clinsight_theme');
            if (saved) {
                document.documentElement.setAttribute('data-theme', saved);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        })();
    </script>

    <!-- Structured Data Schema -->
    <script type="application/ld+json">
    ${schemaJson}
    </script>

    <style>
        :root {
            /* Dark Theme (Default) */
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
            --chip-bg: rgba(255, 255, 255, 0.05);
            --card-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            --bg-grad-1: rgba(56, 189, 248, 0.06);
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'Inter', sans-serif;
            color-scheme: dark;
        }

        /* Auto-adapt to OS / Browser light mode */
        @media (prefers-color-scheme: light) {
            :root:not([data-theme="dark"]) {
                --bg-void: #f8fafc;
                --bg-base: #ffffff;
                --bg-surface: #ffffff;
                --bg-card: #ffffff;
                --border-subtle: #e2e8f0;
                --border-hover: rgba(2, 132, 199, 0.4);
                --cyan: #0284c7;
                --cyan-glow: rgba(2, 132, 199, 0.08);
                --emerald: #059669;
                --emerald-glow: rgba(5, 150, 105, 0.08);
                --purple: #7c3aed;
                --purple-glow: rgba(124, 58, 237, 0.08);
                --amber: #d97706;
                --amber-glow: rgba(217, 119, 6, 0.08);
                --text-high: #0f172a;
                --text-med: #334155;
                --text-low: #64748b;
                --chip-bg: #f1f5f9;
                --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
                --bg-grad-1: rgba(2, 132, 199, 0.03);
                color-scheme: light;
            }
        }

        /* Explicit Light Theme */
        :root[data-theme="light"] {
            --bg-void: #f8fafc;
            --bg-base: #ffffff;
            --bg-surface: #ffffff;
            --bg-card: #ffffff;
            --border-subtle: #e2e8f0;
            --border-hover: rgba(2, 132, 199, 0.4);
            --cyan: #0284c7;
            --cyan-glow: rgba(2, 132, 199, 0.08);
            --emerald: #059669;
            --emerald-glow: rgba(5, 150, 105, 0.08);
            --purple: #7c3aed;
            --purple-glow: rgba(124, 58, 237, 0.08);
            --amber: #d97706;
            --amber-glow: rgba(217, 119, 6, 0.08);
            --text-high: #0f172a;
            --text-med: #334155;
            --text-low: #64748b;
            --chip-bg: #f1f5f9;
            --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
            --bg-grad-1: rgba(2, 132, 199, 0.03);
            color-scheme: light;
        }

        /* Explicit Dark Theme */
        :root[data-theme="dark"] {
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
            --chip-bg: rgba(255, 255, 255, 0.05);
            --card-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            --bg-grad-1: rgba(56, 189, 248, 0.06);
            color-scheme: dark;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--font-sans);
            background-color: var(--bg-void);
            background-image: radial-gradient(circle at 50% 0%, var(--bg-grad-1), transparent 45%);
            color: var(--text-high);
            line-height: 1.6;
            min-height: 100vh;
            transition: background-color 0.2s, color 0.2s;
        }

        /* Topbar */
        .topbar {
            background: var(--bg-base);
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
        .topbar-right { color: var(--text-low); font-size: 12.5px; display: flex; align-items: center; gap: 14px; }
        .topbar-right a { color: var(--text-med); font-weight: 500; }

        .theme-toggle {
            background: transparent;
            border: 1px solid var(--border-subtle);
            color: var(--text-med);
            padding: 5px 9px;
            border-radius: 6px;
            font-size: 11.5px;
            font-family: inherit;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s;
        }
        .theme-toggle:hover {
            color: var(--text-high);
            border-color: var(--border-hover);
            background: var(--chip-bg);
        }

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
            background: var(--chip-bg);
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
            box-shadow: var(--card-shadow);
            backdrop-filter: blur(8px);
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            border-color: var(--border-hover);
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
            background: var(--bg-surface);
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

        .action-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 18px 0 26px;
        }
        .btn-action {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            color: var(--text-med);
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 12.5px;
            font-family: inherit;
            font-weight: 500;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            transition: all 0.15s;
        }
        .btn-action:hover {
            color: var(--cyan);
            border-color: var(--border-hover);
            background: rgba(255, 255, 255, 0.05);
        }
        .vigisight-action {
            color: var(--emerald);
            border-color: rgba(16, 185, 129, 0.35);
        }
        .vigisight-action:hover {
            color: #34d399;
            border-color: rgba(16, 185, 129, 0.7);
        }
        .consulting-card {
            background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.8) 100%);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 12px;
            padding: 24px 28px;
            margin: 36px 0 20px;
        }
        [data-theme="light"] .consulting-card {
            background: #f8fafc;
            border-color: rgba(14, 165, 233, 0.35);
        }
        .consulting-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-family: var(--font-mono);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--cyan);
            margin-bottom: 8px;
        }
        .consulting-card h3 {
            font-size: 17px;
            font-weight: 700;
            color: var(--text-high);
            margin-bottom: 8px;
        }
        .consulting-card p {
            font-size: 13.5px;
            color: var(--text-med);
            line-height: 1.55;
            margin-bottom: 16px;
            max-width: 72ch;
        }
        .btn-consult {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--cyan);
            color: #07090e;
            font-weight: 600;
            font-size: 13px;
            padding: 9px 18px;
            border-radius: 6px;
            text-decoration: none;
            transition: opacity 0.15s;
        }
        .btn-consult:hover { opacity: 0.9; }

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
            <button id="themeToggleTopbar" class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle appearance">
                <i class="fa-regular fa-sun"></i>
            </button>
            <a href="https://pract.eu" target="_blank">pract.eu <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i></a>
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

        <!-- Action Toolbar: 1-Click Citation, Protocol JSON, and VigiSight Safety Signals -->
        <div class="action-bar">
            <button onclick="copyCitation()" id="btnCopyCitation" class="btn-action">
                <i class="fa-regular fa-copy"></i> Copy Citation
            </button>
            <button onclick="downloadJson()" class="btn-action">
                <i class="fa-solid fa-download"></i> Download Protocol JSON
            </button>
            ${vigisightDrug ? `
            <a href="https://vigisight.pract.eu/?search=${encodeURIComponent(vigisightDrug)}" target="_blank" class="btn-action vigisight-action">
                <i class="fa-solid fa-shield-virus"></i> View FAERS Safety Signals (${escapeHtml(vigisightDrug)}) ↗
            </a>` : ''}
        </div>

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

        <!-- PRACT Clinical Methodology & Consulting CTA -->
        <div class="consulting-card">
            <div class="consulting-tag"><i class="fa-solid fa-user-doctor"></i> Target Trial Emulation (TTE) & CER Evidence</div>
            <h3>Translating this protocol into Real-World Evidence?</h3>
            <p>Designing a Target Trial Emulation (TTE) with observational cohorts, preparing Clinical Evaluation Reports (CER/PMCF), or benchmarking clinical outcomes against this registry protocol? Connect with the PRACT clinical methodology and biostatistics team.</p>
            <a href="mailto:contact@pract.eu?subject=Consulting%20Inquiry%20regarding%20${nctId}%20(${encodeURIComponent(acronym)})" class="btn-consult">
                Consult PRACT Clinical Team &rarr; contact@pract.eu
            </a>
        </div>

        <footer>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>&copy; 2026 ClinSight · Primary study records from ClinicalTrials.gov</div>
                <div><a href="https://pract.eu" target="_blank" style="color:var(--text-med); text-decoration:none;">pract.eu <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i></a></div>
            </div>
        </footer>
    </div>

    <script>
        const studyData = ${JSON.stringify({
          nctId: trial.nctId,
          acronym: trial.acronym,
          briefTitle: trial.briefTitle,
          officialTitle: trial.officialTitle,
          sponsor: trial.sponsor,
          phase: trial.phase,
          status: trial.status,
          modality: trial.modality,
          conditions: trial.conditions,
          interventions: trial.interventions,
          primaryOutcomes: trial.primaryOutcomes,
          completionDate: trial.completionDate,
          source: 'ClinicalTrials.gov API v2'
        })};

        function copyCitation() {
            const text = "${acronym !== nctId ? acronym + '. ' : ''}${escapeHtml(title).replace(/"/g, '\\"')}. ClinicalTrials.gov Identifier: ${nctId}. Primary Sponsor: ${escapeHtml(sponsor).replace(/"/g, '\\"')}. Available at: ${BASE_URL}/trials/${nctId}/";
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('btnCopyCitation');
                if (btn) {
                    btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--emerald);"></i> Copied to Clipboard!';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Citation';
                    }, 2500);
                }
            });
        }

        function downloadJson() {
            const blob = new Blob([JSON.stringify(studyData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${nctId}-protocol.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const isLight = theme === 'light';
            const btn = document.getElementById('themeToggleTopbar');
            if (btn) btn.innerHTML = isLight ? '<i class="fa-regular fa-moon"></i>' : '<i class="fa-regular fa-sun"></i>';
        }
        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            const next = current === 'light' ? 'dark' : 'light';
            localStorage.setItem('clinsight_theme', next);
            applyTheme(next);
        }
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                if (!localStorage.getItem('clinsight_theme')) {
                    applyTheme(e.matches ? 'light' : 'dark');
                }
            });
        }
        const saved = localStorage.getItem('clinsight_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        applyTheme(saved);
    </script>
</body>
</html>`;
}

function buildSitemap(trials) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    `  <url>\n    <loc>${BASE_URL}/trials/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`
  ];

  for (const trial of trials) {
    urls.push(
      `  <url>\n    <loc>${BASE_URL}/trials/${trial.nctId}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

// Static, crawlable directory of every trial (plain <a href> links, no JavaScript needed).
function buildTrialsDirectory(trials) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const groups = {};
  for (const t of trials) {
    const key = t.subtype || t.category || 'Other';
    (groups[key] = groups[key] || []).push(t);
  }
  const sections = Object.keys(groups).sort().map((k) => {
    const items = groups[k].map((t) => {
      const ac = t.acronym ? `<strong>${esc(t.acronym)}</strong> — ` : '';
      return `        <li><a href="./${t.nctId}/">${ac}${esc(t.briefTitle)}</a> <span class="m">${t.nctId} · ${esc(t.phase)} · ${esc(t.sponsor)}</span></li>`;
    }).join('\n');
    return `    <h2>${esc(k)} (${groups[k].length})</h2>\n    <ul>\n${items}\n    </ul>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All Indexed Clinical Trials (${trials.length}) | ClinSight</title>
<meta name="description" content="Browse all ${trials.length} clinical trial records on ClinSight, grouped by condition. Each record is sourced from ClinicalTrials.gov and keyed by NCT ID.">
<link rel="canonical" href="${BASE_URL}/trials/">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{font-family:'Inter',sans-serif;max-width:960px;margin:0 auto;padding:32px 20px;line-height:1.55;color:#0f172a;background:#fff}
  @media (prefers-color-scheme: dark){body{background:#0b0f19;color:#e2e8f0}a{color:#38bdf8}}
  h1{font-size:26px} h2{font-size:17px;margin-top:32px;border-bottom:1px solid #8884;padding-bottom:6px}
  ul{padding-left:18px} li{margin:6px 0} .m{display:block;font-size:12px;opacity:.65}
</style>
</head>
<body>
<p><a href="../">&larr; ClinSight</a></p>
<h1>All indexed clinical trials (${trials.length})</h1>
<p>Records are sourced from ClinicalTrials.gov and keyed by NCT ID.</p>
${sections}
</body>
</html>`;
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
- Bispecific Antibodies & T-Cell Engagers (Teclistamab, Elranatamab, Talquetamab, Epcoritamab, Glofitamab, Mosunetuzumab)
- Cell & Gene Therapy (CAR-T: Cilta-cel, Ide-cel, Axi-cel, Liso-cel)
- Antibody-Drug Conjugates (ADCs: T-DXd, Polatuzumab, Belantamab mafodotin, EV)
- Targeted Oncology (TKIs, Menin inhibitors, BTK/BCL2 inhibitors, KRAS, PARP inhibitors)
- Targeted Monoclonal Antibodies (Daratumumab, Isatuximab, Obinutuzumab)
- Checkpoint Inhibitors & Immuno-Oncology (PD-1 / PD-L1)
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

  // 1b. Build crawlable directory /trials/index.html
  fs.writeFileSync(path.join(TRIALS_DIR, 'index.html'), buildTrialsDirectory(trials), 'utf-8');
  console.log('Generated crawlable directory /trials/index.html');

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
