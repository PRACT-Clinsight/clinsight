const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../../ClinSight_PRACT_Master_Database.csv');

const PATCHES = {
  'NCT04504825': {
    acronym: '—',
    leadSponsor: 'Alexion Pharmaceuticals, Inc.',
    startDate: '2020-08-25',
    enrollment: '125',
    keyInterventions: 'CAEL-101, Placebo, cyclophosphamide, bortezomib, and Dexamethasone (CyBorD) regimen',
    primaryOutcome: 'A Hierarchical Combination of Time to All-cause Mortality and Frequency of Cardiovascular Hospitalizations (CVHs) Analyzed by Win Ratio; Number of Participants With TEAEs'
  },
  'NCT06716814': {
    acronym: 'LIBERTY',
    leadSponsor: 'Swedish Orphan Biovitrum',
    startDate: '2025-03-06',
    enrollment: '104',
    keyInterventions: 'Efanesoctocog alfa',
    primaryOutcome: 'Number of injections to treat a bleeding episode; Annualized bleeding rate (ABR) for treated bleeding episodes'
  },
  'NCT06236061': {
    acronym: '—',
    leadSponsor: 'Novartis Pharmaceuticals',
    startDate: '2024-04-08',
    enrollment: '718',
    keyInterventions: 'LCZ, LCZ/AML 200 mg/2.5 mg, LCZ/AML 200 mg/5 mg, LCZ/AML 200 mg/10 mg, Placebo',
    primaryOutcome: '[Core Part] Change from baseline to Week 8 in msSBP'
  },
  'NCT03993288': {
    acronym: '—',
    leadSponsor: 'Sandoz',
    startDate: '2019-06-27',
    enrollment: '267',
    keyInterventions: 'Ferrum Lek® (iron (III) hydroxide polymaltosate), MALTOFER® (iron (III) hydroxide polymaltosate)',
    primaryOutcome: 'Change From Baseline in Blood Hemoglobin Level (g/L)'
  },
  'NCT03120949': {
    acronym: 'CREDO 4',
    leadSponsor: 'R-Pharm International, LLC',
    startDate: '2017-07-04',
    enrollment: '2106',
    keyInterventions: 'Olokizumab 64 mg SC q4w, Olokizumab 64 mg SC q2w, Concomitant treatment',
    primaryOutcome: 'Incidence of Treatment-Emergent Adverse Events (AEs), by System Organ Class and Preferred Term (Safety Population)'
  },
  'NCT03721172': {
    acronym: 'ADVANCE',
    leadSponsor: 'Amgen',
    startDate: '2019-03-11',
    enrollment: '595',
    keyInterventions: 'Apremilast, Placebo',
    primaryOutcome: 'Percentage of Participants With a Static Physician Global Assessment (sPGA) Response at Week 16 During the Placebo-Controlled Phase'
  }
};

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

function patchMaster() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = parseCsvLine(lines[0]);

  let patchedCount = 0;
  const newLines = [lines[0]];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const nctId = cols[0];

    if (PATCHES[nctId]) {
      const p = PATCHES[nctId];
      cols[3] = p.acronym; // Study Acronym
      cols[5] = p.leadSponsor; // Lead Sponsor
      cols[9] = p.startDate; // Start Date
      cols[10] = p.enrollment; // Enrolled Participants
      cols[13] = p.keyInterventions; // Key Interventions
      cols[14] = p.primaryOutcome; // Primary Outcome Measure
      patchedCount++;
    }

    newLines.push(cols.map(escapeCsv).join(','));
  }

  const BOM = '\uFEFF';
  fs.writeFileSync(CSV_PATH, BOM + newLines.join('\r\n'), 'utf8');
  console.log(`Successfully patched ${patchedCount} rows in ${CSV_PATH}`);
}

patchMaster();
