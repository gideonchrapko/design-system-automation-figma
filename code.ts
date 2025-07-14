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
  
  // Supporting images: descriptive names (not main/background)
  if (!name.includes('bg-') && !name.includes('main') && !name.includes('hero')) {
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

// Call OpenAI API to select components
async function selectComponentsWithAI(
  apiKey: string, 
  blogTitle: string, 
  keywords: string, 
  components: ComponentInfo[]
): Promise<TemplateSelection> {
  const backgrounds = components.filter(c => c.type === 'background');
  const mainImages = components.filter(c => c.type === 'main');
  const supportingImages = components.filter(c => c.type === 'supporting');
  
  // Check for company names in blog title and keywords
  const allText = `${blogTitle} ${keywords}`.toLowerCase();
  const logoComponents = mainImages.filter(c => c.name.startsWith('main-logo-'));
  
  // Common company names to look for
  const companyNames = ['botpress', 'kore.ai', 'koreai', 'zapier', 'hubspot', 'salesforce', 'slack'];
  let matchingLogo: string | null = null;
  
  for (const companyName of companyNames) {
    if (allText.includes(companyName.toLowerCase())) {
      matchingLogo = findMatchingLogo(companyName, components);
      if (matchingLogo) {
        console.log(`Found company name "${companyName}" in content, matching logo: ${matchingLogo}`);
        break;
      }
    }
  }
  
  // Build dynamic rules from AI_RULES configuration
  const backgroundRulesText = Object.keys(AI_RULES.backgroundRules)
    .map(bgType => {
      const rule = AI_RULES.backgroundRules[bgType as keyof typeof AI_RULES.backgroundRules];
      return `- For ${bgType}: use ${rule.maxSupporting} supporting image(s) positioned ${rule.positions.join(', ')}`;
    })
    .join('\n');

  const additionalInstructionsText = AI_RULES.additionalInstructions
    .map(instruction => `- ${instruction}`)
    .join('\n');

  const prompt = `
You are an expert graphic designer creating blog post templates. Based on the blog title and keywords, select the most appropriate components from the available options.

Blog Title: "${blogTitle}"
Keywords: "${keywords}"
${matchingLogo ? `DETECTED COMPANY LOGO: "${matchingLogo}" - MUST USE THIS LOGO AND bg-four BACKGROUND` : ''}

Available Components:
Background Images: ${backgrounds.map(b => b.name).join(', ')}
Main Images: ${mainImages.map(m => m.name).join(', ')}
Supporting Images: ${supportingImages.map(s => s.name).join(', ')}

IMPORTANT: You must ONLY select from the exact names listed above. Do not invent or modify any names.

Component Rules:
- Every template needs exactly one background image
- Every template needs exactly one main image
- Background images follow the pattern "bg-number-colour" where number indicates layout complexity
- CRITICAL: main-illustration components can ONLY use backgrounds: bg-one-green, bg-one-black, bg-one-pink, bg-one-yellow, bg-two-green, bg-two-blue, bg-two-pink, bg-two-yellow (NOT bg-three, NOT bg-four)
- CRITICAL: main-3d components can ONLY use backgrounds: bg-three-green, bg-three-blue, bg-three-pink, bg-three-yellow (NOT bg-one, bg-two, bg-four)
- CRITICAL: main-logo components can ONLY use backgrounds: bg-four-green, bg-four-blue, bg-four-pink, bg-four-yellow (NOT bg-one, bg-two, bg-three)
- PRIORITY: If the blog title or keywords mention a company name (e.g., "Botpress", "Kore.ai"), ALWAYS select the corresponding logo component (e.g., main-logo-botpress, main-logo-kore-ai) and use bg-four background
- Try to select different background colors for variety - don't always pick the same color
${backgroundRulesText}

Additional Design Guidelines:
${additionalInstructionsText}

Please respond with a JSON object in this exact format:
{
  "background": "bg-one-blue",
  "mainImage": "main-illustration-tech",
  "supportingImages": ["supporting-graphic-icon"],
  "layout": "bg-one layout with 1 supporting image at top-left",
  "reasoning": "Brief explanation of why these components work well together for this blog post"
}

CRITICAL: Only use the exact component names provided above. Do not create new names.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional graphic designer specializing in blog template creation. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} ${response.statusText === '429' && "You may need to increase OpenAI API usage credits"}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const selection = JSON.parse(content) as TemplateSelection;
    
    // Validate the selection
    if (!selection.background || !selection.mainImage || !selection.supportingImages) {
      throw new Error('Invalid component selection from AI');
    }
    
    // Enforce logo selection if company name was detected
    if (matchingLogo) {
      console.log(`Enforcing logo selection: ${matchingLogo}`);
      selection.mainImage = matchingLogo;
      // Force bg-four background for logos
      const bgFourVariants = backgrounds.filter(bg => bg.name.startsWith('bg-four')).map(bg => bg.name);
      if (bgFourVariants.length > 0) {
        const randomIndex = Math.floor(Math.random() * bgFourVariants.length);
        selection.background = bgFourVariants[randomIndex];
        console.log(`Forced bg-four background: ${selection.background}`);
      }
    }
    
    // Enforce main-illustration background restrictions (bg-one, bg-two, but NOT bg-four - logos get bg-four)
    if (selection.mainImage.startsWith('main-illustration')) {
      const allowedBackgrounds = AI_RULES.mainImageRules['main-illustration'];
      if (allowedBackgrounds.indexOf(selection.background) === -1) {
        // Get all available backgrounds
        const availableBackgrounds = components.filter(c => c.type === 'background').map(c => c.name);
        
        // Filter to only allowed background types (bg-one, bg-two variants, but NOT bg-four)
        const allowedVariants = availableBackgrounds.filter(name => 
          name.startsWith('bg-one-') || name.startsWith('bg-two-')
        );
        
        if (allowedVariants.length > 0) {
          // Randomly select from available allowed variants
          const randomIndex = Math.floor(Math.random() * allowedVariants.length);
          selection.background = allowedVariants[randomIndex];
        } else {
          // Fallback to first available background
          selection.background = availableBackgrounds[0] || 'bg-one-green';
        }
      }
    }
    
    // Enforce main-3d background restrictions (only bg-three)
    if (selection.mainImage.startsWith('main-3d')) {
      const allowedBackgrounds = AI_RULES.mainImageRules['main-3d'];
      if (allowedBackgrounds.indexOf(selection.background) === -1) {
        // Get all available backgrounds
        const availableBackgrounds = components.filter(c => c.type === 'background').map(c => c.name);
        
        // Filter to only bg-three variants
        const allowedVariants = availableBackgrounds.filter(name => 
          name.startsWith('bg-three')
        );
        
        if (allowedVariants.length > 0) {
          // Randomly select from available bg-three variants
          const randomIndex = Math.floor(Math.random() * allowedVariants.length);
          selection.background = allowedVariants[randomIndex];
        } else {
          // Fallback to first available background
          selection.background = availableBackgrounds[0] || 'bg-three-green';
        }
      }
    }
    
    // Enforce main-logo background restrictions (only bg-four)
    if (selection.mainImage.startsWith('main-logo')) {
      const allowedBackgrounds = AI_RULES.mainImageRules['main-logo'];
      if (allowedBackgrounds.indexOf(selection.background) === -1) {
        // Get all available backgrounds
        const availableBackgrounds = components.filter(c => c.type === 'background').map(c => c.name);
        
        // Filter to only bg-four variants
        const allowedVariants = availableBackgrounds.filter(name => 
          name.startsWith('bg-four')
        );
        
        if (allowedVariants.length > 0) {
          // Randomly select from available bg-four variants
          const randomIndex = Math.floor(Math.random() * allowedVariants.length);
          selection.background = allowedVariants[randomIndex];
        } else {
          // Fallback to first available background
          selection.background = availableBackgrounds[0] || 'bg-four-green';
        }
      }
    }
    
    return selection;
  } catch (error) {
    console.error('OpenAI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to select components: ${errorMessage}`);
  }
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
    console.log(`=== BACKGROUND TYPE DEBUG ===`);
    console.log(`Original background: ${selection.background}`);
    console.log(`Extracted bgType: ${bgType}`);
    console.log(`=== END BACKGROUND TYPE DEBUG ===`);
    
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
      console.log('Attempting to find Grid layer in background instance...');
      console.log('Background instance name:', backgroundInstance.name);
      console.log('Background instance type:', backgroundInstance.type);
      
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
        
        console.log('✅ Grid layer added in overlay frame');
        console.log('Grid frame parent:', gridFrame.parent?.name || 'none');
      } else {
        console.log('❌ No Grid layer found in instance. Background structure:');
        debugNodeStructure(backgroundInstance, 0);
        
        // Method 2: Try original component
        const originalGridLayer = findGridLayer(background.node);
        if (originalGridLayer) {
          console.log('✅ Found Grid layer in original component:', originalGridLayer.name);
          const clonedOriginalGrid = originalGridLayer.clone();
          frame.appendChild(clonedOriginalGrid);
          console.log('✅ Grid layer added from original component');
        } else {
          console.log('❌ No Grid layer found anywhere');
        }
      }
      console.log('=== END GRID DEBUG ===');
    } catch (error) {
      console.log('❌ Grid layer error:', error instanceof Error ? error.message : 'Unknown error');
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
      // Select components using AI
      const selection = await selectComponentsWithAI(apiKey, blogTitle, keywords, components);

      // --- RANDOMIZE main-illustration color variant if multiple exist ---
      if (selection.mainImage.startsWith('main-illustration')) {
        // Extract base name (e.g., main-illustration-foo)
        const base = selection.mainImage.split('-').slice(0, 3).join('-');
        // Find all main images with the same base
        const mainVariants = components.filter(c => c.type === 'main' && c.name.startsWith(base));
        if (mainVariants.length > 1) {
          // Randomly select one
          const randomIdx = Math.floor(Math.random() * mainVariants.length);
          selection.mainImage = mainVariants[randomIdx].name;
        }
      }
      // --- END RANDOMIZE ---

      // Create the template and export as PNG
      const pngBytes = await createTemplate(selection, components);
      // Send PNG bytes to UI for further processing
      figma.ui.postMessage({
        type: 'exported-image',
        bytes: Array.from(pngBytes), // Convert Uint8Array to array for postMessage
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
