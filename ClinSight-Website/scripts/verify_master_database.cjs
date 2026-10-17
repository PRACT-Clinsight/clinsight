const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'ClinSight_PRACT_Master_Database.csv');
let content = fs.readFileSync(csvPath, 'utf8');

// Strip any duplicate BOMs
while (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}

const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

function parseCsv(line) {
  const res = [];
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
      res.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  res.push(cur);
  return res;
}

const headers = parseCsv(lines[0]);
console.log('Total trials:', lines.length - 1);
console.log('Headers:', headers);

let missingStartDates = [];
let placeholderSponsors = [];
let blankPhases = [];
let nonPhase3 = [];
let nonIndustry = [];
let blankTitles = [];
let uniqueNcts = new Set();
let duplicates = [];
let areas = {};

for (let i = 1; i < lines.length; i++) {
  const cols = parseCsv(lines[i]);
  const nctId = cols[0];
  const area = cols[1];
  const label = cols[2];
  const acronym = cols[3];
  const title = cols[4];
  const sponsor = cols[5];
  const sponsorClass = cols[6];
  const phase = cols[7];
  const status = cols[8];
  const startDate = cols[9];
  const enrollment = cols[10];
  const purpose = cols[11];
  const interventions = cols[13];
  const primaryOutcome = cols[14];

  if (uniqueNcts.has(nctId)) {
    duplicates.push(nctId);
  }
  uniqueNcts.add(nctId);

  areas[area] = (areas[area] || 0) + 1;

  if (!title || title.trim() === '' || title === '—') {
    blankTitles.push(nctId);
  }
  if (!phase || phase.trim() === '' || phase === '—') {
    blankPhases.push(nctId);
  } else if (!phase.toLowerCase().includes('phase 3')) {
    nonPhase3.push({ nctId, phase });
  }
  if (sponsorClass !== 'INDUSTRY') {
    nonIndustry.push({ nctId, sponsorClass });
  }
  if (!startDate || startDate === '—' || startDate.trim() === '') {
    missingStartDates.push(nctId);
  }
  if (!sponsor || sponsor === 'Industry Sponsor' || sponsor === '—' || sponsor.trim() === '') {
    placeholderSponsors.push(nctId);
  }
}

console.log('--- AUDIT RESULTS ---');
console.log('Unique NCT IDs:', uniqueNcts.size);
console.log('Duplicates:', duplicates.length);
console.log('Blank phases:', blankPhases.length);
console.log('Non-Phase 3:', nonPhase3.length);
console.log('Non-Industry:', nonIndustry.length);
console.log('Blank titles:', blankTitles.length);
console.log('Missing/Placeholder start dates:', missingStartDates.length, missingStartDates);
console.log('Placeholder/Blank sponsors:', placeholderSponsors.length, placeholderSponsors);
console.log('Therapeutic Area Breakdown:', areas);
