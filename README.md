# AI Blog Template Generator - Figma Plugin

An intelligent Figma plugin that uses OpenAI to automatically select and organize components based on blog titles and keywords to create custom blog templates.

## Features

- **AI-Powered Component Selection**: Uses OpenAI GPT-4 to intelligently select the most appropriate components for your blog post
- **Smart Layout Rules**: Automatically positions components based on predefined layout rules
- **Component Categorization**: Automatically categorizes components as backgrounds, main images, or supporting images
- **Professional Templates**: Creates cohesive, professional blog templates with proper component organization

## How It Works

### Component Naming Convention

The plugin automatically categorizes your Figma components based on their names:

#### Background Images
- **Format**: `bg-number-colour` (e.g., `bg-one-blue`, `bg-two-red`, `bg-three-green`)
- **Rules**:
  - `bg-one`: 1 supporting image, positioned bottom-left
  - `bg-two`: 2 supporting images, positioned bottom-left and top-right
  - `bg-three`: 3 supporting images, positioned bottom-left, top-right, and center

#### Main Images
- **Format**: Any component with `main`, `hero`, or `primary` in the name
- **Examples**: `tech-article-main`, `lifestyle-hero`, `business-primary`

#### Supporting Images
- **Format**: Any component that doesn't match background or main image patterns
- **Examples**: `icon-tech`, `decoration-flower`, `graphic-innovation`

### AI Selection Process

1. **Input Analysis**: The plugin analyzes your blog title and keywords
2. **Component Discovery**: Finds all available components in your Figma document
3. **AI Selection**: Uses OpenAI to select the most appropriate components based on:
   - Content relevance
   - Visual harmony
   - Layout compatibility
4. **Template Generation**: Creates a new frame with properly positioned components
5. **Export Ready**: Sets up the template for easy export

## Setup Instructions

### 1. Install the Plugin

1. Open Figma
2. Go to Plugins > Browse plugins in Community
3. Search for "AI Blog Template Generator"
4. Click "Install"

### 2. Prepare Your Components

Create components in your Figma document following the naming convention:

```
Background Components:
- bg-one-blue
- bg-one-red
- bg-two-green
- bg-three-purple

Main Image Components:
- tech-article-main
- lifestyle-hero
- business-primary

Supporting Components:
- icon-tech
- icon-innovation
- decoration-flower
- graphic-chart
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-`)

## Usage

### 1. Launch the Plugin

1. In Figma, go to Plugins > AI Blog Template Generator
2. The plugin window will open

### 2. Enter Your Information

1. **OpenAI API Key**: Paste your API key
2. **Blog Title**: Enter your blog post title
3. **Keywords**: Enter relevant keywords (comma-separated)

### 3. Generate Template

1. Click "Generate Template"
2. The plugin will:
   - Analyze your content
   - Select appropriate components
   - Create a new template frame
   - Position components according to layout rules

### 4. Review and Export

1. The generated template will appear in your Figma document
2. Review the component selection and positioning
3. Make any manual adjustments if needed
4. Export using Figma's export features

## Example Workflow

### Input
- **Blog Title**: "10 Ways to Improve Your Productivity"
- **Keywords**: "productivity, efficiency, time management, work habits"

### AI Selection Process
1. **Background**: Selects `bg-two-blue` (professional, clean layout)
2. **Main Image**: Selects `productivity-main` (relevant to the topic)
3. **Supporting Images**: Selects `icon-clock` and `icon-chart` (reinforce productivity theme)

### Output
- Creates a 1200x800 frame
- Positions background as full-size base
- Centers main image (400x300)
- Places supporting icons at bottom-left and top-right

## Layout Rules

### Background Type 1 (`bg-one`)
- **Supporting Images**: 1
- **Positions**: Bottom-left
- **Best For**: Simple, focused designs

### Background Type 2 (`bg-two`)
- **Supporting Images**: 2
- **Positions**: Bottom-left, Top-right
- **Best For**: Balanced, professional layouts

### Background Type 3 (`bg-three`)
- **Supporting Images**: 3
- **Positions**: Bottom-left, Top-right, Center
- **Best For**: Complex, dynamic designs

## Tips for Best Results

### Component Preparation
- Use descriptive, meaningful names for your components
- Ensure components are properly sized and formatted
- Create variations for different themes (tech, lifestyle, business, etc.)

### Content Input
- Be specific with your blog title
- Include relevant keywords that describe the content
- Consider the target audience and tone

### API Usage
- Keep your API key secure
- Monitor your OpenAI usage (each generation uses API credits)
- Consider the cost implications for high-volume usage

## Troubleshooting

### Common Issues

**"No components found"**
- Ensure you have components in your document
- Check that component names follow the naming convention
- Make sure components are not hidden or locked

**"Invalid component selection from AI"**
- Check your OpenAI API key
- Ensure you have sufficient API credits
- Try regenerating with different keywords

**"Selected components not found"**
- Verify component names match exactly
- Check for typos in component names
- Ensure components are accessible

### Performance Tips
- Keep component names concise but descriptive
- Limit the number of components in your document for faster processing
- Use clear, consistent naming patterns

## Technical Details

### API Requirements
- OpenAI API key required
- Uses GPT-4 model for component selection
- Requires network access to api.openai.com

### File Formats
- Generated templates are 1200x800 pixels
- Export settings configured for PNG format
- 2x scale for high-resolution output

### Component Types Supported
- Component Sets
- Individual Components
- Nested components within sets

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your component naming follows the convention
3. Ensure your OpenAI API key is valid and has credits
4. Check that your Figma document contains the required components

## License

This plugin is provided as-is for educational and commercial use.

---

**Note**: This plugin requires an OpenAI API key and will incur costs based on your usage. Please review OpenAI's pricing before extensive use.
