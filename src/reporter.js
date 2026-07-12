import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { loadAnalyticsDb } from './monitor.js';

// Schema for monthly strategic content assets
const monthlyAssetsSchema = {
  type: "OBJECT",
  properties: {
    evergreenPosts: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of 30 short evergreen X/LinkedIn posts (value-first, stats-focused, mindset/tech)."
    },
    threadIdeas: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of 20 compelling hook and layout concepts for X threads."
    },
    newsletterConcepts: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of 10 general concepts or subject lines for future newsletters."
    },
    digitalProductIdeas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING", description: "What to build (e.g. spreadsheet, guide, notion template)." },
          monetizationAngle: { type: "STRING", description: "How to price and sell it." }
        },
        required: ["title", "description", "monetizationAngle"]
      },
      description: "List of 5 digital product ideas."
    },
    affiliateOpportunities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          toolName: { type: "STRING" },
          description: { type: "STRING" },
          affiliateProgramLink: { type: "STRING" }
        },
        required: ["toolName", "description", "affiliateProgramLink"]
      },
      description: "List of 5 high-paying affiliate tools/programs in tech/business."
    },
    sponsorshipProspects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          companyName: { type: "STRING" },
          industry: { type: "STRING" },
          pitchAngle: { type: "STRING", description: "Why they would want to sponsor our data-driven audience." }
        },
        required: ["companyName", "industry", "pitchAngle"]
      },
      description: "List of 5 potential companies to pitch for newsletter ads."
    }
  },
  required: [
    "evergreenPosts",
    "threadIdeas",
    "newsletterConcepts",
    "digitalProductIdeas",
    "affiliateOpportunities",
    "sponsorshipProspects"
  ]
};

/**
 * Generate the weekly report
 */
export async function generateWeeklyReport(dateStr) {
  const db = loadAnalyticsDb();
  console.log(`Generating weekly report for ${dateStr} from ${db.length} logged posts...`);
  
  // Aggregate stats
  const topicStats = {};
  let totalLikes = 0;
  let totalReposts = 0;
  let totalReplies = 0;
  
  db.forEach(post => {
    const topic = post.topic || 'General';
    if (!topicStats[topic]) {
      topicStats[topic] = { count: 0, likes: 0, reposts: 0, replies: 0 };
    }
    
    topicStats[topic].count++;
    if (post.metrics) {
      topicStats[topic].likes += post.metrics.likes || 0;
      topicStats[topic].reposts += post.metrics.reposts || 0;
      topicStats[topic].replies += post.metrics.replies || 0;
      
      totalLikes += post.metrics.likes || 0;
      totalReposts += post.metrics.reposts || 0;
      totalReplies += post.metrics.replies || 0;
    }
  });
  
  const formattedStats = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    totalPosts: stats.count,
    avgLikes: parseFloat((stats.likes / stats.count).toFixed(1)),
    avgReposts: parseFloat((stats.reposts / stats.count).toFixed(1)),
    totalEngagement: stats.likes + stats.reposts + stats.replies
  }));
  
  // Sort by engagement
  formattedStats.sort((a, b) => b.totalEngagement - a.totalEngagement);
  
  // LLM strategy analysis
  const apiKey = config.geminiApiKey;
  let strategicInsights = '';
  
  if (apiKey) {
    console.log('Fetching strategic insights from Gemini...');
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Analyze the following performance statistics of our social brand "@topstatszone" over the past week:
Total Posts: ${db.length}
Total Likes: ${totalLikes}
Total Reposts: ${totalReposts}
Total Replies: ${totalReplies}

Topic Performance Breakdown:
${JSON.stringify(formattedStats, null, 2)}

Provide strategic advice:
1. Top Performing Topics: Which topics are driving the most engagement?
2. Pivot Recommendations: Which topics should we stop covering or cover less (low engagement)?
3. New Themes to Test: Recommend 3 new data-driven themes or sub-topics we should test next week.
4. Posting Time Optimizations: Advise on posting cadence.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      strategicInsights = response.text;
    } catch (err) {
      strategicInsights = `Error generating insights: ${err.message}`;
    }
  } else {
    strategicInsights = '*Activate Gemini API to generate tailored automated strategic insights here.*';
  }
  
  // Write markdown report
  const reportPath = path.join(config.dirs.analytics, `weekly_report_${dateStr}.md`);
  let md = `# 📊 FutureLoop Weekly Performance Report: ${dateStr}\n\n`;
  md += `## 📈 Weekly Summary Statistics\n`;
  md += `- **Total Posts Tracked:** ${db.length}\n`;
  md += `- **Total Likes Accumulated:** ${totalLikes}\n`;
  md += `- **Total Reposts:** ${totalReposts}\n`;
  md += `- **Total Replies:** ${totalReplies}\n\n`;
  
  md += `## 🏆 Topic Performance Matrix\n\n`;
  md += `| Topic Category | Total Posts | Avg Likes | Avg Reposts | Total Engagement |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: |\n`;
  
  formattedStats.forEach(stat => {
    md += `| ${stat.topic} | ${stat.totalPosts} | ${stat.avgLikes} | ${stat.avgReposts} | ${stat.totalEngagement} |\n`;
  });
  
  md += `\n## 💡 Strategic Insights & Pivots\n\n`;
  md += strategicInsights + '\n';
  
  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`Saved weekly performance report to ${reportPath}`);
  return reportPath;
}

/**
 * Generate monthly evergreen content assets and opportunities
 */
export async function generateMonthlyAssets(dateStr) {
  console.log(`Generating monthly evergreen assets for ${dateStr}...`);
  
  const apiKey = config.geminiApiKey;
  let assets = null;
  
  if (!apiKey) {
    console.log('Gemini API key missing. Creating offline template file.');
    const reportPath = path.join(config.dirs.analytics, `monthly_assets_template_${dateStr}.md`);
    fs.writeFileSync(reportPath, '# Monthly Strategy Vault\n\nKey missing. Please configure GEMINI_API_KEY to generate 30 evergreen posts, ideas and sponsors.', 'utf-8');
    return reportPath;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
You are a content growth officer for "@futureloop_co" (FutureLoop), a premium data-driven newsletter and social brand.
Our current primary milestone goal is to reach a monthly revenue of at least 1,000 SEK (~$100 USD) through low-ticket digital products and high-converting affiliate partnerships.

Generate a massive monthly strategy package including:
1. 30 evergreen posts (short, highly valuable stats, tricks, prompts, or thoughts).
2. 20 new thread ideas (compelling hooks and quick outline descriptions).
3. 10 newsletter concepts (topics/titles).
4. 5 digital product ideas (SaaS trackers, spreadsheets, guides) that we can build or curate. Focus on helping us hit our 1,000 SEK/month goal quickly. Always display prices in both currencies, e.g., "$19 USD (~200 SEK)".
5. 5 affiliate opportunities (existing high-converting AI/business tools) with high-paying commissions.
6. 5 sponsorship prospects (startups, newsletters, or tech platforms we can pitch for paid ads).

Ensure all posts and ideas reflect a data-driven, analytical style.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: monthlyAssetsSchema
      }
    });
    
    assets = JSON.parse(response.text);
    
    // Save report file
    const reportPath = path.join(config.dirs.analytics, `monthly_assets_${dateStr}.md`);
    let md = `# 🗓️ FutureLoop Monthly Strategy Vault: ${dateStr}\n\n`;
    md += `This document serves as your pre-written, highly strategic evergreen asset bank for the next 30 days.\n\n`;
    
    md += `## 💡 1. Digital Product Ideas (Scale to Gumroad/LemonSqueezy)\n\n`;
    assets.digitalProductIdeas.forEach((prod, i) => {
      md += `### [${i + 1}] ${prod.title}\n`;
      md += `- **Description:** ${prod.description}\n`;
      md += `- **Monetization Angle:** ${prod.monetizationAngle}\n\n`;
    });
    
    md += `## 🤝 2. High-Paying Affiliate Opportunities\n\n`;
    assets.affiliateOpportunities.forEach((aff, i) => {
      md += `### [${i + 1}] ${aff.toolName}\n`;
      md += `- **Description:** ${aff.description}\n`;
      md += `- **Affiliate Program:** ${aff.affiliateProgramLink}\n\n`;
    });
    
    md += `## 🎯 3. Sponsorship Pitch Targets\n\n`;
    assets.sponsorshipProspects.forEach((spons, i) => {
      md += `### [${i + 1}] ${spons.companyName} (${spons.industry})\n`;
      md += `- **Pitch Angle:** ${spons.pitchAngle}\n\n`;
    });
    
    md += `## ✍️ 4. 30 Evergreen Value Posts\n\n`;
    assets.evergreenPosts.forEach((post, i) => {
      md += `### Post ${i + 1}\n\`\`\`\n${post}\n\`\`\`\n\n`;
    });
    
    md += `## 🧵 5. 20 Thread Concepts & Hooks\n\n`;
    assets.threadIdeas.forEach((idea, i) => {
      md += `### Thread ${i + 1}\n- ${idea}\n\n`;
    });
    
    md += `## 📰 6. 10 Newsletter Topics\n\n`;
    assets.newsletterConcepts.forEach((concept, i) => {
      md += `### Concept ${i + 1}\n- ${concept}\n\n`;
    });
    
    fs.writeFileSync(reportPath, md, 'utf-8');
    console.log(`Saved monthly evergreen strategy vault to ${reportPath}`);
    return reportPath;
    
  } catch (error) {
    console.error('Failed to generate monthly assets:', error.message);
    throw error;
  }
}
