import { scrapeAllSources, saveRawItems } from './scraper.js';
import { scoreItems } from './scorer.js';
import { generateContent } from './generator.js';
import { publishDuePosts } from './publisher.js';
import { resolveToPrimarySource, fetchFullText, gradeItem, validateQuote } from './grader.js';
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

/**
 * Filter raw items through the verification gate
 */
async function verifyAndFilterItems(rawItems, dateTarget) {
  const verifiedList = [];
  const rejectsPath = path.resolve('content/drafts/rejects.jsonl');
  
  console.log(`[verifier] Verification started. Scanning ${rawItems.length} raw items...`);
  
  for (const item of rawItems) {
    const { resolvedUrl, reason } = resolveToPrimarySource(item);
    
    if (!resolvedUrl) {
      const rejectRecord = {
        title: item.title,
        link: item.link,
        reason: reason || 'banned_or_no_tier_a',
        timestamp: new Date().toISOString()
      };
      fs.appendFileSync(rejectsPath, JSON.stringify(rejectRecord) + '\n', 'utf-8');
      continue;
    }
    
    const textBody = await fetchFullText(resolvedUrl);
    if (!textBody || textBody.length < 500) {
      const rejectRecord = {
        title: item.title,
        link: resolvedUrl,
        reason: !textBody ? 'fetch_failed' : 'text_too_short',
        timestamp: new Date().toISOString()
      };
      fs.appendFileSync(rejectsPath, JSON.stringify(rejectRecord) + '\n', 'utf-8');
      continue;
    }
    
    const gradeResult = await gradeItem(textBody, item.title);
    const isQuoteMatch = validateQuote(textBody, gradeResult.verbatim_quote);
    
    if (gradeResult.grade === 'C' || !isQuoteMatch) {
      const rejectRecord = {
        title: item.title,
        link: resolvedUrl,
        reason: !isQuoteMatch ? 'quote_not_found' : 'grade_c',
        timestamp: new Date().toISOString()
      };
      fs.appendFileSync(rejectsPath, JSON.stringify(rejectRecord) + '\n', 'utf-8');
      continue;
    }
    
    if (gradeResult.grade === 'B') {
      console.log(`[verifier] Grade B (Human review required): "${item.title}"`);
      const reviewPath = path.resolve(`content/drafts/review_${dateTarget}.json`);
      let reviewQueue = [];
      if (fs.existsSync(reviewPath)) {
        reviewQueue = JSON.parse(fs.readFileSync(reviewPath, 'utf-8'));
      }
      reviewQueue.push({ ...item, resolvedUrl, gradeResult });
      fs.writeFileSync(reviewPath, JSON.stringify(reviewQueue, null, 2), 'utf-8');
    } else {
      console.log(`[verifier] Grade A verified: "${item.title}"`);
      verifiedList.push({ ...item, resolvedUrl, gradeResult });
    }
  }
  
  console.log(`[verifier] Verification completed. Verified: ${verifiedList.length} items.`);
  return verifiedList;
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

    // Step 1b: Verify & Gate
    const verifiedItems = await verifyAndFilterItems(rawItems, today);
    if (verifiedItems.length === 0) {
      console.log('\n--- SCHEDULER PIPELINE HALTED ---');
      console.log('Zero primary evidence items passed the verification gate. Never pad the queue.');
      return;
    }
    
    console.log('Scoring items...');
    const top5 = await scoreItems(verifiedItems, today);
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

// Auto-publish checking interval: every 5 minutes (300,000 ms)
const AUTO_PUBLISH_INTERVAL_MS = 5 * 60 * 1000;

async function checkAndPublishDue() {
  const today = getTodayDateStr();
  try {
    await publishDuePosts(today);
  } catch (err) {
    console.error('[SCHEDULER] Auto-publish check failed:', err.message);
  }
}

// Run auto-publish check immediately on start
checkAndPublishDue();

// Run check every 5 minutes
setInterval(checkAndPublishDue, AUTO_PUBLISH_INTERVAL_MS);
