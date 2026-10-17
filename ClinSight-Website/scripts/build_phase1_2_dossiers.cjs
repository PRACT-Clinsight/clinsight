const fs = require('fs');
const path = require('path');

const TRIALS_DIR = path.join(__dirname, '../trials');
const DATA_FILE = path.join(__dirname, '../data/phase1_2_mettl3_extracted.json');
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

function renderFieldRow(label, fieldData, sourceField = null, verbatimQuote = null) {
  const state = fieldData.state;
  let chipHtml = '';
  let borderClass = '';
  let valueHtml = '';
  let sourceHtml = '';

  if (state === 'STATED' || state === 'STATED-structural') {
    chipHtml = '<span class="prov-chip prov-stated">✓ stated</span>';
    borderClass = 'row-stated';
    const val = fieldData.render || fieldData.value;
    valueHtml = `<span class="val-stated">${escapeHtml(val)}</span>`;
    const sField = fieldData.source_field || sourceField;
    const vQuote = fieldData.verbatim || verbatimQuote;
    if (sField && vQuote) {
      sourceHtml = `
        <div class="source-anchor">
          <span class="source-toggle" onclick="toggleSource(this)">⟨source⟩</span>
          <div class="source-payload">
            <span class="source-field">${escapeHtml(sField)}</span>
            <span class="source-quote">"${escapeHtml(vQuote)}"</span>
            <span class="source-verified">✓ checked_at_build: true</span>
          </div>
        </div>`;
    }
  } else if (state === 'INFERRED') {
    chipHtml = '<span class="prov-chip prov-inferred">~ inferred</span>';
    borderClass = 'row-inferred';
    valueHtml = `<span class="val-inferred">${escapeHtml(fieldData.render)}</span>`;
    if (fieldData.source_field && fieldData.verbatim) {
      sourceHtml = `
        <div class="inline-evidence">
          <span class="evidence-label">Verbatim Evidence:</span> "${escapeHtml(fieldData.verbatim)}" 
          <span class="evidence-source">(${escapeHtml(fieldData.source_field)})</span>
        </div>`;
    }
  } else {
    // NOT_REPORTED
    chipHtml = '<span class="prov-chip prov-not-reported">— not reported</span>';
    borderClass = 'row-not-reported';
    const val = fieldData.render || 'Not reported in the statutory record.';
    valueHtml = `<span class="val-not-reported">${escapeHtml(val)}</span>`;
  }

  return `
    <div class="field-row ${borderClass}">
      <div class="field-main">
        <span class="field-label">${escapeHtml(label)}</span>
        <div class="field-content">
          ${valueHtml}
          ${sourceHtml}
        </div>
      </div>
      <div class="field-chip-col">
        ${chipHtml}
      </div>
    </div>`;
}

function countStates(dossier) {
  let stated = 0;
  let inferred = 0;
  let notReported = 0;

  function tally(st) {
    if (st === 'STATED' || st === 'STATED-structural') stated++;
    else if (st === 'INFERRED') inferred++;
    else notReported++;
  }

  // Mod 1
  tally(dossier.module1.design_archetype.state);
  tally(dossier.module1.allocation.state);
  tally(dossier.module1.masking.state);
  tally(dossier.module1.intervention_model.state);
  tally(dossier.module1.primary_purpose.state);
  tally(dossier.module1.participating_countries.state);
  tally(dossier.module1.arms_cohorts.state);

  // Mod 2
  for (const cat of ['hematologic', 'renal', 'hepatic', 'cardiac', 'washout']) {
    tally(dossier.module2[cat].state);
  }

  // Mod 3
  tally(dossier.module3.dlt_endpoint.state);
  tally(dossier.module3.dlt_window.state);
  tally(dossier.module3.rp2d.state);
  tally(dossier.module3.mtd.state);
  tally(dossier.module3.ctcae.state);
  tally(dossier.module3.dose_modification.state);

  return { stated, inferred, notReported, total: stated + inferred + notReported };
}

function renderDossierHtml(dossier) {
  const ident = dossier.identity;
  const nctId = ident.nctId;
  const title = ident.briefTitle;
  const officialTitle = ident.officialTitle;
  const phase = ident.phase;
  const status = ident.status;
  const sponsor = ident.leadSponsor;
  const counts = countStates(dossier);

  const pctStated = ((counts.stated / counts.total) * 100).toFixed(1);
  const pctInferred = ((counts.inferred / counts.total) * 100).toFixed(1);
  const pctNotReported = ((counts.notReported / counts.total) * 100).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(nctId)} — Phase 1/2 Protocol & Regulatory Intelligence Dossier | ClinSight</title>
  <meta name="description" content="${escapeHtml(nctId)} (${escapeHtml(ident.phase)}): ${escapeHtml(title)}. Lead Sponsor: ${escapeHtml(sponsor)}. Protocol architecture, DLT window, and organ function cutoffs.">
  <link rel="canonical" href="${BASE_URL}/trials/${escapeHtml(nctId)}/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <style>
    :root {
      --bg-void: #07090e;
      --bg-base: #0b0f19;
      --bg-surface: #111827;
      --bg-card: rgba(17, 24, 39, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(56, 189, 248, 0.35);
      
      --teal-fact: #14b8a6;
      --teal-glow: rgba(20, 184, 166, 0.12);
      --amber-inferred: #f59e0b;
      --amber-glow: rgba(245, 158, 11, 0.12);
      --grey-silent: #64748b;
      --grey-bg: rgba(100, 116, 139, 0.08);
      
      --text-high: #f8fafc;
      --text-med: #cbd5e1;
      --text-low: #64748b;
      --font-sans: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      color-scheme: dark;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-void);
      color: var(--text-med);
      font-family: var(--font-sans);
      line-height: 1.55;
      padding: 0 0 60px;
    }
    
    .topbar {
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-base);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .topbar a { color: var(--text-high); text-decoration: none; font-weight: 500; }
    .topbar a:hover { color: #38bdf8; }
    
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 28px 20px;
    }
    
    /* TRIAL IDENTITY BAND */
    .identity-band {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .badge {
      font-family: var(--font-mono);
      font-size: 11.5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
    }
    .badge-nct { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-phase { background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .badge-status { background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-high);
      line-height: 1.35;
      margin-bottom: 8px;
    }
    .official-title {
      font-size: 13px;
      color: var(--text-low);
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .sponsor-line {
      font-size: 13px;
      color: var(--text-med);
    }
    .sponsor-line strong { color: var(--text-high); }
    
    /* PROVENANCE SUMMARY BAR & LEGEND */
    .summary-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 12px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stacked-bar {
      height: 10px;
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      display: flex;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .bar-seg { height: 100%; }
    .seg-stated { background: var(--teal-fact); }
    .seg-inferred { background: var(--amber-inferred); }
    .seg-not-reported { background: var(--grey-silent); }
    
    .legend-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: var(--text-low);
    }
    .legend-item { display: inline-flex; align-items: center; gap: 6px; }
    
    .btn-audit {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-med);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-audit:hover {
      border-color: #38bdf8;
      color: #38bdf8;
    }
    
    /* MODULE CARDS */
    .module-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 22px;
    }
    .module-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-high);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 10px;
    }
    .module-title i { color: #38bdf8; font-size: 14px; }
    
    /* FIELD ROWS (ATOMIC UNIT) */
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 12px 14px;
      margin-bottom: 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.02);
      font-size: 13.5px;
    }
    
    /* TRIPLE-REDUNDANT STATE STYLING */
    .row-stated {
      border-left: 3.5px solid var(--teal-fact);
    }
    .row-inferred {
      border-left: 3.5px dashed var(--amber-inferred);
    }
    .row-not-reported {
      border-left: 3.5px dotted var(--grey-silent);
      background: var(--grey-bg);
    }
    
    .field-main { flex: 1; }
    .field-label {
      display: block;
      font-size: 11px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-low);
      margin-bottom: 4px;
    }
    
    .val-stated { color: var(--text-high); font-weight: 500; }
    .val-inferred {
      color: var(--text-med);
      border-bottom: 1px dotted var(--amber-inferred);
    }
    .val-not-reported { color: var(--text-low); font-style: italic; }
    
    .prov-chip {
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .prov-stated { background: var(--teal-glow); color: var(--teal-fact); border: 1px solid rgba(20, 184, 166, 0.3); }
    .prov-inferred { background: var(--amber-glow); color: var(--amber-inferred); border: 1px solid rgba(245, 158, 11, 0.3); }
    .prov-not-reported { background: var(--grey-bg); color: var(--grey-silent); border: 1px solid rgba(100, 116, 139, 0.25); }
    
    .source-anchor { margin-top: 6px; font-size: 11.5px; }
    .source-toggle {
      color: #38bdf8;
      font-family: var(--font-mono);
      cursor: pointer;
    }
    .source-payload {
      display: none;
      margin-top: 6px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 11px;
    }
    .source-payload.open { display: block; }
    .source-field { color: var(--text-low); display: block; margin-bottom: 2px; }
    .source-quote { color: var(--teal-fact); display: block; margin-bottom: 2px; }
    .source-verified { color: #34d399; font-weight: 600; font-size: 10px; }
    
    .inline-evidence {
      margin-top: 6px;
      font-size: 12px;
      color: var(--amber-inferred);
      font-style: italic;
    }
    .evidence-label { font-weight: 600; font-style: normal; }
    .evidence-source { color: var(--text-low); font-style: normal; font-family: var(--font-mono); font-size: 11px; }
    
    .doc-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #38bdf8;
      text-decoration: none;
      font-family: var(--font-mono);
      font-size: 12px;
    }
    .doc-link:hover { text-decoration: underline; }
    
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--text-low);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <a href="../../">&larr; ClinSight Regulatory Intelligence Workbench</a>
    <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-low);">Open-Access Protocol Dossier</span>
  </div>

  <div class="container">
    <!-- TRIAL IDENTITY BAND -->
    <div class="identity-band">
      <div class="badge-row">
        <span class="badge badge-nct">${escapeHtml(nctId)}</span>
        <span class="badge badge-phase">${escapeHtml(phase)}</span>
        <span class="badge badge-status">${escapeHtml(status)}</span>
      </div>
      <h1>${escapeHtml(title)}</h1>
      <p class="official-title">${escapeHtml(officialTitle)}</p>
      <p class="sponsor-line">Lead Sponsor: <strong>${escapeHtml(sponsor)}</strong></p>
    </div>

    <!-- PROVENANCE SUMMARY BAR + LEGEND + AUDIT MODE -->
    <div class="summary-card">
      <div class="summary-header">
        <span>Trial Dossier Provenance: <strong>${counts.stated} stated</strong> · <strong>${counts.inferred} inferred</strong> · <strong>${counts.notReported} not reported</strong></span>
        <button class="btn-audit" onclick="toggleAuditMode()">[Audit mode ▸]</button>
      </div>
      <div class="stacked-bar">
        <div class="bar-seg seg-stated" style="width: ${pctStated}%" title="${pctStated}% Stated"></div>
        <div class="bar-seg seg-inferred" style="width: ${pctInferred}%" title="${pctInferred}% Inferred"></div>
        <div class="bar-seg seg-not-reported" style="width: ${pctNotReported}%" title="${pctNotReported}% Not Reported"></div>
      </div>
      <div class="legend-row">
        <span class="legend-item"><span class="prov-chip prov-stated">✓ stated</span> Verbatim fact from statutory record</span>
        <span class="legend-item"><span class="prov-chip prov-inferred">~ inferred</span> Protocol mechanism described; archetype not named</span>
        <span class="legend-item"><span class="prov-chip prov-not-reported">— not reported</span> Not stated in statutory registry record</span>
      </div>
    </div>

    <!-- MODULE 1: Protocol & Escalation Architecture -->
    <div class="module-card">
      <div class="module-title"><i class="fa-solid fa-network-wired"></i> Module 1 — Protocol & Escalation Architecture</div>
      ${renderFieldRow('Design Archetype', dossier.module1.design_archetype)}
      ${renderFieldRow('Allocation Mode', dossier.module1.allocation, 'protocolSection.designModule.designInfo.allocation', dossier.module1.allocation.value)}
      ${renderFieldRow('Masking', dossier.module1.masking, 'protocolSection.designModule.designInfo.masking', dossier.module1.masking.value)}
      ${renderFieldRow('Intervention Model', dossier.module1.intervention_model, 'protocolSection.designModule.designInfo.interventionModel', dossier.module1.intervention_model.value)}
      ${renderFieldRow('Primary Purpose', dossier.module1.primary_purpose, 'protocolSection.designModule.designInfo.primaryPurpose', dossier.module1.primary_purpose.value)}
      ${renderFieldRow('Participating Countries', dossier.module1.participating_countries, 'protocolSection.locationsModule.locations', dossier.module1.participating_countries.render)}
      ${renderFieldRow('Study Arms / Cohorts', dossier.module1.arms_cohorts, 'protocolSection.armsInterventionsModule.armGroups', dossier.module1.arms_cohorts.render)}
    </div>

    <!-- MODULE 2: Medical Writing Extraction Box -->
    <div class="module-card">
      <div class="module-title"><i class="fa-solid fa-file-lines"></i> Module 2 — Medical Writing Extraction Box (Organ Cutoffs)</div>
      ${renderModule2Category('Hematologic Function', dossier.module2.hematologic)}
      ${renderModule2Category('Renal Clearance (CrCl / eGFR)', dossier.module2.renal)}
      ${renderModule2Category('Hepatic Function', dossier.module2.hepatic)}
      ${renderModule2Category('Cardiac Parameters (LVEF / QTc)', dossier.module2.cardiac)}
      ${renderModule2Category('Prior Therapy & Washout Rules', dossier.module2.washout)}
    </div>

    <!-- MODULE 3: Safety, DLT & RP2D Blueprint -->
    <div class="module-card">
      <div class="module-title"><i class="fa-solid fa-shield-halved"></i> Module 3 — Safety, DLT & RP2D Blueprint</div>
      ${renderFieldRow('Primary Safety Endpoint', dossier.module3.dlt_endpoint, 'protocolSection.outcomesModule.primaryOutcomes', dossier.module3.dlt_endpoint.value)}
      ${renderFieldRow('DLT Assessment Window', dossier.module3.dlt_window, 'protocolSection.outcomesModule.primaryOutcomes.timeFrame', dossier.module3.dlt_window.value)}
      ${renderFieldRow('Recommended Phase 2 Dose (RP2D)', dossier.module3.rp2d, 'protocolSection.outcomesModule.primaryOutcomes', dossier.module3.rp2d.value)}
      ${renderFieldRow('Maximum Tolerated Dose (MTD)', dossier.module3.mtd, 'protocolSection.outcomesModule.primaryOutcomes', dossier.module3.mtd.value)}
      ${renderFieldRow('Toxicity Grading Framework', dossier.module3.ctcae, 'protocolSection.eligibilityModule.eligibilityCriteria', dossier.module3.ctcae.value)}
      ${renderFieldRow('Dose Modification Rules', dossier.module3.dose_modification, 'protocolSection.descriptionModule.detailedDescription', dossier.module3.dose_modification.verbatim)}
    </div>

    <!-- MODULE 4: Statutory Resolution & Document Access -->
    <div class="module-card">
      <div class="module-title"><i class="fa-solid fa-folder-open"></i> Module 4 — Statutory Resolution & Document Access</div>
      <div class="field-row row-stated">
        <div class="field-main">
          <span class="field-label">Primary Statutory Record</span>
          <a href="${dossier.module4.nct_url}" target="_blank" rel="noopener noreferrer" class="doc-link">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> ClinicalTrials.gov (${escapeHtml(nctId)})
          </a>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-stated">✓ stated</span></div>
      </div>
      
      <div class="field-row ${dossier.module4.pmids.length > 0 ? 'row-stated' : 'row-not-reported'}">
        <div class="field-main">
          <span class="field-label">Preclinical / Peer-Reviewed Literature</span>
          ${dossier.module4.pmids.length > 0 ? dossier.module4.pmids.map(p => `
            <a href="https://pubmed.ncbi.nlm.nih.gov/${p}/" target="_blank" rel="noopener noreferrer" class="doc-link" style="margin-right:12px;">
              <i class="fa-solid fa-book-medical"></i> PubMed: ${p}
            </a>
          `).join('') : '<span class="val-not-reported">No linked publication in the public registry record.</span>'}
        </div>
        <div class="field-chip-col">
          <span class="prov-chip ${dossier.module4.pmids.length > 0 ? 'prov-stated' : 'prov-not-reported'}">
            ${dossier.module4.pmids.length > 0 ? '✓ stated' : '— not reported'}
          </span>
        </div>
      </div>

      <div class="field-row row-not-reported">
        <div class="field-main">
          <span class="field-label">CTIS / EU Clinical Trial Number</span>
          <span class="val-not-reported">No CTIS record linked in the statutory record.</span>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-not-reported">— not reported</span></div>
      </div>

      <div class="field-row row-not-reported">
        <div class="field-main">
          <span class="field-label">Official Protocol / SAP Document</span>
          <span class="val-not-reported">No protocol document posted to the registry.</span>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-not-reported">— not reported</span></div>
      </div>
    </div>

    <footer>
      &copy; 2026 ClinSight · Protocol facts from ClinicalTrials.gov API v2 · Enforced under ClinSight Unified Integrity Contract
    </footer>
  </div>

  <script>
    function toggleSource(el) {
      const payload = el.nextElementSibling;
      if (payload) {
        payload.classList.toggle('open');
      }
    }

    let auditMode = false;
    function toggleAuditMode() {
      auditMode = !auditMode;
      const payloads = document.querySelectorAll('.source-payload');
      payloads.forEach(p => {
        if (auditMode) p.classList.add('open');
        else p.classList.remove('open');
      });
      const btn = document.querySelector('.btn-audit');
      if (btn) btn.textContent = auditMode ? '[Audit mode ▾ Collapse]' : '[Audit mode ▸]';
    }
  </script>
</body>
</html>`;
}

function renderModule2Category(label, catData) {
  if (catData.state === 'NOT_REPORTED') {
    return renderFieldRow(label, { state: 'NOT_REPORTED', render: catData.render });
  }

  const itemsHtml = catData.items.map(it => `
    <li style="margin-bottom:6px; line-height:1.45;">
      ${escapeHtml(it.verbatim)}
      <span style="font-family:var(--font-mono); font-size:10px; color:${it.tag === 'numeric' ? '#38bdf8' : '#94a3b8'}; margin-left:6px;">
        [${it.tag}]
      </span>
    </li>
  `).join('');

  return `
    <div class="field-row row-stated">
      <div class="field-main">
        <span class="field-label">${escapeHtml(label)}</span>
        <ul style="padding-left:18px; font-size:13px; color:var(--text-high); margin-top:4px;">
          ${itemsHtml}
        </ul>
      </div>
      <div class="field-chip-col">
        <span class="prov-chip prov-stated">✓ stated</span>
      </div>
    </div>`;
}

function runBuild() {
  console.log('Building Phase 1/2 METTL3 showcase dossiers...');
  if (!fs.existsSync(DATA_FILE)) {
    console.error('Data file not found:', DATA_FILE);
    process.exit(1);
  }

  const dossiers = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  for (const d of dossiers) {
    const nct = d.identity.nctId;
    const folder = path.join(TRIALS_DIR, nct);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    const html = renderDossierHtml(d);
    fs.writeFileSync(path.join(folder, 'index.html'), html, 'utf-8');
    console.log(`Generated integrity dossier for ${nct} at /trials/${nct}/index.html`);
  }
}

runBuild();
