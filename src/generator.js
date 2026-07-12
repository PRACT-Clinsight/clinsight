import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
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
  
  const prompt = `
You are an expert scientific editor, systems architect, and head analyst for "@futureloop_co" (FutureLoop), a premium data-driven research intelligence publication in Deep Tech, AI Startups, and Biotech breakthroughs.
Your tone is: objective, academic-level rigor, analytical, concise, defensive, and data-first. Avoid hyperbole or marketing fluff (e.g. do not say "revolutionize", "game changer", or "unprecedented").

Target Audience & Geos:
- USA: Tech founders, venture capital, biotech ecosystems, deep tech investors.
- India: High-scale software engineering, fintech infrastructure, global tech systems.
- Nordics: Deep tech hubs, healthtech/biotech innovations, clean energy, sustainability systems.

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
- Always link to the original source paper, database, or trial.

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
   - For each item, explicitly separate "Measured Evidence" from "Interpretation".
   - Include a final actionable framework, code snippet, or prompt.

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
    newsletterMd += `*Date: ${dateStr} | Sourced by FutureLoop (@futureloop_co)*\n\n`;
    newsletterMd += `${draftData.newsletter.introduction}\n\n`;
    newsletterMd += `## 🚀 Today's Top Stories\n\n`;
    
    draftData.newsletter.stories.forEach((story, idx) => {
      newsletterMd += `### ${idx + 1}. [${story.title}](${story.link})\n`;
      newsletterMd += `${story.body}\n\n`;
    });
    
    newsletterMd += `## 💡 Actionable Takeaway\n\n`;
    newsletterMd += `${draftData.newsletter.takeaway}\n\n`;
    newsletterMd += `---\n*Thanks for reading! Retweet our daily insights on X: [@futureloop_co](https://x.com/futureloop_co)*\n`;
    
    fs.writeFileSync(newsletterPath, newsletterMd, 'utf-8');
    console.log(`Saved formatted newsletter Markdown to ${newsletterPath}`);
    
    return { draftData, draftPath, newsletterPath };
  } catch (error) {
    console.error('Error during content generation with Gemini:', error.message);
    throw error;
  }
}
