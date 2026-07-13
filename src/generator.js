import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { loadAnalyticsDb } from './monitor.js';
import config from './config.js';

// Schema for content generation structure
const responseSchema = {
  type: "OBJECT",
  properties: {
    xPosts: {
      type: "ARRAY",
      description: "List of 30 short X posts rotating between AI tools, business, money, productivity, science, technology, spaced throughout the day.",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          topic: { type: "STRING" },
          text: { type: "STRING", description: "The X post body text (under 280 characters). Make hooks strong. Do not use hashtags or emojis unless highly relevant." },
          imagePrompt: { type: "STRING", description: "Visual prompt for AI image generation related to this post." },
          scheduledTime: { type: "STRING", description: "Recommended UTC publication time (HH:MM format) to test different timezone audiences, spaced evenly." }
        },
        required: ["id", "topic", "text", "imagePrompt", "scheduledTime"]
      }
    },
    xThreads: {
      type: "ARRAY",
      description: "List of 2 multi-post threads for X (each 5-8 tweets).",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          topic: { type: "STRING" },
          title: { type: "STRING" },
          posts: {
            type: "ARRAY",
            items: { type: "STRING", description: "Individual tweet text (under 280 chars) for this step of the thread." }
          },
          imagePromptForStart: { type: "STRING", description: "Visual prompt to generate an image for the first thread post." }
        },
        required: ["id", "topic", "title", "posts", "imagePromptForStart"]
      }
    },
    linkedinPost: {
      type: "OBJECT",
      properties: {
        topic: { type: "STRING" },
        text: { type: "STRING", description: "Structured professional LinkedIn post (under 1500 chars). Bullet points, clear spacing, zero generic corporate fluff, actionable takeaway." }
      },
      required: ["topic", "text"]
    },
    headlines: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "10 catchy alternative headlines for the newsletter or post threads."
    },
    newsletter: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Subject line / headline of the newsletter." },
        introduction: { type: "STRING", description: "Hooking intro discussing the state of tech/business today." },
        stories: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              link: { type: "STRING" },
              body: { type: "STRING", description: "2-3 sentence digest summarizing the item, its statistical importance, and direct business/tech implication." }
            },
            required: ["title", "link", "body"]
          }
        },
        takeaway: { type: "STRING", description: "A final actionable takeaway (e.g. prompt, framework, action item)." }
      },
      required: ["title", "introduction", "stories", "takeaway"]
    }
  },
  required: ["xPosts", "xThreads", "linkedinPost", "headlines", "newsletter"]
};

/**
 * Generates all daily content formats
 */
export async function generateContent(top5Items, dateStr) {
  const draftPath = path.join(config.dirs.drafts, `draft_${dateStr}.json`);
  const newsletterPath = path.join(config.dirs.newsletters, `newsletter_${dateStr}.md`);
  
  if (fs.existsSync(draftPath)) {
    console.log(`[generator] Found existing draft file at ${draftPath}. Loading draft...`);
    try {
      const draftData = JSON.parse(fs.readFileSync(draftPath, 'utf-8'));
      if (fs.existsSync(newsletterPath)) {
        console.log(`[generator] Newsletter markdown already exists at ${newsletterPath}`);
      } else {
        // Generate newsletter markdown from the loaded draft
        let newsletterMd = `# ${draftData.newsletter.title}\n\n`;
        newsletterMd += `*Date: ${dateStr} | Sourced by TheFutureLoop (@thefutureloop_co)*\n\n`;
        newsletterMd += `${draftData.newsletter.introduction}\n\n`;
        newsletterMd += `## 🚀 Today's Top Stories\n\n`;
        
        draftData.newsletter.stories.forEach((story, idx) => {
          newsletterMd += `### ${idx + 1}. [${story.title}](${story.link})\n`;
          newsletterMd += `${story.body}\n\n`;
        });
        
        newsletterMd += `## 💡 Actionable Takeaway\n\n`;
        newsletterMd += `${draftData.newsletter.takeaway}\n\n`;
        newsletterMd += `---\n*Thanks for reading! Retweet our daily insights on X: [@thefutureloop_co](https://x.com/thefutureloop_co)*\n`;
        
        fs.writeFileSync(newsletterPath, newsletterMd, 'utf-8');
        console.log(`[generator] Generated missing newsletter markdown at ${newsletterPath}`);
      }
      return { draftData, draftPath, newsletterPath };
    } catch (e) {
      console.error(`[generator] Failed to parse manual draft file:`, e.message);
    }
  }

  const apiKey = config.geminiApiKey;
  
  if (!apiKey) {
    console.log('--- GEMINI_API_KEY NOT SET ---');
    console.log('Creating agent-assisted content generation request.');
    
    const requestFile = path.join(config.dirs.drafts, `generator_request_${dateStr}.md`);
    let mdContent = `# Content Generation Request (${dateStr})\n\n`;
    mdContent += `Please generate the daily content suite based on these top 5 items. You will write your response back to \`content/drafts/draft_${dateStr}.json\` matching the schema.\n\n`;
    mdContent += `### Selected Top 5 Items:\n`;
    
    top5Items.forEach((item, idx) => {
      mdContent += `[${idx + 1}] **${item.title}** (${item.source})\n`;
      mdContent += `- URL: ${item.link}\n`;
      mdContent += `- Details: ${item.description}\n`;
      mdContent += `- AI Analysis: ${item.explanation}\n\n`;
    });
    
    fs.writeFileSync(requestFile, mdContent, 'utf-8');
    console.log(`[Agent-Assisted Mode] Generation request written to: ${requestFile}`);
    console.log(`Please read this file, write the generated draft to content/drafts/draft_${dateStr}.json and content/newsletters/newsletter_${dateStr}.md`);
    return null;
  }
  
  console.log('Generating content using Gemini...');
  const ai = new GoogleGenAI({ apiKey });
  
  // Dynamic Traction Feedback Loop: Load recent post performance to automatically adjust topics
  const analytics = loadAnalyticsDb();
  let tractionSummary = '';
  if (analytics && analytics.length > 0) {
    const topicEngagement = {};
    analytics.forEach(post => {
      if (!post.topic) return;
      const likes = post.metrics?.likes || 0;
      const reposts = post.metrics?.reposts || 0;
      const replies = post.metrics?.replies || 0;
      const views = post.metrics?.views || 0;
      const score = (likes * 1) + (reposts * 4) + (replies * 2) + (views * 0.05);
      topicEngagement[post.topic] = (topicEngagement[post.topic] || 0) + score;
    });
    
    const sortedTopics = Object.entries(topicEngagement).sort((a, b) => b[1] - a[1]);
    if (sortedTopics.length > 0) {
      tractionSummary = `\nRecent audience traction metrics (higher score = more impressions and engagement):\n` +
        sortedTopics.map(([topic, score]) => `- ${topic}: Traction Score ${score.toFixed(1)}`).join('\n') +
        `\n\nInstructions: Dynamically adjust the topic distribution of generated posts based on this traction. Prioritize generating more posts and deeper coverage in high-scoring categories. If today's source materials contain strong substance in those high-traction categories, generate more of those and scale back on lower-scoring categories to optimize organic growth.`;
    }
  }
  
  const prompt = `
You are an expert scientific editor, systems architect, and head analyst for "@thefutureloop_co" (TheFutureLoop), a premium data-driven research intelligence publication in Deep Tech, AI Startups, and Biotech breakthroughs.
Your tone is: objective, academic-level rigor, analytical, concise, defensive, and data-first. Avoid hyperbole or marketing fluff (e.g. do not say "revolutionize", "game changer", or "unprecedented").

Recent Traction Context:
${tractionSummary || "No historical traction data logged yet. Focus on high-substance clinical, compute, and deep-tech breakthroughs organically based on the scraped source items."}

Target Audience & Geos:
- USA: Tech founders, venture capital, biotech startups, deep tech investors.
- India: High-scale software engineering, biotech ecosystem, global tech systems.
- Nordics, Switzerland, & EU: Deep tech hubs, healthtech/biotech innovations, clinical trial networks, clean energy, and sustainability systems.
- Special Focus: Keep a special eye on biotech startups, clinical trial designs, and regulatory updates (FDA, EMA, CDSCO, WHO, Läkemedelsverket, Swissmedic, MHRA, UMC) in these key regions.

Sourced Items:
${JSON.stringify(top5Items, null, 2)}

Strict Editorial & Style Guidelines:
- Never use these banned words: "delve", "robust", "novel", "testament", "revolutionize", "harness", "furthermore", "moreover", "look no further", "in conclusion", "synergy", "pivotal", "landscape", "leverage", "interestingly", "importantly", "comprehensive", "excited", "thrilled", "dive deep".
- Write like a human analyst: Start sentences with the most interesting fact or statistic. Avoid broad marketing generalities or rhetorical questions.
- Hook style: Don't ask questions (e.g., "Have you ever wanted to scale?"). Instead, state a sharp statistic or measured benchmark.
- Evidence vs. Interpretation: Keep reported benchmark metrics and factual evidence strictly separate from subjective interpretations of what it means for laboratory workflows or business operations.
- The Three Editorial Questions: Every newsletter story and social thread must address:
  1. What happened? (The raw, measured evidence/result).
  2. Why does it matter? (The computational, scientific, or market analysis).
  3. What should practitioners do differently? (Actionable advice or workflow adjustment).
- Keep paragraphs and sentences short and punchy.
- Always link to the original primary source paper, database, or engineering blog.
- Primary Sources Only: Never frame posts around secondary news articles or general summaries (like ScienceDaily, TechCrunch, StudyFinds). Always locate and cite the primary paper (Nature, Cell, Science, arXiv, bioRxiv, etc.), official engineering repository, or company tech logs directly. Banish wellness and soft-science color psychology topics completely.
- CRITICAL INTERROGATION FRAMEWORK:
  * Never simply relay abstract summaries. Look for actual figures and metrics.
  * Dissect "tripods": If a paper claims a unifying mechanism across multiple diseases or systems, check if one of the legs has significantly weaker evidence (e.g., a low effect size or insignificant p-value). Explicitly call out this weak link.
  * Highlight buried negative/null results: Identify findings that contradict the field's standard assumptions (e.g., a knockdown that unexpectedly did not induce somatic mutation increase). Prioritize these null results over the mainstream shared mechanism.
  * Question preprint-to-publication drift: Note if figures (like cell counts or sample sizes) shifted between preprint and final journal versions, and highlight the difference.


Instructions:
1. "xPosts":
   - Create 30 X posts.
   - Topics: AI in biomedicine, computational biology, bioinformatics, drug discovery, clinical trials, and researcher productivity.
   - Style: High-hook, statistical, data-focused, minimal emojis, no hashtags. Under 280 chars. 
   - Timing: Distribute these posts evenly across a 24-hour cycle (e.g. 00:00, 00:45, 01:30, 02:15... up to 23:15) so we can test audience traction at all hours.
   - Rankings & Lists: Design at least 8 of the 30 posts specifically as ranked comparison lists of recent breakthroughs. Do NOT use generic source-based lists (like 'Top 5 on Nature'). Instead, utilize two distinct models:
     1) Focus-Grouped Lists: Focus the entire list on a specific high-impact clinical domain or molecular mechanism using standard MeSH terms (e.g. *Neoplasms*, *Autophagy*, *GLP-1 Receptor Agonists*, *Immunotherapy*, etc.).
     2) Cross-Disciplinary Roundups: Mix varied fields in a single post (e.g., combining computing, gene therapy, energy, and semiconductors in one daily roundup). For these cross-disciplinary posts, prepend each list item with a clean, bracketed MeSH term or taxonomy tag (e.g., `[Oncology]`, `[Genomics]`, `[Semiconductors]`, `[AI-ML]`) so readers can scan the varied fields instantly.
     For all lists, format them clearly (using 1 to 5, or 1 to 10 if they fit under the character limit) and include the original source URL for each item so readers click to visit the primary evidence.
   - Language: Simplify complex academic terms into clear, readable concepts (keep it accessible without sacrificing truthfulness). Use numbered ranking lists or structured bullet points to organize stats. Be 100% accurate to the source material.
   - Integrate links where appropriate. Make them feel like premium research highlights.
2. "xThreads":
   - Create 2 distinct X threads (each 5-8 tweets).
   - Thread 1: Dissect one of the top bioinformatics/computation tools or AI workflows. Highlight what practitioners should do differently.
   - Thread 2: Dissect one of the top scientific or medical breakthroughs (e.g. clinical cancer trials, structural prediction models, protein biology).
   - Style: Keep each post under 280 characters. Start the first tweet with a massive data-driven hook.
   - Structure: Keep explanations simple and conversational. Use vertical numbered lists or bullet points to present statistics and key steps. Keep citations absolutely accurate.
3. "linkedinPost":
   - Create 1 structured professional LinkedIn post (under 1500 chars).
   - Style: Start with a strong hook, break down key stats, list the Three Editorial Questions answers, and list 3 key lessons.
4. "headlines":
   - 10 alternative subject lines/headlines combining curiosity, data, and value.
5. "newsletter":
   - Create a newsletter draft.
   - It must summarize all 5 items, linking to them.
   - For each item, apply the proprietary **TheFutureLoop signature analysis framework**:
     * One-Sentence Finding: State the core result in under 40 words.
     * Key Benchmark: Present a clear comparison details block or table comparing metrics to legacy baselines.
     * The TFL Evidence Ladder: Classify into E1 (Hypothesis only), E2 (Computational evidence), E3 (Internal experimental validation), E4 (Independent replication), or E5 (Production deployment).
     * The Dual-Score Matrix: Assign a Confidence Score (1-10, weighted by benchmark validity 30%, methodological rigor 25%, reproducibility 20%, external validation 15%, deployment feasibility 10%) AND a Potential Impact Score (1-10).
     * Time-to-Impact Timeline: Classify as Immediate (<12 months), Emerging (1-3 years), Strategic (3-7 years), or Horizon (7+ years).
     * Engineering Cost & Complexity: Document training/inference cost, GPU/memory footprint, and regulatory (GCP/RAPS) burden.
     * Reality Check (Assumptions & Missing Controls): Call out hidden flaws (e.g. data leakage, weak unoptimized baselines, missing ablation checks, closed source weights).
     * Affected Landscape: List specific companies, startups, or platforms that win or lose from this shift.
     * Practical Implication: Provide 3 actionable takeaways for active engineers, founders, or researchers.
   - Include a weekly Forecast/Prediction block with a concrete target review date to build accountability.

Return the content formatted as a JSON object matching the requested schema.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });
    
    const draftData = JSON.parse(response.text);
    
    // Save draft JSON
    const draftPath = path.join(config.dirs.drafts, `draft_${dateStr}.json`);
    fs.writeFileSync(draftPath, JSON.stringify(draftData, null, 2), 'utf-8');
    console.log(`Saved content draft JSON to ${draftPath}`);
    
    // Format and save newsletter markdown separately
    const newsletterPath = path.join(config.dirs.newsletters, `newsletter_${dateStr}.md`);
    let newsletterMd = `# ${draftData.newsletter.title}\n\n`;
    newsletterMd += `*Date: ${dateStr} | Sourced by TheFutureLoop (@thefutureloop_co)*\n\n`;
    newsletterMd += `${draftData.newsletter.introduction}\n\n`;
    newsletterMd += `## 🚀 Today's Top Stories\n\n`;
    
    draftData.newsletter.stories.forEach((story, idx) => {
      newsletterMd += `### ${idx + 1}. [${story.title}](${story.link})\n`;
      newsletterMd += `${story.body}\n\n`;
    });
    
    newsletterMd += `## 💡 Actionable Takeaway\n\n`;
    newsletterMd += `${draftData.newsletter.takeaway}\n\n`;
    newsletterMd += `---\n*Thanks for reading! Retweet our daily insights on X: [@thefutureloop_co](https://x.com/thefutureloop_co)*\n`;
    
    fs.writeFileSync(newsletterPath, newsletterMd, 'utf-8');
    console.log(`Saved formatted newsletter Markdown to ${newsletterPath}`);
    
    return { draftData, draftPath, newsletterPath };
  } catch (error) {
    console.error('Error during content generation with Gemini:', error.message);
    throw error;
  }
}
