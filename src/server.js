import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const PORT = process.env.PORT || 3000;

// Mapping of file extensions to mime types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const method = req.method;

  console.log(`[HTTP] ${method} ${url}`);

  // Handle conferences API endpoint (Lead Magnet / Digital Asset)
  if (url === '/api/conferences' && method === 'GET') {
    const confPath = path.join(config.dirs.analytics, 'conferences.json');
    if (fs.existsSync(confPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(fs.readFileSync(confPath, 'utf-8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Conference database not found' }));
    }
    return;
  }

  // Handle dashboard endpoint
  if (url === '/dashboard' && method === 'GET') {
    const subPath = path.join(config.dirs.analytics, 'subscribers.json');
    const revPath = path.join(config.dirs.analytics, 'revenue.json');
    const postsPath = path.join(config.dirs.analytics, 'posts.json');
    
    let subs = [];
    let revs = [];
    let posts = [];
    
    if (fs.existsSync(subPath)) {
      try { subs = JSON.parse(fs.readFileSync(subPath, 'utf-8')); } catch (e) {}
    }
    if (fs.existsSync(revPath)) {
      try { revs = JSON.parse(fs.readFileSync(revPath, 'utf-8')); } catch (e) {}
    }
    if (fs.existsSync(postsPath)) {
      try { posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8')); } catch (e) {}
    }
    
    // Trailing 30 days revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRevs = revs.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);
    
    const totalUSD = recentRevs.reduce((sum, r) => sum + r.amountUSD, 0);
    const totalSEK = recentRevs.reduce((sum, r) => sum + r.amountSEK, 0);
    
    const targetSEK = 1000;
    const progressPercent = Math.min(100, Math.round((totalSEK / targetSEK) * 100));
    
    // Calculate total engagement
    let totalLikes = 0;
    let totalReposts = 0;
    posts.forEach(p => {
      if (p.metrics) {
        totalLikes += p.metrics.likes || 0;
        totalReposts += p.metrics.reposts || 0;
      }
    });
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboardHtml(subs, totalUSD, totalSEK, progressPercent, posts, totalLikes, totalReposts, revs));
    return;
  }

  // Handle subscriber endpoint
  if (url === '/api/subscribe' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const email = payload.email ? payload.email.trim() : '';

        // Simple validation
        if (!email || !email.includes('@')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please enter a valid email address.' }));
          return;
        }

        const subPath = path.join(config.dirs.analytics, 'subscribers.json');
        let subs = [];

        if (fs.existsSync(subPath)) {
          try {
            subs = JSON.parse(fs.readFileSync(subPath, 'utf-8'));
          } catch (e) {
            subs = [];
          }
        }

        // Check if email already exists
        const exists = subs.some(s => s.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'You are already in the loop!' }));
          return;
        }

        // Add subscriber
        const newSub = {
          email,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        };
        subs.push(newSub);
        
        fs.writeFileSync(subPath, JSON.stringify(subs, null, 2), 'utf-8');
        console.log(`[SUBSCRIBER JOINED] Saved new subscriber: ${email}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Welcome! You have successfully subscribed.' }));

      } catch (err) {
        console.error('Failed to parse subscription payload:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error. Failed to save email.' }));
      }
    });
    return;
  }

  // Handle static file serving
  let filePath = path.join(projectRoot, 'public', url === '/' ? 'index.html' : url);
  
  // Prevent directory traversal attacks
  const relative = path.relative(path.join(projectRoot, 'public'), filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`FutureLoop Landing Page Server is now ONLINE!`);
  console.log(`Local address: http://localhost:${PORT}`);
  console.log(`Serving static files from: ${path.join(projectRoot, 'public')}`);
  console.log(`Subscribers database: ${path.join(config.dirs.analytics, 'subscribers.json')}`);
  console.log(`===================================================`);
});

function renderDashboardHtml(subs, totalUSD, totalSEK, progressPercent, posts, totalLikes, totalReposts, revs) {
  const milestoneAchieved = totalSEK >= 1000;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TheFutureLoop | Partner Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #030712;
      --card-bg: rgba(17, 24, 39, 0.7);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #f3f4f6;
      --text-secondary: #9ca3af;
      --accent-blue: #3b82f6;
      --accent-purple: #8b5cf6;
      --accent-green: #10b981;
      --font-sans: 'Outfit', sans-serif;
      --font-mono: 'Space Grotesk', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-color);
      color: var(--text-primary);
      font-family: var(--font-sans);
      padding: 3rem 1.5rem;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 2.5rem; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; }
    .logo { font-family: var(--font-mono); font-size: 2rem; font-weight: 700; }
    .logo span { color: var(--accent-blue); }
    .badge { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.5rem 1rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.9rem; }
    
    /* Stats Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border-color); padding: 2rem; border-radius: 16px; backdrop-filter: blur(10px); }
    .card h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 0.5rem; font-family: var(--font-mono); }
    .card-val { font-size: 2.5rem; font-weight: 800; }
    .card-sub { font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem; }
    
    /* Milestone Box */
    .milestone-box { background: var(--card-bg); border: 1px solid var(--border-color); padding: 2.5rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem; }
    .milestone-header { display: flex; justify-content: space-between; align-items: center; }
    .milestone-title { font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; }
    .milestone-target { font-size: 0.9rem; color: var(--text-secondary); }
    
    /* Progress Bar */
    .progress-bar-container { background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); height: 24px; border-radius: 12px; overflow: hidden; position: relative; }
    .progress-bar-fill { background: linear-gradient(to right, var(--accent-blue), var(--accent-purple)); width: ${progressPercent}%; height: 100%; transition: width 0.5s ease-out; }
    .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.85rem; font-weight: 700; font-family: var(--font-mono); color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
    
    .milestone-summary { font-size: 1rem; color: var(--text-secondary); }
    .milestone-celebration { display: flex; align-items: center; gap: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 1rem 1.5rem; border-radius: 12px; color: #34d399; font-weight: 600; }
    
    /* Tables Layout */
    .tables-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 2rem; }
    .table-container { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.75rem; overflow: hidden; display: flex; flex-direction: column; gap: 1.25rem; }
    .table-container h3 { font-family: var(--font-mono); font-size: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; }
    
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 0.75rem 1rem; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase; font-family: var(--font-mono); border-bottom: 1px solid var(--border-color); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.95rem; }
    tr:last-child td { border-bottom: none; }
    .no-data { text-align: center; color: var(--text-secondary); padding: 2rem; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo"><span>TheFuture</span>Loop Research & Intelligence</div>
      <div class="badge">Niche: Deep Tech, Compute & Bio-Genomics</div>
    </header>
    
    <!-- Milestone Progress Card -->
    <div class="milestone-box">
      <div class="milestone-header">
        <div class="milestone-title">📈 Monetization Milestone 1 Tracker</div>
        <div class="milestone-target">Target: 1,000.00 SEK / month</div>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar-fill"></div>
        <div class="progress-text">${progressPercent}% Completed</div>
      </div>
      
      ${milestoneAchieved ? `
        <div class="milestone-celebration">
          <span>🎉</span> 
          <span>Congratulations! You have cleared Milestone 1 (1,000 SEK). Keep scale-optimizing towards Milestone 2 (5,000 SEK)!</span>
        </div>
      ` : `
        <div class="milestone-summary">
          Currently at **$${totalUSD.toFixed(2)} USD (~${totalSEK.toFixed(2)} SEK)**. You need **${(1000 - totalSEK).toFixed(2)} SEK** more to clear this milestone.
        </div>
      `}
    </div>

    <!-- Overview Stats Grid -->
    <div class="grid">
      <div class="card">
        <h3>Total Subscribers</h3>
        <div class="card-val">${subs.length}</div>
        <div class="card-sub">Active email readers</div>
      </div>
      <div class="card">
        <h3>Trailing 30-Day Earnings</h3>
        <div class="card-val">${totalSEK.toFixed(0)} kr</div>
        <div class="card-sub">$${totalUSD.toFixed(2)} USD value</div>
      </div>
      <div class="card">
        <h3>Published Social Posts</h3>
        <div class="card-val">${posts.length}</div>
        <div class="card-sub">${totalLikes} Likes | ${totalReposts} Reposts</div>
      </div>
      <div class="card">
        <h3>Active Lead Magnet</h3>
        <div class="card-val">Calendar</div>
        <div class="card-sub"><a href="/api/conferences" target="_blank" style="color:var(--accent-blue); text-decoration:none;">View Conference JSON Asset</a></div>
      </div>
    </div>
    
    <!-- Lists Section -->
    <div class="tables-section">
      <!-- Subscribers List -->
      <div class="table-container">
        <h3>Active Newsletter Subscribers</h3>
        <table>
          <thead>
            <tr>
              <th>Email Address</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            ${subs.length === 0 ? `
              <tr><td colspan="2" class="no-data">No subscribers registered yet.</td></tr>
            ` : subs.slice().reverse().slice(0, 10).map(s => `
              <tr>
                <td>${s.email}</td>
                <td>${s.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Revenue History -->
      <div class="table-container">
        <h3>Monetization Income Log</h3>
        <table>
          <thead>
            <tr>
              <th>Source / Platform</th>
              <th>USD</th>
              <th>SEK value</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${revs.length === 0 ? `
              <tr><td colspan="4" class="no-data">No revenue events logged yet.</td></tr>
            ` : revs.slice().reverse().slice(0, 10).map(r => `
              <tr>
                <td><strong>${r.source}</strong></td>
                <td>$${r.amountUSD.toFixed(2)}</td>
                <td>${r.amountSEK.toFixed(2)} kr</td>
                <td>${r.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
