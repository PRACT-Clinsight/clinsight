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
 * Validates a generated post body against strict brand rules.
 */
export function validateDraft(body) {
  if (!body || body.trim().length === 0) return { isValid: false, reason: 'empty_body' };
  if (body.length > 280) return { isValid: false, reason: 'too_long' };
  
  // Enforce no URLs in body
  const urlRegex = /https?:\/\//i;
  if (urlRegex.test(body)) return { isValid: false, reason: 'contains_url' };
  
  // Enforce no [VERIFY] placeholders
  if (body.includes('[VERIFY]')) return { isValid: false, reason: 'contains_verify_placeholder' };
  
  // Enforce no banned clickbait/hype words
  const banned = [
    'breaking', 'this is huge', 'let that sink in', 'revolutionary', 
    'game-changer', 'pivotal', 'breakthrough', 'disrupting', 'delve'
  ];
  const norm = body.toLowerCase();
  for (const word of banned) {
    if (norm.includes(word)) {
      return { isValid: false, reason: `contains_banned_word_${word}` };
    }
  }
  
  return { isValid: true, reason: null };
}

/**
 * Generates all daily content formats matching verified items count (no padding)
 */
export async function generateContent(verifiedItems, dateStr) {
  const draftPath = path.join(config.dirs.drafts, `draft_${dateStr}.json`);
  const newsletterPath = path.join(config.dirs.newsletters, `newsletter_${dateStr}.md`);
  
  if (verifiedItems.length === 0) {
    console.log('[generator] Error: Cannot generate content for 0 verified items. Halted.');
    throw new Error('Zero verified items for content generation.');
  }

  if (fs.existsSync(draftPath)) {
    console.log(`[generator] Found existing draft file at ${draftPath}. Loading draft...`);
    try {
      const draftData = JSON.parse(fs.readFileSync(draftPath, 'utf-8'));
      if (fs.existsSync(newsletterPath)) {
        console.log(`[generator] Newsletter markdown already exists at ${newsletterPath}`);
      } else {
        let newsletterMd = `# ${draftData.newsletter.title}\n\n`;
        newsletterMd += `*Date: ${dateStr} | Sourced by FutureLoop (@thefutureloop_co)*\n\n`;
        newsletterMd += `${draftData.newsletter.introduction}\n\n`;
        newsletterMd += `## 🚀 Today's Top Stories\n\n`;
        
        draftData.newsletter.stories.forEach((story, idx) => {
          newsletterMd += `### ${idx + 1}. [${story.title}](${story.link})\n`;
          newsletterMd += `${story.body}\n\n`;
        });
        
        newsletterMd += `## 💡 Actionable Takeaway\n\n`;
        newsletterMd += `${draftData.newsletter.takeaway}\n\n`;
        newsletterMd += `---\n*Thanks for reading! Follow our daily insights on X: [@thefutureloop_co](https://x.com/thefutureloop_co)*\n`;
        
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
    mdContent += `Please generate the daily content suite based on these verified items. You will write your response back to \`content/drafts/draft_${dateStr}.json\` matching the schema. Verify that the number of generated xPosts matches the verified items count exactly.\n\n`;
    mdContent += `### Verified Items:\n`;
    
    verifiedItems.forEach((item, idx) => {
      mdContent += `[${idx + 1}] **${item.title}** (${item.source})\n`;
      mdContent += `- URL: ${item.resolvedUrl}\n`;
      mdContent += `- Details: ${item.description}\n`;
      if (item.gradeResult) {
        mdContent += `- Verbatim Quote: "${item.gradeResult.verbatim_quote}" (${item.gradeResult.location})\n`;
        mdContent += `- Verified Caveat: ${item.gradeResult.caveat}\n`;
      }
      mdContent += '\n';
    });
    
    fs.writeFileSync(requestFile, mdContent, 'utf-8');
    console.log(`[Agent-Assisted Mode] Generation request written to: ${requestFile}`);
    return null;
  }
  
  console.log(`Generating content using Gemini for ${verifiedItems.length} verified items...`);
  const ai = new GoogleGenAI({ apiKey });
  
  // Load recent post performance to automatically adjust topics
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
      tractionSummary = `\nRecent audience traction metrics:\n` +
        sortedTopics.map(([topic, score]) => `- ${topic}: Traction Score ${score.toFixed(1)}`).join('\n') +
        `\n\nInstructions: Prioritize generating deeper coverage in high-scoring categories.`;
    }
  }

  // Enforce strict limit on number of posts
  const postsCount = Math.min(verifiedItems.length, 8);
  
  const prompt = `
You are an expert scientific editor and analyst for "FutureLoop", a premium data-driven research intelligence publication in Deep Tech, AI, and Biotech.
Your tone is: objective, academic-level rigor, analytical, concise, and data-first. Avoid hyperbole or marketing fluff.

Recent Traction Context:
${tractionSummary || "No historical traction data logged yet."}

Verified Source Items:
${JSON.stringify(verifiedItems, null, 2)}

Strict Editorial & Style Guidelines:
- Never use these banned words: "delve", "robust", "novel", "testament", "revolutionize", "harness", "furthermore", "moreover", "in conclusion", "synergy", "pivotal", "landscape", "leverage", "interestingly", "importantly", "comprehensive", "excited", "thrilled", "dive deep".
- Write like a human analyst: Start sentences with the most interesting fact or statistic. Avoid broad marketing generalities or rhetorical questions.
- Hook style: Don't ask questions (e.g., "Have you ever wanted to scale?"). Instead, state a sharp statistic or measured benchmark.
- Evidence vs. Interpretation: Keep reported benchmark metrics and factual evidence strictly separate from subjective interpretations.
- No URLs in Post Bodies: Do NOT include any HTTP or HTTPS links in the X post text fields. All links must go in the scheduled metadata/replies.
- Post character limit: Every single post must be under 280 characters.

Instructions:
1. "xPosts":
   - Create exactly ${postsCount} X posts (matching the verified items count).
   - Each post must correspond to one of the verified items.
   - The body of each post must contain the verified number and the corresponding caveat.
   - Timing: Distribute these posts starting at 06:00 UTC (8:00 AM Stockholm) spaced exactly 110 minutes apart.
2. "newsletter":
   - Create a newsletter draft summarizing these stories.
   - For each story, output:
     * One-Sentence Finding: State the core result in under 40 words.
     * Key Benchmark: Present a comparison details block.
     * The TFL Evidence Ladder: Classify (E1 to E5).
     * The Dual-Score Matrix: Assign Confidence and Potential Impact (1-10).
     * Time-to-Impact Timeline: Classify.
     * Reality Check (Assumptions & Missing Controls): Call out hidden flaws.
     * Practical Implication: Provide 3 actionable takeaways.

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
    
    // Hard Assertion: Verify the number of generated posts equals the verified items count
    const actualPostsGenerated = Array.isArray(draftData.xPosts) ? draftData.xPosts.length : 0;
    if (actualPostsGenerated !== postsCount) {
      console.log(`[generator] Warning: Expected ${postsCount} posts but Gemini returned ${actualPostsGenerated}. Truncating/Adjusting.`);
      if (draftData.xPosts) {
        draftData.xPosts = draftData.xPosts.slice(0, postsCount);
      }
    }

    // Align scheduled times (110m intervals starting at 06:00 UTC / 8:00 AM Stockholm)
    if (Array.isArray(draftData.xPosts)) {
      console.log('[generator] Aligning scheduled times (110m intervals starting at 06:00 UTC)...');
      draftData.xPosts.forEach((post, index) => {
        const totalMinutes = 6 * 60 + index * 110;
        const hour = String(Math.floor((totalMinutes / 60) % 24)).padStart(2, '0');
        const min = String(totalMinutes % 60).padStart(2, '0');
        post.scheduledTime = `${hour}:${min}`;
        
        // Enforce validateDraft checks on each post body
        const val = validateDraft(post.text);
        if (!val.isValid) {
          console.log(`[generator] Warning: Post ${post.id} failed validation: ${val.reason}. Stripping invalid terms.`);
          // Simple sanitization to strip any URLs or banned terms
          post.text = post.text
            .replace(/https?:\/\/[^\s]+/gi, '') // Strip links
            .replace(/\[verify\]/gi, '')         // Strip verify placeholders
            .replace(/breaking|delve|robust|novel/gi, '') // Strip banned terms
            .trim();
        }
      });
    }

    // Save draft JSON
    fs.writeFileSync(draftPath, JSON.stringify(draftData, null, 2), 'utf-8');
    console.log(`Saved content draft JSON to ${draftPath}`);
    
    // Format and save newsletter markdown
    let newsletterMd = `# ${draftData.newsletter.title}\n\n`;
    newsletterMd += `*Date: ${dateStr} | Sourced by FutureLoop (@thefutureloop_co)*\n\n`;
    newsletterMd += `${draftData.newsletter.introduction}\n\n`;
    newsletterMd += `## 🚀 Today's Top Stories\n\n`;
    
    draftData.newsletter.stories.forEach((story, idx) => {
      newsletterMd += `### ${idx + 1}. [${story.title}](${story.link})\n`;
      newsletterMd += `${story.body}\n\n`;
    });
    
    newsletterMd += `## 💡 Actionable Takeaway\n\n`;
    newsletterMd += `${draftData.newsletter.takeaway}\n\n`;
    newsletterMd += `---\n*Thanks for reading! Follow our daily insights on X: [@thefutureloop_co](https://x.com/thefutureloop_co)*\n`;
    
    fs.writeFileSync(newsletterPath, newsletterMd, 'utf-8');
    console.log(`Saved formatted newsletter Markdown to ${newsletterPath}`);
    
    return { draftData, draftPath, newsletterPath };
  } catch (error) {
    console.error('Error during content generation with Gemini:', error.message);
    throw error;
  }
}
