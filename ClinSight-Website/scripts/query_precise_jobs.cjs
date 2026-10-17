const https = require('https');

// Search for exact clinical titles without boolean "OR" which matches the word "or"
const terms = ['klinisk prövning', 'kliniska prövningar', 'clinical trials', 'clinical investigation', 'CRA', 'studiekoordinator'];

async function searchWord(term) {
    return new Promise((resolve) => {
        const url = 'https://jobsearch.api.jobtechdev.se/search?q=' + encodeURIComponent('"' + term + '"') + '&limit=15';
        https.get(url, { headers: { 'accept': 'application/json' } }, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(raw);
                    resolve({ term, total: json.total ? json.total.value : 0, hits: json.hits || [] });
                } catch(e) {
                    resolve({ term, total: 0, hits: [] });
                }
            });
        }).on('error', () => resolve({ term, total: 0, hits: [] }));
    });
}

async function run() {
    for (const t of terms) {
        const res = await searchWord(t);
        console.log(`\n================== [TERM: "${t}"] (Total: ${res.total}) ==================`);
        res.hits.slice(0, 5).forEach((h, i) => {
            const title = h.headline;
            const emp = h.employer ? h.employer.name : 'Unknown';
            const city = h.workplace_address ? h.workplace_address.city : 'N/A';
            const url = h.web_url;
            console.log(`[#${i+1}] ${title} | ${emp} | ${city}`);
            console.log(`    Link: ${url}`);
        });
    }
}

run();
