const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_CSV = path.join(__dirname, '../../ClinSight_Specialized_Therapeutics_2000_2026_Verification.csv');

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

function classifyTherapeuticArea(queryTopic) {
  return queryTopic.area;
}

function inferSpecializedModality(interventions, title) {
  const text = ` ${(interventions || []).join(' ')} ${title || ''} `.toLowerCase();
  
  // 1. Biologics & Monoclonal Antibodies
  if (/\b(adalimumab|infliximab|ustekinumab|risankizumab|guselkumab|secukinumab|ixekizumab|dupilumab|ocrelizumab|ofatumumab|natalizumab|vedolizumab|brodalumab|bimekizumab|sarilumab|tocilizumab|belimumab|anifrolumab|tezepelumab|mepolizumab|benralizumab|faricimab|aflibercept|ranibizumab|lecanemab|donanemab|aducanumab|emicizumab|eculizumab|ravulizumab|mab|antibody)\b/i.test(text)) {
    return 'Targeted Monoclonal Antibodies & Receptor Blockers';
  }

  // 2. Small Molecules, JAK/TYK2 & Kinase Inhibitors
  if (/\b(upadacitinib|tofacitinib|baricitinib|filgotinib|deucravacitinib|apremilast|ozanimod|siponimod|fingolimod|ponesimod|tofersen|rimegepant|atogepant|ubrogepant|erenumab|fremanezumab|trikafta|kalydeco|elexacaftor|tezacaftor|ivacaftor|ensifentrine|pirfenidone|nintedanib|sotatercept|iptacopan|danicopan)\b/i.test(text)) {
    return 'Targeted Small Molecules & Signal Modulators';
  }

  // 3. Cell & Gene Therapy / RNA Editing / AAV / Oligonucleotides
  if (/\b(casgevy|lyfgenia|elevidys|zolgensma|spinraza|nusinersen|roctavian|hemgenix|gene therapy|crispr|aav|antisense|oligonucleotide|sirna|patisiran|vutrisiran|inotersen|pegcetacoplan|avacincaptad)\b/i.test(text)) {
    return 'Cell, Gene & RNA Therapeutics (CRISPR/AAV/ASO/Complement)';
  }

  // 4. Neuropsychiatric & CNS Modulators
  if (/\b(karxt|cobenfy|esketamine|zuranolone|brexpiprazole|cariprazine|lumateperone|pimavanserin|dexmedetomidine|modafinil|pitolisant)\b/i.test(text)) {
    return 'Next-Gen Neuropsychiatric & Muscarinic/GABA Modulators';
  }

  // 5. Antivirals & Direct-Acting Agents
  if (/\b(lenacapavir|cabotegravir|rilpivirine|bictegravir|sofosbuvir|velpatasvir|glecaprevir|pibrentasvir|remdesivir|nirmatrelvir|ritonavir|paxlovid|ensitrelvir)\b/i.test(text)) {
    return 'Direct-Acting Antivirals & Long-Acting Capsid/Polymerase Inhibitors';
  }

  // 6. Vaccines
  if (/\b(vaccine|arexvy|abrysvo|shingrix|prevnar|mrna-)\b/i.test(text)) {
    return 'Prophylactic & Recombinant Vaccines';
  }

  return 'Standard Clinical Pharmacotherapy & Comparative Regimens';
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`ClinSight Specialized Therapeutics Engine (2000-2026)`);
  console.log(`Pulling Phase 3 trials across Immunology, Neurology, Rare Diseases, Pulmonology, Ophthalmology & Virology`);
  console.log(`Source: ClinicalTrials.gov API v2 (Range: 2000-01-01 to Present)`);
  console.log(`======================================================\n`);

  const trialMap = new Map();

  const queryTopics = [
    // 1. Immunology, Autoimmune & Dermatology
    { query: 'Rheumatoid Arthritis', area: 'Immunology & Autoimmune', subtype: 'Rheumatoid Arthritis' },
    { query: 'Psoriasis', area: 'Immunology & Dermatology', subtype: 'Psoriasis & Psoriatic Arthritis' },
    { query: 'Atopic Dermatitis', area: 'Immunology & Dermatology', subtype: 'Atopic Dermatitis & Eczema' },
    { query: 'Crohn Disease', area: 'Gastroenterology (IBD)', subtype: "Crohn's Disease" },
    { query: 'Ulcerative Colitis', area: 'Gastroenterology (IBD)', subtype: 'Ulcerative Colitis' },
    { query: 'Systemic Lupus Erythematosus', area: 'Immunology & Autoimmune', subtype: 'Systemic Lupus (SLE)' },
    { query: 'Ankylosing Spondylitis', area: 'Immunology & Autoimmune', subtype: 'Ankylosing Spondylitis' },

    // 2. Neurology & Neurodegeneration
    { query: 'Alzheimer Disease', area: 'Neurology & Neurodegeneration', subtype: "Alzheimer's Disease" },
    { query: 'Multiple Sclerosis', area: 'Neurology & Neurodegeneration', subtype: 'Multiple Sclerosis' },
    { query: 'Parkinson Disease', area: 'Neurology & Neurodegeneration', subtype: "Parkinson's Disease" },
    { query: 'Amyotrophic Lateral Sclerosis', area: 'Neurology & Neurodegeneration', subtype: 'ALS / Motor Neuron Disease' },
    { query: 'Migraine', area: 'Neurology & Neurodegeneration', subtype: 'Migraine Disorders' },
    { query: 'Major Depressive Disorder', area: 'Psychiatry & CNS', subtype: 'Major Depressive Disorder' },
    { query: 'Schizophrenia', area: 'Psychiatry & CNS', subtype: 'Schizophrenia & Psychosis' },

    // 3. Pulmonology & Respiratory
    { query: 'Asthma', area: 'Pulmonology & Respiratory', subtype: 'Severe Asthma' },
    { query: 'Chronic Obstructive Pulmonary Disease', area: 'Pulmonology & Respiratory', subtype: 'COPD' },
    { query: 'Idiopathic Pulmonary Fibrosis', area: 'Pulmonology & Respiratory', subtype: 'Idiopathic Pulmonary Fibrosis (IPF)' },
    { query: 'Pulmonary Arterial Hypertension', area: 'Pulmonology & Respiratory', subtype: 'Pulmonary Arterial Hypertension (PAH)' },

    // 4. Rare Genetic Diseases & Non-Malignant Hematology
    { query: 'Spinal Muscular Atrophy', area: 'Rare Diseases & Gene Therapy', subtype: 'Spinal Muscular Atrophy (SMA)' },
    { query: 'Cystic Fibrosis', area: 'Rare Diseases & Gene Therapy', subtype: 'Cystic Fibrosis' },
    { query: 'Duchenne Muscular Dystrophy', area: 'Rare Diseases & Gene Therapy', subtype: 'Duchenne Muscular Dystrophy (DMD)' },
    { query: 'Hemophilia A', area: 'Non-Malignant Hematology', subtype: 'Hemophilia' },
    { query: 'Paroxysmal Nocturnal Hemoglobinuria', area: 'Non-Malignant Hematology', subtype: 'Complement Disorders (PNH)' },
    { query: 'Sickle Cell Disease', area: 'Rare Diseases & Gene Therapy', subtype: 'Sickle Cell & Beta-Thalassemia' },

    // 5. Ophthalmology & Retinal Diseases
    { query: 'Macular Degeneration', area: 'Ophthalmology & Retinal Diseases', subtype: 'Age-Related Macular Degeneration (AMD)' },
    { query: 'Diabetic Macular Edema', area: 'Ophthalmology & Retinal Diseases', subtype: 'Diabetic Macular Edema (DME)' },
    { query: 'Glaucoma', area: 'Ophthalmology & Retinal Diseases', subtype: 'Glaucoma & Ocular Hypertension' },

    // 6. Infectious Diseases & Virology
    { query: 'HIV-1', area: 'Infectious Diseases & Virology', subtype: 'HIV-1 Infection' },
    { query: 'Hepatitis C', area: 'Infectious Diseases & Virology', subtype: 'Hepatitis C (HCV)' },
    { query: 'Respiratory Syncytial Virus', area: 'Infectious Diseases & Virology', subtype: 'RSV & Respiratory Viruses' }
  ];

  for (const topic of queryTopics) {
    const encodedCond = encodeURIComponent(topic.query);
    const filter = encodeURIComponent('AREA[Phase]PHASE3 AND AREA[StartDate]RANGE[2000-01-01,MAX]');
    const apiUrl = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodedCond}&filter.advanced=${filter}&pageSize=35`;
    
    console.log(`Fetching 2000-2026 Phase 3 trials for ${topic.subtype}...`);
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
          area: topic.area,
          subtype: topic.subtype,
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

  console.log(`\nAggregated ${trialMap.size} distinct trials across specialized therapeutics (2000-2026).`);

  // Build CSV
  const csvHeaders = [
    'NCT ID',
    'Therapeutic Area',
    'Disease Subtype / Indication',
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

  const areaCounts = {};
  const subtypeCounts = {};
  const modalityCounts = {};
  const rows = [];

  for (const t of trialMap.values()) {
    const modality = inferSpecializedModality(t.interventions, t.briefTitle);

    areaCounts[t.area] = (areaCounts[t.area] || 0) + 1;
    subtypeCounts[t.subtype] = (subtypeCounts[t.subtype] || 0) + 1;
    modalityCounts[modality] = (modalityCounts[modality] || 0) + 1;

    const row = [
      escapeCsv(t.nctId),
      escapeCsv(t.area),
      escapeCsv(t.subtype),
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
  console.log(`Specialized Therapeutics Verification Excel Sheet Successfully Generated!`);
  console.log(`Location: ${OUT_CSV}`);
  console.log(`Total Candidates: ${rows.length}`);
  console.log(`\nTherapeutic Area Breakdown:`);
  console.log(areaCounts);
  console.log(`\nModality Breakdown:`);
  console.log(modalityCounts);
  console.log(`======================================================\n`);
}

run().catch(console.error);
