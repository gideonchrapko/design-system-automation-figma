# AI Blog Template Generator - Figma Plugin

An intelligent Figma plugin that uses AI to automatically select and arrange components to create beautiful blog post templates based on your blog title and keywords.

> **Note:** This repository is public for reference and learning purposes. Issues and pull requests are disabled. Feel free to fork and customize for your own use!

## 📖 What This Plugin Does

This plugin analyzes your blog post title and keywords, then uses AI to:
- Select the most relevant main image from your component library
- Choose a compatible background layout
- Add supporting graphics in the right positions
- Create a complete, ready-to-use blog template in Figma

## 🚀 Getting Started

### Prerequisites

- **Figma account** (free at [figma.com](https://figma.com))
- **OpenAI API key** (get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
- **Node.js** (if you want to edit the code - download from [nodejs.org](https://nodejs.org))

### Step 1: Install the Plugin

1. **Download this repository**
   - Click the green "Code" button → "Download ZIP"
   - Extract the ZIP file to a folder on your computer

2. **Install in Figma**
   - Open Figma in your browser
   - Go to **Menu** → **Plugins** → **Development** → **Import plugin from manifest**
   - Navigate to the extracted folder and select `manifest.json`
   - Click **"Import"**

3. **Get Your OpenAI API Key**
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign up or log in
   - Click **"Create new secret key"**
   - Copy the key (it starts with `sk-`)
   - ⚠️ **Important:** Save this key somewhere safe - you won't see it again!

## 🎨 How to Use the Plugin

### Basic Usage

1. **Open your Figma file** with components (see "Creating Components" below)
2. **Run the plugin**: Go to **Plugins** → **AI Blog Template Generator**
3. **Enter your information**:
   - Paste your OpenAI API key
   - Type your blog post title
   - Add keywords (optional, comma-separated)
4. **Click "Generate Template"**
5. **Your template appears!** The plugin creates a new frame with all components arranged

### Example

- **Blog Title:** "How AI is Transforming Email Marketing"
- **Keywords:** "ai, email, automation, marketing"
- **Result:** Plugin selects relevant images and creates a complete template

## 🎨 Creating Components in Figma

The plugin needs components with specific naming conventions. Here's how to create them:

### Component Types

#### 1. Background Components
**Naming:** `bg-[number]-[color]`

Examples:
- `bg-one-blue`
- `bg-two-pink`
- `bg-three-green`
- `bg-four-purple`

**How to create:**
1. Create a frame (F) - typically 1500x1500px
2. Design your background
3. Right-click → **"Create Component"** (or press `⌘/Ctrl + Alt + K`)
4. Name it following the pattern above

#### 2. Main Image Components
**Naming:** `main-[type]-[description]-[color]`

Types:
- `main-illustration-*` - For illustrations (works with bg-one, bg-two)
- `main-3d-*` - For 3D graphics (works with bg-three)
- `main-logo-*` - For logos (works with bg-four)

Examples:
- `main-illustration-email-pink`
- `main-illustration-ai-blue`
- `main-3d-robot-green`
- `main-logo-company-red`

**How to create:**
1. Create your illustration/3D/logo design
2. Make it a component
3. Name it with the `main-` prefix and descriptive words

#### 3. Supporting Graphics
**Naming:** `supporting-graphic-[description]`

Examples:
- `supporting-graphic-star`
- `supporting-graphic-arrow`
- `supporting-graphic-circle`

**How to create:**
1. Create small decorative graphics
2. Make them components
3. Name them starting with `supporting-graphic-`

### Component Organization Tips

- **Use Component Sets** for variants (different colors of the same design)
- **Keep names descriptive** - the AI uses the name to match with your blog content
- **Test your components** - make sure they're visible and properly sized

## 💻 Editing the Plugin with Cursor

### Setting Up Your Development Environment

1. **Open the project in Cursor**
   - Open Cursor (or VS Code)
   - File → Open Folder
   - Select the plugin folder

2. **Install dependencies** (if needed)
   ```bash
   npm install
   ```

3. **Compile TypeScript** (if you edit code.ts)
   ```bash
   npm run build
   ```
   Or set up a watch mode to auto-compile:
   ```bash
   npm run watch
   ```

### Understanding the Code Structure

The main file is `code.ts`. Here's what you need to know:

#### The AI_RULES Object (Lines 15-66)

This is where you customize how the plugin works. Open `code.ts` in Cursor and find the `AI_RULES` object:

```typescript
const AI_RULES = {
  backgroundRules: { ... },
  mainImageRules: { ... },
  mainIllustrationRules: { ... },
  // etc.
}
```

### Customizing Rules

#### 1. Adding New Background Types

To add a new background layout (e.g., `bg-five`):

```typescript
backgroundRules: {
  'bg-five': { 
    maxSupporting: 3,  // How many supporting graphics
    positions: ['top-left', 'top-right', 'bottom-center'],  // Where to place them
    description: 'Three-column layout with graphics on all sides'
  },
  // ... existing rules
}
```

#### 2. Changing Main Image Compatibility

To make a main image type work with different backgrounds:

```typescript
mainImageRules: {
  'main-illustration': ['bg-one', 'bg-two', 'bg-five'],  // Add bg-five
  'main-3d': ['bg-three'],
  'main-logo': ['bg-four']
}
```

#### 3. Adjusting Positions

To change where main images appear:

```typescript
mainIllustrationRules: {
  'bg-one': { x: 650, y: 150, width: 700, height: 700 },  // x, y = position
  'bg-five': { x: 500, y: 200, width: 600, height: 600 }  // Add new position
}
```

#### 4. Adding New Position Types

In the `getPositionsForBackground` function (around line 345), add new positions:

```typescript
case 'bottom-center':
  positions.push({ x: 650, y: 800 });
  break;
```

### Common Customizations

#### Change Default Sizes

Find `componentSizes` in `AI_RULES`:

```typescript
componentSizes: {
  mainIllustration: { width: 700, height: 700 },  // Change these
  supportingGraphic: { width: 500, height: 500 }   // Change these
}
```

#### Modify AI Instructions

Edit the `additionalInstructions` array:

```typescript
additionalInstructions: [
  'Your custom instruction here',
  'Another instruction',
  // Add more as needed
]
```

### Testing Your Changes

1. **Make your edits** in `code.ts`
2. **Compile**: Run `npm run build` (or use watch mode)
3. **Reload in Figma**: 
   - Go to Plugins → Development → Your Plugin
   - Or restart the plugin
4. **Test** with a blog title to see if your changes work

### Important Notes

- **Always edit `code.ts`**, not `code.js` (code.js is auto-generated)
- **Compile after changes** - TypeScript needs to compile to JavaScript
- **Test thoroughly** - Make sure your new rules don't break existing functionality
- **Save your work** - Use git to track your changes

## 🔧 Advanced Customization

### Changing the AI Model

In the `callOpenAIChat` function, you can change the model:

```typescript
model: 'gpt-4o',  // Change to 'gpt-3.5-turbo' for faster/cheaper
```

### Modifying the Selection Logic

The `selectComponentsWithAI` function handles how the AI picks components. You can:
- Adjust the prompt (around line 777)
- Change the variety percentage (line 928: `Math.random() < 0.3`)
- Modify fallback behavior

### Adding New Component Types

1. Update `categorizeComponent` function to recognize new types
2. Add rules in `AI_RULES` for the new type
3. Update `createTemplate` to handle the new type

## 📝 File Structure

```
figma-templating-botpress/
├── code.ts          # Main plugin code (EDIT THIS)
├── code.js          # Compiled JavaScript (auto-generated)
├── ui.html          # Plugin UI interface
├── manifest.json    # Plugin configuration
├── package.json     # Dependencies
└── tsconfig.json    # TypeScript config
```

## ❓ Troubleshooting

### "No components found"
- Make sure components exist in your Figma file
- Check that names follow the naming conventions
- Ensure components are on the current page

### "Invalid API key"
- Verify your OpenAI API key is correct
- Check that you have credits in your OpenAI account
- Make sure the key starts with `sk-`

### Plugin won't install
- Ensure you extracted the ZIP file completely
- Check that `manifest.json` exists
- Try refreshing Figma

### Changes not working
- Make sure you compiled TypeScript (`npm run build`)
- Reload the plugin in Figma
- Check the browser console for errors (F12)

### Components not appearing correctly
- Verify component names match exactly (case-sensitive)
- Check that components are properly created (not just frames)
- Ensure background types match main image rules

## 🎓 Learning Resources

- **Figma Plugin API**: [figma.com/plugin-docs](https://www.figma.com/plugin-docs/)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/)
- **OpenAI API**: [platform.openai.com/docs](https://platform.openai.com/docs)

## 📄 License

This plugin is provided as-is for learning and customization.

---

**Happy designing!** 🎨 If you create something cool, feel free to share it!
