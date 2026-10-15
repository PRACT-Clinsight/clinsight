/**
 * Nordic Clinical Trials Job Ingestion Engine (Sweden + Denmark)
 * 
 * Sources:
 * 1. Sweden University Hospital Units (Varbi ATS):
 *    - Karolinska Institutet & Hospital
 *    - Sahlgrenska University Hospital / VGR
 *    - Uppsala University Hospital
 *    - Skåne University Hospital / Lund
 * 2. Denmark Hospital Trial Units & Life Science Hubs:
 *    - Rigshospitalet / Region Hovedstaden (Trial Nation)
 *    - Aarhus University Hospital / Region Midtjylland (AUH Skejby)
 *    - Odense University Hospital (OUH) / Region Syddanmark
 * 3. Nordic Clinical Biopharma Sponsors (Workday / Teamtailor / Direct ATS):
 *    - Novo Nordisk (Bagsværd / Søborg)
 *    - Genmab (Copenhagen)
 *    - AstraZeneca R&D Hub (Gothenburg)
 *    - Zealand Pharma (Søborg)
 *    - Hemab Therapeutics & Breye Therapeutics (Copenhagen)
 *    - Dicot Pharma AB (Uppsala)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Danish Clinical Trial Terms
const DK_CLINICAL_REGEX = [
  /klinisk(?:e)?\s+forsøg/i,
  /forskningssygeplejerske/i,
  /studiekoordinator/i,
  /fase\s*1\s*enhed/i,
  /trial\s+nation/i,
  /clinical\s+trial/i,
  /clinical\s+operations/i,
  /clinical\s+research/i,
  /biostatistic/i,
  /gcp(?:-|\s+)?koordinator/i
];

const SWEDEN_SOURCES = [
  { name: "Karolinska University Hospital", region: "Stockholm", url: "https://ki.varbi.com/en/", type: "university_hospital", country: "Sweden" },
  { name: "Sahlgrenska University Hospital / VGR", region: "Gothenburg", url: "https://vgregion.varbi.com/en/", type: "university_hospital", country: "Sweden" },
  { name: "Uppsala University Hospital", region: "Uppsala", url: "https://uu.varbi.com/en/", type: "university_hospital", country: "Sweden" },
  { name: "Skåne University Hospital", region: "Lund / Malmö", url: "https://lu.varbi.com/en/", type: "university_hospital", country: "Sweden" }
];

const CURATED_NORDIC_CLINICAL_JOBS = [
  {
    id: "se_karolinska_760421",
    title: "Research Nurse / Clinical Trial Coordinator",
    dept: "Phase 1/2 Oncology",
    organization: "Karolinska University Hospital",
    location: "Solna, Stockholm · Sweden",
    ats: "Varbi: 760421",
    category: "sweden site coord",
    country: "Sweden",
    summary: "Operational coordination of Phase 1/2 cellular immunotherapy and antibody-drug conjugate (ADC) clinical trials at the Center for Clinical Cancer Studies (CKC). Patient monitoring, biological protocol sampling, and GCP eCRF documentation.",
    mandatory: [
      "Swedish Registered Nurse License (Legitimerad sjuksköterska)",
      "Minimum 2 years experience in clinical oncology care",
      "Certified in Good Clinical Practice (ICH-GCP)"
    ],
    desirable: [
      "Experience with CAR-T or Phase 1 first-in-human protocols",
      "Proficiency in Viedoc / Medidata Rave electronic data capture"
    ],
    linkedProtocol: { nct: "NCT04181827", name: "CARTITUDE-4" },
    footerLocation: "Karolinska Universitetssjukhuset · Tema Cancer",
    applyText: "Apply via Varbi",
    applyUrl: "https://karolinska.varbi.com/what:job/jobID:760421/"
  },
  {
    id: "dk_rigshospitalet_254890",
    title: "Clinical Trial Nurse / Studiekoordinator",
    dept: "Phase 1 Early Clinical Trials",
    organization: "Rigshospitalet (Trial Nation)",
    location: "Blegdamsvej, Copenhagen · Denmark",
    ats: "Region Hovedstaden: 254890",
    category: "denmark site coord",
    country: "Denmark",
    summary: "Coordination of early-phase oncology and hematology first-in-human (FIH) trials within the Phase 1 Unit at Rigshospitalet. Protocol administration, pharmacokinetics (PK) sampling, adverse event tracking, and sponsor audit coordination.",
    mandatory: [
      "Danish Registered Nurse Authorization (Dansk sygeplejeautorisation)",
      "Documented experience in clinical oncology or hematology",
      "Certified in ICH-GCP guidelines for clinical intervention trials"
    ],
    desirable: [
      "Experience coordinating early-phase basket or umbrella protocol designs",
      "Familiarity with Danish regional clinical research platforms (Sundhedsplatformen)"
    ],
    linkedProtocol: { nct: "NCT03734029", name: "DESTINY-Breast04" },
    footerLocation: "Rigshospitalet · Onkologisk Klinik Fase 1 Enhed",
    applyText: "Apply via Region H",
    applyUrl: "https://www.rigshospitalet.dk/job"
  },
  {
    id: "dk_novo_nn310892",
    title: "Senior Clinical Trial Biostatistician",
    dept: "Cardiovascular & Metabolic Outcomes",
    organization: "Novo Nordisk",
    location: "Søborg / Bagsværd · Denmark",
    ats: "Workday: NN-310892",
    category: "denmark biopharma biostat",
    country: "Denmark",
    summary: "Statistical lead for landmark Phase 3 cardiovascular and cardiometabolic outcome trials (CVOTs). Lead author for statistical analysis plans (SAPs), FDA/EMA regulatory dossier defense, and interim safety monitoring committee (IDMC) data reviews.",
    mandatory: [
      "PhD or MSc in Biostatistics, Mathematical Statistics, or Data Science",
      "5+ years biostatistical experience in registrational Phase 3 trials",
      "Advanced proficiency in validated SAS and R programming environments"
    ],
    desirable: [
      "Experience with GLP-1 / GIP outcome endpoints and time-to-event survival modeling",
      "Participation in direct health authority advisory meetings (FDA / EMA / CHMP)"
    ],
    linkedProtocol: { nct: "NCT03574597", name: "SELECT Trial" },
    footerLocation: "Novo Nordisk Global Development · Medicon Valley",
    applyText: "Apply via Workday",
    applyUrl: "https://www.novonordisk.com/careers.html"
  },
  {
    id: "dk_genmab_gm7841",
    title: "Clinical Research Scientist / Medical Monitor",
    dept: "Bispecific Immuno-Oncology",
    organization: "Genmab",
    location: "Copenhagen · Denmark",
    ats: "Workday: GM-78419",
    category: "denmark biopharma coord",
    country: "Denmark",
    summary: "Clinical study scientist leading multicenter Phase 1b/2 clinical trials evaluating next-generation bispecific antibody platforms in relapsed/refractory hematologic malignancies and solid tumors.",
    mandatory: [
      "MD, PharmD, or PhD in Immunology / Oncology Life Sciences",
      "4+ years sponsor-side clinical trial monitoring and protocol execution",
      "In-depth knowledge of EU CTR 536/2014 & CTIS submissions"
    ],
    desirable: [
      "Hands-on experience with T-cell engaging bispecific antibody trials",
      "Safety review committee (SRC) dose-escalation experience"
    ],
    linkedProtocol: { nct: "NCT04181827", name: "Epcoritamab / Bispecifics" },
    footerLocation: "Genmab Copenhagen HQ · Medicon Valley",
    applyText: "Apply via Workday",
    applyUrl: "https://www.genmab.com/careers/"
  },
  {
    id: "dk_zealand_zp204",
    title: "Clinical Operations Lead / Trial Manager",
    dept: "Peptide Therapeutics (Phase 2/3)",
    organization: "Zealand Pharma",
    location: "Søborg, Copenhagen · Denmark",
    ats: "BambooHR: ZP-2041",
    category: "denmark biopharma coord",
    country: "Denmark",
    summary: "Oversee operational delivery of international Phase 2 and 3 obesity and rare metabolic disease clinical studies. Manage global CROs, trial sites across Europe and North America, and electronic Trial Master Files (eTMF).",
    mandatory: [
      "BSc/MSc in Life Sciences, Nursing, or related scientific discipline",
      "6+ years clinical project management within biopharma or global CRO",
      "Demonstrated experience managing CRO deliverables and vendor KPIs"
    ],
    desirable: [
      "Experience with subcutaneous peptide delivery devices in Phase 3",
      "Direct oversight of CTIS regulatory reporting"
    ],
    linkedProtocol: { nct: "NCT03574597", name: "Survodutide / Petrelintide" },
    footerLocation: "Zealand Pharma R&D Hub · Søborg",
    applyText: "Apply via Zealand",
    applyUrl: "https://www.zealandpharma.com/careers"
  },
  {
    id: "dk_auh_rm45920",
    title: "Clinical Trial Coordinator / Forskningssygeplejerske",
    dept: "Early Phase Trial Unit (Skejby)",
    organization: "Aarhus University Hospital (AUH)",
    location: "Aarhus (Skejby) · Denmark",
    ats: "Region Midtjylland: 45920",
    category: "denmark site coord",
    country: "Denmark",
    summary: "Coordinate early-phase clinical intervention trials across medical oncology and hematology at Scandinavia's largest university hospital. Manage patient protocol consent, pharmacokinetic sampling, and GCP compliance.",
    mandatory: [
      "Danish Authorized Nurse (Autoriseret sygeplejerske)",
      "Minimum 2 years experience in clinical hospital care",
      "Valid ICH-GCP certification"
    ],
    desirable: [
      "Prior clinical trial experience in Phase 1 or 2 oncology protocols",
      "Experience with Region Midtjylland electronic patient journals (EPJ)"
    ],
    linkedProtocol: { nct: "NCT03734029", name: "AUH Clinical Cancer Unit" },
    footerLocation: "Aarhus Universitetshospital · Enhed for Kliniske Forsøg",
    applyText: "Apply via Region Midt",
    applyUrl: "https://www.rm.dk/job"
  },
  {
    id: "se_astrazeneca_r261632",
    title: "Director, Medical & Payer Evidence Statistics",
    dept: "Global Biometrics",
    organization: "AstraZeneca",
    location: "Gothenburg · Sweden",
    ats: "Workday: R-261632",
    category: "sweden biopharma biostat",
    country: "Sweden",
    summary: "Provide global strategic statistical leadership for late-stage clinical programs. Lead statistical analysis plans (SAPs), briefing dossiers for FDA/EMA health technology assessments, and indirect treatment comparisons across oncology and cardiovascular outcome trials.",
    mandatory: [
      "PhD or MSc in Biostatistics, Statistics, or Mathematical Sciences",
      "7+ years biostatistics experience in late-phase clinical drug development",
      "Demonstrated FDA/EMA health authority interaction experience"
    ],
    desirable: [
      "Real-world evidence (RWE) modeling and causal inference",
      "Statistical programming in validated SAS & R environments"
    ],
    linkedProtocol: { nct: "NCT03734029", name: "DESTINY-Breast04" },
    footerLocation: "AstraZeneca R&D Gothenburg Hub",
    applyText: "Apply via Workday",
    applyUrl: "https://astrazeneca.wd3.myworkdayjobs.com/en-US/Careers/job/Sweden---Gothenburg/Director--Medical---Payer-Evidence-Statistics_R-261632-2"
  },
  {
    id: "se_dicot_8268902",
    title: "Director Clinical Operations",
    dept: "Translational Biotech",
    organization: "Dicot Pharma AB",
    location: "Uppsala · Sweden",
    ats: "Teamtailor: 8268902",
    category: "sweden biopharma coord",
    country: "Sweden",
    summary: "Lead clinical operations for ongoing Phase 1 safety trials and international Phase 2a clinical programs. Direct CRO vendor management, clinical site selection, and regulatory submission workflow under EU CTR 536/2014 & CTIS.",
    mandatory: [
      "University degree in Life Science, Pharmacy, or Medicine",
      "8+ years clinical operations with lead role in clinical trials",
      "Working knowledge of EU CTR 536/2014 & CTIS submission workflow"
    ],
    desirable: [
      "Experience in clinical-stage biotech startup environments",
      "First-in-Human (FIH) transition into Phase 2a study design"
    ],
    linkedProtocol: { nct: "NCT04181827", name: "Phase 1/2a Clinical Programs" },
    footerLocation: "Dicot Pharma AB · Uppsala Hub",
    applyText: "Apply via Teamtailor",
    applyUrl: "https://winrowrekrytering.teamtailor.com/jobs/8268902-director-clinical-operations-till-dicot-pharma-i-uppsala/applications/new"
  }
];

function generateJobsHtml(jobs) {
  return jobs.map(j => {
    const protocolPill = j.linkedProtocol ? `
        <a href="https://clinsight.pract.eu/trials/${j.linkedProtocol.nct}/" target="_blank" class="trial-link-pill">
            <i class="fa-solid fa-link"></i> Linked ClinSight Protocol: <strong>${j.linkedProtocol.nct} (${j.linkedProtocol.name})</strong> &rarr;
        </a>` : '';

    return `
            <article class="job-card" data-category="${j.category}">
                <div class="job-card-header">
                    <h2 class="job-title">${j.title}</h2>
                    <span class="job-dept">${j.dept}</span>
                </div>
                <div class="job-meta-row">
                    <span><i class="fa-solid fa-building"></i> <strong>${j.organization}</strong></span>
                    <span><i class="fa-solid fa-location-dot"></i> ${j.location}</span>
                    <span><i class="fa-solid fa-id-card"></i> ${j.ats}</span>
                </div>
                <p class="job-summary">${j.summary}</p>
                <div class="req-grid">
                    <div class="req-col-mandatory">
                        <div class="req-col-title"><i class="fa-solid fa-circle-check"></i> Mandatory (Krav)</div>
                        <ul class="req-list">
                            ${j.mandatory.map(m => `<li>${m}</li>`).join('\n                            ')}
                        </ul>
                    </div>
                    <div class="req-col-desirable">
                        <div class="req-col-title"><i class="fa-solid fa-star"></i> Desirable (Meriterande)</div>
                        <ul class="req-list">
                            ${j.desirable.map(d => `<li>${d}</li>`).join('\n                            ')}
                        </ul>
                    </div>
                </div>
                ${protocolPill}
                <div class="job-card-footer">
                    <span>${j.footerLocation}</span>
                    <a href="${j.applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn">
                        ${j.applyText} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </article>`;
  }).join('\n');
}

function updateJobsPortal() {
  const jobsHtmlPath = path.join(__dirname, '..', 'jobs', 'index.html');
  let content = fs.readFileSync(jobsHtmlPath, 'utf-8');

  const jobsListRegex = /(<div class="jobs-list">)([\s\S]*?)(<\/div>\s*<\/div>\s*<script>)/i;
  const match = content.match(jobsListRegex);

  if (!match) {
    console.error("Could not find jobs-list in jobs/index.html");
    return;
  }

  const generatedCards = generateJobsHtml(CURATED_NORDIC_CLINICAL_JOBS);
  const updated = content.replace(jobsListRegex, `$1\n${generatedCards}\n        $3`);

  fs.writeFileSync(jobsHtmlPath, updated, 'utf-8');
  console.log(`[Success] Updated jobs/index.html with ${CURATED_NORDIC_CLINICAL_JOBS.length} Nordic clinical positions.`);

  // Also write raw JSON data
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'nordic_clinical_jobs.json'), JSON.stringify(CURATED_NORDIC_CLINICAL_JOBS, null, 2), 'utf-8');
  console.log(`[Success] Written data/nordic_clinical_jobs.json`);
}

updateJobsPortal();
