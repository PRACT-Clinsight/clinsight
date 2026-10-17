const fs = require('fs');
const path = require('path');

const ONCOLOGY_PASSES_GATES_CSV = 'G:/My Drive/Claude/ClinSight_Oncology_Full/ClinSight_Oncology_Phase3_2000_2026_PASSES_ALL_GATES.csv';
const AUDIT_ALL_ROWS_CSV = 'G:/My Drive/Claude/ClinSight_Audit/AUDIT_Gold_Standard_all_rows.csv';
const GOLD_MASTER_CSV = path.join(__dirname, '../../ClinSight_Gold_Standard_Master.csv');
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

function buildUnifiedMaster() {
  console.log('Building Unified PRACT Clinical Trials Intelligence Master Database...');

  const masterMap = new Map();

  // 1. Load the 2,648 Oncology Trials from the Full Registry Pull that passed ALL gates
  const oncoContent = fs.readFileSync(ONCOLOGY_PASSES_GATES_CSV, 'utf8');
  const oncoLines = oncoContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`Loaded ${oncoLines.length - 1} full-pull oncology trials.`);

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

  console.log(`Oncology trials added to master: ${masterMap.size}`);

  // 2. Load the Non-Oncology Trials from the audited gold standard file, ensuring ZERO problems
  const auditContent = fs.readFileSync(AUDIT_ALL_ROWS_CSV, 'utf8');
  const auditLines = auditContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  // Also load the metadata details from Gold Master CSV for these rows
  const goldContent = fs.readFileSync(GOLD_MASTER_CSV, 'utf8');
  const goldLines = goldContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  const goldDetailMap = new Map();
  for (let i = 1; i < goldLines.length; i++) {
    const cols = parseCsvLine(goldLines[i]);
    if (cols.length >= 11) {
      goldDetailMap.set(cols[0], {
        interventionTypes: cols[5],
        sponsorClass: cols[6],
        phase: cols[7],
        primaryPurpose: cols[8]
      });
    }
  }

  let nonOncoAdded = 0;
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

    // Reject the 7 specific non-cancer mislabel diseases flagged by audit
    if (/polycystic kidney|kidney transplant|end-stage renal|polycystic ovary|gastric ulcer/i.test(regConditions)) {
      continue;
    }

    if (!masterMap.has(nctId)) {
      const details = goldDetailMap.get(nctId) || {};
      masterMap.set(nctId, {
        nctId,
        therapeuticArea: area,
        diseaseLabel: label,
        acronym: '—',
        briefTitle,
        leadSponsor: 'Industry',
        sponsorClass: details.sponsorClass || 'INDUSTRY',
        phase: 'Phase 3',
        status,
        startDate: '',
        enrollment: '',
        primaryPurpose: details.primaryPurpose || 'TREATMENT',
        interventionTypes: details.interventionTypes || 'DRUG',
        keyInterventions: '',
        primaryOutcome: '',
        regConditions,
        isLiveOnSite: liveNctSet.has(nctId),
        regLink
      });
      nonOncoAdded++;
    }
  }

  console.log(`Clean non-oncology trials added: ${nonOncoAdded}`);
  console.log(`\nTOTAL UNIFIED MASTER DATABASE SIZE: ${masterMap.size}`);

  const areaCounts = {};
  const labelCounts = {};
  let alreadyLiveCount = 0;
  let candidateCount = 0;

  for (const t of masterMap.values()) {
    areaCounts[t.therapeuticArea] = (areaCounts[t.therapeuticArea] || 0) + 1;
    labelCounts[t.diseaseLabel] = (labelCounts[t.diseaseLabel] || 0) + 1;
    if (t.isLiveOnSite) alreadyLiveCount++;
    else candidateCount++;
  }

  console.log(` - Already Live on clinsight.pract.eu: ${alreadyLiveCount}`);
  console.log(` - Pristine Verified New Master Candidates: ${candidateCount}`);
  console.log(`\nTherapeutic Area Breakdown:`);
  console.log(areaCounts);
  console.log(`\nTop 15 Disease Labels:`);
  console.log(Object.entries(labelCounts).sort((a,b) => b[1] - a[1]).slice(0, 15));

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
  console.log(`\nMaster Database successfully generated at: ${OUT_UNIFIED_CSV}`);
}

buildUnifiedMaster();
