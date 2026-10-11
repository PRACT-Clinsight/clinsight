/**
 * Builds /compare/myeloma-car-t-bispecific-adc/index.html
 * Registry-only: every cell is a verbatim ClinicalTrials.gov field from trials.json.
 * Selection rule (stated on the page): condition mentions myeloma AND an intervention
 * name matches a listed CAR-T / bispecific / ADC agent.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://clinsight.pract.eu';
const SLUG = 'myeloma-car-t-bispecific-adc';

const AGENTS = /ciltacabtagene|cilta-cel|idecabtagene|bb2121|anitocabtagene|teclistamab|elranatamab|talquetamab|belantamab|JNJ-68284528|GSK2857916/i;

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const trials = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trials.json'), 'utf8'));
const rows = trials
  .filter((t) => /myeloma/i.test((t.conditions || []).join(' ') + ' ' + t.briefTitle))
  .filter((t) => AGENTS.test((t.interventions || []).join(' ') + ' ' + t.briefTitle))
  .sort((a, b) => String(a.phase).localeCompare(String(b.phase)) || (b.enrollment || 0) - (a.enrollment || 0));

// Acronyms reused by more than one record (registry fact, helps readers disambiguate)
const acCount = {};
rows.forEach((t) => { if (t.acronym) acCount[t.acronym] = (acCount[t.acronym] || 0) + 1; });
const dupes = Object.keys(acCount).filter((k) => acCount[k] > 1);

const body = rows.map((t) => {
  const po = (t.primaryOutcomes && t.primaryOutcomes[0] && t.primaryOutcomes[0].measure) || '—';
  const inc = (t.inclusionCriteria || []).slice(0, 3).map((c) => `<li>${esc(c)}</li>`).join('') || '<li>—</li>';
  return `<tr>
<td><a href="../../trials/${t.nctId}/"><strong>${esc(t.acronym || t.nctId)}</strong></a><br><span class="m">${t.nctId}</span></td>
<td>${esc(t.phase)}</td>
<td>${esc((t.interventions || []).join('; '))}</td>
<td>${esc(t.sponsor)}</td>
<td>${esc(String(t.status).replace(/_/g, ' '))}</td>
<td class="n">${esc(t.enrollment)}</td>
<td>${esc(po)}</td>
<td><ul>${inc}</ul></td>
</tr>`;
}).join('\n');

const title = `Multiple myeloma CAR-T, bispecific and ADC trials compared (${rows.length}) | ClinSight`;
const desc = `Side-by-side registry comparison of ${rows.length} multiple myeloma trials of CAR-T, bispecific antibody and antibody-drug conjugate regimens: phase, interventions, sponsor, enrollment, primary outcome and eligibility. Source: ClinicalTrials.gov.`;
const url = `${BASE_URL}/compare/${SLUG}/`;

const ld = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Dataset',
      name: 'Multiple myeloma CAR-T, bispecific and ADC trial records (registry comparison)',
      description: desc,
      url,
      creator: { '@type': 'Organization', name: 'ClinSight (PRACT)', url: 'https://pract.eu' },
      isBasedOn: 'https://clinicaltrials.gov/',
      keywords: ['multiple myeloma', 'CAR-T', 'bispecific antibody', 'antibody-drug conjugate', 'clinical trials']
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ClinSight', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Comparisons', item: `${BASE_URL}/compare/` },
        { '@type': 'ListItem', position: 3, name: 'Myeloma CAR-T, bispecific and ADC trials', item: url }
      ]
    }
  ]
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${ld}</script>
<style>
  :root{--bg:#fff;--fg:#0f172a;--mut:#64748b;--line:#e2e8f0;--acc:#0284c7;--head:#f1f5f9}
  @media (prefers-color-scheme: dark){:root{--bg:#0b0f19;--fg:#e2e8f0;--mut:#94a3b8;--line:#1f2937;--acc:#38bdf8;--head:#111827}}
  *{box-sizing:border-box} body{font-family:'Inter',sans-serif;margin:0;background:var(--bg);color:var(--fg);line-height:1.55}
  main{max-width:1280px;margin:0 auto;padding:28px 20px 60px} a{color:var(--acc)}
  h1{font-size:26px;margin:8px 0} h2{font-size:18px;margin-top:34px}
  .lead{max-width:820px;color:var(--mut)} .wrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px}
  table{border-collapse:collapse;width:100%;min-width:1100px;font-size:13px}
  th,td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}
  th{background:var(--head);position:sticky;top:0;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  td ul{margin:0;padding-left:16px} td.n{text-align:right;font-variant-numeric:tabular-nums}
  .m{font-size:12px;color:var(--mut)} .note{max-width:820px;font-size:14px}
</style>
</head>
<body>
<main>
<p><a href="../../">ClinSight</a> / <a href="../">Comparisons</a> / Myeloma CAR-T, bispecific and ADC trials</p>
<h1>Multiple myeloma: CAR-T, bispecific and ADC trials side by side</h1>
<p class="lead">${rows.length} registry records compared on the fields ClinicalTrials.gov publishes for every study. Use it to see, at a glance, which trials share a phase, comparator regimen, sponsor or eligibility rule.</p>

<div class="wrap"><table>
<thead><tr><th>Trial</th><th>Phase</th><th>Interventions (as registered)</th><th>Sponsor</th><th>Status</th><th>Enrolled</th><th>First primary outcome (registry text)</th><th>First inclusion criteria (registry text)</th></tr></thead>
<tbody>
${body}
</tbody></table></div>

<h2>How this table was built</h2>
<p class="note"><strong>Selection rule:</strong> a record is included if its conditions or title mention myeloma <em>and</em> an intervention name matches one of: ciltacabtagene autoleucel, idecabtagene vicleucel (bb2121), anitocabtagene autoleucel, teclistamab, elranatamab, talquetamab, belantamab mafodotin. Records outside the ClinSight dataset are not shown, so this is not a complete list of myeloma trials.</p>
<p class="note"><strong>Source:</strong> every cell is copied from the ClinicalTrials.gov record for that NCT ID. Enrollment may be the planned or the actual number depending on the record's status. No efficacy results are shown on this page; for outcomes, read the linked primary publication.</p>
${dupes.length ? `<p class="note"><strong>Reading the acronyms:</strong> the registry lists the same acronym on more than one record (${dupes.map(esc).join(', ')}). Use the NCT ID to tell them apart.</p>` : ''}
<p class="note">Data retrieved from ClinicalTrials.gov API v2. Records can change; check the registry for the current version.</p>
</main>
</body>
</html>`;

const outDir = path.join(ROOT, 'compare', SLUG);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

// Simple index so /compare/ resolves (breadcrumb target)
const idx = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Trial comparisons | ClinSight</title><meta name="description" content="Side-by-side comparisons of clinical trial records from ClinicalTrials.gov."><link rel="canonical" href="${BASE_URL}/compare/"><style>body{font-family:Inter,sans-serif;max-width:820px;margin:0 auto;padding:32px 20px;line-height:1.6}@media (prefers-color-scheme: dark){body{background:#0b0f19;color:#e2e8f0}a{color:#38bdf8}}</style></head><body><p><a href="../">&larr; ClinSight</a></p><h1>Trial comparisons</h1><ul><li><a href="./${SLUG}/">Multiple myeloma: CAR-T, bispecific and ADC trials side by side (${rows.length})</a></li></ul></body></html>`;
fs.writeFileSync(path.join(ROOT, 'compare', 'index.html'), idx, 'utf8');

console.log(`Built compare page with ${rows.length} trials -> ${url}`);
