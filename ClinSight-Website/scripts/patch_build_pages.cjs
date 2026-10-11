const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'build_pages.cjs');
let content = fs.readFileSync(scriptPath, 'utf8');

// 1. Add doc buttons CSS to detail page style block
const styleMarker = `.action-bar {`;
const docBtnStyles = `        /* 1-Click Primary Document Action Buttons (BioTransfer-style utility) */
        .doc-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 12.5px;
            font-family: var(--font-mono);
            font-weight: 600;
            text-decoration: none;
            transition: all 0.15s ease;
            line-height: 1.2;
        }
        .doc-btn:hover {
            transform: translateY(-1px);
        }
        .doc-btn-protocol {
            background: rgba(56, 189, 248, 0.12);
            color: var(--cyan);
            border: 1px solid rgba(56, 189, 248, 0.35);
        }
        .doc-btn-protocol:hover {
            background: rgba(56, 189, 248, 0.25);
            border-color: var(--cyan);
            color: #fff;
        }
        .doc-btn-sap {
            background: rgba(168, 85, 247, 0.12);
            color: var(--purple);
            border: 1px solid rgba(168, 85, 247, 0.35);
        }
        .doc-btn-sap:hover {
            background: rgba(168, 85, 247, 0.25);
            border-color: var(--purple);
            color: #fff;
        }
        .doc-btn-results {
            background: rgba(16, 185, 129, 0.12);
            color: var(--emerald);
            border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .doc-btn-results:hover {
            background: rgba(16, 185, 129, 0.25);
            border-color: var(--emerald);
            color: #fff;
        }
        .doc-btn-pubmed {
            background: rgba(245, 158, 11, 0.12);
            color: var(--amber);
            border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .doc-btn-pubmed:hover {
            background: rgba(245, 158, 11, 0.25);
            border-color: var(--amber);
            color: #fff;
        }
        .badge.vacant { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); }

        .action-bar {`;

if (!content.includes('.doc-btn-protocol')) {
  content = content.replace(styleMarker, docBtnStyles);
}

// 2. Add document variables in renderTrialPage
const varMarker = `  const interventions = (trial.interventions || []).map(escapeHtml).join(', ');`;
const docVars = `  const interventions = (trial.interventions || []).map(escapeHtml).join(', ');
  const protocolUrl = trial.protocolUrl || null;
  const sapUrl = trial.sapUrl || null;
  const resultsUrl = trial.resultsUrl || null;
  const registryUrl = trial.registryUrl || \`https://clinicaltrials.gov/study/\${trial.nctId}\`;
  const primaryPmid = trial.primaryPmid || null;
  const isResultsVacant = !!trial.isResultsVacant;`;

if (!content.includes('const protocolUrl = trial.protocolUrl')) {
  content = content.replace(varMarker, docVars);
}

// 3. Add vacant badge to badge-row
const badgeMarker = `<span class="badge modality">\${modality}</span>\n        </div>`;
const newBadgeRow = `<span class="badge modality">\${modality}</span>\n            \${isResultsVacant ? '<span class="badge vacant"><i class="fa-solid fa-triangle-exclamation"></i> Results-Vacant</span>' : ''}\n        </div>`;

if (!content.includes('Results-Vacant</span>')) {
  content = content.replace(badgeMarker, newBadgeRow);
}

// 4. Update action-bar toolbar with document action buttons
const actionBarOld = `        <!-- Action Toolbar: 1-Click Citation, Protocol JSON, and VigiSight Safety Signals -->
        <div class="action-bar">
            <button onclick="copyCitation()" id="btnCopyCitation" class="btn-action">
                <i class="fa-regular fa-copy"></i> Copy Citation
            </button>
            <button onclick="downloadJson()" class="btn-action">
                <i class="fa-solid fa-download"></i> Download Protocol JSON
            </button>
            \${vigisightDrug ? \`
            <a href="https://vigisight.pract.eu/?search=\${encodeURIComponent(vigisightDrug)}" target="_blank" class="btn-action vigisight-action">
                <i class="fa-solid fa-shield-virus"></i> View FAERS Safety Signals (\${escapeHtml(vigisightDrug)}) ↗
            </a>\` : ''}
        </div>`;

const actionBarNew = `        <!-- Action Toolbar: 1-Click Document Access, Citation & Protocol JSON -->
        <div class="action-bar">
            \${protocolUrl ? \`
            <a href="\${protocolUrl}" target="_blank" rel="noopener noreferrer" class="doc-btn doc-btn-protocol" title="Download official Protocol PDF from ClinicalTrials.gov CDN">
                <i class="fa-solid fa-file-pdf"></i> Protocol (PDF)
            </a>\` : ''}
            \${(sapUrl && sapUrl !== protocolUrl) ? \`
            <a href="\${sapUrl}" target="_blank" rel="noopener noreferrer" class="doc-btn doc-btn-sap" title="Download Statistical Analysis Plan (SAP) PDF">
                <i class="fa-solid fa-chart-line"></i> SAP (PDF)
            </a>\` : ''}
            \${(trial.hasResults && resultsUrl) ? \`
            <a href="\${resultsUrl}" target="_blank" rel="noopener noreferrer" class="doc-btn doc-btn-results" title="View statutory tabular results on ClinicalTrials.gov">
                <i class="fa-solid fa-square-poll-vertical"></i> Results Tab ↗
            </a>\` : ''}
            \${primaryPmid ? \`
            <a href="https://pubmed.ncbi.nlm.nih.gov/\${primaryPmid}/" target="_blank" rel="noopener noreferrer" class="doc-btn doc-btn-pubmed" title="View primary peer-reviewed publication on PubMed (PMID: \${primaryPmid})">
                <i class="fa-solid fa-book-medical"></i> PubMed: \${primaryPmid} ↗
            </a>\` : ''}
            <button onclick="copyCitation()" id="btnCopyCitation" class="btn-action">
                <i class="fa-regular fa-copy"></i> Copy Citation
            </button>
            <button onclick="downloadJson()" class="btn-action">
                <i class="fa-solid fa-download"></i> Protocol JSON
            </button>
            \${vigisightDrug ? \`
            <a href="https://vigisight.pract.eu/?search=\${encodeURIComponent(vigisightDrug)}" target="_blank" class="btn-action vigisight-action">
                <i class="fa-solid fa-shield-virus"></i> FAERS Safety Signals (\${escapeHtml(vigisightDrug)}) ↗
            </a>\` : ''}
        </div>`;

if (content.includes(actionBarOld)) {
  content = content.replace(actionBarOld, actionBarNew);
} else {
  console.log('Action bar old text not exact match, checking index bounds...');
}

// 5. Update Primary Sources & Statutory Registries card
const sourcesCardOld = `        <!-- Direct Primary Source Actions -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-file-contract"></i> Primary Sources & Statutory Registries</div>
            <p style="font-size:13.5px; color:var(--text-med); margin-bottom:16px;">Access the verbatim statutory protocol records, regulatory postings, and peer-reviewed literature across statutory repositories:</p>
            <div class="actions-row">
                <a href="https://clinicaltrials.gov/study/\${nctId}" target="_blank" class="btn btn-primary">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Open ClinicalTrials.gov Record
                </a>
                <a href="https://pubmed.ncbi.nlm.nih.gov/?term=\${encodeURIComponent(nctId)}" target="_blank" class="btn btn-outline">
                    <i class="fa-solid fa-book-medical"></i> Search PubMed Literature (\${nctId})
                </a>
                <a href="https://scholar.google.com/scholar?q=\${encodeURIComponent(nctId)}" target="_blank" class="btn btn-outline">
                    <i class="fa-solid fa-graduation-cap"></i> Google Scholar Citations
                </a>
            </div>
        </div>`;

const sourcesCardNew = `        <!-- Direct Primary Source Actions -->
        <div class="card">
            <div class="card-header"><i class="fa-solid fa-file-contract"></i> Primary Sources & Statutory Registries</div>
            <p style="font-size:13.5px; color:var(--text-med); margin-bottom:16px;">Access the verbatim statutory protocol records, regulatory postings, and peer-reviewed literature across statutory repositories:</p>
            <div class="actions-row">
                <a href="\${registryUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Open ClinicalTrials.gov Record
                </a>
                \${protocolUrl ? \`
                <a href="\${protocolUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="border-color:rgba(56, 189, 248, 0.4); color:var(--cyan);">
                    <i class="fa-solid fa-file-pdf"></i> Download Protocol (PDF)
                </a>\` : ''}
                \${(sapUrl && sapUrl !== protocolUrl) ? \`
                <a href="\${sapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="border-color:rgba(168, 85, 247, 0.4); color:var(--purple);">
                    <i class="fa-solid fa-chart-line"></i> Download SAP (PDF)
                </a>\` : ''}
                \${(trial.hasResults && resultsUrl) ? \`
                <a href="\${resultsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="border-color:rgba(16, 185, 129, 0.4); color:var(--emerald);">
                    <i class="fa-solid fa-square-poll-vertical"></i> View Results Tab
                </a>\` : ''}
                \${primaryPmid ? \`
                <a href="https://pubmed.ncbi.nlm.nih.gov/\${primaryPmid}/" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="border-color:rgba(245, 158, 11, 0.4); color:var(--amber);">
                    <i class="fa-solid fa-book-medical"></i> Primary Paper (PMID: \${primaryPmid})
                </a>\` : \`
                <a href="https://pubmed.ncbi.nlm.nih.gov/?term=\${encodeURIComponent(nctId)}" target="_blank" class="btn btn-outline">
                    <i class="fa-solid fa-book-medical"></i> Search PubMed Literature (\${nctId})
                </a>\`}
                <a href="https://scholar.google.com/scholar?q=\${encodeURIComponent(nctId)}" target="_blank" class="btn btn-outline">
                    <i class="fa-solid fa-graduation-cap"></i> Google Scholar Citations
                </a>
            </div>
        </div>`;

if (content.includes(sourcesCardOld)) {
  content = content.replace(sourcesCardOld, sourcesCardNew);
}

fs.writeFileSync(scriptPath, content, 'utf8');
console.log('build_pages.cjs updated successfully!');
