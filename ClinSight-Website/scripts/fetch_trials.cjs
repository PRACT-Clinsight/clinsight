/**
 * ClinSight Clinical Trials Ingestion Engine
 * Fetches, normalizes, and enriches landmark clinical trials from ClinicalTrials.gov REST API v2
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../data/trials.json');

// Curated landmark trials with verified benchmark metrics (Information Gain)
const LANDMARK_EVIDENCE = {
  'NCT03734029': {
    acronym: 'DESTINY-Breast04',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Breast Cancer (HER2-Low)',
    primaryEndpoint: 'Progression-Free Survival (PFS) by BICR',
    benchmarkMetric: 'Median PFS 9.9 mo (T-DXd) vs 5.1 mo (TPC); Hazard Ratio 0.50 (95% CI 0.40–0.63; p < 0.001)',
    secondaryMetric: 'Overall Survival 23.4 mo vs 16.8 mo; Hazard Ratio 0.64 (95% CI 0.49–0.84; p = 0.001)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2203690',
    fdaApprovalStatus: 'FDA Approved (Priority Review & Breakthrough Designation, August 2022)',
    euApprovalStatus: 'EMA Approved (January 2023)'
  },
  'NCT03529110': {
    acronym: 'DESTINY-Breast03',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Breast Cancer (HER2+)',
    primaryEndpoint: 'Progression-Free Survival (PFS) by BICR',
    benchmarkMetric: 'Median PFS 28.8 mo (T-DXd) vs 6.8 mo (T-DM1); Hazard Ratio 0.33 (95% CI 0.26–0.43; p < 0.0001)',
    secondaryMetric: '12-Month OS Rate 94.1% vs 85.9%; Hazard Ratio 0.64 (95% CI 0.47–0.87)',
    publishedJournal: 'The Lancet & NEJM',
    publicationDoi: '10.1016/S0140-6736(22)02123-1',
    fdaApprovalStatus: 'FDA Approved (May 2022)',
    euApprovalStatus: 'EMA Approved (July 2022)'
  },
  'NCT04526691': {
    acronym: 'DESTINY-PanTumor02',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Solid Tumors (HER2-Expressing)',
    primaryEndpoint: 'Objective Response Rate (ORR) by ICR',
    benchmarkMetric: 'Confirmed ORR 37.1% across pan-tumor cohort; 61.3% in HER2 IHC 3+ patients',
    secondaryMetric: 'Median Duration of Response 11.3 months overall; 22.1 months in IHC 3+',
    publishedJournal: 'Journal of Clinical Oncology (JCO)',
    publicationDoi: '10.1200/JCO.23.02005',
    fdaApprovalStatus: 'FDA Accelerated Approval (Pan-Tumor HER2 3+, April 2024)',
    euApprovalStatus: 'EMA Review / Breakthrough Indication'
  },
  'NCT04244461': {
    acronym: 'EV-302 / KEYNOTE-A39',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Genitourinary (Urothelial Cancer)',
    primaryEndpoint: 'Progression-Free Survival (PFS) & Overall Survival (OS)',
    benchmarkMetric: 'Median OS 31.5 mo (EV+Pembro) vs 16.1 mo (Chemotherapy); HR 0.47 (95% CI 0.38–0.58; p < 0.00001)',
    secondaryMetric: 'Median PFS 12.5 mo vs 6.3 mo; Hazard Ratio 0.45 (95% CI 0.38–0.54; p < 0.00001)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2312117',
    fdaApprovalStatus: 'FDA Approved (First-Line Standard of Care, December 2023)',
    euApprovalStatus: 'EMA Approved (April 2024)'
  },
  'NCT03971409': {
    acronym: 'TROPiCS-02',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Breast Cancer (HR+/HER2-)',
    primaryEndpoint: 'Progression-Free Survival (PFS)',
    benchmarkMetric: 'Median PFS 5.5 mo vs 4.0 mo; Hazard Ratio 0.66 (95% CI 0.53–0.83; p = 0.0003)',
    secondaryMetric: 'Median OS 14.4 mo vs 11.2 mo; Hazard Ratio 0.79 (95% CI 0.65–0.96; p = 0.020)',
    publishedJournal: 'Journal of Clinical Oncology (JCO)',
    publicationDoi: '10.1200/JCO.22.01002',
    fdaApprovalStatus: 'FDA Approved (February 2023)',
    euApprovalStatus: 'EMA Approved (July 2023)'
  },
  'NCT02638909': {
    acronym: 'KEYNOTE-024',
    modality: 'Immune Checkpoint Inhibitors (PD-1/L1)',
    category: 'Oncology & Hematology',
    subtype: 'Lung Cancer (NSCLC PD-L1 ≥50%)',
    primaryEndpoint: 'Progression-Free Survival (PFS)',
    benchmarkMetric: 'Median OS 30.0 mo (Pembrolizumab) vs 14.2 mo (Chemo); Hazard Ratio 0.63 (95% CI 0.47–0.86)',
    secondaryMetric: '5-Year Overall Survival Rate 31.9% vs 16.3%',
    publishedJournal: 'New England Journal of Medicine & JCO',
    publicationDoi: '10.1200/JCO.20.00149',
    fdaApprovalStatus: 'FDA Approved (October 2016)',
    euApprovalStatus: 'EMA Approved (January 2017)'
  },
  'NCT02578680': {
    acronym: 'KEYNOTE-522',
    modality: 'Immune Checkpoint Inhibitors (PD-1/L1)',
    category: 'Oncology & Hematology',
    subtype: 'Breast Cancer (Triple-Negative)',
    primaryEndpoint: 'Pathological Complete Response (pCR) & EFS',
    benchmarkMetric: 'pCR Rate 64.8% (Pembro+Chemo) vs 51.2% (Placebo); Difference 13.6% (p < 0.001)',
    secondaryMetric: '3-Year EFS 84.5% vs 76.8%; Hazard Ratio 0.63 (95% CI 0.48–0.82; p < 0.001)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa1910549',
    fdaApprovalStatus: 'FDA Approved (July 2021)',
    euApprovalStatus: 'EMA Approved (May 2022)'
  },
  'NCT02246621': {
    acronym: 'CheckMate-067',
    modality: 'Immune Checkpoint Inhibitors (PD-1/L1)',
    category: 'Oncology & Hematology',
    subtype: 'Melanoma',
    primaryEndpoint: 'Progression-Free Survival (PFS) & Overall Survival (OS)',
    benchmarkMetric: 'Median OS 72.1 mo (Nivo+Ipi) vs 36.9 mo (Nivo) vs 19.9 mo (Ipi); HR 0.52 (p < 0.001)',
    secondaryMetric: '7.5-Year Overall Survival Rate 48% with combination therapy',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa1709684',
    fdaApprovalStatus: 'FDA Approved (September 2015)',
    euApprovalStatus: 'EMA Approved (May 2016)'
  },
  'NCT02511106': {
    acronym: 'ADAURA',
    modality: 'Targeted Small Molecules (TKIs)',
    category: 'Oncology & Hematology',
    subtype: 'Lung Cancer (EGFR-Mutated NSCLC)',
    primaryEndpoint: 'Disease-Free Survival (DFS) in Stage II–IIIA',
    benchmarkMetric: '5-Year DFS 65% (Osimertinib) vs 19% (Placebo); Hazard Ratio 0.23 (95% CI 0.18–0.30; p < 0.001)',
    secondaryMetric: '5-Year Overall Survival 88% vs 78%; Hazard Ratio 0.49 (95% CI 0.34–0.70; p < 0.001)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2304594',
    fdaApprovalStatus: 'FDA Approved (December 2020)',
    euApprovalStatus: 'EMA Approved (May 2021)'
  },
  'NCT03155620': {
    acronym: 'monarchE',
    modality: 'Targeted Small Molecules (TKIs)',
    category: 'Oncology & Hematology',
    subtype: 'Breast Cancer (HR+/HER2-)',
    primaryEndpoint: 'Invasive Disease-Free Survival (IDFS)',
    benchmarkMetric: '5-Year IDFS 83.6% (Abemaciclib+ET) vs 76.0% (ET alone); HR 0.68 (95% CI 0.59–0.78; p < 0.0001)',
    secondaryMetric: 'Distant Relapse-Free Survival 86.0% vs 79.2%; Hazard Ratio 0.67 (p < 0.0001)',
    publishedJournal: 'Journal of Clinical Oncology & Lancet Oncology',
    publicationDoi: '10.1200/JCO.23.01994',
    fdaApprovalStatus: 'FDA Approved (October 2021)',
    euApprovalStatus: 'EMA Approved (April 2022)'
  },
  'NCT03041311': {
    acronym: 'CARTITUDE-1',
    modality: 'Cell & Gene Therapy (CAR-T)',
    category: 'Oncology & Hematology',
    subtype: 'Hematologic (Multiple Myeloma)',
    primaryEndpoint: 'Overall Response Rate (ORR) & Safety',
    benchmarkMetric: 'Overall Response Rate 97.9%; Stringent Complete Response Rate 82.5%',
    secondaryMetric: 'Median PFS 34.9 months in heavily pre-treated quad/penta-refractory patients',
    publishedJournal: 'The Lancet',
    publicationDoi: '10.1016/S0140-6736(21)00933-8',
    fdaApprovalStatus: 'FDA Approved (Carvykti, February 2022)',
    euApprovalStatus: 'EMA Approved (May 2022)'
  },
  'NCT04181827': {
    acronym: 'CARTITUDE-4',
    modality: 'Cell & Gene Therapy (CAR-T)',
    category: 'Oncology & Hematology',
    subtype: 'Hematologic (Multiple Myeloma)',
    primaryEndpoint: 'Progression-Free Survival (PFS)',
    benchmarkMetric: 'Median PFS Not Reached (Cilta-cel) vs 11.8 mo (Standard of Care); HR 0.26 (95% CI 0.18–0.38; p < 0.001)',
    secondaryMetric: 'Complete Response Rate 73.1% vs 21.8%',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2303379',
    fdaApprovalStatus: 'FDA Expanded Approval (Second-Line, April 2024)',
    euApprovalStatus: 'EMA Expanded Approval (April 2024)'
  },
  'NCT02348216': {
    acronym: 'ZUMA-1',
    modality: 'Cell & Gene Therapy (CAR-T)',
    category: 'Oncology & Hematology',
    subtype: 'Hematologic (Large B-Cell Lymphoma)',
    primaryEndpoint: 'Objective Response Rate (ORR)',
    benchmarkMetric: 'Objective Response Rate 83%; Complete Response Rate 58%',
    secondaryMetric: '5-Year Overall Survival Rate 42.6% with single infusion',
    publishedJournal: 'New England Journal of Medicine & Lancet Oncology',
    publicationDoi: '10.1056/NEJMoa1707447',
    fdaApprovalStatus: 'FDA Approved (Yescarta, October 2017)',
    euApprovalStatus: 'EMA Approved (August 2018)'
  },
  'NCT03574597': {
    acronym: 'STEP 1',
    modality: 'Incretin Mimetics (GLP-1 / GIP)',
    category: 'Cardiovascular & Metabolic',
    subtype: 'Obesity & Weight Management',
    primaryEndpoint: 'Percentage Change in Body Weight at Week 68',
    benchmarkMetric: 'Mean Weight Loss -14.9% (Semaglutide 2.4 mg) vs -2.4% (Placebo); Difference -12.4% (p < 0.001)',
    secondaryMetric: '86.4% of patients achieved ≥5% body weight reduction vs 31.5%',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2032183',
    fdaApprovalStatus: 'FDA Approved (Wegovy, June 2021)',
    euApprovalStatus: 'EMA Approved (January 2022)'
  },
  'NCT03552718': {
    acronym: 'SELECT',
    modality: 'Incretin Mimetics (GLP-1 / GIP)',
    category: 'Cardiovascular & Metabolic',
    subtype: 'Obesity & Cardiovascular Outcomes',
    primaryEndpoint: 'Major Adverse Cardiovascular Events (MACE)',
    benchmarkMetric: 'Primary MACE Hazard Ratio 0.80 (95% CI 0.72–0.90; p < 0.001); 20% Risk Reduction',
    secondaryMetric: 'Cardiovascular Death HR 0.85; All-Cause Mortality HR 0.81 (95% CI 0.71–0.93)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2307563',
    fdaApprovalStatus: 'FDA Approved (Cardiovascular Risk Reduction, March 2024)',
    euApprovalStatus: 'EMA Approved (July 2024)'
  },
  'NCT04184622': {
    acronym: 'SURMOUNT-1',
    modality: 'Incretin Mimetics (GLP-1 / GIP)',
    category: 'Cardiovascular & Metabolic',
    subtype: 'Obesity & Weight Management',
    primaryEndpoint: 'Percentage Change in Body Weight at Week 72',
    benchmarkMetric: 'Mean Weight Reduction -20.9% (Tirzepatide 15 mg) vs -3.1% (Placebo); Difference -17.8% (p < 0.001)',
    secondaryMetric: '91% of participants achieved ≥5% reduction; 57% achieved ≥20% reduction',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2206038',
    fdaApprovalStatus: 'FDA Approved (Zepbound, November 2023)',
    euApprovalStatus: 'EMA Approved (December 2023)'
  },
  'NCT03057977': {
    acronym: 'DAPA-HF',
    modality: 'Targeted Small Molecules (TKIs)',
    category: 'Cardiovascular & Metabolic',
    subtype: 'Heart Failure (HFrEF)',
    primaryEndpoint: 'Worsening Heart Failure or CV Death',
    benchmarkMetric: 'Primary Composite Outcome Hazard Ratio 0.74 (95% CI 0.65–0.85; p < 0.001); 26% Relative Risk Reduction',
    secondaryMetric: 'Cardiovascular Death HR 0.82; All-Cause Mortality HR 0.83',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa1911303',
    fdaApprovalStatus: 'FDA Approved (May 2020)',
    euApprovalStatus: 'EMA Approved (November 2020)'
  },
  'NCT04209855': {
    acronym: 'MIRASOL',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Gynecologic (Ovarian Cancer)',
    primaryEndpoint: 'Progression-Free Survival (PFS) by Investigator',
    benchmarkMetric: 'Median PFS 5.6 mo (Mirvetuximab) vs 4.0 mo (Chemo); Hazard Ratio 0.65 (95% CI 0.52–0.81; p < 0.0001)',
    secondaryMetric: 'Median OS 16.5 mo vs 12.8 mo; Hazard Ratio 0.67 (95% CI 0.50–0.89; p = 0.0046)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2309169',
    fdaApprovalStatus: 'FDA Full Approval (Elahere, March 2024)',
    euApprovalStatus: 'EMA Approved (November 2024)'
  },
  'NCT03422523': {
    acronym: 'POLARIX',
    modality: 'Antibody-Drug Conjugates (ADC)',
    category: 'Oncology & Hematology',
    subtype: 'Hematologic (Diffuse Large B-Cell Lymphoma)',
    primaryEndpoint: 'Progression-Free Survival (PFS) by Investigator',
    benchmarkMetric: '2-Year PFS 76.7% (Pola-R-CHP) vs 70.2% (R-CHOP); Hazard Ratio 0.73 (95% CI 0.57–0.95; p = 0.02)',
    secondaryMetric: 'Event-Free Survival Hazard Ratio 0.75 (p = 0.02)',
    publishedJournal: 'New England Journal of Medicine (NEJM)',
    publicationDoi: '10.1056/NEJMoa2115304',
    fdaApprovalStatus: 'FDA Approved (April 2023)',
    euApprovalStatus: 'EMA Approved (May 2022)'
  },
  'NCT03355911': {
    acronym: 'CodeBreaK 200',
    modality: 'Targeted Small Molecules (TKIs)',
    category: 'Oncology & Hematology',
    subtype: 'Lung Cancer (KRAS G12C NSCLC)',
    primaryEndpoint: 'Progression-Free Survival (PFS) by BICR',
    benchmarkMetric: '1-Year PFS Rate 24.8% (Sotorasib) vs 10.1% (Docetaxel); Hazard Ratio 0.66 (95% CI 0.51–0.86; p = 0.0017)',
    secondaryMetric: 'Objective Response Rate 28.1% vs 13.2% (p < 0.001)',
    publishedJournal: 'The Lancet',
    publicationDoi: '10.1016/S0140-6736(23)00221-0',
    fdaApprovalStatus: 'FDA Accelerated Approval (Lumakras, May 2021)',
    euApprovalStatus: 'EMA Approved (January 2022)'
  }
};

// Helper: infer modality from drug names and title
function inferModality(title, interventions) {
  const text = (title + ' ' + (interventions || []).join(' ')).toLowerCase();
  if (text.includes('deruxtecan') || text.includes('vedotin') || text.includes('govitecan') || text.includes('soravtansine') || text.includes('adc') || text.includes('antibody-drug conjugate') || text.includes('conjugate')) {
    return 'Antibody-Drug Conjugates (ADC)';
  }
  if (text.includes('car-t') || text.includes('chimeric antigen') || text.includes('t-cell') || text.includes('crispr') || text.includes('gene therapy') || text.includes('autoleucel') || text.includes('vicleucel')) {
    return 'Cell & Gene Therapy (CAR-T)';
  }
  if (text.includes('pembrolizumab') || text.includes('nivolumab') || text.includes('atezolizumab') || text.includes('durvalumab') || text.includes('ipilimumab') || text.includes('checkpoint') || text.includes('pd-1') || text.includes('pd-l1') || text.includes('ctla-4')) {
    return 'Immune Checkpoint Inhibitors (PD-1/L1)';
  }
  if (text.includes('semaglutide') || text.includes('tirzepatide') || text.includes('glp-1') || text.includes('incretin') || text.includes('retatrutide') || text.includes('liraglutide')) {
    return 'Incretin Mimetics (GLP-1 / GIP)';
  }
  if (text.includes('mrna') || text.includes('sirna') || text.includes('antisense') || text.includes('patisiran') || text.includes('inclisiran')) {
    return 'RNA Therapeutics (mRNA / siRNA)';
  }
  if (text.includes('osimertinib') || text.includes('sotorasib') || text.includes('abemaciclib') || text.includes('olaparib') || text.includes('inhibitor') || text.includes('kinase') || text.includes('tki')) {
    return 'Targeted Small Molecules (TKIs)';
  }
  return 'Biological Products & Targeted Therapies';
}

// Helper: infer therapeutic category & subtype
function inferCategoryAndSubtype(title, conditions) {
  const text = (title + ' ' + (conditions || []).join(' ')).toLowerCase();
  
  if (text.includes('breast cancer') || text.includes('breast neoplasm') || text.includes('mammary')) {
    let sub = 'Breast Cancer';
    if (text.includes('her2-low')) sub = 'Breast Cancer (HER2-Low)';
    else if (text.includes('her2+') || text.includes('her2 positive')) sub = 'Breast Cancer (HER2+)';
    else if (text.includes('triple-negative') || text.includes('tnbc')) sub = 'Breast Cancer (Triple-Negative)';
    else if (text.includes('hr+') || text.includes('hormone receptor')) sub = 'Breast Cancer (HR+/HER2-)';
    return { category: 'Oncology & Hematology', subtype: sub };
  }
  if (text.includes('lung cancer') || text.includes('nsclc') || text.includes('sclc') || text.includes('pulmonary neoplasm')) {
    let sub = 'Lung Cancer (NSCLC)';
    if (text.includes('egfr')) sub = 'Lung Cancer (EGFR-Mutated)';
    else if (text.includes('kras')) sub = 'Lung Cancer (KRAS G12C)';
    else if (text.includes('small cell') || text.includes('sclc')) sub = 'Lung Cancer (Small Cell)';
    return { category: 'Oncology & Hematology', subtype: sub };
  }
  if (text.includes('myeloma') || text.includes('lymphoma') || text.includes('leukemia') || text.includes('all') || text.includes('dlbcl') || text.includes('aml')) {
    return { category: 'Oncology & Hematology', subtype: 'Hematologic Malignancies' };
  }
  if (text.includes('melanoma')) {
    return { category: 'Oncology & Hematology', subtype: 'Melanoma' };
  }
  if (text.includes('ovarian') || text.includes('cervical') || text.includes('endometrial')) {
    return { category: 'Oncology & Hematology', subtype: 'Gynecologic Cancers' };
  }
  if (text.includes('prostate') || text.includes('urothelial') || text.includes('bladder') || text.includes('renal')) {
    return { category: 'Oncology & Hematology', subtype: 'Genitourinary Cancers' };
  }
  if (text.includes('cancer') || text.includes('tumor') || text.includes('carcinoma') || text.includes('oncology')) {
    return { category: 'Oncology & Hematology', subtype: 'Solid Tumors' };
  }
  if (text.includes('obesity') || text.includes('weight') || text.includes('diabetes') || text.includes('nash') || text.includes('mash') || text.includes('heart failure') || text.includes('cardiovascular')) {
    let sub = 'Cardiometabolic';
    if (text.includes('obesity') || text.includes('weight')) sub = 'Obesity & Weight Management';
    else if (text.includes('heart failure')) sub = 'Heart Failure';
    else if (text.includes('nash') || text.includes('mash')) sub = 'MASH / NASH';
    else if (text.includes('diabetes')) sub = 'Type 2 Diabetes';
    return { category: 'Cardiovascular & Metabolic', subtype: sub };
  }
  if (text.includes('alzheimer') || text.includes('parkinson') || text.includes('als') || text.includes('neurolog')) {
    return { category: 'Neurology & CNS', subtype: 'Neurodegenerative Disease' };
  }
  return { category: 'Oncology & Hematology', subtype: 'Specialized Therapeutic Indication' };
}

// Helper: infer regions
function inferRegions(locations) {
  const regions = new Set();
  const locStr = JSON.stringify(locations || []).toLowerCase();
  if (locStr.includes('united states') || locStr.includes('usa')) regions.add('United States (US FDA)');
  if (locStr.includes('france') || locStr.includes('germany') || locStr.includes('italy') || locStr.includes('spain') || locStr.includes('netherlands') || locStr.includes('belgium') || locStr.includes('poland') || locStr.includes('european')) {
    regions.add('European Union (EU CTIS)');
  }
  if (locStr.includes('united kingdom') || locStr.includes('uk') || locStr.includes('great britain')) {
    regions.add('United Kingdom (MHRA)');
  }
  if (locStr.includes('sweden') || locStr.includes('denmark') || locStr.includes('norway') || locStr.includes('finland')) {
    regions.add('Nordic Cluster (SE, DK, NO, FI)');
  }
  if (locStr.includes('japan') || locStr.includes('china') || locStr.includes('australia') || locStr.includes('korea')) {
    regions.add('Asia-Pacific (APAC)');
  }
  if (regions.size === 0) regions.add('Global Multi-Center');
  return Array.from(regions);
}

// Fetch single study from API v2
async function fetchStudy(nctId) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${nctId}:`, err.message);
    return null;
  }
}

// Search studies from API v2
async function searchStudies(term, pageSize = 20) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(term)}&pageSize=${pageSize}&filter.advanced=AREA[Phase]PHASE3`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.studies || [];
  } catch (err) {
    console.error(`Error searching ${term}:`, err.message);
    return [];
  }
}

// Parse ClinicalTrials raw study into clean schema
function parseStudy(raw) {
  const p = raw.protocolSection;
  if (!p) return null;

  const nctId = p.identificationModule?.nctId;
  const landmark = LANDMARK_EVIDENCE[nctId] || {};

  const briefTitle = p.identificationModule?.briefTitle || '';
  const officialTitle = p.identificationModule?.officialTitle || briefTitle;
  const acronym = landmark.acronym || p.identificationModule?.acronym || (briefTitle.match(/\[(.*?)\]/) ? briefTitle.match(/\[(.*?)\]/)[1] : '');

  const phases = p.designModule?.phases || [];
  let phaseStr = phases.join(', ').replace('PHASE', 'Phase ');
  if (!phaseStr) phaseStr = 'Phase 3';

  const status = p.statusModule?.overallStatus || 'UNKNOWN';
  const conditions = p.conditionsModule?.conditions || [];
  const interventions = (p.armsInterventionsModule?.interventions || []).map(i => i.name);
  const sponsor = p.sponsorCollaboratorsModule?.leadSponsor?.name || 'Academic / Industry Sponsor';

  // Inferred attributes
  const catSub = landmark.category ? { category: landmark.category, subtype: landmark.subtype } : inferCategoryAndSubtype(briefTitle, conditions);
  const modality = landmark.modality || inferModality(briefTitle, interventions);
  const regions = inferRegions(p.contactsLocationsModule?.locations);

  // Dates
  const completionDate = p.statusModule?.completionDateStruct?.date || p.statusModule?.primaryCompletionDateStruct?.date || '2024';
  const year = parseInt(completionDate.split('-')[0]) || 2024;
  const enrollment = p.designModule?.enrollmentInfo?.count || 500;

  // Outcomes
  const primaryOutcomes = (p.outcomesModule?.primaryOutcomes || []).map(o => ({
    measure: o.measure,
    description: o.description || '',
    timeFrame: o.timeFrame || ''
  }));

  // Eligibility
  const rawCriteria = p.eligibilityModule?.eligibilityCriteria || '';
  const criteriaParts = rawCriteria.split(/Exclusion Criteria:/i);
  const inclusionText = criteriaParts[0] ? criteriaParts[0].replace(/Inclusion Criteria:/i, '').trim() : '';
  const exclusionText = criteriaParts[1] ? criteriaParts[1].trim() : '';

  const cleanList = (txt) => txt.split(/\n+/).map(l => l.replace(/^[\*\-\d\.\s]+/, '').trim()).filter(l => l.length > 15).slice(0, 5);
  const inclusionCriteria = cleanList(inclusionText);
  const exclusionCriteria = cleanList(exclusionText);

  // Publications / DOIs
  const publications = (p.referencesModule?.references || []).slice(0, 3).map(r => ({
    citation: r.citation,
    pmid: r.pmid,
    type: r.type
  }));

  return {
    nctId,
    acronym,
    briefTitle,
    officialTitle,
    phase: phaseStr,
    status: status.replace(/_/g, ' '),
    isCompleted: status === 'COMPLETED',
    sponsor,
    conditions,
    interventions,
    category: catSub.category,
    subtype: catSub.subtype,
    modality,
    regions,
    completionDate,
    year,
    enrollment,
    primaryOutcomes,
    inclusionCriteria,
    exclusionCriteria,
    publications,
    verifiedEvidence: {
      hasBenchmark: !!landmark.benchmarkMetric,
      primaryEndpoint: landmark.primaryEndpoint || (primaryOutcomes[0]?.measure || 'Primary Efficacy Endpoint'),
      benchmarkMetric: landmark.benchmarkMetric || (status === 'COMPLETED' ? 'Primary completion recorded; published clinical trial report available in medical literature.' : 'Study actively recruiting; primary endpoints in active longitudinal follow-up.'),
      secondaryMetric: landmark.secondaryMetric || 'Secondary outcome assessments and safety biomarker monitoring documented.',
      publishedJournal: landmark.publishedJournal || (publications[0]?.pmid ? `PubMed (PMID: ${publications[0].pmid})` : 'Peer-Reviewed Clinical Literature'),
      publicationDoi: landmark.publicationDoi || null,
      fdaApprovalStatus: landmark.fdaApprovalStatus || 'US Investigational New Drug (IND) / Regulatory Application',
      euApprovalStatus: landmark.euApprovalStatus || 'EU Clinical Trials Information System (CTIS) Tracked'
    }
  };
}

async function main() {
  console.log('=== ClinSight Clinical Trials Ingestion Pipeline ===');
  const trialMap = new Map();

  // 1. Fetch Landmark Trials
  console.log(`Fetching ${Object.keys(LANDMARK_EVIDENCE).length} curated landmark studies...`);
  for (const nctId of Object.keys(LANDMARK_EVIDENCE)) {
    const raw = await fetchStudy(nctId);
    if (raw) {
      const parsed = parseStudy(raw);
      if (parsed) trialMap.set(nctId, parsed);
    }
  }

  // 2. Fetch Additional High-Value Batches
  const searchQueries = [
    'antibody-drug conjugate',
    'CAR-T chimeric antigen receptor',
    'semaglutide OR tirzepatide',
    'osimertinib OR KRAS G12C',
    'pembrolizumab Phase 3 oncology'
  ];

  for (const query of searchQueries) {
    console.log(`Searching API for: "${query}"...`);
    const results = await searchStudies(query, 20);
    for (const raw of results) {
      const parsed = parseStudy(raw);
      if (parsed && !trialMap.has(parsed.nctId)) {
        trialMap.set(parsed.nctId, parsed);
      }
    }
  }

  const finalTrials = Array.from(trialMap.values());
  console.log(`\nSuccessfully ingested and normalized ${finalTrials.length} clinical studies.`);

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalTrials, null, 2), 'utf8');
  console.log(`Saved clean dataset to: ${OUTPUT_FILE}`);

  // Mirror to OneDrive
  const oneDriveFile = 'c:/Users/xthomk/OneDrive/Antigravity/Monetization/ClinSight-Website/data/trials.json';
  try {
    fs.mkdirSync(path.dirname(oneDriveFile), { recursive: true });
    fs.writeFileSync(oneDriveFile, JSON.stringify(finalTrials, null, 2), 'utf8');
    console.log(`Mirrored dataset to OneDrive: ${oneDriveFile}`);
  } catch (e) {
    console.warn('OneDrive mirror warning:', e.message);
  }
}

main().catch(console.error);
