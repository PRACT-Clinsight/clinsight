import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { stripDirectoryMetadata } from './stripper.js';
import { registerPublishedPost, addToPublishedHistory } from './monitor.js';

function markdownToHtml(md) {
  let html = md
    .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
    
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/^\*\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/^-\s+(.*)$/gm, '<li>$1</li>');
  
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<li>')) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return html;
}

function getNewsletterTemplate(title, dateStr, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | FutureLoop Briefing</title>
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
      --font-sans: 'Outfit', sans-serif;
      --font-mono: 'Space Grotesk', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-color);
      color: var(--text-primary);
      font-family: var(--font-sans);
      padding: 4rem 1.5rem;
      min-height: 100vh;
      line-height: 1.7;
      position: relative;
    }
    .glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, var(--accent-purple) 0%, transparent 70%);
      top: -10%;
      right: 10%;
      opacity: 0.12;
      z-index: -1;
      filter: blur(100px);
      pointer-events: none;
    }
    .container { max-width: 750px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }
    .back-link {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--accent-blue); }
    header { border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
    header h1 { font-family: var(--font-mono); font-size: 2.25rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
    .meta { font-size: 0.9rem; color: var(--text-secondary); font-family: var(--font-mono); }
    
    article { display: flex; flex-direction: column; gap: 1.5rem; font-size: 1.1rem; }
    article p { margin-bottom: 0.5rem; }
    article h2 { font-family: var(--font-mono); font-size: 1.5rem; margin-top: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; color: var(--accent-blue); }
    article h3 { font-family: var(--font-mono); font-size: 1.2rem; margin-top: 1rem; color: var(--text-primary); }
    article a { color: var(--accent-blue); text-decoration: none; border-bottom: 1px dashed var(--accent-blue); transition: color 0.2s; }
    article a:hover { color: var(--accent-purple); border-bottom-style: solid; }
    article li { margin-left: 1.5rem; margin-bottom: 0.5rem; list-style-type: square; }
    
    footer { border-top: 1px solid var(--border-color); padding-top: 2rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin-top: 3rem; }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="container">
    <a href="/" class="back-link">&larr; Back to landing page</a>
    
    <header>
      <h1>${title}</h1>
      <div class="meta">Published: ${dateStr.replace(/_/g, '-')} | Sourced by FutureLoop</div>
    </header>
    
    <article>
      ${contentHtml}
    </article>
    
    <footer>
      <p>&copy; 2026 FutureLoop. Follow us on X: <a href="https://x.com/futureloop_co" target="_blank">@futureloop_co</a></p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Direct post to X (Twitter) using twitter-api-v2
 */
async function postToXDirect(content) {
  if (!config.xApiKey || !config.xApiSecret || !config.xAccessToken || !config.xAccessSecret) {
    throw new Error('Missing X API credentials in environment.');
  }

  const client = new TwitterApi({
    appKey: config.xApiKey,
    appSecret: config.xApiSecret,
    accessToken: config.xAccessToken,
    accessSecret: config.xAccessSecret,
  });

  if (Array.isArray(content)) {
    console.log(`Publishing X thread (${content.length} posts)...`);
    const tweetResults = await client.v2.tweetThread(content);
    return { id: tweetResults[0].data.id, platform: 'x', type: 'thread', link: `https://x.com/i/status/${tweetResults[0].data.id}` };
  } else {
    console.log('Publishing single X post...');
    const result = await client.v2.tweet(content);
    return { id: result.data.id, platform: 'x', type: 'post', link: `https://x.com/i/status/${result.data.id}` };
  }
}

/**
 * Direct post to LinkedIn via UGC API
 */
async function postToLinkedInDirect(text) {
  if (!config.linkedinAccessToken || !config.linkedinPersonId) {
    throw new Error('Missing LinkedIn credentials (Token or Person ID) in environment.');
  }

  console.log('Publishing LinkedIn post...');
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.linkedinAccessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${config.linkedinPersonId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LinkedIn API failed: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const id = data.id || 'linkedin_post_id';
  return { id, platform: 'linkedin', link: `https://www.linkedin.com/feed/update/${id}` };
}

/**
 * Post using Buffer API (unified scheduler)
 */
async function postToBuffer(text) {
  if (!config.bufferAccessToken || config.bufferProfileIds.length === 0) {
    throw new Error('Missing Buffer API credentials or profile IDs.');
  }

  console.log(`Scheduling to Buffer for profiles: ${config.bufferProfileIds.join(', ')}...`);
  
  const results = [];
  for (const profileId of config.bufferProfileIds) {
    const params = new URLSearchParams({
      text: text,
      'profile_ids[]': profileId,
      shorten: 'false',
      now: 'true' // post immediately
    });

    const res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.bufferAccessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!res.ok) {
      console.error(`Buffer post failed for profile ${profileId}: ${res.status}`);
      continue;
    }

    const data = await res.json();
    results.push({
      profileId,
      success: true,
      updates: data.updates
    });
  }

  return { platform: 'buffer', results };
}

/**
 * Core publishing coordinator
 */
export async function publishPost(content, platform = 'x') {
  const isSimulation = config.portingMode === 'simulation';
  
  if (isSimulation) {
    console.log(`\n[SIMULATION] Posting to ${platform.toUpperCase()}:`);
    console.log('--------------------------------------------------');
    console.log(Array.isArray(content) ? content.join('\n\n--- THREAD BREAK ---\n\n') : content);
    console.log('--------------------------------------------------');
    const mockId = `${platform}_mock_${Date.now()}`;
    return { id: mockId, link: `https://simulation.topstatszone.com/${platform}/${mockId}`, status: 'simulated' };
  }

  // Active production posting
  try {
    // Check if we can use Buffer (if configured)
    if (config.bufferAccessToken && config.bufferProfileIds.length > 0) {
      const textContent = Array.isArray(content) ? content.join('\n\n') : content;
      return await postToBuffer(textContent);
    }
    
    // Otherwise, direct integration
    if (platform === 'x') {
      return await postToXDirect(content);
    } else if (platform === 'linkedin') {
      const textContent = Array.isArray(content) ? content.join('\n\n') : content;
      return await postToLinkedInDirect(textContent);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Production publishing error on ${platform}:`, error.message);
    throw error;
  }
}

/**
 * Handle draft scheduling & movement
 */
export function scheduleDraft(dateStr) {
  const draftFile = path.join(config.dirs.drafts, `draft_${dateStr}.json`);
  if (!fs.existsSync(draftFile)) {
    throw new Error(`Draft file not found for date ${dateStr}`);
  }

  const scheduledFile = path.join(config.dirs.scheduled, `scheduled_${dateStr}.json`);
  fs.copyFileSync(draftFile, scheduledFile);
  console.log(`Approved & scheduled draft for ${dateStr}. Copied to ${scheduledFile}`);

  // Static site compilation for Netlify past issues archive
  try {
    const draft = JSON.parse(fs.readFileSync(draftFile, 'utf-8'));
    const newsletter = draft.newsletter;
    const newsletterMdPath = path.join(config.dirs.newsletters, `newsletter_${dateStr}.md`);
    
    if (newsletter && newsletter.title && fs.existsSync(newsletterMdPath)) {
      const publicNewslettersDir = path.join(process.cwd(), 'public', 'newsletters');
      if (!fs.existsSync(publicNewslettersDir)) {
        fs.mkdirSync(publicNewslettersDir, { recursive: true });
      }

      // compile markdown content to HTML
      const mdContent = fs.readFileSync(newsletterMdPath, 'utf-8');
      const htmlContent = markdownToHtml(mdContent);
      const fullPageHtml = getNewsletterTemplate(newsletter.title, dateStr, htmlContent);
      
      const fileName = `newsletter_${dateStr}.html`;
      const filePath = path.join(publicNewslettersDir, fileName);
      fs.writeFileSync(filePath, fullPageHtml, 'utf-8');
      console.log(`Compiled static newsletter issue HTML to: public/newsletters/${fileName}`);

      // update public catalog index
      const catalogPath = path.join(process.cwd(), 'public', 'newsletters.json');
      let catalog = [];
      if (fs.existsSync(catalogPath)) {
        try {
          catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        } catch (e) {
          catalog = [];
        }
      }

      // prevent duplicates in catalog index
      catalog = catalog.filter(item => item.date !== dateStr);
      catalog.push({
        date: dateStr,
        title: newsletter.title,
        path: `newsletters/${fileName}`
      });

      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
      console.log(`Updated newsletter archive index: public/newsletters.json`);
    }
  } catch (err) {
    console.error('Failed to compile static newsletter page:', err.message);
  }

  // Enforce Anonymity: Automatically strip all metadata from public files before publishing
  try {
    console.log('[stripper] Cleaning metadata from public assets folder to enforce anonymity...');
    stripDirectoryMetadata(path.join(process.cwd(), 'public'));
  } catch (stripErr) {
    console.error('Warning: Failed to clean assets directory metadata:', stripErr.message);
  }

  return scheduledFile;
}

/**
 * Sweeps scheduled drafts and publishes only the posts that are due based on scheduledTime
 */
export async function publishDuePosts(dateStr) {
  const scheduledPath = path.join(config.dirs.scheduled, `scheduled_${dateStr}.json`);
  if (!fs.existsSync(scheduledPath)) {
    console.log(`[publisher] No scheduled file found at ${scheduledPath}`);
    return;
  }

  let scheduleData;
  try {
    scheduleData = JSON.parse(fs.readFileSync(scheduledPath, 'utf-8'));
  } catch (e) {
    console.error('[publisher] Failed to read scheduled file:', e.message);
    return;
  }

  const now = new Date();
  const currentUTC = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  console.log(`[publisher] Checking due posts for UTC time: ${currentUTC}`);

  let updated = false;
  let allDone = true;

  // Process X Posts
  if (Array.isArray(scheduleData.xPosts)) {
    for (const post of scheduleData.xPosts) {
      if (post.published) continue;
      
      if (post.scheduledTime <= currentUTC) {
        try {
          console.log(`[publisher] Publishing due post ${post.id} (Scheduled: ${post.scheduledTime})...`);
          const res = await publishPost(post.text, 'x');
          post.published = true;
          post.publishedId = res.id;
          updated = true;

          registerPublishedPost({
            id: res.id,
            platform: 'x',
            topic: post.topic,
            text: post.text
          });

          // Log verification audit trail to posted.csv
          try {
            const csvPath = path.resolve('content/analytics/posted.csv');
            const dir = path.dirname(csvPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            if (!fs.existsSync(csvPath)) {
              fs.writeFileSync(csvPath, 'timestamp,post_id,platform,text,resolved_url,grade,published_id\n', 'utf-8');
            }
            
            const escapeCsv = val => `"${(val || '').toString().replace(/"/g, '""')}"`;
            const row = [
              new Date().toISOString(),
              post.id,
              'x',
              post.text,
              post.resolvedUrl || '',
              post.grade || 'A',
              res.id
            ].map(escapeCsv).join(',');
            
            fs.appendFileSync(csvPath, row + '\n', 'utf-8');
            console.log(`[publisher] Logged verification audit trail to ${csvPath}`);
          } catch (csvErr) {
            console.warn('[publisher] Failed to write verification audit trail to CSV:', csvErr.message);
          }

          // Log to published history
          const urls = post.text.match(/https?:\/\/[^\s"'()]+/g) || [];
          if (urls.length > 0) {
            addToPublishedHistory(urls.map(url => ({ title: post.topic || 'X Post', link: url })));
          }
        } catch (err) {
          console.error(`[publisher] Failed to publish post ${post.id}:`, err.message);
          allDone = false;
        }
        // Exit loop and process only one post per run to prevent rate-limit burst spikes
        break;
      } else {
        allDone = false;
      }
    }
  }

  // Process X Threads (Only if we didn't just publish a post to avoid simultaneous rate limits)
  if (!updated && Array.isArray(scheduleData.xThreads)) {
    for (const thread of scheduleData.xThreads) {
      if (thread.published) continue;

      if (!thread.scheduledTime) {
        thread.scheduledTime = thread.id === 'x_thread_1' ? '11:00' : '19:00';
      }

      if (thread.scheduledTime <= currentUTC) {
        try {
          console.log(`[publisher] Publishing due thread ${thread.id} (Scheduled: ${thread.scheduledTime})...`);
          const res = await publishPost(thread.posts, 'x');
          thread.published = true;
          thread.publishedId = res.id;
          updated = true;

          registerPublishedPost({
            id: res.id,
            platform: 'x',
            topic: thread.topic,
            text: thread.posts[0]
          });

          // Log to published history
          const urls = [];
          thread.posts.forEach(p => {
            const matches = p.match(/https?:\/\/[^\s"'()]+/g) || [];
            urls.push(...matches);
          });
          if (urls.length > 0) {
            addToPublishedHistory(urls.map(url => ({ title: thread.topic || 'X Thread', link: url })));
          }
        } catch (err) {
          console.error(`[publisher] Failed to publish thread ${thread.id}:`, err.message);
          allDone = false;
        }
        // Exit loop
        break;
      } else {
        allDone = false;
      }
    }
  }

  // Process LinkedIn Post (Only if we didn't just publish a post/thread to avoid bursts)
  if (!updated && scheduleData.linkedinPost && !scheduleData.linkedinPost.published) {
    if (!scheduleData.linkedinPost.scheduledTime) {
      scheduleData.linkedinPost.scheduledTime = '12:00';
    }

    if (scheduleData.linkedinPost.scheduledTime <= currentUTC) {
      try {
        if ((config.linkedinAccessToken && config.linkedinPersonId) || (config.bufferAccessToken && config.bufferProfileIds.length > 0)) {
          console.log(`[publisher] Publishing due LinkedIn post (Scheduled: ${scheduleData.linkedinPost.scheduledTime})...`);
          const res = await publishPost(scheduleData.linkedinPost.text, 'linkedin');
          scheduleData.linkedinPost.published = true;
          scheduleData.linkedinPost.publishedId = res.id;
          updated = true;

          registerPublishedPost({
            id: res.id,
            platform: 'linkedin',
            topic: scheduleData.linkedinPost.topic,
            text: scheduleData.linkedinPost.text
          });
        } else {
          console.log(`[publisher] Skipping LinkedIn post (credentials not set). Marking as simulated/skipped.`);
          scheduleData.linkedinPost.published = true;
          updated = true;
        }
      } catch (err) {
        console.error(`[publisher] Failed to publish LinkedIn post:`, err.message);
        allDone = false;
      }
    } else {
      allDone = false;
    }
  }

  // Save changes back to scheduled file
  if (updated) {
    fs.writeFileSync(scheduledPath, JSON.stringify(scheduleData, null, 2), 'utf-8');
    console.log(`[publisher] Updated scheduled state file: ${scheduledPath}`);
  }

  // If everything has been published, move the file to published directory
  if (allDone) {
    const publishedPath = path.join(config.dirs.published, `published_${dateStr}.json`);
    fs.renameSync(scheduledPath, publishedPath);
    console.log(`[publisher] All scheduled items for ${dateStr} successfully published! Moved to ${publishedPath}`);
  }
}
