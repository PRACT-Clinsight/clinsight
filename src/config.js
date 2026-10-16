import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure output directory
const baseOutputDir = process.env.CONTENT_OUTPUT_DIR || './content';
const resolvedOutputDir = path.resolve(baseOutputDir);

const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Twitter API keys
  xApiKey: process.env.X_API_KEY,
  xApiSecret: process.env.X_API_SECRET,
  xAccessToken: process.env.X_ACCESS_TOKEN,
  xAccessSecret: process.env.X_ACCESS_SECRET,
  
  // LinkedIn API keys
  linkedinAccessToken: process.env.LINKEDIN_ACCESS_TOKEN,
  linkedinPersonId: process.env.LINKEDIN_PERSON_ID,
  
  // Buffer API keys
  bufferAccessToken: process.env.BUFFER_ACCESS_TOKEN,
  bufferProfileIds: process.env.BUFFER_PROFILE_IDS ? process.env.BUFFER_PROFILE_IDS.split(',').map(s => s.trim()) : [],
  
  // App Config
  outputDir: resolvedOutputDir,
  portingMode: process.env.PORTING_MODE || 'simulation', // simulation or production
  
  // Folders to maintain
  dirs: {
    drafts: path.join(resolvedOutputDir, 'drafts'),
    scheduled: path.join(resolvedOutputDir, 'scheduled'),
    published: path.join(resolvedOutputDir, 'published'),
    analytics: path.join(resolvedOutputDir, 'analytics'),
    images: path.join(resolvedOutputDir, 'images'),
    prompts: path.join(resolvedOutputDir, 'prompts'),
    newsletters: path.join(resolvedOutputDir, 'newsletters'),
  }
};

// Auto-create directories
export function ensureDirectories() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  for (const dirName of Object.values(config.dirs)) {
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
  }
}

export default config;
