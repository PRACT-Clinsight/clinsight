const https = require('https');

// Search for exact clinical titles in medical device & life science
const terms = ['"klinisk prövning"', '"kliniska prövningar"', '"clinical investigation"', '"ISO 14155"', '"clinical trial manager"', '"clinical research associate"'];
const query = terms.join(' OR ');
const url = 'https://jobsearch.api.jobtechdev.se/search?q=' + encodeURIComponent(query) + '&limit=25';

https.get(url, { headers: { 'accept': 'application/json' } }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(raw);
            console.log('Total verified clinical hits:', json.total ? json.total.value : 0);
            if (json.hits) {
                json.hits.forEach((h, i) => {
                    const title = h.headline;
                    const emp = h.employer ? h.employer.name : 'Unknown';
                    const city = h.workplace_address ? h.workplace_address.city : 'N/A';
                    const desc = h.description ? h.description.text.substring(0, 140).replace(/\n/g, ' ') : '';
                    console.log(`[#${i+1}] ${title} | ${emp} | ${city}`);
                    console.log(`    Snippet: ${desc}...`);
                });
            }
        } catch(e) {
            console.error('Error:', e.message);
        }
    });
}).on('error', err => console.error('Request error:', err.message));
