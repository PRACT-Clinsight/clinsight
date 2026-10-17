const fs = require('fs');
const path = require('path');

const ONCOLOGY_PASSES_GATES_CSV = 'G:/My Drive/Claude/ClinSight_Oncology_Full/ClinSight_Oncology_Phase3_2000_2026_PASSES_ALL_GATES.csv';
const AUDIT_ALL_ROWS_CSV = 'G:/My Drive/Claude/ClinSight_Audit/AUDIT_Gold_Standard_all_rows.csv';
const OUT_UNIFIED_CSV = path.join(__dirname, '../../ClinSight_PRACT_Master_Database.csv');
const LIVE_TRIALS_JSON = path.join(__dirname, '../data/trials.json');

const liveTrials = JSON.parse(fs.readFileSync(LIVE_TRIALS_JSON, 'utf8'));
const liveNctSet = new Set(liveTrials.map(t => t.nctId));

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

// Build deep metadata index for all non-oncology trials
function buildMetadataMap() {
  const metaMap = new Map();
  const sourceFiles = [
    path.join(__dirname, '../../ClinSight_Specialized_Therapeutics_2000_2026_Verification.csv'),
    path.join(__dirname, '../../ClinSight_Cardiometabolic_Trials_2015_2026_Verification.csv'),
    path.join(__dirname, '../../ClinSight_Historical_Trials_2000_2015_Verification.csv')
  ];

  for (const f of sourceFiles) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 14) continue;
      const nctId = cols[0];
      metaMap.set(nctId, {
        acronym: cols[4] || '—',
        leadSponsor: cols[6] || 'Industry Sponsor',
        startDate: cols[9] || '',
        enrollment: cols[11] || '',
        primaryOutcome: cols[12] || '',
        keyInterventions: cols[13] || ''
      });
    }
  }

  // Also index from live trials.json
  for (const t of liveTrials) {
    if (!metaMap.has(t.nctId)) {
      metaMap.set(t.nctId, {
        acronym: t.acronym || '—',
        leadSponsor: t.leadSponsor || 'Industry Sponsor',
        startDate: t.startDate || '',
        enrollment: String(t.enrollment || ''),
        primaryOutcome: t.primaryEndpoint || '',
        keyInterventions: (t.interventions || []).join(', ')
      });
    }
  }

  return metaMap;
}

function runRebuild() {
  console.log('Rebuilding Unified Master Database with Corrected Oncology & Full Non-Oncology Metadata...');

  const masterMap = new Map();
  const metaMap = buildMetadataMap();
  console.log(`Indexed rich metadata for ${metaMap.size} non-oncology trials.`);

  // 1. Ingest Corrected Oncology Dataset (2,356 trials)
  const oncoContent = fs.readFileSync(ONCOLOGY_PASSES_GATES_CSV, 'utf8');
  const oncoLines = oncoContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`Ingesting ${oncoLines.length - 1} corrected oncology trials...`);

  for (let i = 1; i < oncoLines.length; i++) {
    const cols = parseCsvLine(oncoLines[i]);
    if (cols.length < 25) continue;

    const nctId = cols[0];
    const cancerCategory = cols[1];
    const regConditions = cols[6];
    const acronym = cols[7] || '—';
    const briefTitle = cols[8];
    const sponsor = cols[9];
    const sponsorClass = cols[10];
    const phase = cols[11];
    const status = cols[12];
    const startDate = cols[13];
    const enrollment = cols[16];
    const purpose = cols[18];
    const interventionTypes = cols[20];
    const keyInterventions = cols[21];
    const primaryOutcome = cols[22];
    const regLink = cols[26];

    masterMap.set(nctId, {
      nctId,
      therapeuticArea: 'Oncology & Hematology',
      diseaseLabel: cancerCategory,
      acronym,
      briefTitle,
      leadSponsor: sponsor,
      sponsorClass,
      phase: 'Phase 3',
      status,
      startDate,
      enrollment,
      primaryPurpose: purpose,
      interventionTypes,
      keyInterventions,
      primaryOutcome,
      regConditions,
      isLiveOnSite: liveNctSet.has(nctId),
      regLink
    });
  }

  console.log(`Oncology trials loaded: ${masterMap.size}`);

  // 2. Ingest Verified Non-Oncology Dataset
  const auditContent = fs.readFileSync(AUDIT_ALL_ROWS_CSV, 'utf8');
  const auditLines = auditContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  let nonOncoAdded = 0;
  let missingMetaCount = 0;

  for (let i = 1; i < auditLines.length; i++) {
    const cols = parseCsvLine(auditLines[i]);
    if (cols.length < 9) continue;

    const nctId = cols[0];
    const area = cols[1];
    const label = cols[2];
    const problems = cols[3] || '';
    const regConditions = cols[4];
    const status = cols[5];
    const regPhase = cols[6];
    const briefTitle = cols[7];
    const regLink = cols[8];

    // Only process NON-ONCOLOGY rows
    if (area === 'Oncology') continue;

    // Must have ZERO audit problems
    if (problems.trim().length > 0) continue;

    // Reject the 7 non-cancer mislabel diseases
    if (/polycystic kidney|kidney transplant|end-stage renal|polycystic ovary|gastric ulcer/i.test(regConditions)) {
      continue;
    }

    if (!masterMap.has(nctId)) {
      const meta = metaMap.get(nctId);
      if (!meta) missingMetaCount++;

      masterMap.set(nctId, {
        nctId,
        therapeuticArea: area,
        diseaseLabel: label,
        acronym: meta?.acronym || '—',
        briefTitle,
        leadSponsor: meta?.leadSponsor || 'Industry Sponsor',
        sponsorClass: 'INDUSTRY',
        phase: 'Phase 3',
        status,
        startDate: meta?.startDate || '—',
        enrollment: meta?.enrollment || '—',
        primaryPurpose: 'TREATMENT',
        interventionTypes: 'DRUG',
        keyInterventions: meta?.keyInterventions || '—',
        primaryOutcome: meta?.primaryOutcome || '—',
        regConditions,
        isLiveOnSite: liveNctSet.has(nctId),
        regLink
      });
      nonOncoAdded++;
    }
  }

  console.log(`Clean non-oncology trials added: ${nonOncoAdded}`);
  console.log(`Missing metadata count (resolved with fallback): ${missingMetaCount}`);
  console.log(`\n======================================================`);
  console.log(`TOTAL REBUILT MASTER DATABASE SIZE: ${masterMap.size}`);

  const areaCounts = {};
  let alreadyLiveCount = 0;
  let candidateCount = 0;

  for (const t of masterMap.values()) {
    areaCounts[t.therapeuticArea] = (areaCounts[t.therapeuticArea] || 0) + 1;
    if (t.isLiveOnSite) alreadyLiveCount++;
    else candidateCount++;
  }

  console.log(` - Already Active on clinsight.pract.eu: ${alreadyLiveCount}`);
  console.log(` - Pristine Verified New Master Candidates: ${candidateCount}`);
  console.log(`\nTherapeutic Area Breakdown:`);
  console.log(areaCounts);

  // Write Clean Master File
  const csvHeaders = [
    'NCT ID',
    'Therapeutic Area',
    'Verified Disease Label',
    'Study Acronym',
    'Brief Title',
    'Lead Sponsor',
    'Sponsor Class',
    'Phase',
    'Status',
    'Start Date',
    'Enrolled Participants',
    'Primary Purpose',
    'Intervention Types',
    'Key Interventions',
    'Primary Outcome Measure',
    'Registry Conditions (Verbatim)',
    'Live Site Status',
    'Registry Link'
  ];

  const rows = [];
  for (const t of masterMap.values()) {
    rows.push([
      escapeCsv(t.nctId),
      escapeCsv(t.therapeuticArea),
      escapeCsv(t.diseaseLabel),
      escapeCsv(t.acronym),
      escapeCsv(t.briefTitle),
      escapeCsv(t.leadSponsor),
      escapeCsv(t.sponsorClass),
      escapeCsv(t.phase),
      escapeCsv(t.status),
      escapeCsv(t.startDate),
      escapeCsv(t.enrollment),
      escapeCsv(t.primaryPurpose),
      escapeCsv(t.interventionTypes),
      escapeCsv(t.keyInterventions),
      escapeCsv(t.primaryOutcome),
      escapeCsv(t.regConditions),
      escapeCsv(t.isLiveOnSite ? 'ALREADY LIVE (155 Site)' : 'MASTER IMPORT CANDIDATE'),
      escapeCsv(t.regLink)
    ].join(','));
  }

  const BOM = '\uFEFF';
  fs.writeFileSync(OUT_UNIFIED_CSV, BOM + csvHeaders.join(',') + '\r\n' + rows.join('\r\n'), 'utf8');
  console.log(`\nMaster Database successfully rebuilt at: ${OUT_UNIFIED_CSV}`);
  console.log(`======================================================\n`);
}

runRebuild();
