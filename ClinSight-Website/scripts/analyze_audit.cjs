const fs = require('fs');

const content = fs.readFileSync('G:/My Drive/Claude/ClinSight_Audit/AUDIT_ALL_FAIL_and_REVIEW.csv', 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

console.log('Total audited problem rows in file:', lines.length - 1);

let failCount = 0;
let reviewCount = 0;
const failReasons = {};
const samples = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes(',"FAIL",')) {
    failCount++;
    const parts = line.split('","');
    const problem = parts[4] || '';
    failReasons[problem] = (failReasons[problem] || 0) + 1;
    if (samples.length < 8) samples.push({ nct: parts[2], problem: parts[4], assigned: parts[6], actual: parts[8], title: parts[19] });
  } else if (line.includes(',"REVIEW",')) {
    reviewCount++;
  }
}

console.log(`FAIL count: ${failCount}, REVIEW count: ${reviewCount}`);
console.log('\nTop FAIL problems:');
console.log(failReasons);
console.log('\nSample FAIL entries:');
console.dir(samples, { depth: null });
