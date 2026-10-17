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

const OUT_GOLD_CSV = path.join(__dirname, '../../ClinSight_Gold_Standard_Master.csv');
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

// Strict condition mapping derived ONLY from Registry Conditions, testing specific before generic
function mapStrictCondition(regConditions) {
  if (!regConditions || regConditions.trim().length === 0) return null;
  const c = ` ${regConditions.trim()} `.toLowerCase();

  // 1. SPECIFIC NON-CANCER PULMONARY (Must precede Lung Cancer!)
  if (/\b(pulmonary arterial hypertension|pah)\b/i.test(c)) return { area: 'Pulmonology', label: 'Pulmonary Arterial Hypertension' };
  if (/\b(idiopathic pulmonary fibrosis|ipf|pulmonary fibrosis|interstitial lung disease)\b/i.test(c)) return { area: 'Pulmonology', label: 'Idiopathic Pulmonary Fibrosis' };
  if (/\b(copd|pulmonary disease, chronic obstructive|chronic bronchitis|emphysema)\b/i.test(c)) return { area: 'Pulmonology', label: 'COPD' };
  if (/\b(asthma)\b/i.test(c)) return { area: 'Pulmonology', label: 'Severe Asthma' };

  // 2. SPECIFIC NON-CANCER NEUROLOGY & PSYCHIATRY (Include previously omitted diseases)
  if (/\b(major depressive|depression|depressive disorder|mdd)\b/i.test(c)) return { area: 'Psychiatry & CNS', label: 'Major Depressive Disorder' };
  if (/\b(schizophrenia|schizoaffective|psychosis)\b/i.test(c)) return { area: 'Psychiatry & CNS', label: 'Schizophrenia & Psychosis' };
  if (/\b(migraine|headache disorders)\b/i.test(c)) return { area: 'Neurology', label: 'Migraine Disorders' };
  if (/\b(alzheimer|alzheimer's|mild cognitive impairment)\b/i.test(c)) return { area: 'Neurology', label: "Alzheimer's Disease" };
  if (/\b(multiple sclerosis)\b/i.test(c)) return { area: 'Neurology', label: 'Multiple Sclerosis' };
  if (/\b(parkinson|parkinson's)\b/i.test(c)) return { area: 'Neurology', label: "Parkinson's Disease" };
  if (/\b(amyotrophic lateral sclerosis|als|motor neuron disease)\b/i.test(c)) return { area: 'Neurology', label: 'ALS' };

  // 3. SPECIFIC RARE DISEASES & HEMATOLOGY (Include previously omitted diseases)
  if (/\b(paroxysmal nocturnal hemoglobinuria|pnh)\b/i.test(c)) return { area: 'Rare Diseases & Hematology', label: 'Paroxysmal Nocturnal Hemoglobinuria (PNH)' };
  if (/\b(duchenne|dmd|muscular dystrophy, duchenne)\b/i.test(c)) return { area: 'Rare Diseases & Genetics', label: 'Duchenne Muscular Dystrophy' };
  if (/\b(sickle cell|thalassemia|beta-thalassemia)\b/i.test(c)) return { area: 'Rare Diseases & Hematology', label: 'Sickle Cell & Beta-Thalassemia' };
  if (/\b(cystic fibrosis)\b/i.test(c)) return { area: 'Rare Diseases & Genetics', label: 'Cystic Fibrosis' };
  if (/\b(spinal muscular atrophy|sma)\b/i.test(c)) return { area: 'Rare Diseases & Genetics', label: 'Spinal Muscular Atrophy' };
  if (/\b(hemophilia|haemophilia)\b/i.test(c)) return { area: 'Rare Diseases & Hematology', label: 'Hemophilia' };

  // 4. SPECIFIC OPHTHALMOLOGY
  if (/\b(macular degeneration|amd|macular edema|dme|diabetic retinopathy|geographic atrophy)\b/i.test(c)) return { area: 'Ophthalmology', label: 'Retinal Diseases (AMD/DME/GA)' };
  if (/\b(glaucoma|ocular hypertension)\b/i.test(c)) return { area: 'Ophthalmology', label: 'Glaucoma & Ocular Hypertension' };

  // 5. SPECIFIC INFECTIOUS DISEASES (Include RSV)
  if (/\b(respiratory syncytial virus|rsv)\b/i.test(c)) return { area: 'Infectious Diseases', label: 'RSV & Respiratory Viruses' };
  if (/\b(hiv|human immunodeficiency virus)\b/i.test(c)) return { area: 'Infectious Diseases', label: 'HIV-1 Infection' };
  if (/\b(hepatitis c|hcv)\b/i.test(c)) return { area: 'Infectious Diseases', label: 'Hepatitis C (HCV)' };
  if (/\b(hepatitis b|hbv)\b/i.test(c)) return { area: 'Infectious Diseases', label: 'Hepatitis B (HBV)' };

  // 6. SPECIFIC IMMUNOLOGY & DERMATOLOGY
  if (/\b(rheumatoid arthritis)\b/i.test(c)) return { area: 'Immunology', label: 'Rheumatoid Arthritis' };
  if (/\b(psoriasis|psoriatic arthritis)\b/i.test(c)) return { area: 'Immunology & Dermatology', label: 'Psoriasis & Psoriatic Arthritis' };
  if (/\b(atopic dermatitis|eczema)\b/i.test(c)) return { area: 'Immunology & Dermatology', label: 'Atopic Dermatitis & Eczema' };
  if (/\b(crohn|crohn's|ulcerative colitis|inflammatory bowel disease|ibd)\b/i.test(c)) return { area: 'Gastroenterology (IBD)', label: 'Inflammatory Bowel Disease (IBD)' };
  if (/\b(systemic lupus|lupus erythematosus|sle|ankylosing spondylitis)\b/i.test(c)) return { area: 'Immunology', label: 'Autoimmune & Rheumatic Diseases' };

  // 7. SPECIFIC CARDIOMETABOLIC (Exclude portal/ocular/pulmonary hypertension)
  if (/\b(heart failure|cardiomyopathy|hfref|hfpef)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Heart Failure & Cardiomyopathy' };
  if (/\b(obesity|overweight|weight loss|weight management)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Obesity & Weight Management' };
  if (/\b(type 2 diabetes|t2d|t2dm|diabetes mellitus, type 2|hyperglycemia)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Type 2 Diabetes Mellitus' };
  if (/\b(chronic kidney disease|ckd|diabetic nephropath|renal impairment)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Chronic Kidney Disease (Cardio-Renal)' };
  if (/\b(atherosclerosis|ascvd|coronary artery|coronary disease|myocardial infarction|angina pectoris|cad)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Atherosclerosis & CAD' };
  if (/\b(hypercholesterolemia|hyperlipidemia|dyslipidemia|lipoprotein|hyperlipemia)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Dyslipidemia & Lipid Disorders' };
  if (/\b(essential hypertension|arterial hypertension|hypertension, arterial)\b/i.test(c) || (/\b(hypertension)\b/i.test(c) && !/pulmonary|ocular|portal|intraocular/i.test(c))) {
    return { area: 'Cardiometabolic', label: 'Essential Hypertension & Vascular' };
  }
  if (/\b(atrial fibrillation|cardiac arrhythmia|stroke|thrombosis|pulmonary embolism|venous thromboembolism|dvt)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'Thrombosis, Arrhythmia & Stroke' };
  if (/\b(nash|mash|nonalcoholic steatohepatitis|metabolic dysfunction-associated steatohepatitis)\b/i.test(c)) return { area: 'Cardiometabolic', label: 'MASH / Metabolic Liver Disease' };

  // 8. SPECIFIC ONCOLOGY (Checked against actual oncology condition keywords)
  if (/\b(breast cancer|breast neoplasms|breast carcinoma|breast tumor|triple negative breast)\b/i.test(c)) return { area: 'Oncology', label: 'Breast Cancer' };
  if (/\b(non-small cell lung|small cell lung|nsclc|sclc|lung cancer|lung neoplasms|lung carcinoma|mesothelioma)\b/i.test(c)) return { area: 'Oncology', label: 'Thoracic & Lung Cancer' };
  if (/\b(multiple myeloma|myeloma|plasma cell myeloma|plasma cell neoplasm)\b/i.test(c)) return { area: 'Oncology', label: 'Multiple Myeloma' };
  if (/\b(lymphoma|dlbcl|diffuse large b-cell|follicular lymphoma|mantle cell|hodgkin)\b/i.test(c)) return { area: 'Oncology', label: 'Lymphoma' };
  if (/\b(leukemia|leukaemia|acute myeloid|aml|chronic lymphocytic|cll|cml|myelodysplastic|mds|myeloid leukemia)\b/i.test(c)) return { area: 'Oncology', label: 'Leukemia & MDS' };
  if (/\b(prostate cancer|prostate carcinoma|prostatic neoplasms|prostate adenocarcinoma)\b/i.test(c)) return { area: 'Oncology', label: 'Prostate Cancer' };
  if (/\b(urothelial|bladder cancer|bladder carcinoma|renal cell|renal carcinoma|rcc|kidney neoplasm)\b/i.test(c)) return { area: 'Oncology', label: 'Genitourinary Cancers' };
  if (/\b(colorectal|colon cancer|colon carcinoma|rectal cancer|rectal carcinoma|colorectal neoplasms)\b/i.test(c)) return { area: 'Oncology', label: 'Colorectal Cancer' };
  if (/\b(gastric cancer|gastric carcinoma|stomach neoplasms|esophageal cancer|esophageal carcinoma|pancreatic cancer|pancreatic carcinoma|hepatocellular|liver cancer|liver carcinoma|hcc|cholangiocarcinoma|biliary tract|gastroenteropancreatic|gep-net|neuroendocrine)\b/i.test(c)) {
    return { area: 'Oncology', label: 'Gastrointestinal & Hepatobiliary' };
  }
  if (/\b(ovarian cancer|ovarian carcinoma|ovarian neoplasms|cervical cancer|cervical carcinoma|endometrial cancer|endometrial carcinoma|uterine neoplasms|fallopian)\b/i.test(c)) return { area: 'Oncology', label: 'Gynecologic Cancers' };
  if (/\b(melanoma|cutaneous melanoma|malignant melanoma|merkel cell)\b/i.test(c)) return { area: 'Oncology', label: 'Melanoma & Cutaneous' };
  if (/\b(glioblastoma|glioma|astrocytoma|sarcoma|head and neck|squamous cell carcinoma of the head|thyroid cancer)\b/i.test(c)) return { area: 'Oncology', label: 'CNS, Sarcoma & Head/Neck' };
  if (/\b(solid tumor|advanced solid|malignant solid|neoplasms, advanced)\b/i.test(c)) return { area: 'Oncology', label: 'Solid Tumors (Advanced)' };

  return null;
}

function run() {
  console.log('Running Gold Standard Audit-Compliant Compilation...');
  
  const uniqueTrials = new Map();
  let totalScreened = 0;
  let droppedDeadOrNotRecruiting = 0;
  let droppedNonPurePhase3 = 0;
  let droppedNonDrug = 0;
  let droppedNonTreatment = 0;
  let droppedNonIndustry = 0;
  let droppedUnmatchedCondition = 0;

  for (const filename of ALL_AUDIT_FILES) {
    const fullPath = path.join(AUDIT_DIR, filename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

    for (let i = 1; i < lines.length; i++) {
      totalScreened++;
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 21) continue;

      const nctId = cols[2];
      const problems = cols[4] || '';
      const cautions = cols[5] || '';
      const regConditions = cols[8];
      const regPhase = cols[11];
      const studyType = cols[12];
      const primaryPurpose = cols[13];
      const interventionTypes = cols[14];
      const sponsorClass = cols[15];
      const briefTitle = cols[19];
      const regLink = cols[20];

      // 1. Strict Phase 3 Gate (must be pure Phase 3, no Phase 2/3)
      if (regPhase !== 'PHASE3') {
        droppedNonPurePhase3++;
        continue;
      }

      // 2. Strict Interventional Treatment Gate
      if (studyType !== 'INTERVENTIONAL' || primaryPurpose !== 'TREATMENT') {
        droppedNonTreatment++;
        continue;
      }

      // 3. Strict Drug / Biologic Intervention Gate
      if (!/drug|biological|genetic/i.test(interventionTypes)) {
        droppedNonDrug++;
        continue;
      }

      // 4. Strict Status Gate: No Dead, Terminated, Withdrawn, Suspended, Unknown, or Not Yet Recruiting
      if (/status (terminated|withdrawn|suspended|unknown)|not yet recruiting|not yet initiated/i.test(problems + ' ' + cautions)) {
        droppedDeadOrNotRecruiting++;
        continue;
      }

      // 5. Strict Industry Sponsor Gate
      if (sponsorClass !== 'INDUSTRY') {
        droppedNonIndustry++;
        continue;
      }

      // 6. Strict Condition Mapping purely from Registry Conditions
      const conditionMatch = mapStrictCondition(regConditions);
      if (!conditionMatch) {
        droppedUnmatchedCondition++;
        continue;
      }

      // Deduplicate
      if (!uniqueTrials.has(nctId)) {
        uniqueTrials.set(nctId, {
          nctId,
          area: conditionMatch.area,
          diseaseLabel: conditionMatch.label,
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
  console.log(`Gold Standard Clean Compilation Report:`);
  console.log(`Total Rows Audited: ${totalScreened}`);
  console.log(`Filter Purges:`);
  console.log(` - Dropped Combined Phase 2/3: ${droppedNonPurePhase3}`);
  console.log(` - Dropped Non-Treatment / Non-Interventional: ${droppedNonTreatment}`);
  console.log(` - Dropped Non-Drug / Non-Biologic: ${droppedNonDrug}`);
  console.log(` - Dropped Dead / Not Yet Recruiting / Terminated: ${droppedDeadOrNotRecruiting}`);
  console.log(` - Dropped Non-Industry Sponsors: ${droppedNonIndustry}`);
  console.log(` - Dropped Ambiguous / Unmatched Conditions: ${droppedUnmatchedCondition}`);
  console.log(`\nFINAL GOLD STANDARD CANDIDATES: ${uniqueTrials.size}`);

  const areaCounts = {};
  const labelCounts = {};
  let alreadyLive = 0;
  let readyToStage = 0;

  for (const t of uniqueTrials.values()) {
    areaCounts[t.area] = (areaCounts[t.area] || 0) + 1;
    labelCounts[t.diseaseLabel] = (labelCounts[t.diseaseLabel] || 0) + 1;
    if (t.isAlreadyLive) alreadyLive++;
    else readyToStage++;
  }

  console.log(` - Already Active on clinsight.pract.eu: ${alreadyLive}`);
  console.log(` - Pristine Verified New Candidates (Ready for Staged Import): ${readyToStage}`);
  console.log(`\nTherapeutic Area Breakdown:`);
  console.log(areaCounts);
  console.log(`\nTop Verified Disease Labels:`);
  console.log(Object.entries(labelCounts).sort((a,b) => b[1] - a[1]));

  // Write Clean File
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
    'Production Site Status',
    'Registry Link'
  ];

  const rows = [];
  for (const t of uniqueTrials.values()) {
    rows.push([
      escapeCsv(t.nctId),
      escapeCsv(t.area),
      escapeCsv(t.diseaseLabel),
      escapeCsv(t.briefTitle),
      escapeCsv(t.regConditions),
      escapeCsv(t.interventionTypes),
      escapeCsv(t.sponsorClass),
      escapeCsv(t.phase),
      escapeCsv(t.primaryPurpose),
      escapeCsv(t.isAlreadyLive ? 'ALREADY LIVE (155 Site)' : 'GOLD IMPORT CANDIDATE'),
      escapeCsv(t.regLink)
    ].join(','));
  }

  const BOM = '\uFEFF';
  fs.writeFileSync(OUT_GOLD_CSV, BOM + csvHeaders.join(',') + '\r\n' + rows.join('\r\n'), 'utf8');
  console.log(`\nSaved Gold Standard File To: ${OUT_GOLD_CSV}`);
  console.log(`======================================================\n`);
}

run();
