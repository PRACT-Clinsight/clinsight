const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const p1 = 'function quickFilter';
const p3 = 'function switchNav';

const idx1 = content.indexOf(p1);
const idx3 = content.indexOf(p3);

if (idx1 === -1 || idx3 === -1) {
  console.error('Cannot locate bounds for quickFilter/switchNav');
  process.exit(1);
}

const replacement = `function quickFilter(type) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');

            if (type === 'adc') {
                clearFilters();
                document.getElementById('filterModality').value = 'ADC';
            } else if (type === 'cart') {
                clearFilters();
                document.getElementById('filterModality').value = 'CAR-T';
            } else if (type === 'bispecific') {
                clearFilters();
                document.getElementById('filterModality').value = 'Bispecific';
            } else if (type === 'checkpoint') {
                clearFilters();
                document.getElementById('filterModality').value = 'Checkpoint';
            } else if (type === 'glp1') {
                clearFilters();
                document.getElementById('filterModality').value = 'GLP-1';
            } else if (type === 'has-results') {
                clearFilters();
                if (document.getElementById('filterResultsStatus')) document.getElementById('filterResultsStatus').value = 'has-results';
            } else if (type === 'has-protocol') {
                clearFilters();
                if (document.getElementById('filterResultsStatus')) document.getElementById('filterResultsStatus').value = 'has-protocol';
            } else if (type === 'vacant') {
                clearFilters();
                if (document.getElementById('filterResultsStatus')) document.getElementById('filterResultsStatus').value = 'vacant';
            } else if (type === 'phase3') {
                document.getElementById('filterPhase').value = 'Phase 3';
            } else if (type === 'completed') {
                document.getElementById('filterStatus').value = 'completed';
            }
            applyFilters();
        }

        function clearFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('filterCategory').value = '';
            document.getElementById('filterModality').value = '';
            if (document.getElementById('filterResultsStatus')) document.getElementById('filterResultsStatus').value = '';
            document.getElementById('filterPhase').value = '';
            document.getElementById('filterStatus').value = '';
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            applyFilters();
        }

        function exportFilteredCohortCSV() {
            if (!CURRENT_FILTERED || CURRENT_FILTERED.length === 0) {
                alert('No trials match current filters to export.');
                return;
            }

            const headers = [
                'nctId',
                'acronym',
                'briefTitle',
                'modality',
                'phase',
                'status',
                'year',
                'enrollment',
                'sponsor',
                'conditions',
                'hasResults',
                'hasPublication',
                'isResultsVacant',
                'protocolUrl',
                'sapUrl',
                'resultsUrl',
                'pubmedUrl',
                'registryUrl'
            ];

            function escapeCsv(val) {
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return '"' + str + '"';
            }

            const rows = CURRENT_FILTERED.map(t => [
                escapeCsv(t.id),
                escapeCsv(t.acronym !== t.id ? t.acronym : ''),
                escapeCsv(t.title),
                escapeCsv(t.modality),
                escapeCsv(t.phase),
                escapeCsv(t.status),
                escapeCsv(t.year),
                escapeCsv(t.enrollment),
                escapeCsv(t.sponsor),
                escapeCsv(t.conditions),
                escapeCsv(t.hasResults),
                escapeCsv(t.hasPublication),
                escapeCsv(t.isResultsVacant),
                escapeCsv(t.protocolUrl || ''),
                escapeCsv(t.sapUrl || ''),
                escapeCsv(t.resultsUrl || ''),
                escapeCsv(t.primaryPmid ? ('https://pubmed.ncbi.nlm.nih.gov/' + t.primaryPmid + '/') : ''),
                escapeCsv(t.registryUrl)
            ].join(','));

            const csvContent = [headers.join(','), ...rows].join('\\r\\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = 'ClinSight_Cohort_Export_' + timestamp + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        `;

content = content.substring(0, idx1) + replacement + content.substring(idx3);
fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully patched index.html with new quickFilter, clearFilters, and exportFilteredCohortCSV!');
