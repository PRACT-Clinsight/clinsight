const fs = require('fs');
const path = require('path');

const excludeNcts = new Set([
  'NCT02520739', // NUTRAOLEUM (Olive oil)
  'NCT05721456', // Pneumococcal 12-valent
  'NCT00678301', // Pneumococcal GSK
  'NCT01026038', // Pneumococcal 13vPnC
  'NCT01154088', // Meningococcal GSK
  'NCT01692886', // Pneumococcal 13vPnC
  'NCT01964716', // Pneumococcal 13vPnC
  'NCT01310413', // H5N1 Vaccine
  'NCT00368966', // Pneumococcal 13-valent
  'NCT07160244', // Group B Streptococcus
  'NCT01641133'  // Synflorix / Prevenar 13
]);

const trialsPath = path.join(__dirname, '../data/trials.json');
const csvPath = path.join(__dirname, '../data/ClinSight_Deploy_Sheet.csv');

const trials = JSON.parse(fs.readFileSync(trialsPath, 'utf8'));
const filtered = trials.filter(t => !excludeNcts.has(t.nctId));
fs.writeFileSync(trialsPath, JSON.stringify(filtered, null, 2), 'utf8');

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const csvLines = csvRaw.split(/\r?\n/);
const header = csvLines[0];
const filteredCsv = csvLines.slice(1).filter(line => {
  if (!line.trim()) return false;
  const match = line.match(/^"([^"]+)"/);
  const nct = match ? match[1] : '';
  return !excludeNcts.has(nct);
});
fs.writeFileSync(csvPath, [header, ...filteredCsv].join('\r\n'), 'utf8');

// Also remove obsolete generated trial folders for those 11
for (const nct of excludeNcts) {
  const dir = path.join(__dirname, '../trials', nct);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Deleted folder for ${nct}`);
  }
}

console.log(`Original trials count: ${trials.length}`);
console.log(`Purged count: ${excludeNcts.size}`);
console.log(`Cleaned trials count: ${filtered.length}`);
console.log(`Cleaned CSV rows: ${filteredCsv.length}`);
