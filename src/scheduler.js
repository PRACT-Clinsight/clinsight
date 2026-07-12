import { scrapeAllSources, saveRawItems } from './scraper.js';
import { scoreItems } from './scorer.js';
import { generateContent } from './generator.js';
import config, { ensureDirectories } from './config.js';
import path from 'path';
import fs from 'fs';

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

async function runScheduledPipeline() {
  const today = getTodayDateStr();
  console.log(`\n===================================================`);
  console.log(`[SCHEDULER] Starting automated run for: ${today}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`===================================================`);
  
  try {
    ensureDirectories();
    
    console.log('Sourcing latest items...');
    const rawItems = await scrapeAllSources();
    saveRawItems(rawItems, today);
    console.log(`Successfully fetched ${rawItems.length} raw stories.`);
    
    console.log('Scoring items...');
    const top5 = await scoreItems(rawItems, today);
    if (!top5) {
      console.log('[SCHEDULER] Pipeline paused in Agent-Assisted Mode. Awaiting manual scoring / approvals.');
      return;
    }
    
    console.log('Generating content drafts...');
    await generateContent(top5, today);
    console.log('[SCHEDULER] Daily draft and newsletter briefing created successfully!');
  } catch (err) {
    console.error('[SCHEDULER] Pipeline execution failed:', err.message);
  }
}

// Start schedule loop: runs every 12 hours (43,200,000 ms)
const INTERVAL_MS = 12 * 60 * 60 * 1000;

console.log('===================================================');
console.log('FutureLoop Scheduler Daemon is active!');
console.log(`Interval: Every 12 hours`);
console.log('===================================================');

// Run immediately on startup
runScheduledPipeline();

// Schedule future iterations
setInterval(runScheduledPipeline, INTERVAL_MS);
