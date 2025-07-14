# AI Rules Configuration Guide

This guide explains how to modify the AI component selection rules in the Figma plugin.

## Overview

The plugin enforces rules through **two layers**:

1. **AI Prompt Rules**: Instructions sent to OpenAI for intelligent component selection
2. **Code Enforcement**: Hard-coded positioning and validation logic

## Configurable Rules Section

All rules are defined in the `AI_RULES` object at the top of `code.ts`:

```typescript
const AI_RULES = {
  // Background layout rules
  backgroundRules: {
    'bg-one': { 
      maxSupporting: 1, 
      positions: ['bottom-left'],
      description: 'Simple layout with 1 supporting image at bottom-left'
    },
    'bg-two': { 
      maxSupporting: 2, 
      positions: ['bottom-left', 'top-right'],
      description: 'Balanced layout with 2 supporting images at bottom-left and top-right'
    },
    'bg-three': { 
      maxSupporting: 3, 
      positions: ['bottom-left', 'top-right', 'center'],
      description: 'Complex layout with 3 supporting images at bottom-left, top-right, and center'
    }
  },
  
  // Main image compatibility rules
  mainImageRules: {
    'tech-article': ['bg-one', 'bg-two'],
    'lifestyle-article': ['bg-two', 'bg-three'],
    'business-article': ['bg-one', 'bg-three'],
    'creative-article': ['bg-two', 'bg-three']
  },
  
  // Additional AI instructions
  additionalInstructions: [
    'Main images should be thematically related to the blog content',
    'Supporting images should complement the main image and background',
    'Consider color harmony between background and supporting elements',
    'Ensure visual hierarchy with main image as focal point'
  ]
};
```

## How to Modify Rules

### 1. Add New Background Types

To add a new background type (e.g., `bg-four`):

```typescript
backgroundRules: {
  'bg-one': { 
    maxSupporting: 1, 
    positions: ['top-left'],
    description: 'Simple layout with 1 supporting image at top-left'
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
  // NEW: Add bg-four
  'bg-four': { 
    maxSupporting: 2, 
    positions: ['top-mid-left', 'bottom-mid-left'],
    description: 'Left layout with two smaller supporting graphics'
  }
}
```

### 2. Add New Position Types

To add new positioning options, update the `getPositionsForBackground()` function:

```typescript
rule.positions.forEach(position => {
  switch (position) {
    case 'top-left':
      positions.push({ x: 0, y: 0 });
      break;
    case 'top-right':
      positions.push({ x: 1000, y: 0 });
      break;
    case 'top-mid-left':
      positions.push({ x: 0, y: 125 });
      break;
    case 'bottom-mid-left':
      positions.push({ x: 0, y: 500 });
  }
});
```

### 3. Modify Main Image Compatibility

To change which backgrounds work with which main images:

```typescript
mainImageRules: {
  'main-illustration': ['bg-one', 'bg-two', 'bg-four'],
}
```

### 4. Add New AI Instructions

To give the AI additional guidance:

```typescript
additionalInstructions: [
  'Main images should be thematically related to the blog content',
  'Supporting images should complement the main image and background',
  'Consider color harmony between background and supporting elements',
  'Ensure visual hierarchy with main image as focal point',
  // NEW: Add custom instructions
  'Prefer minimalist designs for business articles',
  'Use vibrant colors for creative content',
  'Ensure accessibility with sufficient contrast ratios'
]
```

## Advanced Customizations

### 1. Dynamic Component Sizing

To make component sizes configurable, add size rules:

```typescript
const AI_RULES = {
  // ... existing rules ...
  
  // Component sizing rules
  componentSizes: {
    mainImage: { width: 400, height: 300 },
    supportingImage: { width: 150, height: 150 },
    frame: { width: 1200, height: 800 }
  },
  
  // Dynamic sizing based on background type
  backgroundSizing: {
    'bg-one': { mainImageScale: 1.0, supportingImageScale: 1.0 },
    'bg-two': { mainImageScale: 0.9, supportingImageScale: 1.1 },
    'bg-three': { mainImageScale: 0.8, supportingImageScale: 1.2 }
  }
};
```

### 2. Color Harmony Rules

To add color-based selection rules:

```typescript
const AI_RULES = {
  // ... existing rules ...
  
  // Color compatibility rules
  colorRules: {
    'blue-background': ['blue-main', 'white-supporting', 'gray-supporting'],
    'red-background': ['red-main', 'white-supporting', 'black-supporting'],
    'green-background': ['green-main', 'white-supporting', 'yellow-supporting']
  }
};
```

### 3. Content-Based Rules

To add rules based on blog content:

```typescript
const AI_RULES = {
  // ... existing rules ...
  
  // Content-based selection rules
  contentRules: {
    'productivity': {
      preferredBackgrounds: ['bg-one', 'bg-two'],
      preferredMainImages: ['productivity-main', 'efficiency-main'],
      preferredSupporting: ['icon-clock', 'icon-chart', 'icon-check']
    },
    'technology': {
      preferredBackgrounds: ['bg-two', 'bg-three'],
      preferredMainImages: ['tech-main', 'innovation-main'],
      preferredSupporting: ['icon-tech', 'icon-code', 'icon-device']
    }
  }
};
```

## Testing Your Changes

After modifying rules:

1. **Rebuild the plugin**:
   ```bash
   npm run build
   ```

2. **Test in Figma**:
   - Create components with the new naming conventions
   - Run the plugin with different blog titles
   - Verify the AI follows your new rules

3. **Debug if needed**:
   - Check the browser console for errors
   - Verify component names match exactly
   - Test with simple cases first

## Best Practices

### 1. Naming Conventions
- Keep component names consistent and descriptive
- Use clear prefixes (bg-, main-, icon-, etc.)
- Avoid special characters in names

### 2. Rule Complexity
- Start simple and add complexity gradually
- Test each rule change independently
- Document your rule changes

### 3. AI Instructions
- Be specific but not overly restrictive
- Use clear, actionable language
- Balance creativity with consistency

### 4. Positioning
- Ensure positions don't overlap
- Consider different screen sizes
- Test with various component sizes

## Example: Complete Rule Modification

Here's an example of adding a new "corner" layout:

```typescript
const AI_RULES = {
  backgroundRules: {
    'bg-one': { 
      maxSupporting: 1, 
      positions: ['bottom-left'],
      description: 'Simple layout with 1 supporting image at bottom-left'
    },
    'bg-two': { 
      maxSupporting: 2, 
      positions: ['bottom-left', 'top-right'],
      description: 'Balanced layout with 2 supporting images at bottom-left and top-right'
    },
    'bg-three': { 
      maxSupporting: 3, 
      positions: ['bottom-left', 'top-right', 'center'],
      description: 'Complex layout with 3 supporting images at bottom-left, top-right, and center'
    },
    // NEW: Corner layout
    'bg-corner': { 
      maxSupporting: 4, 
      positions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      description: 'Corner layout with 4 supporting images at all corners'
    }
  },
  
  mainImageRules: {
    'tech-article': ['bg-one', 'bg-two', 'bg-corner'],
    'lifestyle-article': ['bg-two', 'bg-three', 'bg-corner'],
    'business-article': ['bg-one', 'bg-three'],
    'creative-article': ['bg-two', 'bg-three', 'bg-corner']
  },
  
  additionalInstructions: [
    'Main images should be thematically related to the blog content',
    'Supporting images should complement the main image and background',
    'Consider color harmony between background and supporting elements',
    'Ensure visual hierarchy with main image as focal point',
    'Use corner layout for dynamic, energetic content'
  ]
};
```

Then add the positioning logic:

```typescript
case 'top-left':
  positions.push({ x: 50, y: 50 });
  break;
case 'bottom-right':
  positions.push({ x: 1000, y: 600 });
  break;
```

## Troubleshooting

### Common Issues

1. **AI ignores new rules**: Check that the prompt is being generated correctly
2. **Components not found**: Verify naming conventions match exactly
3. **Positioning errors**: Ensure all position cases are handled in the switch statement
4. **Build errors**: Check TypeScript syntax and rebuild

### Debug Tips

1. **Console logging**: Add `console.log()` statements to see what rules are being applied
2. **Test with known components**: Use components you know exist
3. **Simplify rules**: Start with basic rules and add complexity
4. **Check AI response**: Look at the actual JSON response from OpenAI

Remember: The AI is intelligent but follows the rules you give it. Clear, specific instructions will produce better results! 

The error `Failed to create template: Selected components not found` means that the AI selected a component name (for background, main, or supporting image) that does not exactly match any component in your Figma document.

### Why This Happens

- **Component name mismatch:** The AI may suggest a name like `"bg-one-blue"` or `"tech-article-main"`, but if your actual component is named slightly differently (e.g., `"bg-1-blue"` or `"Tech Article Main"`), the code won't find it.
- **Case sensitivity:** The code uses exact string matching, which is case-sensitive.
- **Component not present:** The AI may invent a name that doesn't exist in your document.

---

## How to Fix

### 1. **Check Your Component Names**
- Make sure your Figma components **exactly match** the naming convention and the names the AI is likely to use.
- For example, if your backgrounds are named `bg-one-blue`, `bg-two-red`, etc., make sure the names are exactly that (no extra spaces, no different capitalization).

### 2. **Print Available Component Names for Debugging**
To help debug, you can add a `console.log` in your plugin code to print all available component names before the AI selection. This will help you see what the AI can choose from.

Add this before the AI call in your `figma.ui.onmessage` handler:
```typescript
console.log('Available components:', components.map(c => c.name));
```

### 3. **Print the AI's Selection**
Add a log after the AI selection:
```typescript
console.log('AI selection:', selection);
```

### 4. **Make AI More Likely to Pick Existing Names**
- In the prompt, you can add:  
  `"Only select from the provided component names. Do not invent new names."`
- This will make the AI less likely to invent names.

### 5. **(Optional) Make Name Matching Case-Insensitive**
If you want to make the matching more forgiving, you can compare names in lowercase:
```typescript
const background = components.find(c => c.name.toLowerCase() === selection.background.toLowerCase());
```
Do the same for main and supporting images.

---

## Next Steps

1. **Check your Figma component names** for exact matches.
2. **Add the debugging logs** to see what the AI is picking and what components are available.
3. **Update the AI prompt** to say "Only select from the provided component names."
4. **(Optional) Make the name matching case-insensitive** for more flexibility.

Would you like me to make these code changes for you? If so, let me know which options you want (e.g., case-insensitive matching, improved prompt, debugging logs)! 

The error `Failed to create template: Selected components not found` means that your plugin is trying to use the `findAll` method (to search for nodes/components in the document) **before** calling `await figma.loadAllPagesAsync()`.

### Why does this happen?

- When your plugin's `manifest.json` uses `"documentAccess": "dynamic-page"`, Figma **does not load all pages by default** for performance reasons.
- To access nodes/components across all pages, you **must** call `await figma.loadAllPagesAsync()` before using `findAll` or similar methods.

### What triggers the error?

If you call:
```typescript
const allComponents = figma.root.findAll(...);
```
**before**:
```typescript
await figma.loadAllPagesAsync();
```
You get:
```
"in findAll: Cannot call with documentAccess: dynamic-page without calling figma.loadAllPagesAsync() first."
```

---

## How to Fix

**Always call**:
```typescript
await figma.loadAllPagesAsync();
```
**before** any `findAll` or document-wide search.

**Example:**
```typescript
async function getAllComponents() {
  await figma.loadAllPagesAsync(); // <-- required!
  const allComponents = figma.root.findAll(node => ...);
  // ...rest of your code
}
```

---

## Summary

- The error means you must load all pages before searching the document.
- Fix: Add `await figma.loadAllPagesAsync();` before any `findAll` calls.

Your plugin will then be able to access all components across all pages without this error! 

q: for the mainImageRules what would it look like if I wanted any image that started with main-illustration to use only template bg-one bg-two and bg-four. Also I would like to be able to control the size of images for the supporting-graphics and the main-illustration graphics

Great questions! Here’s how you can achieve both:

---

## 1. **mainImageRules for `main-illustration*`**

If you want any main image whose name starts with `main-illustration` to use only backgrounds `bg-one`, `bg-two`, and `bg-four`, you can use a **pattern-based rule**.

Since the current `mainImageRules` is a simple object, you can:
- Add a rule for `"main-illustration"` (and check for prefix matches in your code), or
- Use a function or array of rules with patterns for more flexibility.

**Recommended: Use a prefix match in your code.**  
Update your `mainImageRules` like this:

```typescript
mainImageRules: {
  'main-illustration': ['bg-one', 'bg-two', 'bg-four'],
}
```

**And in your code, when checking which backgrounds are allowed for a main image:**

```typescript
function getAllowedBackgroundsForMain(mainName: string): string[] {
  // Check for prefix match
  if (mainName.startsWith('main-illustration')) {
    return AI_RULES.mainImageRules['main-illustration'];
  }
  // ...other rules as needed
  return [];
}
```

---

## 2. **Control the Size of Images**

Add a `componentSizes` section to your `AI_RULES` object:

```typescript
componentSizes: {
  mainIllustration: { width: 500, height: 400 },
  supportingGraphic: { width: 180, height: 180 }
}
```

**Then, in your code where you create instances:**

```typescript
// For main image
if (mainInstance.name.startsWith('main-illustration')) {
  mainInstance.resize(AI_RULES.componentSizes.mainIllustration.width, AI_RULES.componentSizes.mainIllustration.height);
} else {
  mainInstance.resize(400, 300); // default
}

// For supporting images
supportingImages.forEach((supporting, index) => {
  if (supporting) {
    const supportInstance = supporting.node.createInstance();
    if (supporting.name.startsWith('supporting-graphic')) {
      supportInstance.resize(AI_RULES.componentSizes.supportingGraphic.width, AI_RULES.componentSizes.supportingGraphic.height);
    }
  }
});
``` 