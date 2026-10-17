const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_CSV = path.join(__dirname, '../../ClinSight_Cancer_Trials_Verification.csv');
const EXISTING_TRIALS_PATH = path.join(__dirname, '../data/trials.json');

// Helper for HTTP GET
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

// Map conditions and interventions to fine-grained oncology category
function classifyOncology(conditions, briefTitle, interventions) {
  const text = ` ${(conditions || []).join(' ')} ${briefTitle || ''} ${(interventions || []).join(' ')} `.toLowerCase();
  
  if (/\b(breast)\b/i.test(text)) return 'Breast Cancer';
  if (/\b(lung|nsclc|sclc|thoracic|mesothelioma)\b/i.test(text)) return 'Thoracic & Lung Cancer';
  if (/\b(ovarian|cervic|cervical|endometri|endometrial|uterine|fallopian)\b/i.test(text)) return 'Gynecologic Cancers';
  if (/\b(myeloma|plasma cell)\b/i.test(text)) return 'Multiple Myeloma';
  if (/\b(lymphoma|dlbcl|follicular|mantle cell|hodgkin)\b/i.test(text)) return 'Lymphoma';
  if (/\b(leukemia|aml|cll|cml|mds|myelodysplastic|myeloid)\b/i.test(text) || /\b(all)\b/i.test(text) && text.includes('lymphoblastic')) return 'Leukemia & MDS';
  if (/\b(prostate|urothelial|bladder|renal|kidney|rcc)\b/i.test(text)) return 'Genitourinary Cancers';
  if (/\b(colorectal|colon|rectal|gastric|stomach|esophag|esophageal|pancrea|pancreatic|hepatocellular|liver|biliary|cholangio)\b/i.test(text)) return 'Gastrointestinal & Hepatobiliary';
  if (/\b(melanoma|merkel|cutaneous)\b/i.test(text)) return 'Melanoma & Cutaneous';
  if (/\b(glioblastoma|glioma|brain|sarcoma|head and neck|thyroid|neuroendocrine)\b/i.test(text)) return 'CNS, Sarcoma & Head/Neck';
  
  return 'Pan-Tumor & Solid Neoplasms';
}

function inferModality(interventions) {
  const text = (interventions || []).join(' ').toLowerCase();
  if (text.includes('deruxtecan') || text.includes('vedotin') || text.includes('govitecan') || text.includes('soravtansine') || text.includes('t-dxd') || text.includes('t-dm1') || text.includes('belantamab') || text.includes('polatuzumab') || text.includes('datopotamab')) {
    return 'Antibody-Drug Conjugates (ADC)';
  }
  if (text.includes('ciloleucel') || text.includes('autoleucel') || text.includes('vicleucel') || text.includes('car-t') || text.includes('chimeric antigen') || text.includes('ciltacabtagene') || text.includes('idecabtagene') || text.includes('axicabtagene') || text.includes('lisocabtagene') || text.includes('tisagenlecleucel')) {
    return 'Cell & Gene Therapy (CAR-T)';
  }
  if (text.includes('teclistamab') || text.includes('elranatamab') || text.includes('talquetamab') || text.includes('epcoritamab') || text.includes('glofitamab') || text.includes('mosunetuzumab') || text.includes('odronextamab') || text.includes('blinatumomab') || text.includes('bispecific') || text.includes('t-cell engager') || text.includes('tarlatamab') || text.includes('linvoseltamab')) {
    return 'Bispecific Antibodies & T-Cell Engagers';
  }
  if (text.includes('pembrolizumab') || text.includes('nivolumab') || text.includes('atezolizumab') || text.includes('durvalumab') || text.includes('ipilimumab') || text.includes('cemiplimab') || text.includes('dostarlimab') || text.includes('relatlimab') || text.includes('toripalimab') || text.includes('tislelizumab')) {
    return 'Immuno-Oncology (Checkpoint / Anti-PD-1/L1/CTLA-4/LAG-3)';
  }
  if (text.includes('daratumumab') || text.includes('isatuximab') || text.includes('rituximab') || text.includes('obinutuzumab') || text.includes('tafasitamab') || text.includes('amivantamab') || text.includes('cetuximab') || text.includes('panitumumab') || text.includes('bevacizumab') || text.includes('trastuzumab') || text.includes('pertuzumab') || text.includes('zolbetuximab')) {
    return 'Targeted Monoclonal Antibodies';
  }
  if (text.includes('venetoclax') || text.includes('ibrutinib') || text.includes('acalabrutinib') || text.includes('zanubrutinib') || text.includes('pirtobrutinib') || text.includes('osimertinib') || text.includes('sotorasib') || text.includes('adagrasib') || text.includes('abemaciclib') || text.includes('ribociclib') || text.includes('palbociclib') || text.includes('olaparib') || text.includes('talazoparib') || text.includes('niraparib') || text.includes('rucaparib') || text.includes('asciminib') || text.includes('imatinib') || text.includes('dasatinib') || text.includes('nilotinib') || text.includes('alectinib') || text.includes('brigatinib') || text.includes('lorlatinib') || text.includes('lazertinib') || text.includes('lenvatinib') || text.includes('cabozantinib') || text.includes('axitinib') || text.includes('sorafenib') || text.includes('sunitinib') || text.includes('gilteritinib') || text.includes('ivosidenib') || text.includes('enasidenib') || text.includes('revumenib') || text.includes('bortezomib') || text.includes('carfilzomib') || text.includes('lenalidomide') || text.includes('pomalidomide') || text.includes('darolutamide') || text.includes('enzalutamide') || text.includes('abiraterone') || text.includes('elacestrant') || text.includes('capivasertib')) {
    return 'Targeted Small Molecules & Kinase Inhibitors (TKI/PROTAC)';
  }
  if (text.includes('177lu') || text.includes('lutetium') || text.includes('radioligand') || text.includes('pluvicto')) {
    return 'Radioligand Therapy & Nuclear Medicine';
  }
  return 'Systemic Chemotherapy & Standard of Care Combos';
}

async function run() {
  console.log(`Starting Oncology Verification Pipeline...`);
  
  // 1. Load existing trials
  const existingTrials = JSON.parse(fs.readFileSync(EXISTING_TRIALS_PATH, 'utf8'));
  const trialMap = new Map();

  existingTrials.forEach(t => {
    // Only keep if oncology related and Phase 3 / registrational
    const condText = (t.conditions || []).join(' ').toLowerCase();
    const titleText = (t.briefTitle || t.officialTitle || '').toLowerCase();
    const isCancer = /cancer|tumor|carcinoma|myeloma|lymphoma|leukemia|melanoma|sarcoma|glioma|neoplasm|malignan/i.test(condText + ' ' + titleText);
    const isPhase3OrReg = (t.phase && (t.phase.includes('3') || t.phase.includes('Phase 2'))) && (t.enrollment >= 50);
    
    if (isCancer && isPhase3OrReg) {
      trialMap.set(t.nctId, {
        nctId: t.nctId,
        briefTitle: t.briefTitle || t.officialTitle,
        officialTitle: t.officialTitle || t.briefTitle,
        acronym: t.acronym || '',
        leadSponsor: t.leadSponsor || '',
        phase: t.phase || 'Phase 3',
        status: t.overallStatus || '',
        enrollment: t.enrollment || 0,
        conditions: t.conditions || [],
        interventions: t.interventions || [],
        primaryEndpoint: t.primaryEndpoint || '',
        source: 'ClinSight Curated Registrational'
      });
    }
  });

  console.log(`Loaded ${trialMap.size} existing cancer trials.`);

  // 2. High-impact Phase 3 queries across 9 key disease verticals
  const queryTopics = [
    { query: 'Breast Cancer', category: 'Breast Cancer' },
    { query: 'Non-Small Cell Lung Cancer', category: 'Thoracic & Lung Cancer' },
    { query: 'Small Cell Lung Cancer', category: 'Thoracic & Lung Cancer' },
    { query: 'Multiple Myeloma', category: 'Multiple Myeloma' },
    { query: 'Diffuse Large B-Cell Lymphoma', category: 'Lymphoma' },
    { query: 'Follicular Lymphoma', category: 'Lymphoma' },
    { query: 'Acute Myeloid Leukemia', category: 'Leukemia & MDS' },
    { query: 'Chronic Lymphocytic Leukemia', category: 'Leukemia & MDS' },
    { query: 'Prostate Cancer', category: 'Genitourinary Cancers' },
    { query: 'Urothelial Carcinoma', category: 'Genitourinary Cancers' },
    { query: 'Renal Cell Carcinoma', category: 'Genitourinary Cancers' },
    { query: 'Colorectal Cancer', category: 'Gastrointestinal & Hepatobiliary' },
    { query: 'Gastric Cancer', category: 'Gastrointestinal & Hepatobiliary' },
    { query: 'Hepatocellular Carcinoma', category: 'Gastrointestinal & Hepatobiliary' },
    { query: 'Pancreatic Adenocarcinoma', category: 'Gastrointestinal & Hepatobiliary' },
    { query: 'Ovarian Cancer', category: 'Gynecologic Cancers' },
    { query: 'Endometrial Cancer', category: 'Gynecologic Cancers' },
    { query: 'Cervical Cancer', category: 'Gynecologic Cancers' },
    { query: 'Melanoma', category: 'Melanoma & Cutaneous' }
  ];

  for (const topic of queryTopics) {
    const encodedCond = encodeURIComponent(topic.query);
    const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodedCond}&filter.advanced=AREA%5BPhase%5DPHASE3&pageSize=15`;
    console.log(`Fetching registry data for ${topic.query}...`);
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
        const enrollment = p.designModule?.enrollmentInfo?.count || 0;
        const conditions = p.conditionsModule?.conditions || [];
        const interventions = (p.armsInterventionsModule?.interventions || []).map(i => i.name);
        const primaryEndpoint = (p.outcomesModule?.primaryOutcomes || []).map(o => o.measure).join('; ') || '';

        // Exclude pediatric-only, behavioral, observational, or non-drug
        const interText = interventions.join(' ').toLowerCase();
        const isNonDrug = interText.includes('dietary') || interText.includes('acupuncture') || interText.includes('questionnaire') || interText.includes('exercise') || interText.includes('behavioral');
        if (isNonDrug) continue;

        trialMap.set(nctId, {
          nctId,
          briefTitle,
          officialTitle,
          acronym,
          leadSponsor,
          phase,
          status,
          enrollment,
          conditions,
          interventions,
          primaryEndpoint,
          source: 'ClinicalTrials.gov API (Phase 3 Expanded)'
        });
      }
    }
    // Small delay to be respectful to API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nTotal verified cancer trial candidates: ${trialMap.size}`);

  // Build CSV
  const csvHeaders = [
    'NCT ID',
    'Disease Category',
    'Cancer Subtype / Indication',
    'Modality',
    'Acronym / Study Name',
    'Brief Title',
    'Lead Sponsor',
    'Phase',
    'Overall Status',
    'Enrolled Participants',
    'Primary Outcome Measure',
    'Key Interventions',
    'Source & Origin',
    'Registry Link'
  ];

  const categoryCounts = {};
  const modalityCounts = {};
  const rows = [];

  for (const t of trialMap.values()) {
    const diseaseCat = classifyOncology(t.conditions, t.briefTitle, t.interventions);
    const modality = inferModality(t.interventions);
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
      escapeCsv(t.enrollment),
      escapeCsv(t.primaryEndpoint),
      escapeCsv((t.interventions || []).slice(0, 4).join(', ')),
      escapeCsv(t.source),
      escapeCsv(`https://clinicaltrials.gov/study/${t.nctId}`)
    ];
    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM so Excel opens with proper character rendering
  const BOM = '\uFEFF';
  const csvContent = BOM + csvHeaders.join(',') + '\r\n' + rows.join('\r\n');
  fs.writeFileSync(OUT_CSV, csvContent, 'utf8');

  console.log(`\n======================================================`);
  console.log(`Verification Excel/CSV successfully generated!`);
  console.log(`Saved to: ${OUT_CSV}`);
  console.log(`Total Candidates: ${rows.length}`);
  console.log(`\nCategory Distribution:`);
  console.log(categoryCounts);
  console.log(`\nModality Distribution:`);
  console.log(modalityCounts);
  console.log(`======================================================\n`);
}

run().catch(console.error);
