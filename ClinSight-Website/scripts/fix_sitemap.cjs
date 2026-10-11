const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'build_pages.cjs');
let code = fs.readFileSync(filePath, 'utf8');

const idx1 = code.indexOf('function buildSitemap(trials) {');
const idx2 = code.indexOf('// Static, crawlable directory of every trial');

if (idx1 === -1 || idx2 === -1) {
  console.error('Could not find buildSitemap boundaries');
  process.exit(1);
}

const newSitemap = `function buildSitemap(trials) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  urls.push('  <url>\\n    <loc>' + BASE_URL + '/</loc>\\n    <lastmod>' + today + '</lastmod>\\n    <changefreq>daily</changefreq>\\n    <priority>1.0</priority>\\n  </url>');
  urls.push('  <url>\\n    <loc>' + BASE_URL + '/trials/</loc>\\n    <lastmod>' + today + '</lastmod>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.9</priority>\\n  </url>');

  const extra = ['/compare/', '/compare/myeloma-car-t-bispecific-adc/'].filter((p) => fs.existsSync(path.join(ROOT_DIR, p.slice(1), 'index.html')));
  for (const p of extra) {
    urls.push('  <url>\\n    <loc>' + BASE_URL + p + '</loc>\\n    <lastmod>' + today + '</lastmod>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.9</priority>\\n  </url>');
  }

  for (const trial of trials) {
    urls.push('  <url>\\n    <loc>' + BASE_URL + '/trials/' + trial.nctId + '/</loc>\\n    <lastmod>' + today + '</lastmod>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>');
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' + urls.join('\\n') + '\\n</urlset>';
}`;

code = code.substring(0, idx1) + newSitemap + '\n\n' + code.substring(idx2);
fs.writeFileSync(filePath, code, 'utf8');
console.log('buildSitemap updated successfully!');
