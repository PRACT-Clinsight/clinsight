/**
 * ClinSight Staged Wave Deployment Engine
 * 
 * Automates staged wave ingestion and deployment:
 * 1. Reads target wave manifest(s) from ClinSight-Website/waves/
 * 2. Fetches full primary-source trial records from ClinicalTrials.gov API v2
 * 3. Enriches records with verified modality, category, documents (Protocols, SAPs, PMIDs)
 * 4. Merges into data/trials.json (with strict deduplication)
 * 5. Executes build_pages.cjs to regenerate static dossier pages and sitemap.xml
 * 6. (Optional) Auto-commits and pushes to Git remote
 * 
 * Usage:
 *   node ClinSight-Website/scripts/deploy_wave.cjs --waves 2,3 --dry-run
 *   node ClinSight-Website/scripts/deploy_wave.cjs --waves 2,3
 *   node ClinSight-Website/scripts/deploy_wave.cjs --waves 2,3 --push
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const WAVES_DIR = path.join(ROOT_DIR, 'waves');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const TRIALS_JSON_PATH = path.join(DATA_DIR, 'trials.json');
const BUILD_SCRIPT_PATH = path.join(__dirname, 'build_pages.cjs');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Transparent modality inference strictly from registry intervention names
function inferModalityFromInterventions(interventions) {
  const text = (interventions || []).join(' ').toLowerCase();
  if (text.includes('deruxtecan') || text.includes('vedotin') || text.includes('govitecan') || text.includes('soravtansine') || text.includes('t-dxd') || text.includes('t-dm1') || text.includes('belantamab') || text.includes('polatuzumab') || text.includes('datopotamab') || text.includes('enfortumab') || text.includes('sacituzumab')) {
    return 'Antibody-Drug Conjugates (ADC)';
  }
  if (text.includes('ciloleucel') || text.includes('autoleucel') || text.includes('vicleucel') || text.includes('car-t') || text.includes('chimeric antigen') || text.includes('ciltacabtagene') || text.includes('idecabtagene') || text.includes('axicabtagene') || text.includes('lisocabtagene') || text.includes('tisagenlecleucel')) {
    return 'Cell & Gene Therapy (CAR-T)';
  }
  if (text.includes('teclistamab') || text.includes('elranatamab') || text.includes('talquetamab') || text.includes('epcoritamab') || text.includes('glofitamab') || text.includes('mosunetuzumab') || text.includes('odronextamab') || text.includes('blinatumomab') || text.includes('bispecific') || text.includes('t-cell engager') || text.includes('bite') || text.includes('tarlatamab')) {
    return 'Bispecific Antibodies & T-Cell Engagers';
  }
  if (text.includes('pembrolizumab') || text.includes('nivolumab') || text.includes('atezolizumab') || text.includes('durvalumab') || text.includes('ipilimumab') || text.includes('cemiplimab') || text.includes('tislelizumab') || text.includes('toripalimab') || text.includes('dostarlimab')) {
    return 'Immuno-Oncology (Checkpoint Inhibitor)';
  }
  if (text.includes('daratumumab') || text.includes('isatuximab') || text.includes('rituximab') || text.includes('obinutuzumab') || text.includes('tafasitamab') || text.includes('brentuximab') || text.includes('inotuzumab') || text.includes('trastuzumab') || text.includes('pertuzumab') || text.includes('cetuximab') || text.includes('panitumumab')) {
    return 'Targeted Monoclonal Antibodies';
  }
  if (text.includes('semaglutide') || text.includes('tirzepatide') || text.includes('retatrutide') || text.includes('liraglutide') || text.includes('cagrilintide') || text.includes('orforglipron') || text.includes('glp-1') || text.includes('gip')) {
    return 'Incretin Mimetics (GLP-1 / GIP)';
  }
  if (text.includes('venetoclax') || text.includes('ibrutinib') || text.includes('acalabrutinib') || text.includes('zanubrutinib') || text.includes('pirtobrutinib') || text.includes('midostaurin') || text.includes('gilteritinib') || text.includes('ivosidenib') || text.includes('revumenib') || text.includes('bortezomib') || text.includes('carfilzomib') || text.includes('ixazomib') || text.includes('lenalidomide') || text.includes('pomalidomide') || text.includes('osimertinib') || text.includes('sotorasib') || text.includes('abemaciclib') || text.includes('olaparib') || text.includes('asciminib') || text.includes('imatinib') || text.includes('dasatinib') || text.includes('nilotinib') || text.includes('ponatinib') || text.includes('rucaparib') || text.includes('niraparib') || text.includes('talazoparib') || text.includes('adagrasib')) {
    return 'Targeted Therapy (Small Molecule / TKI)';
  }
  return 'Targeted Oncology & Systemic Therapy';
}

function inferCategory(conditions) {
  const text = (conditions || []).join(' ').toLowerCase();
  if (text.includes('myeloma') || text.includes('lymphoma') || text.includes('leukemia') || text.includes('aml') || text.includes('cll') || text.includes('dlbcl') || text.includes('myelodysplastic') || text.includes('myeloproliferative') || text.includes('pnh') || text.includes('sickle') || text.includes('thalassemia') || text.includes('hemophilia')) {
    return { category: 'Oncology', subtype: 'Hematologic Malignancies' };
  }
  if (text.includes('breast') || text.includes('lung') || text.includes('prostate') || text.includes('colorectal') || text.includes('ovarian') || text.includes('pancreatic') || text.includes('urothelial') || text.includes('melanoma') || text.includes('cancer') || text.includes('carcinoma') || text.includes('sarcoma') || text.includes('gastric') || text.includes('cervical') || text.includes('endometrial')) {
    return { category: 'Oncology', subtype: 'Solid Tumors' };
  }
  if (text.includes('heart failure') || text.includes('diabetes') || text.includes('obesity') || text.includes('weight') || text.includes('cardio') || text.includes('atherosclero') || text.includes('hypertension') || text.includes('lipid')) {
    return { category: 'Cardiometabolic & Endocrinology', subtype: 'Cardiometabolic' };
  }
  if (text.includes('cystic fibrosis') || text.includes('duchenne') || text.includes('spinal muscular') || text.includes('amyloidosis')) {
    return { category: 'Rare & Genetic Diseases', subtype: 'Monomorphic / Rare' };
  }
  return { category: 'Specialized Clinical Areas', subtype: 'Systemic Disease' };
}

function fetchStudyFromApi(nctId) {
  const cacheFile = path.join(CACHE_DIR, `${nctId}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return Promise.resolve(cached);
    } catch (e) {
      // ignore cache error, refetch
    }
  }

  return new Promise((resolve) => {
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
    const req = https.get(url, { headers: { 'User-Agent': 'ClinSight-Data-Engine/2.0' } }, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`\n[WARN] ${nctId} returned HTTP ${res.statusCode}`);
        return resolve(null);
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          fs.writeFileSync(cacheFile, raw, 'utf8');
          resolve(parsed);
        } catch (e) {
          console.error(`\n[ERR] JSON parse error for ${nctId}:`, e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`\n[ERR] Network error for ${nctId}:`, err.message);
      resolve(null);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      console.warn(`\n[TIMEOUT] ${nctId} request timed out`);
      resolve(null);
    });
  });
}

function parseStudyRecord(nctId, raw) {
  if (!raw || !raw.protocolSection) return null;

  const p = raw.protocolSection;
  const docSec = raw.documentSection;
  const hasResults = Boolean(raw.hasResults);

  const briefTitle = p.identificationModule?.briefTitle || '';
  const officialTitle = p.identificationModule?.officialTitle || briefTitle;

  const rawAcronym = p.identificationModule?.acronym;
  const registryAcronym = (rawAcronym && rawAcronym.trim() && rawAcronym !== 'undefined') ? rawAcronym.trim() : null;

  const phases = p.designModule?.phases || [];
  let phaseStr = phases.join(', ').replace(/PHASE/g, 'Phase ');
  if (!phaseStr) phaseStr = 'Phase 3';

  const status = p.statusModule?.overallStatus || 'UNKNOWN';
  const isCompleted = status.toUpperCase().includes('COMPLETED');
  const conditions = p.conditionsModule?.conditions || [];
  const interventions = (p.armsInterventionsModule?.interventions || []).map(item => item.name);
  const sponsor = p.sponsorCollaboratorsModule?.leadSponsor?.name || 'Academic / Industry Sponsor';

  const modality = inferModalityFromInterventions(interventions);
  const catSub = inferCategory(conditions);

  const completionDate = p.statusModule?.completionDateStruct?.date || p.statusModule?.primaryCompletionDateStruct?.date || '2026';
  const year = parseInt(completionDate.split('-')[0]) || 2026;
  const enrollment = p.designModule?.enrollmentInfo?.count || 0;

  const publications = (p.referencesModule?.references || []).map(r => ({
    citation: r.citation || '',
    pmid: r.pmid || '',
    type: r.type || 'REFERENCE'
  }));

  const resultPubs = publications.filter(r => r.type === 'RESULT');
  const anyPubWithPmid = publications.find(r => r.pmid);
  const hasPublication = resultPubs.length > 0 || Boolean(anyPubWithPmid);
  const primaryPmid = (resultPubs[0] && resultPubs[0].pmid) || (anyPubWithPmid && anyPubWithPmid.pmid) || null;

  const isResultsVacant = isCompleted && !hasResults && !hasPublication;

  // Documents from documentSection
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

  return {
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
}

async function runBatch(items, fn, concurrency = 4) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
    if (i + concurrency < items.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const doPush = args.includes('--push');
  
  let targetWaves = [];
  const wavesIdx = args.findIndex(a => a === '--waves' || a === '--wave');
  if (wavesIdx !== -1 && args[wavesIdx + 1]) {
    targetWaves = args[wavesIdx + 1].split(',').map(s => s.trim());
  } else {
    // Default to Wave 2 and Wave 3 if unspecified
    targetWaves = ['2', '3'];
  }

  console.log(`\n======================================================`);
  console.log(`ClinSight Staged Wave Deployment Engine`);
  console.log(`Target waves: ${targetWaves.join(', ')}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Auto push: ${doPush}`);
  console.log(`======================================================\n`);

  // Identify wave files
  const allWaveFiles = fs.readdirSync(WAVES_DIR).filter(f => f.endsWith('.json'));
  const selectedFiles = [];

  for (const target of targetWaves) {
    let matched = null;
    if (target.endsWith('.json')) {
      matched = allWaveFiles.find(f => f.toLowerCase() === target.toLowerCase());
    } else {
      matched = allWaveFiles.find(f => {
        const match = f.match(/^wave(\d+)_/i);
        return match && match[1] === target;
      });
    }
    if (matched) {
      selectedFiles.push(matched);
    } else {
      console.warn(`[WARN] Wave "${target}" not found in ${WAVES_DIR}`);
    }
  }

  if (selectedFiles.length === 0) {
    console.error(`[ERROR] No matching wave manifest files found.`);
    process.exit(1);
  }

  console.log(`Found ${selectedFiles.length} wave file(s):`);
  selectedFiles.forEach(f => console.log(` - ${f}`));

  // Collect all NCT IDs
  const nctIdSet = new Set();
  for (const f of selectedFiles) {
    const filePath = path.join(WAVES_DIR, f);
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    list.forEach(id => nctIdSet.add(id));
  }

  const allNctIds = Array.from(nctIdSet);
  console.log(`\nTotal unique NCT IDs in selected waves: ${allNctIds.length}`);

  // Load existing trials.json
  const existingTrials = fs.existsSync(TRIALS_JSON_PATH) 
    ? JSON.parse(fs.readFileSync(TRIALS_JSON_PATH, 'utf8')) 
    : [];
  const existingNctMap = new Map(existingTrials.map(t => [t.nctId, t]));
  console.log(`Currently live trials in dataset: ${existingTrials.length}`);

  const toFetch = allNctIds.filter(id => !existingNctMap.has(id));
  console.log(`New trials to fetch & ingest: ${toFetch.length} (Skipping ${allNctIds.length - toFetch.length} already live)`);

  if (toFetch.length === 0) {
    console.log(`All trials in selected wave(s) are already ingested!`);
    return;
  }

  console.log(`\nFetching records from ClinicalTrials.gov API v2...`);
  let completedCount = 0;
  const newTrials = [];

  const fetchHandler = async (nctId) => {
    const raw = await fetchStudyFromApi(nctId);
    completedCount++;
    if (completedCount % 10 === 0 || completedCount === toFetch.length) {
      process.stdout.write(`\rProgress: [${completedCount}/${toFetch.length}] trials processed...`);
    }
    if (!raw) return null;
    return parseStudyRecord(nctId, raw);
  };

  const results = await runBatch(toFetch, fetchHandler, 4);
  console.log('\n');

  for (const r of results) {
    if (r) newTrials.push(r);
  }

  console.log(`Successfully parsed ${newTrials.length} new trial records.`);

  if (dryRun) {
    console.log(`\n[DRY RUN COMPLETE] No files modified. Dataset would grow from ${existingTrials.length} to ${existingTrials.length + newTrials.length}.`);
    return;
  }

  // Merge into trials.json
  const combinedTrials = [...existingTrials, ...newTrials];
  fs.writeFileSync(TRIALS_JSON_PATH, JSON.stringify(combinedTrials, null, 2), 'utf8');
  console.log(`[SUCCESS] Updated ${TRIALS_JSON_PATH} (Now ${combinedTrials.length} trials total).`);

  // Execute build_pages.cjs
  console.log(`\nRunning build_pages.cjs to regenerate static trial dossiers, directory, and sitemap...`);
  try {
    const nodeExec = process.execPath;
    execSync(`"${nodeExec}" "${BUILD_SCRIPT_PATH}"`, { stdio: 'inherit' });
    console.log(`[SUCCESS] All static dossiers and sitemap successfully generated.`);
  } catch (err) {
    console.error(`[ERROR] build_pages.cjs failed:`, err.message);
    process.exit(1);
  }

  // Optional auto-commit and push
  if (doPush) {
    console.log(`\nStaging and pushing changes to GitHub...`);
    try {
      execSync(`git add "${TRIALS_JSON_PATH}" "${ROOT_DIR}/trials" "${ROOT_DIR}/sitemap.xml" "${ROOT_DIR}/robots.txt" "${ROOT_DIR}/llms.txt"`, { stdio: 'inherit' });
      execSync(`git commit -m "feat(data): deploy waves ${targetWaves.join(', ')} (+${newTrials.length} trials, total ${combinedTrials.length})"`, { stdio: 'inherit' });
      execSync(`git push origin main`, { stdio: 'inherit' });
      console.log(`[SUCCESS] Pushed to origin/main. Cloudflare & Netlify deployments triggered!`);
    } catch (err) {
      console.error(`[ERROR] Git commit/push failed:`, err.message);
    }
  } else {
    console.log(`\nTo deploy, run:`);
    console.log(`  git add ClinSight-Website/data/trials.json ClinSight-Website/trials/ ClinSight-Website/sitemap.xml`);
    console.log(`  git commit -m "feat(data): deploy waves ${targetWaves.join(', ')}"`);
    console.log(`  git push origin main`);
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
