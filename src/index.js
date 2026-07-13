import { scrapeAllSources, saveRawItems } from './scraper.js';
import { scoreItems } from './scorer.js';
import { generateContent } from './generator.js';
import { scheduleDraft, publishPost, publishDuePosts } from './publisher.js';
import { logEngagement, checkHighPerformanceAndFollowUp, registerPublishedPost, logRevenue, checkMilestoneStatus, addToPublishedHistory } from './monitor.js';
import { generateWeeklyReport, generateMonthlyAssets } from './reporter.js';
import config, { ensureDirectories } from './config.js';
import fs from 'fs';
import path from 'path';

/**
 * Get current date string in YYYY_MM_DD format
 */
function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

async function main() {
  // Ensure directories are created
  ensureDirectories();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    printHelp();
    return;
  }
  
  const today = getTodayDateStr();
  
  switch (command) {
    case 'pipeline': {
      const dateTarget = args[1] && !args[1].startsWith('--') ? args[1] : today;
      console.log(`Starting content pipeline for ${dateTarget}...`);
      const dryRun = args.includes('--dry-run');
      
      try {
        // Step 1: Scrape
        const rawItems = await scrapeAllSources();
        saveRawItems(rawItems, dateTarget);
        
        if (rawItems.length === 0) {
          console.log('No raw items found to process.');
          return;
        }
        
        if (dryRun) {
          console.log('\n--- DRY-RUN COMPLETE ---');
          console.log('Sourced items successfully. Skipping Gemini scoring & content generation.');
          return;
        }
        
        // Step 2: Score
        const top5 = await scoreItems(rawItems, dateTarget);
        if (!top5) {
          // Paused for agent-assisted scoring
          return;
        }
        
        // Step 3: Generate
        await generateContent(top5, dateTarget);
        console.log('\nPipeline run completed successfully! Review your drafts in:');
        console.log(`  - JSON Draft: content/drafts/draft_${dateTarget}.json`);
        console.log(`  - Newsletter: content/newsletters/newsletter_${dateTarget}.md`);
        
      } catch (err) {
        console.error('Pipeline execution failed:', err.message);
      }
      break;
    }
    
    case 'approve': {
      const dateTarget = args[1] || today;
      try {
        console.log(`Approving and scheduling drafts for date: ${dateTarget}...`);
        const scheduledPath = scheduleDraft(dateTarget);
        console.log(`Drafts successfully approved. Ready for publishing.`);
      } catch (err) {
        console.error('Failed to approve draft:', err.message);
      }
      break;
    }
    
    case 'publish': {
      const dateTarget = args[1] || today;
      try {
        await publishDuePosts(dateTarget);
      } catch (err) {
        console.error('Publishing run failed:', err.message);
      }
      break;
    }
    
    case 'log-engagement': {
      const postId = args[1];
      const likes = args[2];
      const reposts = args[3];
      const replies = args[4];
      const views = args[5];
      
      if (!postId || !likes) {
        console.error('Usage: node src/index.js log-engagement <postId> <likes> [reposts] [replies] [views]');
        return;
      }
      
      try {
        logEngagement(postId, likes, reposts, replies, views);
      } catch (err) {
        console.error('Failed to log engagement:', err.message);
      }
      break;
    }
    
    case 'check-performance': {
      console.log('Running hourly performance monitor...');
      try {
        await checkHighPerformanceAndFollowUp();
        checkMilestoneStatus();
      } catch (err) {
        console.error('Performance monitor failed:', err.message);
      }
      break;
    }
    
    case 'report-weekly': {
      const dateTarget = args[1] || today;
      try {
        await generateWeeklyReport(dateTarget);
      } catch (err) {
        console.error('Failed to generate weekly report:', err.message);
      }
      break;
    }
    
    case 'report-monthly': {
      const dateTarget = args[1] || today;
      try {
        await generateMonthlyAssets(dateTarget);
      } catch (err) {
        console.error('Failed to generate monthly assets:', err.message);
      }
      break;
    }
    
    case 'log-revenue': {
      const source = args[1];
      const amountUSD = args[2];
      if (!source || !amountUSD) {
        console.error('Usage: node src/index.js log-revenue <source> <amountUSD>');
        process.exit(1);
      }
      logRevenue(source, amountUSD);
      break;
    }
    
    case 'start-server': {
      console.log('Starting landing page web server...');
      import('./server.js');
      break;
    }
    
    case 'start-scheduler': {
      console.log('Starting background scheduler daemon...');
      import('./scheduler.js');
      break;
    }
    
    default: {
      console.error(`Unknown command: ${command}`);
      printHelp();
    }
  }
}

function printHelp() {
  console.log(`
===================================================
FutureLoop Autonomous Content System (TopStatsZone)
===================================================

Usage: node src/index.js <command> [arguments]

Commands:
  pipeline [--dry-run]  Fetch news, score topics, and generate daily content drafts.
                        Use --dry-run to test scraper without Gemini API charges.
                        
  approve [date]        Approve generated drafts for publishing (default: today).
  
  publish [date]        Publish approved schedule to social media / Buffer API.
  
  log-engagement <id> <likes> <reposts> <replies> [views]
                        Log analytics for a post.
                        
  log-revenue <source> <amountUSD>
                        Log incoming revenue (automatically converts to SEK).
                        
  check-performance     Check metrics database & auto-draft follow-up posts/assets.
  
  report-weekly [date]  Aggregate statistics and generate weekly metric summaries.
  
  report-monthly [date] Brainstorm 30 evergreen posts, digital products, sponsors.
  
  start-server          Launch local landing page web server for capturing subscribers.
  
  start-scheduler       Launch background scheduler daemon running pipeline every 12h.
`);
}

main();
