const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_CSV = path.join(__dirname, '../../ClinSight_Cardiometabolic_Trials_2015_2026_Verification.csv');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'ClinSight-Research-Bot/2.0' } }, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[WARN] HTTP ${res.statusCode} for ${url}`);
        return resolve(null);
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`[ERR] Network error: ${err.message}`);
      resolve(null);
    });
  });
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

// Fine-grained Cardiometabolic Disease Subtype Classifier
function classifyCardioMetabolic(conditions, briefTitle) {
  const text = ` ${(conditions || []).join(' ')} ${briefTitle || ''} `.toLowerCase();
  
  if (/\b(heart failure|hfref|hfpef|hfmref|cardiomyopathy)\b/i.test(text)) return 'Heart Failure & Cardiomyopathy';
  if (/\b(obesity|overweight|weight loss|weight management)\b/i.test(text)) return 'Obesity & Weight Management';
  if (/\b(chronic kidney disease|ckd|diabetic nephropathy|kidney failure|renal impairment|esrd)\b/i.test(text)) return 'Chronic Kidney Disease (Cardio-Renal)';
  if (/\b(diabetes|type 2 diabetes|t2d|t2dm|hyperglycemia)\b/i.test(text)) return 'Type 2 Diabetes Mellitus';
  if (/\b(mash|nash|steatohepatitis|metabolic dysfunction-associated steatotic liver|fatty liver)\b/i.test(text)) return 'MASH / Metabolic Liver Disease';
  if (/\b(atherosclerosis|ascvd|coronary artery|myocardial infarction|angina|cad|peripheral artery)\b/i.test(text)) return 'Atherosclerosis & Ischemic Heart Disease';
  if (/\b(hypercholesterolemia|hyperlipidemia|dyslipidemia|lipoprotein|ldl|triglycerid)\b/i.test(text)) return 'Dyslipidemia & Lipid Disorders';
  if (/\b(hypertension|blood pressure|resistant hypertension)\b/i.test(text)) return 'Hypertension & Vascular Disease';
  if (/\b(atrial fibrillation|arrhythmia|stroke prevention|thrombosis|pulmonary embolism|venous thromboembolism)\b/i.test(text)) return 'Thrombosis, Arrhythmia & Stroke';
  
  return 'Cardiometabolic & Vascular Medicine';
}

// Deep Cardiometabolic Modality Classifier
function inferCardioModality(interventions, title) {
  const text = ` ${(interventions || []).join(' ')} ${title || ''} `.toLowerCase();
  
  // 1. Incretin Mimetics (GLP-1 / GIP / Glucagon Triple Agonists)
  if (/\b(semaglutide|tirzepatide|retatrutide|cagrisema|liraglutide|dulaglutide|orforglipron|mazdutide|pemvidutide|survodutide|efpeglenatide|glp-1|glp-1\/gip|incretin)\b/i.test(text)) {
    return 'Incretin Mimetics (GLP-1 / GIP Dual & Triple Agonists)';
  }

  // 2. SGLT2 Inhibitors (Gliflozins)
  if (/\b(empagliflozin|dapagliflozin|canagliflozin|sotagliflozin|bexagliflozin|ertugliflozin|sglt2|sglt-2)\b/i.test(text)) {
    return 'SGLT2 Inhibitors (Cardio-Renal Gliflozins)';
  }

  // 3. Non-Steroidal Mineralocorticoid Receptor Antagonists (nsMRA)
  if (/\b(finerenone|apararenone|esaxerenone|nsmra|mineralocorticoid receptor antagonist)\b/i.test(text)) {
    return 'Non-Steroidal MRAs (nsMRA)';
  }

  // 4. Lipid-Lowering RNAi & PCSK9 Therapeutics
  if (/\b(inclisiran|evolocumab|alirocumab|olpasiran|lepodisiran|pelacarsen|bempedoic acid|pcsk9|sirna|rnai|antisense)\b/i.test(text)) {
    return 'Advanced Lipid-Lowering & RNAi Therapeutics (PCSK9/Lp(a))';
  }

  // 5. Cardiac Myosin Inhibitors & Activators (Inotropes)
  if (/\b(mavacamten|aficamten|omecamtiv mecarbil|myosin inhibitor|cardiac myosin)\b/i.test(text)) {
    return 'Cardiac Myosin Modulators';
  }

  // 6. Soluble Guanylate Cyclase (sGC) Stimulators
  if (/\b(vericiguat|riociguat|sgc stimulator|guanylate cyclase)\b/i.test(text)) {
    return 'sGC Stimulators & Pulmonary/Vascular Modulators';
  }

  // 7. Next-Generation Antithrombotics & Factor XI/XIa Inhibitors
  if (/\b(asundexian|milvexian|abelacimab|factor xi|factor xia|fxi)\b/i.test(text)) {
    return 'Next-Gen Antithrombotics (Factor XI/XIa Inhibitors)';
  }

  // 8. Angiotensin Receptor-Neprilysin Inhibitor (ARNI) & Aldosterone Synthase Inhibitors
  if (/\b(sacubitril|valsartan|entresto|baxdrostat|lorundrostat|aldosterone synthase|arni)\b/i.test(text)) {
    return 'Neurohormonal & ARNI / ASI Modulators';
  }

  // 9. Thyroid Hormone Receptor-Beta Agonists
  if (/\b(resmetirom|thr-beta|thr-b)\b/i.test(text)) {
    return 'Selective THR-Beta Agonists (Liver-Directed)';
  }

  return 'Standard Pharmacotherapy & Guideline-Directed Medical Therapy';
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`ClinSight Cardiometabolic Expansion Engine (2015-2026)`);
  console.log(`Pulling verified Phase 3 trials from ClinicalTrials.gov API v2`);
  console.log(`======================================================\n`);

  const trialMap = new Map();

  const queryTopics = [
    { query: 'Heart Failure', name: 'Heart Failure' },
    { query: 'Obesity', name: 'Obesity' },
    { query: 'Type 2 Diabetes Mellitus', name: 'Type 2 Diabetes' },
    { query: 'Chronic Kidney Disease', name: 'Chronic Kidney Disease' },
    { query: 'Atherosclerosis', name: 'Atherosclerosis / CAD' },
    { query: 'Hypercholesterolemia', name: 'Dyslipidemia / Hypercholesterolemia' },
    { query: 'Hypertension', name: 'Hypertension' },
    { query: 'Atrial Fibrillation', name: 'Atrial Fibrillation' },
    { query: 'Myocardial Infarction', name: 'Myocardial Infarction' },
    { query: 'Nonalcoholic Steatohepatitis', name: 'NASH / MASH' }
  ];

  for (const topic of queryTopics) {
    const encodedCond = encodeURIComponent(topic.query);
    const filter = encodeURIComponent('AREA[Phase]PHASE3 AND AREA[StartDate]RANGE[2015-01-01,MAX]');
    const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodedCond}&filter.advanced=${filter}&pageSize=35`;
    
    console.log(`Fetching Phase 3 trials for ${topic.name}...`);
    const res = await fetchJson(apiUrl);
    if (!res || !res.studies) continue;

    for (const study of res.studies) {
      const p = study.protocolSection;
      if (!p) continue;
      const nctId = p.identificationModule?.nctId;
      if (!nctId) continue;

      if (!trialMap.has(nctId)) {
        const briefTitle = p.identificationModule?.briefTitle || '';
        const officialTitle = p.identificationModule?.officialTitle || briefTitle;
        const acronym = p.identificationModule?.acronym || '';
        const leadSponsor = p.sponsorCollaboratorsModule?.leadSponsor?.name || '';
        const phase = (p.designModule?.phases || []).join(', ') || 'Phase 3';
        const status = p.statusModule?.overallStatus || '';
        const startDate = p.statusModule?.startDateStruct?.date || '';
        const completionDate = p.statusModule?.completionDateStruct?.date || '';
        const enrollment = p.designModule?.enrollmentInfo?.count || 0;
        const conditions = p.conditionsModule?.conditions || [];
        const interventions = (p.armsInterventionsModule?.interventions || []).map(i => i.name);
        const primaryEndpoint = (p.outcomesModule?.primaryOutcomes || []).map(o => o.measure).join('; ') || '';

        // Exclude purely non-drug / observational / device-only
        const interText = interventions.join(' ').toLowerCase();
        const isNonDrug = interText.includes('acupuncture') || interText.includes('questionnaire') || interText.includes('exercise') || interText.includes('dietary supplement') || interText.includes('behavioral');
        if (isNonDrug) continue;

        // Ensure minimum enrollment sample size
        if (enrollment > 0 && enrollment < 50) continue;

        trialMap.set(nctId, {
          nctId,
          briefTitle,
          officialTitle,
          acronym,
          leadSponsor,
          phase,
          status,
          startDate,
          completionDate,
          enrollment,
          conditions,
          interventions,
          primaryEndpoint
        });
      }
    }
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\nAggregated ${trialMap.size} distinct cardiometabolic trials (2015-2026).`);

  // Build CSV
  const csvHeaders = [
    'NCT ID',
    'Therapeutic Area',
    'Cardiometabolic Subtype',
    'Modality (Enriched)',
    'Study Acronym',
    'Brief Title',
    'Lead Sponsor',
    'Phase',
    'Overall Status',
    'Start Date',
    'Completion Date',
    'Enrolled Participants',
    'Primary Outcome Measure',
    'Key Interventions',
    'Registry Link'
  ];

  const categoryCounts = {};
  const modalityCounts = {};
  const rows = [];

  for (const t of trialMap.values()) {
    const subType = classifyCardioMetabolic(t.conditions, t.briefTitle);
    const modality = inferCardioModality(t.interventions, t.briefTitle);

    categoryCounts[subType] = (categoryCounts[subType] || 0) + 1;
    modalityCounts[modality] = (modalityCounts[modality] || 0) + 1;

    const row = [
      escapeCsv(t.nctId),
      escapeCsv('Cardiometabolic & Vascular Medicine'),
      escapeCsv(subType),
      escapeCsv(modality),
      escapeCsv(t.acronym || '—'),
      escapeCsv(t.briefTitle),
      escapeCsv(t.leadSponsor || '—'),
      escapeCsv(t.phase),
      escapeCsv(t.status),
      escapeCsv(t.startDate),
      escapeCsv(t.completionDate),
      escapeCsv(t.enrollment),
      escapeCsv(t.primaryEndpoint),
      escapeCsv((t.interventions || []).slice(0, 5).join(', ')),
      escapeCsv(`https://clinicaltrials.gov/study/${t.nctId}`)
    ];
    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM so Excel opens with proper character rendering
  const BOM = '\uFEFF';
  const csvContent = BOM + csvHeaders.join(',') + '\r\n' + rows.join('\r\n');
  fs.writeFileSync(OUT_CSV, csvContent, 'utf8');

  console.log(`\n======================================================`);
  console.log(`Cardiometabolic Verification Excel Sheet Successfully Generated!`);
  console.log(`Location: ${OUT_CSV}`);
  console.log(`Total Candidates: ${rows.length}`);
  console.log(`\nSubtype Distribution:`);
  console.log(categoryCounts);
  console.log(`\nModality Distribution:`);
  console.log(modalityCounts);
  console.log(`======================================================\n`);
}

run().catch(console.error);
