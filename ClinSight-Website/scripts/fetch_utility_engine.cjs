const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '../data');
const TRIALS_JSON_PATH = path.join(DATA_DIR, 'trials.json');
const CSV_OUT_PATH = path.join(DATA_DIR, 'ClinSight_Deploy_Sheet.csv');

const existingTrials = JSON.parse(fs.readFileSync(TRIALS_JSON_PATH, 'utf8'));
const nctIds = existingTrials.map(t => t.nctId);

function fetchRegistryRecord(nctId) {
  return new Promise((resolve) => {
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[WARN] ${nctId} HTTP status ${res.statusCode}`);
        return resolve(null);
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          console.error(`[ERR] JSON parse error for ${nctId}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`[ERR] Network error for ${nctId}:`, err.message);
      resolve(null);
    });
  });
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Section 4 Modality Derivation (Strictly from registered intervention names; Unclassified fallback)
function deriveModality(interventions) {
  const text = (interventions || []).join(' ').toLowerCase();

  // ADC conjugates
  if (
    text.includes('deruxtecan') ||
    text.includes('vedotin') ||
    text.includes('govitecan') ||
    text.includes('mafodotin') ||
    text.includes('emtansine') ||
    text.includes('soravtansine') ||
    text.includes('t-dxd') ||
    text.includes('t-dm1') ||
    text.includes('conjugate') ||
    text.includes('belantamab') ||
    text.includes('polatuzumab')
  ) {
    return 'ADC';
  }

  // CAR-T / Cell therapy
  if (
    text.includes('autoleucel') ||
    text.includes('ciloleucel') ||
    text.includes('vicleucel') ||
    text.includes('car-t') ||
    text.includes('chimeric antigen') ||
    text.includes('ciltacabtagene') ||
    text.includes('idecabtagene') ||
    text.includes('axicabtagene') ||
    text.includes('lisocabtagene') ||
    text.includes('tisagenlecleucel')
  ) {
    return 'CAR-T';
  }

  // Bispecifics
  if (
    text.includes('teclistamab') ||
    text.includes('elranatamab') ||
    text.includes('talquetamab') ||
    text.includes('epcoritamab') ||
    text.includes('glofitamab') ||
    text.includes('mosunetuzumab') ||
    text.includes('odronextamab') ||
    text.includes('blinatumomab') ||
    text.includes('bispecific') ||
    text.includes('t-cell engager')
  ) {
    return 'Bispecific';
  }

  // Checkpoint Inhibitors
  if (
    text.includes('pembrolizumab') ||
    text.includes('nivolumab') ||
    text.includes('durvalumab') ||
    text.includes('atezolizumab') ||
    text.includes('ipilimumab') ||
    text.includes('cemiplimab') ||
    text.includes('pd-1') ||
    text.includes('pd-l1') ||
    text.includes('ctla-4')
  ) {
    return 'Checkpoint';
  }

  // Incretins / GLP-1
  if (
    text.includes('semaglutide') ||
    text.includes('tirzepatide') ||
    text.includes('retatrutide') ||
    text.includes('liraglutide') ||
    text.includes('dulaglutide') ||
    text.includes('cagrilintide')
  ) {
    return 'GLP-1';
  }

  // TKIs / Small Molecules
  if (
    text.includes('tinib') ||
    text.includes('rasib') ||
    text.includes('ciclib') ||
    text.includes('parib') ||
    text.includes('bortezomib') ||
    text.includes('carfilzomib') ||
    text.includes('ixazomib') ||
    text.includes('lenalidomide') ||
    text.includes('pomalidomide') ||
    text.includes('venetoclax') ||
    text.includes('sotorasib') ||
    text.includes('osimertinib') ||
    text.includes('abemaciclib') ||
    text.includes('olaparib')
  ) {
    return 'TKI / Small Molecule';
  }

  // Monoclonal Antibodies
  if (
    text.includes('daratumumab') ||
    text.includes('isatuximab') ||
    text.includes('rituximab') ||
    text.includes('obinutuzumab') ||
    text.includes('tafasitamab') ||
    text.includes('mab')
  ) {
    return 'Monoclonal Antibody (mAb)';
  }

  return 'Unclassified';
}

function inferCategory(conditions) {
  const text = (conditions || []).join(' ').toLowerCase();
  if (text.includes('myeloma') || text.includes('lymphoma') || text.includes('leukemia') || text.includes('aml') || text.includes('cll') || text.includes('dlbcl') || text.includes('myelodysplastic')) {
    return { category: 'Oncology', subtype: 'Hematologic Malignancies' };
  }
  if (text.includes('breast') || text.includes('lung') || text.includes('prostate') || text.includes('colorectal') || text.includes('ovarian') || text.includes('pancreatic') || text.includes('urothelial') || text.includes('melanoma') || text.includes('cancer') || text.includes('carcinoma')) {
    return { category: 'Oncology', subtype: 'Solid Tumors' };
  }
  if (text.includes('heart failure') || text.includes('diabetes') || text.includes('obesity') || text.includes('weight')) {
    return { category: 'Cardiometabolic & Endocrinology', subtype: 'Cardiometabolic' };
  }
  return { category: 'Specialized Clinical Areas', subtype: 'Systemic Disease' };
}

async function runUtilityIngestion() {
  console.log(`\n======================================================`);
  console.log(`ClinSight Utility Engine: Ingestion & Primary Links`);
  console.log(`Fetching ${nctIds.length} trials from ClinicalTrials.gov API v2`);
  console.log(`======================================================\n`);

  const utilityTrials = [];
  const csvRows = [];

  const csvHeaders = [
    'nct_id',
    'brief_title',
    'official_title',
    'lead_sponsor',
    'phase',
    'overall_status',
    'enrollment',
    'registry_acronym',
    'modality',
    'has_posted_results',
    'has_publication',
    'is_results_vacant',
    'protocol_url',
    'sap_url',
    'results_url',
    'primary_pmid',
    'registry_url'
  ];
  csvRows.push(csvHeaders.map(escapeCsv).join(','));

  for (let i = 0; i < nctIds.length; i++) {
    const nctId = nctIds[i];
    process.stdout.write(`[${i + 1}/${nctIds.length}] Fetching ${nctId}... `);

    const raw = await fetchRegistryRecord(nctId);
    if (!raw || !raw.protocolSection) {
      console.log('FAILED (Skipped)');
      continue;
    }

    const p = raw.protocolSection;
    const docSec = raw.documentSection;
    const hasResults = Boolean(raw.hasResults);

    const briefTitle = p.identificationModule?.briefTitle || '';
    const officialTitle = p.identificationModule?.officialTitle || briefTitle;

    // Registry Acronym strictly from identificationModule.acronym
    const rawAcronym = p.identificationModule?.acronym;
    const registryAcronym = (rawAcronym && rawAcronym.trim() && rawAcronym !== 'undefined') ? rawAcronym.trim() : null;

    const phases = p.designModule?.phases || [];
    let phaseStr = phases.join(', ').replace(/PHASE/g, 'Phase ');
    if (!phaseStr) phaseStr = 'N/A';

    const status = p.statusModule?.overallStatus || 'UNKNOWN';
    const isCompleted = status.toUpperCase().includes('COMPLETED') || status.toUpperCase().includes('TERMINATED');
    const conditions = p.conditionsModule?.conditions || [];
    const interventions = (p.armsInterventionsModule?.interventions || []).map(item => item.name);
    const sponsor = p.sponsorCollaboratorsModule?.leadSponsor?.name || 'Academic / Industry Sponsor';

    const modality = deriveModality(interventions);
    const catSub = inferCategory(conditions);

    const completionDate = p.statusModule?.completionDateStruct?.date || p.statusModule?.primaryCompletionDateStruct?.date || '2024';
    const year = parseInt(completionDate.split('-')[0]) || 2024;
    const enrollment = p.designModule?.enrollmentInfo?.count || 0;

    // References & Publications
    const rawRefs = p.referencesModule?.references || [];
    const publications = rawRefs.map(r => ({
      pmid: r.pmid || null,
      type: r.type || 'REFERENCE',
      citation: r.citation || ''
    }));

    // Find result/derived publications
    const resultPubs = publications.filter(r => r.pmid && (r.type === 'RESULT' || r.type === 'DERIVED'));
    const anyPubWithPmid = publications.find(r => r.pmid);
    const hasPublication = resultPubs.length > 0 || Boolean(anyPubWithPmid);
    const primaryPmid = (resultPubs[0] && resultPubs[0].pmid) || (anyPubWithPmid && anyPubWithPmid.pmid) || null;

    // Results-vacant definition: completed/terminated AND neither posted results nor publication
    const isResultsVacant = isCompleted && !hasResults && !hasPublication;

    // Document links from documentSection.largeDocumentModule
    const largeDocs = docSec?.largeDocumentModule?.largeDocs || [];
    let protocolFilename = null;
    let sapFilename = null;

    const suffix = nctId.slice(-2);

    for (const doc of largeDocs) {
      if (doc.hasProtocol && !protocolFilename && doc.filename) {
        protocolFilename = doc.filename;
      }
      if (doc.hasSap && !sapFilename && doc.filename) {
        sapFilename = doc.filename;
      }
    }

    const protocolUrl = protocolFilename ? `https://cdn.clinicaltrials.gov/large-docs/${suffix}/${nctId}/${protocolFilename}` : null;
    const sapUrl = sapFilename ? `https://cdn.clinicaltrials.gov/large-docs/${suffix}/${nctId}/${sapFilename}` : null;
    const resultsUrl = hasResults ? `https://clinicaltrials.gov/study/${nctId}?tab=results` : null;
    const registryUrl = `https://clinicaltrials.gov/study/${nctId}`;

    const primaryOutcomes = (p.outcomesModule?.primaryOutcomes || []).map(o => ({
      measure: o.measure || '',
      description: o.description || '',
      timeFrame: o.timeFrame || ''
    }));

    const rawCriteria = p.eligibilityModule?.eligibilityCriteria || '';
    const criteriaParts = rawCriteria.split(/Exclusion Criteria:/i);
    const inclusionText = criteriaParts[0] ? criteriaParts[0].replace(/Inclusion Criteria:/i, '').trim() : '';
    const exclusionText = criteriaParts[1] ? criteriaParts[1].trim() : '';

    const inclusionCriteria = inclusionText.split(/\n(?=[-•*]|\d+\.)/).map(s => s.replace(/^[-•*]\s*|^\d+\.\s*/, '').trim()).filter(s => s.length > 5).slice(0, 8);
    const exclusionCriteria = exclusionText.split(/\n(?=[-•*]|\d+\.)/).map(s => s.replace(/^[-•*]\s*|^\d+\.\s*/, '').trim()).filter(s => s.length > 5).slice(0, 8);

    const trialObj = {
      nctId,
      acronym: registryAcronym,
      briefTitle,
      officialTitle,
      phase: phaseStr,
      status,
      isCompleted,
      sponsor,
      conditions,
      interventions,
      category: catSub.category,
      subtype: catSub.subtype,
      modality,
      completionDate,
      year,
      enrollment,
      hasResults,
      hasPublication,
      isResultsVacant,
      protocolUrl,
      sapUrl,
      resultsUrl,
      registryUrl,
      primaryPmid,
      primaryOutcomes,
      inclusionCriteria,
      exclusionCriteria,
      publications
    };

    utilityTrials.push(trialObj);

    csvRows.push([
      escapeCsv(nctId),
      escapeCsv(briefTitle),
      escapeCsv(officialTitle),
      escapeCsv(sponsor),
      escapeCsv(phaseStr),
      escapeCsv(status),
      escapeCsv(enrollment),
      escapeCsv(registryAcronym || ''),
      escapeCsv(modality),
      escapeCsv(hasResults ? 'YES' : 'NO'),
      escapeCsv(hasPublication ? 'YES' : 'NO'),
      escapeCsv(isResultsVacant ? 'YES' : 'NO'),
      escapeCsv(protocolUrl || ''),
      escapeCsv(sapUrl || ''),
      escapeCsv(resultsUrl || ''),
      escapeCsv(primaryPmid || ''),
      escapeCsv(registryUrl)
    ].join(','));

    console.log(`OK (Modality: ${modality} | Docs: Prot=${Boolean(protocolUrl)}, Results=${hasResults}, Pub=${hasPublication})`);
  }

  // Save enriched dataset
  fs.writeFileSync(TRIALS_JSON_PATH, JSON.stringify(utilityTrials, null, 2), 'utf8');
  console.log(`\n[SUCCESS] Wrote ${utilityTrials.length} utility trial records to ${TRIALS_JSON_PATH}`);

  // Save CSV export sheet
  fs.writeFileSync(CSV_OUT_PATH, csvRows.join('\r\n'), 'utf8');
  console.log(`[SUCCESS] Wrote ${utilityTrials.length} rows to ${CSV_OUT_PATH}`);

  // Summary diagnostics
  const withProtocol = utilityTrials.filter(t => t.protocolUrl).length;
  const withSap = utilityTrials.filter(t => t.sapUrl).length;
  const withResults = utilityTrials.filter(t => t.hasResults).length;
  const withPub = utilityTrials.filter(t => t.hasPublication).length;
  const resultsVacant = utilityTrials.filter(t => t.isResultsVacant).length;

  console.log(`\n--- Document & Results Summary ---`);
  console.log(`Total Trials: ${utilityTrials.length}`);
  console.log(`With Direct Protocol PDF: ${withProtocol}`);
  console.log(`With Direct SAP PDF: ${withSap}`);
  console.log(`With Posted Results Tab: ${withResults}`);
  console.log(`With Peer-Reviewed Publication: ${withPub}`);
  console.log(`Results-Vacant Completed Trials: ${resultsVacant}`);
  console.log(`------------------------------------\n`);
}

runUtilityIngestion();
