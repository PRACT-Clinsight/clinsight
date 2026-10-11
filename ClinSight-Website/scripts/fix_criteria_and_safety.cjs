const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'build_pages.cjs');
let code = fs.readFileSync(scriptPath, 'utf8');

// 1. Remove vigisightDrug computation
const oldVigisightCompute = `  // Compute primary drug for VigiSight FAERS safety cross-link
  let vigisightDrug = null;
  if (trial.interventions && trial.interventions.length > 0) {
    const rawDrug = trial.interventions[0].replace(/^Drug:\\s*/i, '').trim();
    const cleaned = rawDrug.split(/[\\s,\\/]+/)[0];
    if (cleaned && cleaned.length >= 3 && !['placebo', 'study', 'saline', 'standard', 'comparator'].includes(cleaned.toLowerCase())) {
      vigisightDrug = cleaned;
    }
  }`;

if (code.includes(oldVigisightCompute)) {
  code = code.replace(oldVigisightCompute, `  // Safety signals / FAERS cross-linking completely removed per strict liability protocol`);
  console.log('Removed vigisightDrug computation.');
}

// 2. Remove .vigisight-action CSS
const oldVigisightCss = `        .vigisight-action {
            color: var(--emerald);
            border-color: rgba(16, 185, 129, 0.35);
        }
        .vigisight-action:hover {
            color: #34d399;
            border-color: rgba(16, 185, 129, 0.7);
        }`;

if (code.includes(oldVigisightCss)) {
  code = code.replace(oldVigisightCss, '');
  console.log('Removed vigisight CSS.');
}

// 3. Remove vigisight button from action-bar
const oldVigisightBtn = `            \${vigisightDrug ? \`
            <a href="https://vigisight.pract.eu/?search=\${encodeURIComponent(vigisightDrug)}" target="_blank" class="btn-action vigisight-action">
                <i class="fa-solid fa-shield-virus"></i> FAERS Safety Signals (\${escapeHtml(vigisightDrug)}) ↗
            </a>\` : ''}`;

if (code.includes(oldVigisightBtn)) {
  code = code.replace(oldVigisightBtn, '');
  console.log('Removed vigisight button from action-bar.');
}

// 4. Update Eligibility Criteria section to render VERBATIM inclusionCriteria and exclusionCriteria
const oldCriteriaCard = `        <!-- Eligibility Criteria Checklist -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-list-check"></i> Patient Eligibility Checklist</div>
            <div class="criteria-grid">
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-circle-check" style="color:var(--emerald);"></i> Key Inclusion Criteria</h4>
                    <ul>
                        \${(trial.eligibilityCriteria && trial.eligibilityCriteria.inclusion && trial.eligibilityCriteria.inclusion.length > 0)
                          ? trial.eligibilityCriteria.inclusion.map(c => \`<li>\${escapeHtml(c)}</li>\`).join('')
                          : \`<li>Histologically confirmed diagnosis for \${conditions || subtype}</li>
                             <li>Measurable disease according to standardized response evaluation criteria</li>
                             <li>Adequate baseline organ and bone marrow function</li>
                             <li>Age &ge; 18 years at time of written informed consent</li>\`}
                    </ul>
                </div>
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i> Key Exclusion Criteria</h4>
                    <ul>
                        \${(trial.eligibilityCriteria && trial.eligibilityCriteria.exclusion && trial.eligibilityCriteria.exclusion.length > 0)
                          ? trial.eligibilityCriteria.exclusion.map(c => \`<li>\${escapeHtml(c)}</li>\`).join('')
                          : \`<li>Active, clinically uncontrolled central nervous system (CNS) metastases</li>
                             <li>Severe or uncontrolled concurrent systemic disease or active infection</li>
                             <li>Prior intolerance or hypersensitivity to study intervention</li>
                             <li>Participation in another investigational intervention within protocol window</li>\`}
                    </ul>
                </div>
            </div>
        </div>`;

const newCriteriaCard = `        \${(trial.inclusionCriteria && trial.inclusionCriteria.length > 0) ? \`
        <!-- Verbatim Registry Eligibility Criteria (ClinicalTrials.gov eligibilityModule) -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-list-check"></i> Verbatim Protocol Eligibility Criteria</div>
            <div class="criteria-grid">
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-circle-check" style="color:var(--emerald);"></i> Key Inclusion Criteria</h4>
                    <ul>
                        \${trial.inclusionCriteria.map(c => \`<li>\${escapeHtml(c).replace(/\\n/g, '<br>')}</li>\`).join('')}
                    </ul>
                </div>
                \${(trial.exclusionCriteria && trial.exclusionCriteria.length > 0) ? \`
                <div class="criteria-box">
                    <h4><i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i> Key Exclusion Criteria</h4>
                    <ul>
                        \${trial.exclusionCriteria.map(c => \`<li>\${escapeHtml(c).replace(/\\n/g, '<br>')}</li>\`).join('')}
                    </ul>
                </div>\` : ''}
            </div>
        </div>\` : ''}`;

if (code.includes(oldCriteriaCard)) {
  code = code.replace(oldCriteriaCard, newCriteriaCard);
  console.log('Replaced templated eligibility with verbatim registry criteria.');
} else {
  console.error('Could not find oldCriteriaCard in build_pages.cjs!');
}

fs.writeFileSync(scriptPath, code, 'utf8');
console.log('build_pages.cjs patched successfully.');
