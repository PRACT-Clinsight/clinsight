const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_CSV = path.join(__dirname, '../../ClinSight_Historical_Trials_2000_2015_Verification.csv');

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

function classifyTherapeuticArea(conditions, title) {
  const text = ` ${(conditions || []).join(' ')} ${title || ''} `.toLowerCase();
  const isCancer = /cancer|tumor|carcinoma|myeloma|lymphoma|leukemia|melanoma|sarcoma|glioma|neoplasm|malignan/i.test(text);
  if (isCancer) return 'Oncology & Hematology';
  return 'Cardiovascular & Metabolic Diseases';
}

function classifySubtype(conditions, title) {
  const text = ` ${(conditions || []).join(' ')} ${title || ''} `.toLowerCase();
  
  // Oncology
  if (/\b(breast)\b/i.test(text)) return 'Breast Cancer';
  if (/\b(lung|nsclc|sclc|thoracic)\b/i.test(text)) return 'Thoracic & Lung Cancer';
  if (/\b(prostate)\b/i.test(text)) return 'Prostate Cancer';
  if (/\b(colorectal|colon|rectal)\b/i.test(text)) return 'Colorectal Cancer';
  if (/\b(melanoma)\b/i.test(text)) return 'Melanoma & Cutaneous';
  if (/\b(lymphoma|dlbcl|follicular|mantle cell|hodgkin)\b/i.test(text)) return 'Lymphoma';
  if (/\b(leukemia|aml|cll|cml|all)\b/i.test(text)) return 'Leukemia';
  if (/\b(myeloma)\b/i.test(text)) return 'Multiple Myeloma';
  if (/\b(ovarian|cervic|endometri)\b/i.test(text)) return 'Gynecologic Cancers';
  if (/\b(gastric|stomach|esophag|pancrea|hepatocellular|liver)\b/i.test(text)) return 'Gastrointestinal & Hepatobiliary';
  if (/\b(renal|kidney|urothelial|bladder)\b/i.test(text)) return 'Genitourinary Cancers';
  
  // Cardiometabolic
  if (/\b(heart failure|cardiomyopathy)\b/i.test(text)) return 'Heart Failure';
  if (/\b(diabetes|hyperglycemia)\b/i.test(text)) return 'Type 2 Diabetes';
  if (/\b(obesity|overweight)\b/i.test(text)) return 'Obesity & Metabolic';
  if (/\b(hypercholesterolemia|dyslipidemia|lipid|cholesterol|statin)\b/i.test(text)) return 'Dyslipidemia & Lipid Disorders';
  if (/\b(atherosclerosis|coronary|myocardial infarction|angina)\b/i.test(text)) return 'Atherosclerosis & Ischemic Heart Disease';
  if (/\b(hypertension|blood pressure)\b/i.test(text)) return 'Hypertension & Vascular';
  if (/\b(thrombosis|stroke|atrial fibrillation|embolism)\b/i.test(text)) return 'Thrombosis, Arrhythmia & Stroke';
  if (/\b(kidney|renal impairment|nephropathy)\b/i.test(text)) return 'Chronic Kidney Disease';

  return 'General Specialized Medicine';
}

function inferModality(interventions, title) {
  const text = ` ${(interventions || []).join(' ')} ${title || ''} `.toLowerCase();
  
  if (/\b(trastuzumab|bevacizumab|rituximab|cetuximab|panitumumab|alemtuzumab|ipilimumab|pembrolizumab|nivolumab|mab)\b/i.test(text)) {
    return 'Monoclonal Antibodies & Biologics';
  }
  if (/\b(imatinib|erlotinib|gefitinib|sorafenib|sunitinib|lapatinib|bortezomib|lenalidomide|thalidomide|dasatinib|nilotinib|everolimus|temsirolimus|abiraterone|enzalutamide)\b/i.test(text)) {
    return 'Targeted Small Molecules & Kinase Inhibitors (TKI)';
  }
  if (/\b(atorvastatin|rosuvastatin|simvastatin|pravastatin|ezetimibe|niacin|fibrate)\b/i.test(text)) {
    return 'Lipid-Lowering Pharmacotherapy (Statins & Non-Statins)';
  }
  if (/\b(metformin|glimepiride|glipizide|pioglitazone|rosiglitazone|sitagliptin|vildagliptin|saxagliptin|exenatide|liraglutide|insulin)\b/i.test(text)) {
    return 'Metabolic & Antidiabetic Agents (Incretin/DPP-4/TZD/Insulin)';
  }
  if (/\b(losartan|valsartan|candesartan|enalapril|ramipril|lisinopril|amlodipine|metoprolol|carvedilol|bisoprolol|spironolactone|eplerenone)\b/i.test(text)) {
    return 'Cardiovascular Neurohormonal & Antihypertensive Agents';
  }
  if (/\b(aspirin|clopidogrel|prasugrel|ticagrelor|warfarin|rivaroxaban|apixaban|dabigatran|edoxaban|heparin)\b/i.test(text)) {
    return 'Antithrombotic & Anticoagulant Pharmacotherapy';
  }
  if (/\b(chemotherapy|paclitaxel|docetaxel|cisplatin|carboplatin|oxaliplatin|gemcitabine|doxorubicin|cyclophosphamide|fluorouracil|capecitabine)\b/i.test(text)) {
    return 'Standard Cytotoxic Chemotherapy';
  }

  return 'Standard Pharmacotherapy & Comparative Clinical Regimens';
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`ClinSight Historical Landmark Trials Engine (2000-2015)`);
  console.log(`Pulling landmark Phase 3 trials from ClinicalTrials.gov API v2`);
  console.log(`Range: 2000-01-01 to 2014-12-31 (Oncology + Cardiometabolic)`);
  console.log(`======================================================\n`);

  const trialMap = new Map();

  const queryTopics = [
    // Oncology Landmark Topics
    { query: 'Breast Cancer', type: 'Oncology' },
    { query: 'Non-Small Cell Lung Cancer', type: 'Oncology' },
    { query: 'Colorectal Cancer', type: 'Oncology' },
    { query: 'Prostate Cancer', type: 'Oncology' },
    { query: 'Melanoma', type: 'Oncology' },
    { query: 'Lymphoma', type: 'Oncology' },
    { query: 'Multiple Myeloma', type: 'Oncology' },
    { query: 'Leukemia', type: 'Oncology' },
    { query: 'Ovarian Cancer', type: 'Oncology' },
    { query: 'Renal Cell Carcinoma', type: 'Oncology' },
    { query: 'Gastric Cancer', type: 'Oncology' },
    
    // Cardiometabolic Landmark Topics
    { query: 'Heart Failure', type: 'Cardiometabolic' },
    { query: 'Type 2 Diabetes', type: 'Cardiometabolic' },
    { query: 'Hypercholesterolemia', type: 'Cardiometabolic' },
    { query: 'Atherosclerosis', type: 'Cardiometabolic' },
    { query: 'Hypertension', type: 'Cardiometabolic' },
    { query: 'Atrial Fibrillation', type: 'Cardiometabolic' },
    { query: 'Myocardial Infarction', type: 'Cardiometabolic' },
    { query: 'Chronic Kidney Disease', type: 'Cardiometabolic' }
  ];

  for (const topic of queryTopics) {
    const encodedCond = encodeURIComponent(topic.query);
    const filter = encodeURIComponent('AREA[Phase]PHASE3 AND AREA[StartDate]RANGE[2000-01-01,2014-12-31]');
    const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodedCond}&filter.advanced=${filter}&pageSize=35`;
    
    console.log(`Fetching 2000-2015 landmark Phase 3 trials for ${topic.query}...`);
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

        // Exclude purely non-drug
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

  console.log(`\nAggregated ${trialMap.size} distinct historical landmark trials (2000-2015).`);

  // Build CSV
  const csvHeaders = [
    'NCT ID',
    'Therapeutic Area',
    'Disease Subtype',
    'Historical Modality / Drug Class',
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
  const areaCounts = {};
  const rows = [];

  for (const t of trialMap.values()) {
    const area = classifyTherapeuticArea(t.conditions, t.briefTitle);
    const subType = classifySubtype(t.conditions, t.briefTitle);
    const modality = inferModality(t.interventions, t.briefTitle);

    areaCounts[area] = (areaCounts[area] || 0) + 1;
    categoryCounts[subType] = (categoryCounts[subType] || 0) + 1;

    const row = [
      escapeCsv(t.nctId),
      escapeCsv(area),
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
  console.log(`Historical 2000-2015 Verification Excel Sheet Generated!`);
  console.log(`Location: ${OUT_CSV}`);
  console.log(`Total Candidates: ${rows.length}`);
  console.log(`\nTherapeutic Area Distribution:`);
  console.log(areaCounts);
  console.log(`\nSubtype Distribution:`);
  console.log(categoryCounts);
  console.log(`======================================================\n`);
}

run().catch(console.error);
