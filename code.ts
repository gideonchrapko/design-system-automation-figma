// AI Blog Template Generator Plugin
// This plugin uses OpenAI to intelligently select and organize Figma components
// based on blog title and keywords to create custom templates

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

interface GeneratedTemplate {
  blogTitle: string;
  background: string;
  mainImage: string;
  supportingImages: string[];
  downloadUrl?: string;
}

// Component selection rules
const COMPONENT_RULES = {
  backgrounds: {
    'bg-one': { maxSupporting: 1, position: 'bottom-left' },
    'bg-two': { maxSupporting: 1, position: 'bottom-left, top-right' },
    'bg-three': { maxSupporting: 2, position: 'bottom-left, top-right, center' }
  },
  mainImageRules: {
    'tech-article': ['bg-one', 'bg-two'],
    'lifestyle-article': ['bg-two', 'bg-three'],
    'business-article': ['bg-one', 'bg-three'],
    'creative-article': ['bg-two', 'bg-three']
  }
};

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

// Helper function to find matching logo for company name
function findMatchingLogo(companyName: string, components: ComponentInfo[]): string | null {
  const normalizedCompanyName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Look for logo components that match the company name
  const logoComponents = components.filter(c => c.type === 'main' && c.name.startsWith('main-logo-'));
  
  for (const logo of logoComponents) {
    const logoName = logo.name.toLowerCase().replace('main-logo-', '').replace(/[^a-z0-9]/g, '');
    if (logoName.includes(normalizedCompanyName) || normalizedCompanyName.includes(logoName)) {
      return logo.name;
    }
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
  // ...other rules as needed
  return [];
}

// Function to get relevant main images based on blog title and keywords
function getRelevantMainImages(blogTitle: string, keywords: string, mainImages: any[]) {
    const allWords = (blogTitle + ' ' + keywords)
        .toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 2); // ignore very short words

    // Score each main image by number of keyword matches
    return mainImages
        .map(img => {
            const name = img.name.toLowerCase();
            const matchCount = allWords.filter(word => name.includes(word)).length;
            return { ...img, matchCount };
        })
        .filter(img => img.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount); // most matches first
}

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildPrompt(mainImages: { name: string }[], blogTitle: string, keywords: string): string {
  return `
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
}

async function getBestImageFromOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o', // or 'gpt-4' if you don't have access to 4o
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 50
    })
  });
  const data = await response.json();
  // Extract the first line or the trimmed content as the name
  return data.choices[0].message.content.trim().split('\n')[0].replace(/^Best main image:\s*/i, '').trim();
}

async function pickBestMainImage(
  apiKey: string,
  mainImages: { name: string }[],
  blogTitle: string,
  keywords: string,
  chunkSize = 25
): Promise<string> {
  // 1. Chunk the main images
  const chunks = chunkArray(mainImages, chunkSize);

  // 2. Get the best from each chunk
  const chunkWinners: { name: string }[] = [];
  for (const chunk of chunks) {
    const prompt = buildPrompt(chunk, blogTitle, keywords);
    const winnerName = await getBestImageFromOpenAI(apiKey, prompt);
    const winner = chunk.find(m => m.name === winnerName);
    if (winner) chunkWinners.push(winner);
  }

  // 3. Final round with the chunk winners
  if (chunkWinners.length === 1) return chunkWinners[0].name;
  const finalPrompt = buildPrompt(chunkWinners, blogTitle, keywords);
  return await getBestImageFromOpenAI(apiKey, finalPrompt);
}

// Add a new function to get top picks from each chunk, limited to 3, and export thumbnails
async function getTopMainImagePicksWithThumbnails(
  apiKey: string,
  mainImages: ComponentInfo[],
  blogTitle: string,
  keywords: string,
  chunkSize = 25,
  maxPicks = 3
): Promise<{ name: string, thumbnail: string }[]> {
  const chunks = chunkArray(mainImages, chunkSize);
  const allChunkPicks: ComponentInfo[] = [];
  
  console.log(`🔍 Processing ${chunks.length} chunks with ${chunkSize} images each...`);
  
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(`\n📦 Chunk ${chunkIndex + 1}/${chunks.length} - ${chunk.length} images:`);
    
    // Get top 3 picks from this chunk
    const chunkPicks: ComponentInfo[] = [];
    const chunkCopy = [...chunk]; // Create a copy to avoid modifying original
    
    for (let pickIndex = 0; pickIndex < Math.min(3, chunk.length); pickIndex++) {
      const prompt = buildPrompt(chunkCopy, blogTitle, keywords);
      const winnerName = await getBestImageFromOpenAI(apiKey, prompt);
      const winner = chunkCopy.find(m => m.name === winnerName);
      
      if (winner) {
        chunkPicks.push(winner);
        console.log(`  🏆 Pick ${pickIndex + 1}: ${winner.name}`);
        
        // Remove the winner from the copy so it doesn't get picked again
        const winnerIndex = chunkCopy.findIndex(m => m.name === winnerName);
        if (winnerIndex > -1) {
          chunkCopy.splice(winnerIndex, 1);
        }
      }
    }
    
    console.log(`  ✅ Chunk ${chunkIndex + 1} top picks: ${chunkPicks.map(p => p.name).join(', ')}`);
    allChunkPicks.push(...chunkPicks);
  }
  
  // Take only the first maxPicks from all chunk picks
  const finalPicks = allChunkPicks.slice(0, maxPicks);
  console.log(`\n🎯 Final top ${finalPicks.length} picks across all chunks: ${finalPicks.map(p => p.name).join(', ')}`);
  
  // Export thumbnails for each pick (100px width)
  const picksWithThumbnails = await Promise.all(finalPicks.map(async (pick) => {
    const bytes = await pick.node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 100 } });
    const base64 = uint8ToBase64(bytes);
    return { name: pick.name, thumbnail: `data:image/png;base64,${base64}` };
  }));
  
  return picksWithThumbnails;
}

// New function to get the top pick from every single chunk
async function getTopPickFromEveryChunk(
  apiKey: string,
  mainImages: ComponentInfo[],
  blogTitle: string,
  keywords: string,
  chunkSize = 25
): Promise<{ name: string, thumbnail: string, chunkNumber: number }[]> {
  const chunks = chunkArray(mainImages, chunkSize);
  const chunkTopPicks: { name: string, thumbnail: string, chunkNumber: number }[] = [];
  
  console.log(`🔍 Processing ${chunks.length} chunks with ${chunkSize} images each...`);
  
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(`\n📦 Chunk ${chunkIndex + 1}/${chunks.length} - ${chunk.length} images:`);
    
    // Get the top pick from this chunk
    const prompt = buildPrompt(chunk, blogTitle, keywords);
    const winnerName = await getBestImageFromOpenAI(apiKey, prompt);
    const winner = chunk.find(m => m.name === winnerName);
    
    if (winner) {
      console.log(`  🏆 Top pick from chunk ${chunkIndex + 1}: ${winner.name}`);
      
      // Export thumbnail for this pick (100px width)
      const bytes = await winner.node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 100 } });
      const base64 = uint8ToBase64(bytes);
      
      chunkTopPicks.push({
        name: winner.name,
        thumbnail: `data:image/png;base64,${base64}`,
        chunkNumber: chunkIndex + 1
      });
    } else {
      console.log(`  ❌ No valid pick found for chunk ${chunkIndex + 1}`);
    }
  }
  
  console.log(`\n🎯 Top picks from all ${chunkTopPicks.length} chunks: ${chunkTopPicks.map(p => `Chunk ${p.chunkNumber}: ${p.name}`).join(', ')}`);
  
  return chunkTopPicks;
}

// Call OpenAI API to select main image only
async function selectComponentsWithAI(
  apiKey: string,
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
- Pick the most relevant and specific match.
- If multiple options are similar, choose the one that captures the **core concept** of the post.
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

Respond in this format:
Best main image: <exact name from the list above>
Why this is the best match: <1-3 bullet points explaining your reasoning>
`;

  // Call OpenAI to pick the main image
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
      max_tokens: 50
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  const match = content.match(/Best main image:\s*([^\n]+)/i);
  const mainImageName = match ? match[1].trim() : '';
  const mainImage = mainImages.find(m => m.name === mainImageName);

  if (!mainImage) {
    throw new Error('AI did not return a valid main image name.');
  }

  // Use rules to pick a valid background for the main image
  const allowedBackgrounds = getAllowedBackgroundsForMain(mainImage.name); // e.g., ['bg-one', 'bg-two']
  const availableBackgrounds = backgrounds.filter(bg =>
    allowedBackgrounds.some(type => bg.name.startsWith(type))
  );
  if (availableBackgrounds.length === 0) {
    throw new Error('No valid backgrounds available for the selected main image.');
  }
  const background = availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)];

  // Use rules to pick supporting images for the background
  const bgType = background.name.split('-').slice(0, 2).join('-');
  const rule = AI_RULES.backgroundRules[bgType as keyof typeof AI_RULES.backgroundRules];
  const numSupporting = rule ? rule.maxSupporting : 1;
  const supportingPool = [...supportingImages];
  const supportingImagesPicked: string[] = [];
  for (let i = 0; i < numSupporting && supportingPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * supportingPool.length);
    supportingImagesPicked.push(supportingPool[idx].name);
    supportingPool.splice(idx, 1);
  }

  // Return the selection
  return {
    background: background.name,
    mainImage: mainImage.name,
    supportingImages: supportingImagesPicked,
    layout: '',
    reasoning: 'Main image selected by AI, background and supporting images selected by design rules.'
  };
}

// Create the template composition
async function createTemplate(selection: TemplateSelection, components: ComponentInfo[]): Promise<Uint8Array> {
  try {
    // Find the selected components
    const background = components.find(
      c => c.type === 'background' && c.name.trim().toLowerCase() === selection.background.trim().toLowerCase()
    ) || components.find(c => c.type === 'background'); // fallback to first available
    
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

        } else {

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
    const pngBytes = await frame.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
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
      // Get top pick from every single chunk
      const topPicks = await getTopPickFromEveryChunk(apiKey, mainImages, blogTitle, keywords, 25);
      // Send top picks to UI for user selection
      figma.ui.postMessage({
        type: 'main-image-picks',
        picks: topPicks,
        blogTitle,
        keywords
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
      // --- REMOVED: RANDOMIZE main-illustration color AND base variant if multiple exist ---
      // --- END RANDOMIZE ---
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
