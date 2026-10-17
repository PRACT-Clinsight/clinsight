/**
 * Sweden Clinical Trials Job Ingestion Engine (Sandbox Prototype)
 * Sources:
 * 1. Västra Götalandsregionen (VGR / Sahlgrenska University Hospital)
 * 2. Karolinska Institutet & Karolinska University Hospital
 * 3. Lund University & Skåne University Hospital
 * 4. Uppsala University & Uppsala University Hospital
 * 5. Umeå University & Norrlands University Hospital
 * 
 * Strict Whitelist: Clinical Trials Operations, Study Coordinators,
 * Forskningssköterskor, Medical Monitors, Biostatisticians.
 * Strictly Excludes: Regulatory Affairs (RegSight), Pharmacovigilance (VigiSight), generic nursing.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SWEDEN_SOURCES = [
  {
    name: "Sahlgrenska University Hospital / VGR",
    region: "Västra Götaland (Gothenburg)",
    url: "https://vgregion.varbi.com/en/",
    type: "hospital"
  },
  {
    name: "Karolinska Institutet & Hospital",
    region: "Stockholm",
    url: "https://ki.varbi.com/en/",
    type: "university_hospital"
  },
  {
    name: "Skåne University Hospital / Lund Univ",
    region: "Skåne (Lund/Malmö)",
    url: "https://lu.varbi.com/en/",
    type: "university_hospital"
  },
  {
    name: "Uppsala University Hospital",
    region: "Uppsala",
    url: "https://uu.varbi.com/en/",
    type: "university_hospital"
  },
  {
    name: "Umeå University Hospital",
    region: "Västerbotten (Umeå)",
    url: "https://umu.varbi.com/en/",
    type: "university_hospital"
  }
];

// Strict Clinical Trials Inclusion Patterns
const CLINICAL_TRIAL_REGEX = [
  /forskningssköterska/i,
  /klinisk(?:a)?\s+prövning(?:ar)?/i,
  /klinisk(?:a)?\s+studie(?:r)?/i,
  /studiekoordinator/i,
  /clinical\s+trial/i,
  /clinical\s+research/i,
  /gothia\s+forum/i,
  /karolinska\s+trial\s+alliance/i,
  /gcp(?:-|\s+)?koordinator/i,
  /prövningsledare/i,
  /biostatistiker/i,
  /clinical\s+data\s+manager/i,
  /medical\s+monitor/i
];

// Exclusion Filters (Exclude general nursing, regulatory, pharmacovigilance)
const EXCLUSION_REGEX = [
  /grundutbildad\s+sjuksköterska/i,
  /undersköterska/i,
  /psykolog/i,
  /fysioterapeut/i,
  /tandläkare/i,
  /städare/i,
  /kock/i,
  /regulatory\s+affairs/i, // RegSight
  /pharmacovigilance/i     // VigiSight
];

function fetchHtml(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      console.error(`[Error] Failed to fetch ${url}:`, err.message);
      resolve('');
    });
  });
}

function decodeEntities(str) {
  return str
    .replace(/&ouml;/g, 'ö')
    .replace(/&auml;/g, 'ä')
    .replace(/&aring;/g, 'å')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Aring;/g, 'Å')
    .replace(/&amp;/g, '&');
}

function detectPhase(title) {
  if (/fas\s*1|phase\s*1|fih|first-in-human/i.test(title)) return "Phase 1 (Early/FIH)";
  if (/fas\s*2|phase\s*2/i.test(title)) return "Phase 2 (Proof of Concept)";
  if (/fas\s*3|phase\s*3|pivotal/i.test(title)) return "Phase 3 (Registrational)";
  return "Phase 1-3 Clinical Trials";
}

async function collectSwedenJobs() {
  console.log("=================================================");
  console.log("  ClinSight: Sweden Clinical Trials Job Ingest   ");
  console.log("=================================================");
  
  const allJobs = [];
  const today = new Date().toISOString().split('T')[0];

  for (const source of SWEDEN_SOURCES) {
    console.log(`\nQuerying ${source.name} (${source.url})...`);
    const html = await fetchHtml(source.url);
    if (!html) continue;

    // Pattern to match Varbi table rows / job links
    // href="https://...varbi.com/en/what:job/jobID:972324/">Title</a>
    const jobRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let foundInSource = 0;

    while ((rowMatch = jobRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      const linkMatch = rowContent.match(/href="([^"]*what:job\/jobID:(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/i);
      
      if (!linkMatch) continue;

      const rawUrl = linkMatch[1];
      const jobId = linkMatch[2];
      const rawTitle = decodeEntities(linkMatch[3].trim());

      // Check Exclusions
      const isExcluded = EXCLUSION_REGEX.some(rx => rx.test(rawTitle));
      if (isExcluded) continue;

      // Check Clinical Trial Inclusion
      const isClinical = CLINICAL_TRIAL_REGEX.some(rx => rx.test(rawTitle) || rx.test(rowContent));
      if (!isClinical) continue;

      // Extract deadline if present
      const dateMatch = rowContent.match(/\b(202\d-\d{2}-\d{2})\b/);
      const deadline = dateMatch ? dateMatch[1] : null;

      const jobRecord = {
        id: `se_varbi_${jobId}`,
        title: rawTitle,
        organization: source.name,
        region: source.region,
        country: "Sweden",
        type: source.type,
        phase: detectPhase(rawTitle),
        apply_url: rawUrl,
        deadline: deadline,
        first_seen: today,
        last_verified_alive: today,
        status: "active"
      };

      allJobs.push(jobRecord);
      foundInSource++;
      console.log(`  ✓ [MATCH] ${rawTitle} (Deadline: ${deadline || 'N/A'})`);
    }

    console.log(`  Total verified clinical trial positions found: ${foundInSource}`);
  }

  // Ensure output directory exists
  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'sweden_clinical_jobs.json');
  fs.writeFileSync(outFile, JSON.stringify(allJobs, null, 2), 'utf-8');

  console.log("\n=================================================");
  console.log(`Successfully indexed ${allJobs.length} pure clinical trial jobs in Sweden.`);
  console.log(`Saved output to: ${outFile}`);
  console.log("=================================================");
}

collectSwedenJobs();
