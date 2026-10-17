const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_CSV = path.join(__dirname, '../../ClinSight_Cancer_Trials_2020_2026_Verification.csv');

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

// Fine-grained Oncology Vertical Classifier
function classifyOncology(conditions, briefTitle, interventions) {
  const text = ` ${(conditions || []).join(' ')} ${briefTitle || ''} ${(interventions || []).join(' ')} `.toLowerCase();
  
  if (/\b(breast)\b/i.test(text)) return 'Breast Cancer';
  if (/\b(lung|nsclc|sclc|thoracic|mesothelioma)\b/i.test(text)) return 'Thoracic & Lung Cancer';
  if (/\b(ovarian|cervic|cervical|endometri|endometrial|uterine|fallopian)\b/i.test(text)) return 'Gynecologic Cancers';
  if (/\b(myeloma|plasma cell)\b/i.test(text)) return 'Multiple Myeloma';
  if (/\b(lymphoma|dlbcl|follicular|mantle cell|hodgkin)\b/i.test(text)) return 'Lymphoma';
  if (/\b(leukemia|aml|cll|cml|mds|myelodysplastic|myeloid)\b/i.test(text) || (/\b(all)\b/i.test(text) && text.includes('lymphoblastic'))) return 'Leukemia & MDS';
  if (/\b(prostate|urothelial|bladder|renal|kidney|rcc)\b/i.test(text)) return 'Genitourinary Cancers';
  if (/\b(colorectal|colon|rectal|gastric|stomach|esophag|esophageal|pancrea|pancreatic|hepatocellular|liver|biliary|cholangio)\b/i.test(text)) return 'Gastrointestinal & Hepatobiliary';
  if (/\b(melanoma|merkel|cutaneous)\b/i.test(text)) return 'Melanoma & Cutaneous';
  if (/\b(glioblastoma|glioma|brain|sarcoma|head and neck|thyroid|neuroendocrine)\b/i.test(text)) return 'CNS, Sarcoma & Head/Neck';
  
  return 'Pan-Tumor & Solid Neoplasms';
}

// Deep Modality Classifier (Prioritizes innovative mechanisms over background standard-of-care chemo)
function inferModalityDeep(interventions, title) {
  const text = ` ${(interventions || []).join(' ')} ${title || ''} `.toLowerCase();
  
  // 1. Antibody-Drug Conjugates (ADC)
  if (/\b(deruxtecan|vedotin|govitecan|soravtansine|t-dxd|t-dm1|belantamab|polatuzumab|datopotamab|patritumab|trastuzumab deruxtecan|sacituzumab|enfortumab|telisotuzumab|ifinatamab|tisotumab|brentuximab|trastuzumab emtansine|adc|conjugate)\b/i.test(text)) {
    return 'Antibody-Drug Conjugates (ADC)';
  }

  // 2. Bispecific Antibodies & T-Cell Engagers
  if (/\b(teclistamab|elranatamab|talquetamab|epcoritamab|glofitamab|mosunetuzumab|odronextamab|blinatumomab|tarlatamab|linvoseltamab|zanidatamab|ivonescimab|amivantamab|bispecific|bite|t-cell engager|tri-specific)\b/i.test(text)) {
    return 'Bispecific Antibodies & T-Cell Engagers';
  }

  // 3. Cell & Gene Therapy (CAR-T / TCR)
  if (/\b(ciloleucel|autoleucel|vicleucel|ciltacabtagene|idecabtagene|axicabtagene|lisocabtagene|tisagenlecleucel|brexucabtagene|car-t|tcr-t|chimeric antigen receptor)\b/i.test(text)) {
    return 'Cell & Gene Therapy (CAR-T)';
  }

  // 4. Immuno-Oncology Checkpoint Inhibitors
  if (/\b(pembrolizumab|nivolumab|atezolizumab|durvalumab|ipilimumab|cemiplimab|dostarlimab|relatlimab|tislelizumab|toripalimab|serplulimab|penpulimab|sintilimab|camrelizumab|envafolimab|balstilimab|botensilimab|pd-1|pd-l1|ctla-4|lag-3|checkpoint inhibitor)\b/i.test(text)) {
    return 'Immuno-Oncology (Checkpoint Inhibitor)';
  }

  // 5. Targeted Small Molecules, TKIs & Degraders
  if (/\b(osimertinib|sotorasib|adagrasib|abemaciclib|ribociclib|palbociclib|olaparib|talazoparib|niraparib|rucaparib|asciminib|imatinib|dasatinib|nilotinib|alectinib|brigatinib|lorlatinib|lazertinib|lenvatinib|cabozantinib|axitinib|sorafenib|sunitinib|gilteritinib|ivosidenib|enasidenib|revumenib|ziftomenib|bortezomib|carfilzomib|ixazomib|venetoclax|ibrutinib|acalabrutinib|zanubrutinib|pirtobrutinib|darolutamide|enzalutamide|apalutamide|abiraterone|elacestrant|capivasertib|fruquintinib|mobocertinib|repotrectinib|selpercatinib|pralsetinib|capmatinib|tepotinib|tucatinib|entrectinib|larotrectinib|tki|parp|cdk4\/6|kras|btk|flt3|protac)\b/i.test(text)) {
    return 'Targeted Small Molecules & Kinase Inhibitors (TKI/PROTAC)';
  }

  // 6. Targeted Monoclonal Antibodies (Naked / Anti-Angiogenic)
  if (/\b(daratumumab|isatuximab|rituximab|obinutuzumab|tafasitamab|cetuximab|panitumumab|bevacizumab|trastuzumab|pertuzumab|zolbetuximab|ramucirumab|dinutuximab|naxitamab|monoclonal antibody|mab)\b/i.test(text)) {
    return 'Targeted Monoclonal Antibodies';
  }

  // 7. Radioligand Therapies & Nuclear Medicine
  if (/\b(177lu|lutetium|pluvicto|lutathera|radioligand|psma-617|actinium|targeted alpha)\b/i.test(text)) {
    return 'Radioligand Therapy & Nuclear Medicine';
  }

  // 8. Therapeutic Cancer Vaccines & Oncolytic Viruses
  if (/\b(vaccine|mrna-|oncolytic|t-vec|talimogene)\b/i.test(text)) {
    return 'Therapeutic Cancer Vaccines & Oncolytics';
  }

  return 'Systemic Chemotherapy & Standard of Care Combos';
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`ClinSight 2020-2026 Phase 3 Oncology Expansion Engine`);
  console.log(`Pulling verified trials (StartDate >= 2020-01-01) from ClinicalTrials.gov API v2`);
  console.log(`Target: Build an offline Excel verification sheet for interval deployment`);
  console.log(`======================================================\n`);

  const trialMap = new Map();

  const queryTopics = [
    { query: 'Breast Cancer', name: 'Breast Cancer' },
    { query: 'Non-Small Cell Lung Cancer', name: 'Thoracic (NSCLC)' },
    { query: 'Small Cell Lung Cancer', name: 'Thoracic (SCLC)' },
    { query: 'Multiple Myeloma', name: 'Multiple Myeloma' },
    { query: 'Diffuse Large B-Cell Lymphoma', name: 'Lymphoma (DLBCL)' },
    { query: 'Follicular Lymphoma', name: 'Lymphoma (FL)' },
    { query: 'Acute Myeloid Leukemia', name: 'Leukemia (AML)' },
    { query: 'Chronic Lymphocytic Leukemia', name: 'Leukemia (CLL)' },
    { query: 'Prostate Cancer', name: 'Prostate Cancer' },
    { query: 'Urothelial Carcinoma', name: 'Urothelial Cancer' },
    { query: 'Renal Cell Carcinoma', name: 'Renal Cell Cancer' },
    { query: 'Colorectal Cancer', name: 'Colorectal Cancer' },
    { query: 'Gastric Cancer', name: 'Gastric/GEJ Cancer' },
    { query: 'Hepatocellular Carcinoma', name: 'Liver Cancer (HCC)' },
    { query: 'Pancreatic Adenocarcinoma', name: 'Pancreatic Cancer' },
    { query: 'Ovarian Cancer', name: 'Ovarian Cancer' },
    { query: 'Endometrial Cancer', name: 'Endometrial Cancer' },
    { query: 'Cervical Cancer', name: 'Cervical Cancer' },
    { query: 'Melanoma', name: 'Melanoma' }
  ];

  for (const topic of queryTopics) {
    const encodedCond = encodeURIComponent(topic.query);
    const filter = encodeURIComponent('AREA[Phase]PHASE3 AND AREA[StartDate]RANGE[2020-01-01,MAX]');
    const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodedCond}&filter.advanced=${filter}&pageSize=30`;
    
    console.log(`Fetching 2020-2026 Phase 3 trials for ${topic.name}...`);
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

        // Exclude purely non-drug / non-systemic
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

  console.log(`\nAggregated ${trialMap.size} distinct trials from 2020-2026.`);

  // Build CSV
  const csvHeaders = [
    'NCT ID',
    'Disease Category',
    'Specific Cancer Indication',
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
    const diseaseCat = classifyOncology(t.conditions, t.briefTitle, t.interventions);
    const modality = inferModalityDeep(t.interventions, t.briefTitle);
    const subType = (t.conditions || []).slice(0, 2).join('; ') || diseaseCat;

    categoryCounts[diseaseCat] = (categoryCounts[diseaseCat] || 0) + 1;
    modalityCounts[modality] = (modalityCounts[modality] || 0) + 1;

    const row = [
      escapeCsv(t.nctId),
      escapeCsv(diseaseCat),
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
  console.log(`Comprehensive 2020-2026 Verification Excel Sheet Generated!`);
  console.log(`Location: ${OUT_CSV}`);
  console.log(`Total Candidates: ${rows.length}`);
  console.log(`\nCategory Distribution:`);
  console.log(categoryCounts);
  console.log(`\nModality Distribution (Enriched):`);
  console.log(modalityCounts);
  console.log(`======================================================\n`);
}

run().catch(console.error);
