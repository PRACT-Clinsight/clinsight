import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import config from './config.js';

// Schema for follow-up content generation
const followupSchema = {
  type: "OBJECT",
  properties: {
    followupPost: { type: "STRING", description: "A high-engagement follow-up X post." },
    followupThread: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "A 5-post follow-up X thread detailing the topic."
    },
    infographicIdea: { type: "STRING", description: "A detailed description and layout idea for an infographic." },
    newsletterSection: { type: "STRING", description: "A deep-dive section (markdown) for the next newsletter issue." },
    youtubeScriptOutline: { type: "STRING", description: "A 60-second YouTube Shorts/TikTok script outline (hook, 3 tips, CTA)." }
  },
  required: ["followupPost", "followupThread", "infographicIdea", "newsletterSection", "youtubeScriptOutline"]
};

/**
 * Get the path to the analytics database
 */
function getAnalyticsDbPath() {
  return path.join(config.dirs.analytics, 'posts.json');
}

/**
 * Loads published posts analytics database
 */
export function loadAnalyticsDb() {
  const dbPath = getAnalyticsDbPath();
  if (!fs.existsSync(dbPath)) {
    // Return empty database
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch (err) {
    console.error('Failed to parse analytics DB, returning empty array.');
    return [];
  }
}

/**
 * Saves published posts analytics database
 */
export function saveAnalyticsDb(db) {
  const dbPath = getAnalyticsDbPath();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

/**
 * Logs engagement for a specific post
 */
export function logEngagement(postId, likes, reposts, replies, views) {
  const db = loadAnalyticsDb();
  const post = db.find(p => p.id === postId);
  
  if (!post) {
    throw new Error(`Post with ID ${postId} not found in analytics database.`);
  }
  
  post.metrics = {
    likes: parseInt(likes, 10) || 0,
    reposts: parseInt(reposts, 10) || 0,
    replies: parseInt(replies, 10) || 0,
    views: parseInt(views, 10) || 0,
    lastUpdated: new Date().toISOString()
  };
  
  saveAnalyticsDb(db);
  console.log(`Updated engagement for post ${postId}: Likes: ${likes}, Reposts: ${reposts}, Replies: ${replies}, Views/Impressions: ${views || 0}`);
  return post;
}

/**
 * Checks for high performing posts and generates follow-up assets
 */
export async function checkHighPerformanceAndFollowUp() {
  const db = loadAnalyticsDb();
  
  // High-performance threshold: Likes >= 50 or Reposts >= 10
  const thresholdLikes = 50;
  const thresholdReposts = 10;
  
  const highPerformers = db.filter(post => 
    !post.followedUp && 
    post.metrics && 
    (post.metrics.likes >= thresholdLikes || post.metrics.reposts >= thresholdReposts)
  );
  
  if (highPerformers.length === 0) {
    console.log('No new high-performing posts identified.');
    return;
  }
  
  console.log(`Identified ${highPerformers.length} new high-performing posts!`);
  
  for (const post of highPerformers) {
    console.log(`Processing follow-up for post ${post.id} (Likes: ${post.metrics.likes}, Topic: ${post.topic})`);
    
    // Check API Key
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      console.log('Gemini API key missing. Creating offline request.');
      const offlineFile = path.join(config.dirs.drafts, `followup_request_${post.id}.md`);
      fs.writeFileSync(offlineFile, `# Offline Follow-Up Request\n\nPost: "${post.text}" performed well.\nGenerate a follow-up post, thread, infographic, newsletter, and short video script.`, 'utf-8');
      
      post.followedUp = true; // Mark as done for offline
      continue;
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
The following post about "${post.topic}" went viral (Likes: ${post.metrics.likes}, Reposts: ${post.metrics.reposts}).

Post content:
"${post.text}"

Generate high-value follow-up assets to capitalize on this interest:
1. "followupPost": A short, high-impact X post expanding on this specific angle.
2. "followupThread": A step-by-step 5-post thread with deeper data/details.
3. "infographicIdea": A detailed description of an infographic layout (what stats, visual charts, and texts to place in the graphic).
4. "newsletterSection": A deep-dive section (markdown format) explaining the underlying mechanics/business opportunity in detail.
5. "youtubeScriptOutline": A short 60-second video script (Hook, Body, Call to Action) matching this topic.

Return as a JSON object matching the requested schema.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: followupSchema
        }
      });
      
      const followupData = JSON.parse(response.text);
      
      // Save follow-up assets
      const filepath = path.join(config.dirs.drafts, `followup_${post.id}_${Date.now()}.md`);
      let mdContent = `# 📈 High-Performance Follow-up Assets: Post ${post.id}\n\n`;
      mdContent += `**Original Post Topic:** ${post.topic}\n`;
      mdContent += `**Original Text:** \n> ${post.text}\n\n`;
      mdContent += `**Performance:** Likes: ${post.metrics.likes} | Reposts: ${post.metrics.reposts}\n\n`;
      mdContent += `## 🚀 1. Follow-up X Post\n\`\`\`\n${followupData.followupPost}\n\`\`\`\n\n`;
      
      mdContent += `## 🧵 2. Follow-up X Thread\n`;
      followupData.followupThread.forEach((t, i) => {
        mdContent += `### Tweet ${i + 1}\n\`\`\`\n${t}\n\`\`\`\n\n`;
      });
      
      mdContent += `## 📊 3. Infographic Idea & Design\n${followupData.infographicIdea}\n\n`;
      mdContent += `## 📰 4. Newsletter Deep-Dive Section\n${followupData.newsletterSection}\n\n`;
      mdContent += `## 🎥 5. YouTube Shorts / TikTok Script Outline\n${followupData.youtubeScriptOutline}\n\n`;
      
      fs.writeFileSync(filepath, mdContent, 'utf-8');
      console.log(`Saved follow-up assets to ${filepath}`);
      
      // Mark as followed up
      post.followedUp = true;
      
    } catch (error) {
      console.error(`Failed to generate follow-up for post ${post.id}:`, error.message);
    }
  }
  
  saveAnalyticsDb(db);
}

/**
 * Registers a post as published
 */
export function registerPublishedPost(postData) {
  const db = loadAnalyticsDb();
  
  const record = {
    id: postData.id,
    platform: postData.platform || 'x',
    topic: postData.topic || 'General',
    text: postData.text || '',
    publishDate: new Date().toISOString().split('T')[0],
    metrics: { likes: 0, reposts: 0, replies: 0 },
    followedUp: false,
    timestamp: new Date().toISOString()
  };
  
  db.push(record);
  saveAnalyticsDb(db);
  console.log(`Registered post ${postData.id} to analytics database.`);
}

/**
 * Logs revenue to the monetization database
 */
export function logRevenue(source, amountUSD) {
  const revPath = path.join(config.dirs.analytics, 'revenue.json');
  let db = [];
  if (fs.existsSync(revPath)) {
    try {
      db = JSON.parse(fs.readFileSync(revPath, 'utf-8'));
    } catch (err) {
      db = [];
    }
  }
  
  const usd = parseFloat(amountUSD) || 0;
  const sek = parseFloat((usd * 10.5).toFixed(2));
  
  const entry = {
    id: `rev_${Date.now()}`,
    source,
    amountUSD: usd,
    amountSEK: sek,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0]
  };
  
  db.push(entry);
  fs.writeFileSync(revPath, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`[REVENUE LOGGED] Payout of $${usd} USD (~${sek} SEK) from "${source}" successfully logged.`);
  
  // Show milestone progress
  checkMilestoneStatus();
  
  return entry;
}

/**
 * Checks progress towards the 1,000 SEK/month milestone
 */
export function checkMilestoneStatus() {
  const revPath = path.join(config.dirs.analytics, 'revenue.json');
  let db = [];
  if (fs.existsSync(revPath)) {
    try {
      db = JSON.parse(fs.readFileSync(revPath, 'utf-8'));
    } catch (err) {
      db = [];
    }
  }
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRevenues = db.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);
  const totalUSD = recentRevenues.reduce((sum, r) => sum + r.amountUSD, 0);
  const totalSEK = recentRevenues.reduce((sum, r) => sum + r.amountSEK, 0);
  
  const targetSEK = 1000;
  const percentage = Math.min(100, Math.round((totalSEK / targetSEK) * 100));
  
  const barWidth = 20;
  const filledWidth = Math.round((percentage / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
  
  console.log('\n===================================================');
  console.log(`📈 FutureLoop Monetization - First Milestone Status`);
  console.log(`Milestone 1: 1,000 SEK / month`);
  console.log(`Current Trailing 30-day Revenue: $${totalUSD.toFixed(2)} USD (~${totalSEK.toFixed(2)} SEK)`);
  console.log(`Progress: [${progressBar}] ${percentage}%`);
  
  if (totalSEK >= targetSEK) {
    console.log('\n🎉🎉🎉 CONGRATULATIONS! 🎉🎉🎉');
    console.log('You have hit your first milestone of 1,000 SEK/month!');
    console.log('Now scaling toward Milestone 2 (5,000 SEK/month)...');
  } else {
    console.log(`Need ${(targetSEK - totalSEK).toFixed(2)} SEK more to reach this milestone.`);
  }
  console.log('===================================================\n');
  
  return { totalUSD, totalSEK, percentage, achieved: totalSEK >= targetSEK };
}
