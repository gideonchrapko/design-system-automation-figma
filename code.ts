// ============================================================================
// AI Blog Template Generator Plugin - SOURCE OF TRUTH
// ============================================================================
// This plugin uses OpenAI to intelligently select and organize Figma components
// based on blog title and keywords to create custom templates
// 
// IMPORTANT: This is the source file. Do not edit code.js directly.
// All changes must be made to this file (code.ts) and then compiled.
// ============================================================================

// ============================================================================
// CONFIGURABLE RULES - Modify these to change how the AI selects components
// ============================================================================

const AI_RULES = {
  // Background layout rules
  backgroundRules: {
    'bg-one': { 
      maxSupporting: 2, 
      positions: ['top-left', 'custom-bg-one-2'],
      description: 'Simple layout with 2 supporting images: one at top-left, one at (250,750) sized 250x250'
    },
    'bg-two': { 
      maxSupporting: 1, 
      positions: ['top-right'],
      description: 'Balanced layout with 1 supporting graphic at top-right'
    },
    'bg-three': { 
      maxSupporting: 0, 
      positions: [],
      description: 'Simple layout with no supporting graphics'
    },
    'bg-four': { 
      maxSupporting: 2, 
      positions: ['top-mid-left', 'bottom-mid-left'],
      description: 'Left layout with two smaller supporting graphics'
    }
  },
  
      // Main image compatibility rules
    mainImageRules: {
      'main-illustration': ['bg-one', 'bg-two'], // NOT bg-four - logos get bg-four
      'main-3d': ['bg-three'],
      'main-logo': ['bg-four']
    },
    
    // Main illustration positioning and sizing rules
    mainIllustrationRules: {
      'bg-one': { x: 650, y: 150, width: 700, height: 700 },
      'bg-two': { x: 144, y: 150, width: 700, height: 700 },
      'bg-four': { x: 624, y: 175, width: 650, height: 650 },
      'bg-three': { x: 375, y: 125, width: 750, height: 750 } // Centered for 3D images
    },
  
  // Additional AI instructions
  additionalInstructions: [
    'Main images should be thematically related to the blog content',
    'Supporting images should complement the main image and background',
    'Consider color harmony between background and supporting elements',
    'Ensure visual hierarchy with main image as focal point'
  ],
  componentSizes: {
    mainIllustration: { width: 700, height: 700 },
    supportingGraphic: { width: 500, height: 500 }
  }
};

// ============================================================================
// END CONFIGURABLE RULES
// ============================================================================

// ============================================================================
// PLUGIN AVAILABILITY SYSTEM - Tracks when plugin is open and active
// ============================================================================

// Heartbeat interval for plugin availability (5 seconds)
const HEARTBEAT_INTERVAL = 5000;

// Function to send heartbeat to server
async function sendHeartbeat() {
  try {
    console.log('💓 Sending heartbeat...');
    const response = await fetch(`${VERCEL_URL}/api/check-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'heartbeat' }),
      credentials: 'omit'
    });
    
    if (response.ok) {
      console.log('💓 Heartbeat sent successfully');
    } else {
      console.log('⚠️ Heartbeat failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error sending heartbeat:', error);
  }
}

// Start heartbeat system
function startHeartbeat() {
  console.log('💓 Starting plugin heartbeat system...');
  
  // Send initial heartbeat immediately
  sendHeartbeat();
  
  // Set up interval for regular heartbeats
  const heartbeatInterval = setInterval(() => {
    console.log('💓 Interval triggered - sending heartbeat...');
    sendHeartbeat();
  }, HEARTBEAT_INTERVAL);
  
  console.log('💓 Heartbeat interval set for every', HEARTBEAT_INTERVAL / 1000, 'seconds');
}


// Handle plugin focus/blur events
function setupFocusHandling() {
  // In Figma plugin environment, we can't use window/document events
  // Instead, we rely on the heartbeat system and Figma's plugin lifecycle
  console.log('📱 Plugin focus handling setup complete');
  
  // Figma plugins automatically stop when closed, so the heartbeat will stop
  // The server will detect the timeout after 10 seconds of no heartbeats
}

// ============================================================================
// USAGE TRACKING SYSTEM - Prevents overuse of specific images
// ============================================================================

// In-memory usage tracking (resets when plugin restarts)
const imageUsageTracker: { [imageName: string]: number } = {};

// Function to get usage count for an image
function getImageUsageCount(imageName: string): number {
  return imageUsageTracker[imageName] || 0;
}

// Function to increment usage count for an image
function incrementImageUsage(imageName: string): void {
  imageUsageTracker[imageName] = (imageUsageTracker[imageName] || 0) + 1;
  const currentCount = imageUsageTracker[imageName];
  console.log(`📊 Usage updated for ${imageName}: ${currentCount} times used`);
  
  // Log warning if image is being overused
  if (currentCount >= 3) {
    console.log(`⚠️  WARNING: ${imageName} has been used ${currentCount} times - consider using less frequently`);
  }
}

// Function to log current usage statistics
function logUsageStatistics(): void {
  const stats = { ...imageUsageTracker };
  const sortedStats: [string, number][] = [];
  
  for (const imageName of Object.keys(stats)) {
    sortedStats.push([imageName, stats[imageName]]);
  }
  
  sortedStats.sort(([,a], [,b]) => b - a);
  
  console.log(`📊 Current Image Usage Statistics:`);
  if (sortedStats.length === 0) {
    console.log(`  No images have been used yet.`);
  } else {
    sortedStats.forEach(([imageName, count]) => {
      console.log(`  ${imageName}: ${count} times`);
    });
  }
}


// ============================================================================
// END USAGE TRACKING SYSTEM
// ============================================================================

// Configuration
const VERCEL_URL = 'https://slack-webhook-personal.vercel.app';

interface ComponentInfo {
  id: string;
  name: string;
  type: 'background' | 'main' | 'supporting';
  description?: string;
  node: ComponentNode;
}

interface TemplateSelection {
  background: string;
  mainImage: string;
  supportingImages: string[];
  layout: string;
  reasoning: string;
}


figma.showUI(__html__, { width: 500, height: 600 });

// Get all components from the current document
async function getAllComponents(): Promise<ComponentInfo[]> {
  const components: ComponentInfo[] = [];
  
  // Load all pages first (required for dynamic-page access)
  await figma.loadAllPagesAsync();
  
  // Get all component sets and components
  const componentSets = figma.root.findAll(node => node.type === 'COMPONENT_SET') as ComponentSetNode[];
  const components_ = figma.root.findAll(node => node.type === 'COMPONENT') as ComponentNode[];
  
  // Process component sets
  componentSets.forEach(set => {
    set.children.forEach(child => {
      if (child.type === 'COMPONENT') {
        const component = child as ComponentNode;
        const info = categorizeComponent(component);
        if (info) {
          components.push(info);
        }
      }
    });
  });
  
  // Process standalone components
  components_.forEach(component => {
    const info = categorizeComponent(component);
    if (info) {
      components.push(info);
    }
  });
  
  return components;
}

// Categorize components based on naming convention
function categorizeComponent(component: ComponentNode): ComponentInfo | null {
  const name = component.name.toLowerCase();
  
  // Background images: bg-number-colour
  if (name.startsWith('bg-')) {
    return {
      id: component.id,
      name: component.name,
      type: 'background',
      description: `Background image: ${component.name}`,
      node: component
    };
  }
  
  // Main images: descriptive names
  if (name.includes('main') || name.includes('hero') || name.includes('primary')) {
    return {
      id: component.id,
      name: component.name,
      type: 'main',
      description: `Main image: ${component.name}`,
      node: component
    };
  }
  
  // Supporting images: only those starting with 'supporting-graphic-'
  if (name.startsWith('supporting-graphic-')) {
    return {
      id: component.id,
      name: component.name,
      type: 'supporting',
      description: `Supporting image: ${component.name}`,
      node: component
    };
  }
  
  return null;
}


// Get positioning for supporting images based on background type
function getPositionsForBackground(bgType: string): { x: number, y: number, customSize?: {width:number, height:number} }[] {
  const rule = AI_RULES.backgroundRules[bgType as keyof typeof AI_RULES.backgroundRules];
  
  if (!rule) {
    return [{ x: 50, y: 600 }]; // default to bottom-left
  }
  
  const positions: { x: number, y: number, customSize?: {width:number, height:number} }[] = [];
  
  rule.positions.forEach((position, idx) => {
    switch (position) {
      case 'bottom-left':
        positions.push({ x: 50, y: 600 });
        break;
      case 'top-right':
        positions.push({ x: 1000, y: 0 });
        break;
      case 'center':
        positions.push({ x: 525, y: 325 });
        break;
      case 'top-left':
        positions.push({ x: 0, y: 0 });
        break;
      case 'bottom-right':
        positions.push({ x: 1000, y: 600 });
        break;
      case 'top-mid-left':
        positions.push({ x: 0, y: 125 });
        break;
      case 'bottom-mid-left':
        positions.push({ x: 0, y: 500 });
        break;
      case 'custom-bg-one-2':
        positions.push({ x: 250, y: 750, customSize: { width: 250, height: 250 } });
        break;
      default:
        positions.push({ x: 50, y: 600 });
    }
  });
  
  return positions;
}

// Helper function to find Grid layer within a node
function findGridLayer(node: SceneNode): SceneNode | null {
  // If the node itself is named "Grid", return it
  if (node.name === 'Grid') {
    return node;
  }
  
  // If the node has children, search through them
  if ('children' in node) {
    for (const child of node.children) {
      const found = findGridLayer(child);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

// Debug function to print the structure of a node
function debugNodeStructure(node: SceneNode, depth: number = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}- ${node.name} (${node.type})`);
  
  if ('children' in node) {
    for (const child of node.children) {
      debugNodeStructure(child, depth + 1);
    }
  }
}

function getAllowedBackgroundsForMain(mainName: string): string[] {
  // Check for prefix match
  if (mainName.startsWith('main-illustration')) {
    return AI_RULES.mainImageRules['main-illustration'];
  }
  if (mainName.startsWith('main-3d')) {
    return AI_RULES.mainImageRules['main-3d'];
  }
  if (mainName.startsWith('main-logo')) {
    return AI_RULES.mainImageRules['main-logo'];
  }
  return [];
}


function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildPrompt(mainImages: { name: string }[], blogTitle: string, keywords: string): string {
  console.log(`🔍 Building AI prompt with:`, { blogTitle, keywords, imageCount: mainImages.length });
  const prompt = `
You are a world-class visual designer for Figma templates.
Rules:
- Prioritize image names that contain any of the title or keyword terms, even partially.
- Pick the most relevant and specific match.
- If multiple options are similar, choose the one that captures the core concept of the post.
- Never fabricate a name — choose only from the provided list.

Available main images:
${mainImages.map(m => `- ${m.name}`).join('\n')}

Blog Title: "${blogTitle}"
Keywords: "${keywords}"

Respond with the exact name of the most relevant main image from the list above. If none are relevant, pick the closest match. Respond with only the name, nothing else.
`;
  console.log(`📝 Generated prompt:`, prompt);
  return prompt;
}

async function callOpenAIChat(apiKey: string | null, prompt: string, maxTokens: number = 50): Promise<string> {
  // If an API key is provided (UI flow), call OpenAI directly. Otherwise, use server proxy (Slack flow)
  if (apiKey && apiKey.trim() !== '') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      })
    });
    const data = await response.json();
    return (data.choices?.[0]?.message?.content ?? '').trim();
  }
  // No API key available locally: use Vercel proxy that holds the key in env
  console.log(`🌐 Using Vercel proxy for OpenAI call to: ${VERCEL_URL}/api/openai-chat`);
  const proxyResponse = await fetch(`${VERCEL_URL}/api/openai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ prompt, max_tokens: maxTokens, temperature: 0.7 })
  });
  
  console.log(`🌐 Proxy response status: ${proxyResponse.status} ${proxyResponse.statusText}`);
  
  if (!proxyResponse.ok) {
    const text = await proxyResponse.text();
    console.error(`❌ Proxy error response: ${text}`);
    throw new Error(`OpenAI proxy error: ${proxyResponse.status} ${proxyResponse.statusText} - ${text}`);
  }
  
  const proxyData = await proxyResponse.json();
  console.log(`🌐 Proxy response data:`, proxyData);
  
  if (!proxyData.content) {
    console.error(`❌ Proxy response missing content:`, proxyData);
    throw new Error('Proxy response missing content field');
  }
  
  return (proxyData.content ?? '').trim();
}

async function getBestImageFromOpenAI(apiKey: string | null, prompt: string): Promise<string> {
  try {
    console.log(`🤖 Calling OpenAI with prompt length: ${prompt.length}`);
    const content = await callOpenAIChat(apiKey, prompt, 50);
    console.log(`🤖 OpenAI response: "${content}"`);
    
    if (!content || content.trim() === '') {
      throw new Error('OpenAI returned empty response');
    }
    
    const result = content.trim().split('\n')[0].replace(/^Best main image:\s*/i, '').trim();
    console.log(`🤖 Extracted result: "${result}"`);
    
    if (!result || result === '') {
      throw new Error('Failed to extract valid result from OpenAI response');
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error in getBestImageFromOpenAI:`, error);
    console.error(`❌ Prompt was: "${prompt}"`);
    throw error;
  }
}

// Function to get the top pick from every single chunk with improved variety (optimized for speed)
async function getTopPickFromEveryChunk(
  apiKey: string | null,
  mainImages: ComponentInfo[],
  blogTitle: string,
  keywords: string,
  chunkSize = 25,
  maxPicks = 5
): Promise<{ name: string, thumbnail: string, chunkNumber: number }[]> {
  // Shuffle images before chunking to add randomness
  const shuffledImages = [...mainImages].sort(() => Math.random() - 0.5);
  const chunks = chunkArray(shuffledImages, chunkSize);
  const chunkTopPicks: ComponentInfo[] = [];
  
  console.log(`🔍 Processing ${chunks.length} chunks with ${chunkSize} images each...`);
  
  // Get 1 pick from each chunk (fast - only 1 AI call per chunk)
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(`\n📦 Chunk ${chunkIndex + 1}/${chunks.length} - ${chunk.length} images:`);
    
    // Get the top pick from this chunk (single AI call)
    const prompt = buildPrompt(chunk, blogTitle, keywords);
    const winnerName = await getBestImageFromOpenAI(apiKey, prompt);
    const winner = chunk.find(m => m.name === winnerName);
    
    if (winner) {
      console.log(`  🏆 Top pick from chunk ${chunkIndex + 1}: ${winner.name}`);
      
      // Add variety: 60% chance to use a different relevant image from the same chunk
      let finalWinner = winner;
      if (chunk.length > 1 && Math.random() < 0.6) {
        // Find relevant alternatives (no AI call needed - just filter)
        const relevantImages = chunk.filter(img => {
          const imgName = img.name.toLowerCase();
          const titleWords = blogTitle.toLowerCase().split(/\W+/).filter(w => w.length > 2);
          const keywordWords = keywords.toLowerCase().split(/\W+/).filter(w => w.length > 2);
          const allWords = [...titleWords, ...keywordWords];
          return allWords.some(word => imgName.includes(word));
        });
        
        if (relevantImages.length > 1) {
          // Prioritize less-used images when selecting variety
          const otherRelevant = relevantImages.filter(img => img.name !== winner.name);
          if (otherRelevant.length > 0) {
            // Get the least used relevant image for better variety
            const sortedByUsage = [...otherRelevant].sort((a, b) => {
              const usageA = getImageUsageCount(a.name);
              const usageB = getImageUsageCount(b.name);
              // Add some randomness: 40% chance to ignore usage
              if (Math.random() < 0.4) {
                return Math.random() - 0.5;
              }
              return usageA - usageB;
            });
            
            // Pick from top 3 least used (or all if less than 3)
            const candidates = sortedByUsage.slice(0, Math.min(3, sortedByUsage.length));
            if (candidates.length > 0) {
              finalWinner = candidates[Math.floor(Math.random() * candidates.length)];
              const winnerUsage = getImageUsageCount(winner.name);
              const finalWinnerUsage = getImageUsageCount(finalWinner.name);
              console.log(`  🎲 Variety: Using ${finalWinner.name} (usage: ${finalWinnerUsage}) instead of ${winner.name} (usage: ${winnerUsage})`);
            }
          }
        }
      }
      
      chunkTopPicks.push(finalWinner);
    } else {
      console.log(`  ❌ No valid pick found for chunk ${chunkIndex + 1}`);
    }
  }
  
  // Remove duplicates by name
  const uniquePicks: ComponentInfo[] = [];
  const seenNames = new Set<string>();
  for (const pick of chunkTopPicks) {
    if (!seenNames.has(pick.name)) {
      uniquePicks.push(pick);
      seenNames.add(pick.name);
    }
  }
  
  // Sort by usage count (least used first) to prioritize variety, with randomness
  uniquePicks.sort((a, b) => {
    const usageA = getImageUsageCount(a.name);
    const usageB = getImageUsageCount(b.name);
    // Add randomness: 30% chance to ignore usage for more variety
    if (Math.random() < 0.3) {
      return Math.random() - 0.5;
    }
    return usageA - usageB;
  });
  
  // Take top maxPicks (default 5)
  let finalPicks = uniquePicks.slice(0, maxPicks);
  
  // If we don't have enough unique picks, fill with random unused images
  if (finalPicks.length < maxPicks) {
    const usedNames = new Set(finalPicks.map(p => p.name));
    const unusedImages = mainImages.filter(img => !usedNames.has(img.name));
    const shuffledUnused = [...unusedImages].sort(() => Math.random() - 0.5);
    const needed = maxPicks - finalPicks.length;
    finalPicks.push(...shuffledUnused.slice(0, needed));
  }
  
  console.log(`\n🎯 Selected ${finalPicks.length} diverse picks: ${finalPicks.map(p => p.name).join(', ')}`);
  
  // Export thumbnails and track usage
  const picksWithThumbnails = await Promise.all(finalPicks.map(async (pick, index) => {
    const bytes = await pick.node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 100 } });
    const base64 = uint8ToBase64(bytes);
    // Track usage
    incrementImageUsage(pick.name);
    return {
      name: pick.name,
      thumbnail: `data:image/png;base64,${base64}`,
      chunkNumber: Math.floor(index / 2) + 1
    };
  }));
  
  return picksWithThumbnails;
}

// Call OpenAI API to select main image only
async function selectComponentsWithAI(
  apiKey: string | null,
  blogTitle: string,
  keywords: string,
  components: ComponentInfo[]
): Promise<TemplateSelection> {
  const backgrounds = components.filter(c => c.type === 'background');
  const mainImages = components.filter(c => c.type === 'main');
  const supportingImages = components.filter(c => c.type === 'supporting');

  // Build the prompt for the AI
  const prompt = `
You are a world-class visual designer for Figma templates.
Your job is to pick the most semantically relevant main image for a blog post, using only the provided names.

Rules:
- Prioritize image names that contain any of the title or keyword terms, even partially.
- Pick a relevant match, but don't always choose the most obvious one.
- Consider variety and different visual approaches.
- Never fabricate a name — choose only from the provided list.

Available main images:
${mainImages.map(m => `- ${m.name}`).join('\n')}

Examples:

Blog Title: "How AI is Transforming Email Campaigns"
Keywords: "ai, email, automation"
Best main image: main-illustration-email-pink
Why this is the best match:
- The name includes “email”
- Relevant to the blog topic on email campaigns
- Most direct match from the list

Blog Title: "Using Voice Assistants for Better Customer Experience"
Keywords: "voice, sound, assistant"
Best main image: main-illustration-volume-voice-sound-blue
Why this is the best match:
- Contains “voice” and “sound”
- Matches core theme of the blog

Blog Title: "${blogTitle}"
Keywords: "${keywords}"

IMPORTANT: You must respond in exactly this format:
Best main image: [exact name from the list above]
Why this is the best match: [1-3 bullet points explaining your reasoning]

Do not add any other text, formatting, or explanations outside of this format.
`;

  // Call OpenAI to pick the main image
  const content = await callOpenAIChat(apiKey, prompt, 50);
  console.log(`🤖 Raw AI response: "${content}"`);
  
  const match = content.match(/Best main image:\s*([^\n]+)/i);
  const mainImageName = match ? match[1].trim() : '';
  console.log(`🔍 Extracted main image name: "${mainImageName}"`);
  
  const mainImage = mainImages.find(m => m.name === mainImageName);
  console.log(`🔍 Found main image in components:`, mainImage ? mainImage.name : 'NOT FOUND');
  console.log(`🔍 Available main images:`, mainImages.map(m => m.name));

  // If AI selection fails, use intelligent fallback with variety
  if (!mainImage) {
    console.error(`❌ AI response parsing failed:`);
    console.error(`   - Raw response: "${content}"`);
    console.error(`   - Extracted name: "${mainImageName}"`);
    console.error(`   - Available images:`, mainImages.map(m => m.name));
    
    // Try to find a fallback by looking for any image name in the response
    console.log(`🔄 Attempting fallback parsing...`);
    for (const img of mainImages) {
      if (content.toLowerCase().includes(img.name.toLowerCase())) {
        console.log(`✅ Fallback found: ${img.name}`);
        const fallbackImage = img;
        console.log(`🎨 AI selected main image (fallback): ${fallbackImage.name}`);
        console.log(`🎨 Available backgrounds for this main image: ${getAllowedBackgroundsForMain(fallbackImage.name).join(', ')}`);
        
        // Continue with fallback image
        const allowedBackgrounds = getAllowedBackgroundsForMain(fallbackImage.name);
        const availableBackgrounds = backgrounds.filter(bg =>
          allowedBackgrounds.some(type => bg.name.startsWith(type))
        );
        
        if (availableBackgrounds.length === 0) {
          throw new Error('No valid backgrounds available for the selected main image.');
        }
        
        // Ensure we get variety in background colors by grouping by base type
        const backgroundGroups: { [key: string]: ComponentInfo[] } = {};
        availableBackgrounds.forEach(bg => {
          const baseType = bg.name.split('-').slice(0, 2).join('-');
          if (!backgroundGroups[baseType]) {
            backgroundGroups[baseType] = [];
          }
          backgroundGroups[baseType].push(bg);
        });
        
        console.log(`🎨 Available background groups:`, backgroundGroups);
        
        // Randomly select a base type, then randomly select from that group
        const baseTypes = Object.keys(backgroundGroups);
        const selectedBaseType = baseTypes[Math.floor(Math.random() * baseTypes.length)];
        const selectedGroup = backgroundGroups[selectedBaseType];
        const background = selectedGroup[Math.floor(Math.random() * selectedGroup.length)];
        
        console.log(`🎨 Selected background: ${background.name} from group ${selectedBaseType}`);
        console.log(`🎨 All backgrounds in selected group: ${selectedGroup.map(bg => bg.name).join(', ')}`);

        // Use rules to pick supporting images for the background
        const bgType = background.name.split('-').slice(0, 2).join('-');
        const rule = AI_RULES.backgroundRules[bgType as keyof typeof AI_RULES.backgroundRules];
        const numSupporting = rule ? rule.maxSupporting : 1;
        
        console.log(`🎨 Background type: ${bgType}, max supporting images: ${numSupporting}`);
        
        const supportingPool = [...supportingImages];
        const supportingImagesPicked: string[] = [];
        for (let i = 0; i < numSupporting && supportingPool.length > 0; i++) {
          const idx = Math.floor(Math.random() * supportingPool.length);
          supportingImagesPicked.push(supportingPool[idx].name);
          supportingPool.splice(idx, 1);
        }
        
        console.log(`🎨 Selected supporting images: ${supportingImagesPicked.join(', ')}`);

        // Track usage of the fallback image
        incrementImageUsage(fallbackImage.name);
        
        // Return the selection with fallback image
        return {
          background: background.name,
          mainImage: fallbackImage.name,
          supportingImages: supportingImagesPicked,
          layout: '',
          reasoning: 'Main image selected by AI fallback, background and supporting images selected by design rules.'
        };
      }
    }
    
    throw new Error(`AI did not return a valid main image name. Response: "${content}"`);
  }
  
  // AI selection succeeded, but let's add variety by sometimes using a different relevant image
  console.log(`🎨 AI selected main image: ${mainImage.name}`);
  console.log(`🎨 Available backgrounds for this main image: ${getAllowedBackgroundsForMain(mainImage.name).join(', ')}`);
  
  // Find other relevant images to add variety
  const relevantImages = mainImages.filter(img => {
    const imgName = img.name.toLowerCase();
    const titleWords = blogTitle.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const keywordWords = keywords.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const allWords = [...titleWords, ...keywordWords];
    
    return allWords.some(word => imgName.includes(word));
  });
  
  console.log(`🎨 Found ${relevantImages.length} relevant images for variety`);
  
  // 30% chance to use a different relevant image for variety
  let finalMainImage = mainImage;
  if (relevantImages.length > 1 && Math.random() < 0.3) {
    const otherRelevantImages = relevantImages.filter(img => img.name !== mainImage.name);
    if (otherRelevantImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherRelevantImages.length);
      finalMainImage = otherRelevantImages[randomIndex];
      console.log(`🎨 Variety mode: Using different relevant image: ${finalMainImage.name}`);
    }
  }
  
  console.log(`🎨 Final main image selected: ${finalMainImage.name}`);

  // Use rules to pick a valid background for the main image
  const allowedBackgrounds = getAllowedBackgroundsForMain(finalMainImage.name); // e.g., ['bg-one', 'bg-two']
  const availableBackgrounds = backgrounds.filter(bg =>
    allowedBackgrounds.some(type => bg.name.startsWith(type))
  );
  
  if (availableBackgrounds.length === 0) {
    throw new Error('No valid backgrounds available for the selected main image.');
  }
  
  // Ensure we get variety in background colors by grouping by base type
  const backgroundGroups: { [key: string]: ComponentInfo[] } = {};
  availableBackgrounds.forEach(bg => {
    const baseType = bg.name.split('-').slice(0, 2).join('-'); // e.g., 'bg-one' from 'bg-one-green'
    if (!backgroundGroups[baseType]) {
      backgroundGroups[baseType] = [];
    }
    backgroundGroups[baseType].push(bg);
  });
  
  console.log(`🎨 Available background groups:`, backgroundGroups);
  
  // Randomly select a base type, then randomly select from that group
  const baseTypes = Object.keys(backgroundGroups);
  const selectedBaseType = baseTypes[Math.floor(Math.random() * baseTypes.length)];
  const selectedGroup = backgroundGroups[selectedBaseType];
  const background = selectedGroup[Math.floor(Math.random() * selectedGroup.length)];
  
  console.log(`🎨 Selected background: ${background.name} from group ${selectedBaseType}`);
  console.log(`🎨 All backgrounds in selected group: ${selectedGroup.map(bg => bg.name).join(', ')}`);

  // Use rules to pick supporting images for the background
  const bgType = background.name.split('-').slice(0, 2).join('-');
  const rule = AI_RULES.backgroundRules[bgType as keyof typeof AI_RULES.backgroundRules];
  const numSupporting = rule ? rule.maxSupporting : 1;
  
  console.log(`🎨 Background type: ${bgType}, max supporting images: ${numSupporting}`);
  
  const supportingPool = [...supportingImages];
  const supportingImagesPicked: string[] = [];
  for (let i = 0; i < numSupporting && supportingPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * supportingPool.length);
    supportingImagesPicked.push(supportingPool[idx].name);
    supportingPool.splice(idx, 1);
  }
  
  console.log(`🎨 Selected supporting images: ${supportingImagesPicked.join(', ')}`);

  // Track usage of the selected main image
  incrementImageUsage(finalMainImage.name);
  
  // Return the selection
  return {
    background: background.name,
    mainImage: finalMainImage.name,
    supportingImages: supportingImagesPicked,
    layout: '',
    reasoning: 'Main image selected by AI with variety, background and supporting images selected by design rules.'
  };
}

// Create the template composition
async function createTemplate(selection: TemplateSelection, components: ComponentInfo[]): Promise<Uint8Array> {
  try {
    // Find the selected components
    const background = components.find(
      c => c.type === 'background' && c.name.trim().toLowerCase().startsWith(selection.background.trim().toLowerCase())
    ) || components.find(c => c.type === 'background'); // fallback to first available
    
    console.log(`🎨 Looking for background starting with: ${selection.background}`);
    console.log(`🎨 Found background: ${background?.name}`);
    
    const mainImage = components.find(
      c => c.type === 'main' && c.name.trim().toLowerCase() === selection.mainImage.trim().toLowerCase()
    );
    const supportingImages = selection.supportingImages.map(name => 
      components.find(c => c.type === 'supporting' && c.name.trim().toLowerCase() === name.trim().toLowerCase())
    ).filter(Boolean);
    
    if (!background || !mainImage) {
      throw new Error('Selected components not found');
    }
    
    // Create a new frame for the template
    const frame = figma.createFrame();
    frame.name = `Blog Template - ${selection.background}`;
    
    // Add background (use natural size, no resizing)
    const bgInstance = background.node.createInstance();
    frame.resize(bgInstance.width, bgInstance.height);
    frame.appendChild(bgInstance);
    
    // Store reference to background instance for later grid layer extraction
    const backgroundInstance = bgInstance;
    
    // Add main image with specific positioning for main-illustration and main-3d
    const mainInstance = mainImage.node.createInstance();
    
    if (mainInstance.name.startsWith('main-illustration') || mainInstance.name.startsWith('main-3d') || mainInstance.name.startsWith('main-logo')) {
      // Extract background type without color (e.g., 'bg-one' from 'bg-one-green')
      const bgType = selection.background.split('-').slice(0, 2).join('-'); // 'bg-one' from 'bg-one-green'
      
      // Use specific positioning and sizing based on background
      const illustrationRule = AI_RULES.mainIllustrationRules[bgType as keyof typeof AI_RULES.mainIllustrationRules];
      
      if (illustrationRule) {
        mainInstance.resize(illustrationRule.width, illustrationRule.height);
        mainInstance.x = illustrationRule.x;
        mainInstance.y = illustrationRule.y;
      } else {
        // Fallback to default sizing and centering
        mainInstance.resize(AI_RULES.componentSizes.mainIllustration.width, AI_RULES.componentSizes.mainIllustration.height);
        mainInstance.x = (frame.width - mainInstance.width) / 2;
        mainInstance.y = (frame.height - mainInstance.height) / 2;
      }
    } else {
      // Default for non-main-illustration components
      mainInstance.resize(400, 300);
      mainInstance.x = (frame.width - mainInstance.width) / 2;
      mainInstance.y = (frame.height - mainInstance.height) / 2;
    }
    
    frame.appendChild(mainInstance);
    
    // Add supporting images based on background type with randomization
    // Extract background type without color (e.g., 'bg-one' from 'bg-one-pink')
    const bgType = selection.background.split('-').slice(0, 2).join('-'); // 'bg-one' from 'bg-one-pink'
    
    const rule = AI_RULES.backgroundRules[bgType as keyof typeof AI_RULES.backgroundRules];
    if (rule && rule.positions.length > 0) {
      const positions = getPositionsForBackground(bgType);
      
      // Get all available supporting graphics for randomization
      const allSupportingGraphics = components.filter(c => c.type === 'supporting');
      
      // Randomly select supporting graphics for each position
      for (let index = 0; index < positions.length; index++) {
        if (!positions || typeof positions[index] === 'undefined') {
          continue;
        }
        if (allSupportingGraphics.length > 0) {
          // Randomly select a supporting graphic
          const randomIndex = Math.floor(Math.random() * allSupportingGraphics.length);
          const selectedSupporting = allSupportingGraphics[randomIndex];
          
          const supportInstance = selectedSupporting.node.createInstance();
          if (selectedSupporting.name.startsWith('supporting-graphic')) {
            // Check if this is bg-four and use smaller size, or bg-one's second supporting graphic
            if (bgType === 'bg-four') {
              supportInstance.resize(375, 375); // Smaller size for bg-four
            } else if (
              bgType === 'bg-one' &&
              positions[index]?.customSize?.width !== undefined &&
              positions[index]?.customSize?.height !== undefined
            ) {
              supportInstance.resize(positions[index]?.customSize?.width ?? 250, positions[index]?.customSize?.height ?? 250);
            } else {
              supportInstance.resize(AI_RULES.componentSizes.supportingGraphic.width, AI_RULES.componentSizes.supportingGraphic.height);
            }
          } else {
            supportInstance.resize(150, 150); // default
          }
          supportInstance.x = positions[index]?.x ?? 0;
          supportInstance.y = positions[index]?.y ?? 0;
          frame.appendChild(supportInstance);
          
          // Remove the selected graphic from the pool to avoid duplicates (optional)
          allSupportingGraphics.splice(randomIndex, 1);
        }
      }
    }
    
    // Move Grid layer to the top of the hierarchy
    try {
      
      // Method 1: Try to find Grid layer directly
      const gridLayer = findGridLayer(backgroundInstance);
      if (gridLayer) {
        console.log('✅ Found Grid layer:', gridLayer.name);
        
        // Create a new frame for the Grid layer to ensure proper containment
        const gridFrame = figma.createFrame();
        gridFrame.name = "Grid Overlay";
        gridFrame.x = 0;
        gridFrame.y = 0;
        gridFrame.resize(frame.width, frame.height);
        gridFrame.fills = []; // Make it transparent
        
        // Clone the Grid layer and add it to the grid frame
        const clonedGrid = gridLayer.clone();
        clonedGrid.x = 0;
        clonedGrid.y = 0;
        
        // Only resize if the node supports it
        if ('resize' in clonedGrid) {
          clonedGrid.resize(frame.width, frame.height);
        }
        
        // Make sure the Grid layer is visible
        if ('visible' in clonedGrid) {
          clonedGrid.visible = true;
        }
        
        // Add to grid frame first, then add grid frame to main frame
        gridFrame.appendChild(clonedGrid);
        frame.appendChild(gridFrame);
        
        } else {
          debugNodeStructure(backgroundInstance, 0);
          
          // Method 2: Try original component
          const originalGridLayer = findGridLayer(background.node);
          if (originalGridLayer) {
            const clonedOriginalGrid = originalGridLayer.clone();
            frame.appendChild(clonedOriginalGrid);
          }
        }

    } catch (error) {
      console.error('Grid layer error:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Select the frame
    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    // Export the template as PNG and return the bytes
    const pngBytes = await frame.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 1500 } });
    return pngBytes;
  } catch (error) {
    console.error('Template creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create template: ${errorMessage}`);
  }
}

// Handle messages from the UI
figma.ui.onmessage = async (msg: any) => {
  if (msg.type === 'generate-template') {
    try {
      const { apiKey, blogTitle, keywords } = msg;
      // Get all components
      const components = await getAllComponents();
      if (components.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No components found in the document. Please add some components first.'
        });
        return;
      }
      // Get main images
      const mainImages = components.filter(c => c.type === 'main');
      if (mainImages.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No main images found in the document. Please add some main image components first.'
        });
        return;
      }
      // Get top pick from every single chunk
      const topPicks = await getTopPickFromEveryChunk(apiKey, mainImages, blogTitle, keywords, 25);
      if (topPicks.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No suitable images found. Please try different keywords or check your components.'
        });
        return;
      }
      // Auto-select the first pick and generate template directly
      const selectedMainImage = topPicks[0].name;
      console.log('🎯 Auto-selecting first pick:', selectedMainImage);
      
      // Select components using AI, but override main image
      const selection = await selectComponentsWithAI(apiKey, blogTitle, keywords, components);
      selection.mainImage = selectedMainImage;
      
      // Create the template and export as PNG
      const pngBytes = await createTemplate(selection, components);
      figma.ui.postMessage({
        type: 'exported-image',
        bytes: Array.from(pngBytes),
        blogTitle,
        background: selection.background,
        mainImage: selection.mainImage,
        supportingImages: selection.supportingImages
      });
    } catch (error) {
      console.error('Template generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      figma.ui.postMessage({
        type: 'error',
        message: errorMessage
      });
    }
  } else if (msg.type === 'main-image-selected') {
    try {
      const { apiKey, blogTitle, keywords, selectedMainImage } = msg;
      // Get all components
      const components = await getAllComponents();
      if (components.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'No components found in the document. Please add some components first.'
        });
        return;
      }
      // Select components using AI, but override main image
      const selection = await selectComponentsWithAI(apiKey, blogTitle, keywords, components);
      selection.mainImage = selectedMainImage;
      
      // Create the template and export as PNG
      const pngBytes = await createTemplate(selection, components);
      figma.ui.postMessage({
        type: 'exported-image',
        bytes: Array.from(pngBytes),
        blogTitle,
        background: selection.background,
        mainImage: selection.mainImage,
        supportingImages: selection.supportingImages
      });
    } catch (error) {
      console.error('Template generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      figma.ui.postMessage({
        type: 'error',
        message: errorMessage
      });
    }
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Helper to convert Uint8Array to base64 (browser compatible)
function uint8ToBase64(bytes: Uint8Array): string {
  // Polyfill for environments without btoa
  const base64abc = [
    "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P",
    "Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f",
    "g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v",
    "w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/"
  ];
  let result = '', i, l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i-2] >> 2];
    result += base64abc[((bytes[i-2] & 0x03) << 4) | (bytes[i-1] >> 4)];
    result += base64abc[((bytes[i-1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += base64abc[bytes[i] & 0x3f];
  }
  if (i === l+1) { // 1 octet yet to write
    result += base64abc[bytes[i-2] >> 2];
    result += base64abc[((bytes[i-2] & 0x03) << 4)];
    result += '==';
  }
  if (i === l) { // 2 octets yet to write
    result += base64abc[bytes[i-2] >> 2];
    result += base64abc[((bytes[i-2] & 0x03) << 4) | (bytes[i-1] >> 4)];
    result += base64abc[((bytes[i-1] & 0x0f) << 2)];
    result += '=';
  }
  return result;
}

interface SlackRequest {
  id: string;
  blogTitle: string;
  userId: string;
  channelId: string;
  timestamp: number;
  status: string;
  selectedGraphicIndex?: number;
  topPicks?: any[]; // Store the top picks to ensure consistency
}

// Global state for tracking processed requests to prevent duplicates
const processedRequestIds = new Set<string>();

async function checkForSlackRequests() {
  try {
    console.log('🔍 Checking for Slack requests...');
    const response = await fetch(`${VERCEL_URL}/api/check-requests`, {
      credentials: 'omit'
    });
    const data = await response.json();
    
    // Handle both old array format and new object format
    let requests: SlackRequest[] = [];
    if (Array.isArray(data)) {
      // Old format: direct array
      requests = data;
    } else if (data.requests && Array.isArray(data.requests)) {
      // New format: { requests: [...] }
      requests = data.requests;
    } else {
      console.log('⚠️ Unexpected response format:', data);
      requests = [];
    }
    
    console.log(`📋 Found ${requests.length} total requests`);
    
    // Get current time for all calculations
    const now = Date.now();
    
    // No caching - process all requests every time
    
    // Process only recent pending requests (less than 3 minutes old)
    const threeMinutesAgo = now - (3 * 60 * 1000);
    const pending = requests.filter(r => 
      (r.status === 'pending' || r.status === 'waiting_for_selection') &&
      r.timestamp > threeMinutesAgo
    );
    console.log(`⏳ Found ${pending.length} recent pending requests`);
    
    // Debug: Log all requests
    console.log('🔍 All requests:');
    requests.forEach(r => {
      const ageMinutes = Math.floor((now - r.timestamp) / (60 * 1000));
      const isRecent = r.timestamp > threeMinutesAgo;
      console.log(`  - ${r.blogTitle} (ID: ${r.id}, Status: ${r.status}, Age: ${ageMinutes}m, Recent: ${isRecent})`);
    });
    
    // Log old requests that are being ignored
    const oldRequests = requests.filter(r => 
      (r.status === 'pending' || r.status === 'waiting_for_selection') &&
      r.timestamp <= threeMinutesAgo
    );
    if (oldRequests.length > 0) {
      console.log('⏭️ Ignoring old requests:');
      oldRequests.forEach(r => {
        const ageMinutes = Math.floor((now - r.timestamp) / (60 * 1000));
        console.log(`  - ${r.blogTitle} (ID: ${r.id}, Age: ${ageMinutes}m)`);
      });
    }
    
    // Process each pending request individually, but skip if already processed
    for (const request of pending) {
      // Check if we've already processed this request
      if (processedRequestIds.has(request.id)) {
        console.log(`⏭️ Skipping already processed request: ${request.blogTitle} (ID: ${request.id})`);
        continue;
      }
      
      console.log(`🚀 Processing request: ${request.blogTitle} (ID: ${request.id})`);
      
      // Mark as processed before starting to prevent race conditions
      processedRequestIds.add(request.id);
      
      try {
        await processSlackRequest(request);
        console.log(`✅ Finished processing request: ${request.id}`);
      } catch (error) {
        console.error(`❌ Error processing request ${request.id}:`, error);
        // Remove from processed set on error so it can be retried
        processedRequestIds.delete(request.id);
      }
    }
    
    // Clean up old processed IDs (older than 10 minutes) to prevent memory leaks
    const tenMinutesAgo = now - (10 * 60 * 1000);
    for (const requestId of processedRequestIds) {
      const request = requests.find(r => r.id === requestId);
      if (request && request.timestamp < tenMinutesAgo) {
        processedRequestIds.delete(requestId);
        console.log(`🧹 Cleaned up old processed request ID: ${requestId}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Slack requests:', error);
  }
}

async function processSlackRequest(request: SlackRequest) {
  try {
    console.log(`🎨 Processing request for: "${request.blogTitle}"`);
    console.log(`📤 Will send response to channel: ${request.channelId}`);
    console.log(`🆔 Request ID: ${request.id}`);
    console.log(`📊 Request details:`, JSON.stringify(request, null, 2));
    
    // Create all templates directly (no selection needed)
    await createAllTemplates(request);
    
  } catch (error) {
    console.error('Error processing Slack request:', error);
    const message = error instanceof Error ? error.message : 
                   (typeof error === 'object' && error !== null) ? JSON.stringify(error) : 
                   String(error);
    console.error(`❌ Sending error to Slack: ${message}`);
    await sendSlackError(request, message);
  }
}

async function createAllTemplates(request: SlackRequest) {
  try {
    console.log(`🎯 Creating all 5 templates for: "${request.blogTitle}"`);
    
    // Mark as processing
    await updateRequestStatus(request.id, 'processing', 'Creating all templates...');
    
    // Get components
    const components = await getAllComponents();
    console.log(`🔧 Found ${components.length} total components`);
    
    if (components.length === 0) {
      console.log('❌ No components found in Figma file');
      await sendSlackError(request, 'No components found in Figma file');
      return;
    }
    
    // Get main images
    const mainImages = components.filter(c => c.type === 'main');
    console.log(`🖼️ Found ${mainImages.length} main images`);
    
    if (mainImages.length === 0) {
      console.log('❌ No main images found in Figma file');
      await sendSlackError(request, 'No main images found in Figma file');
      return;
    }
    
    // Get top picks - use blog title as keywords if none provided
    const keywords = request.blogTitle; // Use blog title as keywords for better AI selection
    console.log(`🔍 AI Selection - Blog Title: "${request.blogTitle}", Keywords: "${keywords}"`);
    
    let topPicks: { name: string, thumbnail: string, chunkNumber: number }[];
    try {
      topPicks = await getTopPickFromEveryChunk(
        null,
        mainImages,
        request.blogTitle, 
        keywords
      );
      console.log(`🎯 Successfully got top picks:`, topPicks.map(p => p.name));
    } catch (error) {
      console.error(`❌ Error getting top picks:`, error);
      await sendSlackError(request, `Failed to select images: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    
    console.log(`🎯 Creating templates for top picks:`, topPicks.map(p => p.name));
    
    // Log current usage statistics
    logUsageStatistics();
    
    // Create all 5 templates
    const downloadLinks = [];
    
    for (let i = 0; i < topPicks.length; i++) {
      const selectedPick = topPicks[i];
      console.log(`🎨 Creating template ${i + 1}/5 with: ${selectedPick.name}`);
      
      // Add delay between AI calls to reduce rate limiting (except for first iteration)
      if (i > 0) {
        console.log(`⏳ Adding 2 second delay between AI calls to reduce rate limiting...`);
        await delay(2000);
      }
      
      // Get allowed backgrounds for this main image
      const allowedBackgrounds = getAllowedBackgroundsForMain(selectedPick.name);
      
      // Get all available background components
      const backgroundComponents = components.filter(c => c.type === 'background');
      
      // Filter to only allowed background types
      const availableBackgrounds = backgroundComponents.filter(bg =>
        allowedBackgrounds.some(type => bg.name.startsWith(type))
      );
      
      let background: string;
      if (availableBackgrounds.length > 0) {
        // Group backgrounds by base type for variety
        const backgroundGroups: { [key: string]: ComponentInfo[] } = {};
        availableBackgrounds.forEach(bg => {
          const baseType = bg.name.split('-').slice(0, 2).join('-');
          if (!backgroundGroups[baseType]) {
            backgroundGroups[baseType] = [];
          }
          backgroundGroups[baseType].push(bg);
        });
        
        // Randomly select a base type, then randomly select from that group
        const baseTypes = Object.keys(backgroundGroups);
        const selectedBaseType = baseTypes[Math.floor(Math.random() * baseTypes.length)];
        const selectedGroup = backgroundGroups[selectedBaseType];
        const selectedBg = selectedGroup[Math.floor(Math.random() * selectedGroup.length)];
        background = selectedBg.name;
        
        console.log(`🎨 Template ${i + 1}: Selected background ${background} from group ${selectedBaseType}`);
      } else {
        // Fallback to first available background
        background = backgroundComponents.length > 0 ? backgroundComponents[0].name : 'bg-one';
        console.log(`🎨 Template ${i + 1}: Using fallback background ${background}`);
      }
      
      // Create template selection
      const selection: TemplateSelection = {
        background: background,
        mainImage: selectedPick.name,
        supportingImages: [], // We'll let AI select these
        layout: 'standard',
        reasoning: `Selected ${selectedPick.name} as main image with ${background} background`
      };
      
      // Let AI select supporting images
      let aiSelection: TemplateSelection;
      try {
        aiSelection = await selectComponentsWithAI(
          null,
          request.blogTitle,
          keywords,
          components
        );
        console.log(`🤖 AI selection successful for template ${i + 1}`);
      } catch (error) {
        console.error(`❌ Error in AI selection for template ${i + 1}:`, error);
        // Use a fallback selection
        aiSelection = {
          background: background,
          mainImage: selectedPick.name,
          supportingImages: [],
          layout: 'standard',
          reasoning: `Fallback selection due to AI error: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
      // Override main image with our selection
      aiSelection.mainImage = selectedPick.name;
      aiSelection.background = background;
      
      // Create the template
      const pngBytes = await createTemplate(aiSelection, components);
      
      // Convert to WebP and upload
      const webpData = await convertToWebP(pngBytes);
      const uploadResult = await uploadImageForDownload(webpData, `${request.blogTitle}_Option_${i + 1}`);
      
      if (uploadResult.success && uploadResult.downloadUrl) {
        downloadLinks.push({
          option: i + 1,
          name: selectedPick.name,
          url: uploadResult.downloadUrl
        });
        console.log(`✅ Template ${i + 1} uploaded: ${uploadResult.downloadUrl}`);
      } else {
        console.log(`❌ Failed to upload template ${i + 1}`);
      }
    }
    
    // Send all download links to Slack
    const message = `🎨 Here are all 5 templates for "${request.blogTitle}":\n\n` +
      downloadLinks.map(link => 
        `**Option ${link.option}** (${link.name}):\n${link.url}`
      ).join('\n\n') +
      `\n\nChoose the template you prefer by downloading the one you like best!`;
    
    await sendSlackMessage(request.channelId, message);
    console.log(`📤 All templates sent to channel: ${request.channelId}`);
    
    // Mark as completed
    await updateRequestStatus(request.id, 'completed', 'All templates created and sent');
    
    // Log final usage statistics
    logUsageStatistics();
    
  } catch (error) {
    console.error('Error creating all templates:', error);
    const message = error instanceof Error ? error.message : 
                   (typeof error === 'object' && error !== null) ? JSON.stringify(error) : 
                   String(error);
    await sendSlackError(request, message);
  }
}

async function sendSlackError(request: SlackRequest, errorMessage: string) {
  try {
    console.log(`🚨 Sending error message: ${errorMessage}`);
    await updateRequestStatus(request.id, 'error', errorMessage);
    await sendSlackMessage(request.channelId, `❌ Error creating template for "${request.blogTitle}": ${errorMessage}`);
  } catch (error) {
    console.error('Error in sendSlackError:', error);
    console.error('Original error message:', errorMessage);
  }
}

async function updateRequestStatus(requestId: string, status: string, message: string) {
  try {
    console.log(`🔄 Updating request ${requestId} to status: ${status}`);
    const response = await fetch(`${VERCEL_URL}/api/check-requests?updateStatus=true&requestId=${requestId}&status=${status}`, {
      method: 'GET',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to update status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
    } else {
      console.log(`✅ Successfully updated request ${requestId} to ${status}`);
    }
  } catch (error) {
    console.error(`❌ CORS/Network error updating status for ${requestId}:`, error);
  }
}

async function sendSlackMessage(channelId: string, message: string) {
  try {
    console.log(`📤 Sending message to channel ${channelId}: ${message}`);
    
    // Send message directly to slack-messages endpoint
    const response = await fetch(`${VERCEL_URL}/api/slack-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ channel: channelId, text: message })
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to send Slack message: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
    } else {
      console.log(`✅ Successfully sent message to channel ${channelId}`);
    }
  } catch (error) {
    console.error(`❌ CORS/Network error sending Slack message:`, error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
  }
}

async function convertToWebP(pngBytes: Uint8Array): Promise<string> {
  try {
    console.log('🔄 Converting PNG to WebP...');
    
    // For now, we'll return the PNG data as base64
    // In a real implementation, you'd use a WebP conversion library
    const base64Data = uint8ToBase64(pngBytes);
    
    console.log('✅ PNG converted to base64');
    return base64Data;
  } catch (error) {
    console.error('❌ Error converting to WebP:', error);
    throw error;
  }
}

async function uploadImageForDownload(imageData: string, blogTitle: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    console.log('📤 Uploading image for download...');
    
    const response = await fetch(`${VERCEL_URL}/api/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({
        imageData: imageData,
        fileName: blogTitle.replace(/[^a-zA-Z0-9]/g, '_'),
        blogTitle: blogTitle
      })
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to upload image: ${response.status} ${response.statusText}`);
      return { success: false, error: 'Upload failed' };
    }
    
    const result = await response.json();
    console.log('✅ Image uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return { success: false, error: 'Upload error' };
  }
}

// Utility function to add delays between API calls
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start polling when plugin loads
console.log('🚀 Plugin loaded, starting Slack request polling...');
setInterval(checkForSlackRequests, 5000);

// Also check immediately
checkForSlackRequests();

// Start heartbeat system
startHeartbeat();

// Setup focus handling
setupFocusHandling();