import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import config from './config.js';

const parser = new Parser({
  headers: {
    'User-Agent': 'FutureLoopContentBot/1.0.0 (contact: support@topstatszone.com)'
  }
});

/**
 * Normalizes strings to help with deduplication
 */
function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Fetch Hacker News top stories using the keyless official API
 */
async function fetchHackerNews() {
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topStoriesRes.ok) throw new Error(`HN status: ${topStoriesRes.status}`);
    const storyIds = await topStoriesRes.json();
    
    // Fetch details for top 15 stories
    const stories = [];
    for (const id of storyIds.slice(0, 15)) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!storyRes.ok) continue;
        const story = await storyRes.json();
        if (story && story.title && story.url) {
          stories.push({
            title: story.title,
            link: story.url,
            source: 'Hacker News',
            description: `Score: ${story.score} by ${story.by} with ${story.descendants || 0} comments`,
            category: 'Tech News & Discussions',
            timestamp: new Date(story.time * 1000).toISOString()
          });
        }
      } catch (err) {
        // Skip individual errors
      }
    }
    return stories;
  } catch (error) {
    console.error('Error fetching Hacker News:', error.message);
    // Fallback to RSS feed if API fails
    try {
      const feed = await parser.parseURL('https://news.ycombinator.com/rss');
      return feed.items.map(item => ({
        title: item.title,
        link: item.link,
        source: 'Hacker News (RSS)',
        description: item.content || '',
        category: 'Tech News & Discussions',
        timestamp: new Date().toISOString()
      }));
    } catch (rssError) {
      console.error('HN RSS fallback failed:', rssError.message);
      return [];
    }
  }
}

/**
 * Fetch Reddit RSS items safely
 */
async function fetchRedditSubreddit(subreddit, category = 'Reddit Discussion') {
  try {
    const feedUrl = `https://www.reddit.com/r/${subreddit}/hot.rss`;
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const xmlText = await response.text();
    const feed = await parser.parseString(xmlText);
    return feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      source: `r/${subreddit}`,
      description: item.contentSnippet || item.content || '',
      category: category,
      timestamp: item.isoDate || new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error.message);
    return [];
  }
}

/**
 * Fetch new products from Product Hunt RSS
 */
async function fetchProductHunt() {
  try {
    const feed = await parser.parseURL('https://www.producthunt.com/feed');
    return feed.items.slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      source: 'Product Hunt',
      description: item.contentSnippet || item.content || '',
      category: 'Product Releases',
      timestamp: item.isoDate || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching Product Hunt:', error.message);
    return [];
  }
}

/**
 * Fetch top recent AI research papers from arXiv
 */
async function fetcharXivPapers() {
  try {
    const res = await fetch('http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=lastUpdatedDate&sortOrder=descending&max_results=10');
    if (!res.ok) throw new Error(`arXiv status: ${res.status}`);
    const xmlText = await res.text();
    
    // Parse arXiv XML using basic string splitting (regex) to avoid heavy XML parser dependencies
    const entries = xmlText.split('<entry>');
    const papers = [];
    
    // The first segment is feed metadata, skip it
    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
      
      if (titleMatch && idMatch) {
        const title = titleMatch[1].trim().replace(/\s+/g, ' ');
        const link = idMatch[1].trim();
        const description = summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, ' ').slice(0, 300) + '...' : '';
        const published = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();
        
        papers.push({
          title,
          link,
          source: 'arXiv CS.AI',
          description,
          category: 'Research Papers',
          timestamp: published
        });
      }
    }
    return papers;
  } catch (error) {
    console.error('Error fetching arXiv Papers:', error.message);
    return [];
  }
}

/**
 * Fetch top scientific breakthroughs and biotech/medical research from Nature, Science, NEJM, and Cell
 */
async function fetchPremiumScienceNews() {
  const feeds = [
    { name: 'Nature Journal', url: 'https://www.nature.com/nature.rss' },
    { name: 'Nature Biotech', url: 'https://www.nature.com/nbt/feed' },
    { name: 'Science Magazine', url: 'https://www.science.org/rss/news_current.xml' },
    { name: 'NEJM', url: 'https://www.nejm.org/action/showFeed?jc=nejm&type=etoc' },
    { name: 'Cell', url: 'https://www.cell.com/cell/inpress.rss' }
  ];
  
  const results = [];
  
  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const xmlText = await response.text();
      const parsed = await parser.parseString(xmlText);
      
      const items = parsed.items.slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        source: feed.name,
        description: item.contentSnippet || item.content || '',
        category: 'Biotech & Pharma',
        timestamp: item.isoDate || new Date().toISOString()
      }));
      
      results.push(...items);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Loads upcoming conference alerts from our local curated calendar database
 */
function fetchUpcomingConferences() {
  try {
    const confPath = path.join(config.dirs.analytics, 'conferences.json');
    if (!fs.existsSync(confPath)) return [];
    const data = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
    
    return data.map(conf => ({
      title: `${conf.name} (${conf.dates})`,
      link: conf.link,
      source: 'Conference Calendar',
      description: `${conf.name} takes place in ${conf.location} on ${conf.dates}. Focus: ${conf.focus}. URL: ${conf.link}`,
      category: 'Conferences',
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error reading conference database:', error.message);
    return [];
  }
}

/**
 * Fetch top tech hardware and product news from Ars Technica and TechCrunch
 */
async function fetchPremiumTechAndHardwareNews() {
  const feeds = [
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    { name: 'TechCrunch Hardware', url: 'https://techcrunch.com/category/hardware/feed/' }
  ];
  
  const results = [];
  
  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const xmlText = await response.text();
      const parsed = await parser.parseString(xmlText);
      
      const items = parsed.items.slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        source: feed.name,
        description: item.contentSnippet || item.content || '',
        category: 'Deep Tech & Startups',
        timestamp: item.isoDate || new Date().toISOString()
      }));
      
      results.push(...items);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Fetch trending tech/science stories from premium global newspapers and outlets (MIT Tech Review, WIRED, NYT)
 */
async function fetchPremiumNewspapersAndOutlets() {
  const feeds = [
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', cat: 'Deep Tech & Startups' },
    { name: 'WIRED Science', url: 'https://www.wired.com/feed/category/science/latest/rss', cat: 'Biotech & Pharma' },
    { name: 'WIRED Gear', url: 'https://www.wired.com/feed/category/gear/latest/rss', cat: 'Deep Tech & Startups' },
    { name: 'NYT Technology', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', cat: 'Deep Tech & Startups' }
  ];
  
  const results = [];
  
  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const xmlText = await response.text();
      const parsed = await parser.parseString(xmlText);
      
      const items = parsed.items.slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        source: feed.name,
        description: item.contentSnippet || item.content || '',
        category: feed.cat,
        timestamp: item.isoDate || new Date().toISOString()
      }));
      
      results.push(...items);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Fetch stock, crypto, and geopolitical tech policy trends from Yahoo Finance and CFR
 */
async function fetchFinanceAndGeopoliticalNews() {
  const feeds = [
    { name: 'CNBC Tech Markets', url: 'https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=technology', cat: 'Deep Tech & Startups' },
    { name: 'CNBC Finance Markets', url: 'https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=finance', cat: 'Deep Tech & Startups' },
    { name: 'CoinDesk Crypto', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml', cat: 'Deep Tech & Startups' }
  ];
  
  const results = [];
  
  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const xmlText = await response.text();
      const parsed = await parser.parseString(xmlText);
      
      const items = parsed.items.slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        source: feed.name,
        description: item.contentSnippet || item.content || '',
        category: feed.cat,
        timestamp: item.isoDate || new Date().toISOString()
      }));
      
      results.push(...items);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Fetch trending biomedical papers from PubMed Trending
 */
async function fetchPubMedTrending() {
  try {
    const response = await fetch('https://pubmed.ncbi.nlm.nih.gov/trending/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const html = await response.text();
    
    const regex = /<a[^>]*class="docsum-title"[^>]*href="\/(\d+)\/"[^>]*>\s*([\s\S]*?)\s*<\/a>/g;
    let match;
    const papers = [];
    
    while ((match = regex.exec(html)) !== null && papers.length < 10) {
      const pmid = match[1];
      const title = match[2].replace(/<\/?[^>]+(>|$)/g, '').trim().replace(/\s+/g, ' ');
      papers.push({
        title: title,
        link: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        source: 'PubMed Trending',
        description: `PubMed Trending article. PMID: ${pmid}. Title: ${title}`,
        category: 'Biotech & Pharma',
        timestamp: new Date().toISOString()
      });
    }
    return papers;
  } catch (error) {
    console.error('Error fetching PubMed Trending:', error.message);
    return [];
  }
}

/**
 * Run the full scraper pipeline
 */
export async function scrapeAllSources() {
  console.log('Sourcing trending items...');
  
  const [hn, singularity, technology, startups, productHunt, arxiv, biotech, hardware, newsOutlets, markets, pubmed] = await Promise.all([
    fetchHackerNews(),
    fetchRedditSubreddit('singularity', 'AI News & Future'),
    fetchRedditSubreddit('technology', 'Technology Trends'),
    fetchRedditSubreddit('startups', 'Startup & Business Ideas'),
    fetchProductHunt(),
    fetcharXivPapers(),
    fetchPremiumScienceNews(),
    fetchPremiumTechAndHardwareNews(),
    fetchPremiumNewspapersAndOutlets(),
    fetchFinanceAndGeopoliticalNews(),
    fetchPubMedTrending()
  ]);
  
  const conferences = fetchUpcomingConferences();
  const allItems = [...hn, ...singularity, ...technology, ...startups, ...productHunt, ...arxiv, ...biotech, ...hardware, ...newsOutlets, ...markets, ...pubmed, ...conferences];
  console.log(`Successfully fetched ${allItems.length} raw stories.`);
  
  // Deduplicate by normalized title & URL
  const seenTitles = new Set();
  const seenLinks = new Set();
  const uniqueItems = [];
  
  for (const item of allItems) {
    const normTitle = normalizeTitle(item.title);
    if (!normTitle || seenTitles.has(normTitle) || seenLinks.has(item.link)) {
      continue;
    }
    seenTitles.add(normTitle);
    seenLinks.add(item.link);
    uniqueItems.push(item);
  }
  
  console.log(`Filtered down to ${uniqueItems.length} unique items.`);
  
  // Take top 80 (sorted by newest, or keeping order from top lists)
  return uniqueItems.slice(0, 80);
}

/**
 * Save scraped raw items to a daily JSON file
 */
export function saveRawItems(items, dateStr) {
  const filepath = path.join(config.dirs.drafts, `raw_${dateStr}.json`);
  fs.writeFileSync(filepath, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`Saved raw items to ${filepath}`);
  return filepath;
}
