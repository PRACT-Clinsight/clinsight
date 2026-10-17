const fs = require('fs');
const path = require('path');

const AUDIT_DIR = 'G:/My Drive/Claude/ClinSight_Audit';
const ALL_AUDIT_FILES = [
  'AUDIT_Oncology_2020_2026.csv',
  'AUDIT_Oncology_2015_2020.csv',
  'AUDIT_Cardiometabolic_2015_2026.csv',
  'AUDIT_Historical_2000_2015.csv',
  'AUDIT_Specialized_2000_2026.csv'
];

const OUT_CLEAN_CSV = path.join(__dirname, '../../ClinSight_Audit_Corrected_Master.csv');
const LIVE_TRIALS_JSON = path.join(__dirname, '../data/trials.json');

// Read existing live 155 NCT IDs
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

// Strict condition mapping derived purely from Registry Conditions
function normalizeDiseaseLabel(regConditions, title) {
  const text = ` ${(regConditions || '')} ${(title || '')} `.toLowerCase();

  // Oncology
  if (/\b(breast)\b/i.test(text)) return { area: 'Oncology', label: 'Breast Cancer' };
  if (/\b(lung|nsclc|sclc|thoracic|mesothelioma)\b/i.test(text)) return { area: 'Oncology', label: 'Thoracic & Lung Cancer' };
  if (/\b(myeloma|plasma cell)\b/i.test(text)) return { area: 'Oncology', label: 'Multiple Myeloma' };
  if (/\b(lymphoma|dlbcl|follicular|mantle cell|hodgkin)\b/i.test(text)) return { area: 'Oncology', label: 'Lymphoma' };
  if (/\b(leukemia|leukemic)\b/i.test(text) || /\b(aml|cll|cml|mds)\b/i.test(text) || (/\b(all)\b/i.test(text) && text.includes('lymphoblastic'))) {
    return { area: 'Oncology', label: 'Leukemia & MDS' };
  }
  if (/\b(prostate)\b/i.test(text)) return { area: 'Oncology', label: 'Prostate Cancer' };
  if (/\b(urothelial|bladder|renal cell|kidney cancer|rcc)\b/i.test(text)) return { area: 'Oncology', label: 'Genitourinary Cancers' };
  if (/\b(colorectal|colon cancer|rectal cancer)\b/i.test(text)) return { area: 'Oncology', label: 'Colorectal Cancer' };
  if (/\b(gastric|stomach cancer|gastroesophageal|esophageal|pancreatic|hepatocellular|liver cancer|biliary|cholangiocarcinoma|gep-net)\b/i.test(text)) {
    return { area: 'Oncology', label: 'Gastrointestinal & Hepatobiliary' };
  }
  if (/\b(ovarian|cervical|endometrial|uterine|fallopian)\b/i.test(text)) return { area: 'Oncology', label: 'Gynecologic Cancers' };
  if (/\b(melanoma|merkel|cutaneous)\b/i.test(text)) return { area: 'Oncology', label: 'Melanoma & Cutaneous' };
  if (/\b(glioblastoma|glioma|astrocytoma|sarcoma|head and neck|thyroid cancer)\b/i.test(text)) return { area: 'Oncology', label: 'CNS, Sarcoma & Head/Neck' };
  if (/\b(solid tumor|cancer|carcinoma|neoplasm|malignan)\b/i.test(text)) return { area: 'Oncology', label: 'Solid Tumors (Advanced)' };

  // Cardiometabolic
  if (/\b(heart failure|cardiomyopathy|hfref|hfpef)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Heart Failure' };
  if (/\b(obesity|overweight|weight loss)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Obesity & Weight Management' };
  if (/\b(type 2 diabetes|t2d|t2dm|hyperglycemia)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Type 2 Diabetes Mellitus' };
  if (/\b(chronic kidney disease|ckd|diabetic nephropathy)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Chronic Kidney Disease' };
  if (/\b(atherosclerosis|ascvd|coronary|myocardial infarction|angina)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Atherosclerosis & CAD' };
  if (/\b(hypercholesterolemia|hyperlipidemia|dyslipidemia|ldl)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Dyslipidemia & Lipid Disorders' };
  if (/\b(hypertension|blood pressure)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Hypertension & Vascular' };
  if (/\b(thrombosis|stroke|atrial fibrillation|embolism|dvt|pe)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'Thrombosis, Arrhythmia & Stroke' };
  if (/\b(nash|mash|steatohepatitis)\b/i.test(text)) return { area: 'Cardiometabolic', label: 'MASH / Metabolic Liver Disease' };

  // Immunology & Specialized
  if (/\b(rheumatoid arthritis)\b/i.test(text)) return { area: 'Immunology', label: 'Rheumatoid Arthritis' };
  if (/\b(psoriasis|psoriatic arthritis)\b/i.test(text)) return { area: 'Immunology', label: 'Psoriasis & Psoriatic Arthritis' };
  if (/\b(atopic dermatitis|eczema)\b/i.test(text)) return { area: 'Immunology', label: 'Atopic Dermatitis' };
  if (/\b(crohn|ulcerative colitis|inflammatory bowel)\b/i.test(text)) return { area: 'Immunology', label: 'Inflammatory Bowel Disease (IBD)' };
  if (/\b(lupus|sle|ankylosing spondylitis)\b/i.test(text)) return { area: 'Immunology', label: 'Autoimmune & Rheumatic Diseases' };
  if (/\b(alzheimer)\b/i.test(text)) return { area: 'Neurology', label: "Alzheimer's Disease" };
  if (/\b(multiple sclerosis)\b/i.test(text)) return { area: 'Neurology', label: 'Multiple Sclerosis' };
  if (/\b(parkinson)\b/i.test(text)) return { area: 'Neurology', label: "Parkinson's Disease" };
  if (/\b(amyotrophic lateral sclerosis|als)\b/i.test(text)) return { area: 'Neurology', label: 'ALS' };
  if (/\b(asthma)\b/i.test(text)) return { area: 'Pulmonology', label: 'Severe Asthma' };
  if (/\b(copd|pulmonary disease, chronic obstructive)\b/i.test(text)) return { area: 'Pulmonology', label: 'COPD' };
  if (/\b(pulmonary arterial hypertension|pah)\b/i.test(text)) return { area: 'Pulmonology', label: 'Pulmonary Arterial Hypertension' };
  if (/\b(macular degeneration|amd|macular edema)\b/i.test(text)) return { area: 'Ophthalmology', label: 'Retinal Diseases (AMD/DME)' };
  if (/\b(cystic fibrosis)\b/i.test(text)) return { area: 'Rare Diseases', label: 'Cystic Fibrosis' };
  if (/\b(spinal muscular atrophy)\b/i.test(text)) return { area: 'Rare Diseases', label: 'Spinal Muscular Atrophy (SMA)' };
  if (/\b(hemophilia)\b/i.test(text)) return { area: 'Rare Diseases', label: 'Hemophilia' };
  if (/\b(hiv|human immunodeficiency)\b/i.test(text)) return { area: 'Infectious Diseases', label: 'HIV-1' };
  if (/\b(hepatitis c|hcv)\b/i.test(text)) return { area: 'Infectious Diseases', label: 'Hepatitis C (HCV)' };

  return null; // Reject ambiguous or unclassifiable
}

function runAuditCorrection() {
  console.log('Starting Master Audit Correction Pipeline...');
  
  const masterRows = new Map();
  let totalInputRows = 0;
  let rejectedDeadStatus = 0;
  let rejectedNoDrug = 0;
  let rejectedNotTreatment = 0;
  let rejectedNotPhase3 = 0;
  let rejectedFutureStart = 0;
  let rejectedAmbiguousCondition = 0;

  for (const filename of ALL_AUDIT_FILES) {
    const fullPath = path.join(AUDIT_DIR, filename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

    for (let i = 1; i < lines.length; i++) {
      totalInputRows++;
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 21) continue;

      const sourceFile = cols[0];
      const nctId = cols[2];
      const verdict = cols[3];
      const problems = cols[4] || '';
      const cautions = cols[5] || '';
      const assignedLabel = cols[6];
      const regConditions = cols[8];
      const startInWindow = cols[10];
      const regPhase = cols[11];
      const studyType = cols[12];
      const primaryPurpose = cols[13];
      const interventionTypes = cols[14];
      const sponsorClass = cols[15];
      const enrollmentType = cols[16];
      const resultsPosted = cols[17];
      const alsoIn = cols[18];
      const briefTitle = cols[19];
      const regLink = cols[20];

      // 1. FILTER: Must be Interventional Treatment or Prevention
      if (studyType !== 'INTERVENTIONAL') { rejectedNotTreatment++; continue; }
      if (!/treatment|prevention/i.test(primaryPurpose)) { rejectedNotTreatment++; continue; }

      // 2. FILTER: Must have Drug or Biological intervention
      if (!/drug|biological|genetic/i.test(interventionTypes)) { rejectedNoDrug++; continue; }

      // 3. FILTER: Drop dead / terminated / withdrawn / unknown status
      if (/status (terminated|withdrawn|suspended|unknown)/i.test(problems + ' ' + cautions)) {
        rejectedDeadStatus++;
        continue;
      }

      // 4. FILTER: Drop future start dates
      if (/not yet initiated/i.test(problems + ' ' + cautions)) {
        rejectedFutureStart++;
        continue;
      }

      // 5. FILTER: Phase 3 required (allow Phase 2/3 only if treatment with drug)
      if (!/phase3/i.test(regPhase)) { rejectedNotPhase3++; continue; }

      // 6. NORMALIZE CONDITION FROM REGISTRY FACTS
      const normalized = normalizeDiseaseLabel(regConditions, briefTitle);
      if (!normalized) {
        rejectedAmbiguousCondition++;
        continue;
      }

      // Deduplicate by NCT ID (keep first occurrence or upgrade)
      if (!masterRows.has(nctId)) {
        masterRows.set(nctId, {
          nctId,
          area: normalized.area,
          diseaseLabel: normalized.label,
          briefTitle,
          regConditions,
          interventionTypes,
          sponsorClass,
          regPhase,
          primaryPurpose,
          isAlreadyLive: liveNctSet.has(nctId),
          regLink
        });
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`Master Audit Correction Summary:`);
  console.log(`Total Rows Screened: ${totalInputRows}`);
  console.log(`Rejections Breakdown:`);
  console.log(` - Dead / Withdrawn / Terminated Status: ${rejectedDeadStatus}`);
  console.log(` - No Drug / Biological Intervention: ${rejectedNoDrug}`);
  console.log(` - Not Treatment/Prevention Purpose: ${rejectedNotTreatment}`);
  console.log(` - Not Phase 3: ${rejectedNotPhase3}`);
  console.log(` - Future / Unstarted: ${rejectedFutureStart}`);
  console.log(` - Ambiguous / Non-specific Condition: ${rejectedAmbiguousCondition}`);
  console.log(`\nRemaining Clean Master Candidate Cohort: ${masterRows.size}`);
  
  // Breakdown of clean candidates
  const areaBreakdown = {};
  const labelBreakdown = {};
  let alreadyLiveCount = 0;
  let newImportCount = 0;

  for (const t of masterRows.values()) {
    areaBreakdown[t.area] = (areaBreakdown[t.area] || 0) + 1;
    labelBreakdown[t.diseaseLabel] = (labelBreakdown[t.diseaseLabel] || 0) + 1;
    if (t.isAlreadyLive) alreadyLiveCount++;
    else newImportCount++;
  }

  console.log(` - Already Live on clinsight.pract.eu: ${alreadyLiveCount}`);
  console.log(` - Pristine Verified New Candidates: ${newImportCount}`);
  console.log(`\nArea Distribution:`);
  console.log(areaBreakdown);
  console.log(`\nTop Disease Labels:`);
  console.log(Object.entries(labelBreakdown).sort((a,b) => b[1] - a[1]).slice(0, 15));

  // Write Clean Master CSV
  const csvHeaders = [
    'NCT ID',
    'Therapeutic Area',
    'Verified Disease Label',
    'Brief Title',
    'Registry Conditions (Verbatim)',
    'Intervention Types',
    'Sponsor Class',
    'Phase',
    'Primary Purpose',
    'Live On Site Status',
    'Registry Link'
  ];

  const csvRows = [];
  for (const t of masterRows.values()) {
    csvRows.push([
      escapeCsv(t.nctId),
      escapeCsv(t.area),
      escapeCsv(t.diseaseLabel),
      escapeCsv(t.briefTitle),
      escapeCsv(t.regConditions),
      escapeCsv(t.interventionTypes),
      escapeCsv(t.sponsorClass),
      escapeCsv(t.regPhase),
      escapeCsv(t.primaryPurpose),
      escapeCsv(t.isAlreadyLive ? 'ALREADY LIVE (155 Site)' : 'CLEAN IMPORT CANDIDATE'),
      escapeCsv(t.regLink)
    ].join(','));
  }

  const BOM = '\uFEFF';
  fs.writeFileSync(OUT_CLEAN_CSV, BOM + csvHeaders.join(',') + '\r\n' + csvRows.join('\r\n'), 'utf8');
  console.log(`\nClean Corrected Master File Written To: ${OUT_CLEAN_CSV}`);
  console.log(`======================================================\n`);
}

runAuditCorrection();
