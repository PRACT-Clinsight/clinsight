import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import config from './config.js';

// Schema for structured JSON output
const responseSchema = {
  type: "OBJECT",
  properties: {
    scoredItems: {
      type: "ARRAY",
      description: "List of items with calculated scores on 1-10 scale.",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          link: { type: "STRING" },
          source: { type: "STRING" },
          description: { type: "STRING" },
          category: { type: "STRING" },
          scores: {
            type: "OBJECT",
            properties: {
              novelty: { type: "INTEGER", description: "How unique/fresh is this? (1-10)" },
              virality: { type: "INTEGER", description: "How likely is this to get likes/reposts? (1-10)" },
              educationalValue: { type: "INTEGER", description: "Does this teach something useful? (1-10)" },
              evergreenPotential: { type: "INTEGER", description: "Will this be relevant in 6 months? (1-10)" },
              businessRelevance: { type: "INTEGER", description: "Can this link to monetization, startups, or digital products? (1-10)" }
            },
            required: ["novelty", "virality", "educationalValue", "evergreenPotential", "businessRelevance"]
          },
          explanation: { type: "STRING", description: "Brief 1-sentence explanation of the scores." }
        },
        required: ["title", "link", "source", "description", "category", "scores", "explanation"]
      }
    }
  },
  required: ["scoredItems"]
};

/**
 * Calculates weighted score
 */
function calculateWeightedScore(scores) {
  const w = {
    novelty: 0.20,
    virality: 0.25,
    educationalValue: 0.20,
    evergreenPotential: 0.15,
    businessRelevance: 0.20
  };
  
  const score = 
    (scores.novelty * w.novelty) +
    (scores.virality * w.virality) +
    (scores.educationalValue * w.educationalValue) +
    (scores.evergreenPotential * w.evergreenPotential) +
    (scores.businessRelevance * w.businessRelevance);
    
  return parseFloat(score.toFixed(2));
}

/**
 * Run scoring on items
 */
function writeScoreRequestFile(rawItems, dateStr) {
  const requestFile = path.join(config.dirs.drafts, `score_request_${dateStr}.md`);
  let mdContent = `# Content Scoring Request (${dateStr})\n\n`;
  mdContent += `Please score the following ${rawItems.length} items. Rank each item from 1-10 on:\n`;
  mdContent += `- **Novelty** (Weight: 20%)\n`;
  mdContent += `- **Virality** (Weight: 25%)\n`;
  mdContent += `- **Educational value** (Weight: 20%)\n`;
  mdContent += `- **Evergreen potential** (Weight: 15%)\n`;
  mdContent += `- **Business relevance** (Weight: 20%)\n\n`;
  mdContent += `Write a JSON block containing the scored items. Format it exactly like this:\n`;
  mdContent += '```json\n';
  mdContent += JSON.stringify({
    scoredItems: [
      {
        title: "Item Title",
        link: "Item URL",
        source: "Item Source",
        description: "Description",
        category: "Category",
        scores: { novelty: 8, virality: 9, educationalValue: 7, evergreenPotential: 6, businessRelevance: 8 },
        explanation: "Explanation here"
      }
    ]
  }, null, 2);
  mdContent += '\n```\n\n## Raw Items\n\n';
  
  rawItems.forEach((item, idx) => {
    mdContent += `### [${idx + 1}] ${item.title}\n`;
    mdContent += `- **Link:** ${item.link}\n`;
    mdContent += `- **Source:** ${item.source} (${item.category})\n`;
    mdContent += `- **Info:** ${item.description}\n\n`;
  });
  
  fs.writeFileSync(requestFile, mdContent, 'utf-8');
  console.log(`\n[Agent-Assisted Mode] Scoring request written to: ${requestFile}`);
  console.log(`Please read this file, perform the scoring, and save the result to content/drafts/scored_${dateStr}.json`);
}

/**
 * Run scoring on items
 */
export async function scoreItems(rawItems, dateStr) {
  const apiKey = config.geminiApiKey;
  
  if (!apiKey) {
    console.log('--- GEMINI_API_KEY NOT SET ---');
    console.log('Creating agent-assisted scoring request file.');
    writeScoreRequestFile(rawItems, dateStr);
    return null;
  }
  
  console.log(`Scoring ${rawItems.length} items using Gemini...`);
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
You are an expert scientific researcher and content ranking officer for "@thefutureloop_co" (TheFutureLoop), a premium data-driven research intelligence publication.
Your focus is strictly AI for Biomedicine, computational biology, bioinformatics, drug discovery, clinical trials, regulatory compliance (FDA/EMA/CDSCO/MHRA/Läkemedelsverket/Swissmedic), pharmacovigilance safety, deep tech startups, developer workflows, and researcher productivity.

Analyze the following list of raw scraped items. Score each item from 1 to 10 on these parameters:
1. Novelty: How fresh, unique, or rare is this scientific news, startup model, or tech paper?
2. Virality: Will this hook deep-tech and biology research audiences on X and LinkedIn?
3. Rigor & Evidence Quality: Does it present clean baselines, controls, ablations, and reproducible codebase elements?
4. Potential Impact: How strongly does it shift workflow speeds, B2B engineering costs, or regulatory timelines?
5. Business Relevance: Does it connect to high-value bio-ML tools, startup funding, digital datasets, or developer SaaS?

Provide a concise 1-sentence explanation of why it got these scores.

Items to score:
${JSON.stringify(rawItems.map((item, idx) => ({ id: idx, title: item.title, description: item.description, category: item.category, source: item.source })), null, 2)}
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
    
    const responseText = response.text;
    const data = JSON.parse(responseText);
    
    // Add links and timestamps back from raw items, and calculate final weighted scores
    const scoredItems = data.scoredItems.map(scoredItem => {
      const original = rawItems.find(r => r.title.toLowerCase().includes(scoredItem.title.toLowerCase().slice(0, 10)));
      return {
        title: scoredItem.title,
        link: original ? original.link : '',
        source: scoredItem.source,
        description: original ? original.description : scoredItem.description,
        category: scoredItem.category,
        scores: scoredItem.scores,
        finalScore: calculateWeightedScore(scoredItem.scores),
        explanation: scoredItem.explanation,
        timestamp: original ? original.timestamp : new Date().toISOString()
      };
    });
    
    // Sort by finalScore descending
    scoredItems.sort((a, b) => b.finalScore - a.finalScore);
    
    const filepath = path.join(config.dirs.drafts, `scored_${dateStr}.json`);
    fs.writeFileSync(filepath, JSON.stringify(scoredItems, null, 2), 'utf-8');
    console.log(`Scored items saved to ${filepath}`);
    
    // Pick the top 5
    const top5 = scoredItems.slice(0, 5);
    console.log(`Top 5 items selected for drafting:`);
    top5.forEach((item, index) => {
      console.log(`  ${index + 1}. [${item.finalScore}] ${item.title} (${item.source})`);
    });
    
    return top5;
  } catch (error) {
    console.error('Error during scoring with Gemini:', error.message);
    console.log('Falling back gracefully to Agent-Assisted Mode...');
    writeScoreRequestFile(rawItems, dateStr);
    return null;
  }
}
