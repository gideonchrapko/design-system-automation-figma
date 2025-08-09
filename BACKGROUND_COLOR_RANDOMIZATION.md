# Background Color Randomization Feature

## Overview
Added automatic color variation randomization for background selection. Previously, the system only used base background types (like `bg-one`) and ignored color variations (like `bg-one-green`, `bg-one-pink`, etc.). Now it randomly selects from all available color variations.

## Problem Solved

### **Before (Limited Background Selection)**
- Only used base background types: `bg-one`, `bg-two`, `bg-three`, `bg-four`
- Ignored color variations: `bg-one-green`, `bg-one-pink`, `bg-one-blue`, etc.
- Limited visual diversity in generated templates
- Same color backgrounds repeated across templates

### **After (Full Color Randomization)**
- Randomly selects from all available color variations
- Includes: `bg-one-green`, `bg-one-pink`, `bg-one-blue`, `bg-two-purple`, etc.
- Maximum visual diversity in generated templates
- Different color backgrounds for each template variation

## Technical Implementation

### **New Functions Added**

#### **`getAllAvailableBackgrounds(components)`**
```javascript
// Groups backgrounds by their base type
// Input: ['bg-one-green', 'bg-one-pink', 'bg-two-purple', 'bg-two-blue']
// Output: {
//   'bg-one': ['bg-one-green', 'bg-one-pink'],
//   'bg-two': ['bg-two-purple', 'bg-two-blue']
// }
```

#### **`getRandomBackgroundForMain(mainName, components)`**
```javascript
// 1. Gets allowed base types for the main image
// 2. Finds all color variations for those base types
// 3. Randomly selects one color variation
// 4. Returns the full background name (e.g., 'bg-one-green')
```

### **Updated Background Selection Logic**

#### **Before**
```javascript
const allowedBackgrounds = getAllowedBackgroundsForMain(selectedPick.name);
const background = allowedBackgrounds.length > 0
  ? allowedBackgrounds[Math.floor(Math.random() * allowedBackgrounds.length)]
  : 'bg-one';
// Result: Always 'bg-one', 'bg-two', etc. (no color variation)
```

#### **After**
```javascript
const background = getRandomBackgroundForMain(selectedPick.name, components);
// Result: 'bg-one-green', 'bg-two-purple', 'bg-three-blue', etc.
```

## How It Works

### **Step 1: Component Analysis**
```javascript
// Scans all background components in Figma
const backgroundComponents = components.filter(c => c.type === 'background');
// Finds: bg-one-green, bg-one-pink, bg-two-purple, bg-three-blue, etc.
```

### **Step 2: Grouping by Base Type**
```javascript
// Groups by base type (before the color)
backgroundsByType = {
  'bg-one': ['bg-one-green', 'bg-one-pink', 'bg-one-blue'],
  'bg-two': ['bg-two-purple', 'bg-two-orange'],
  'bg-three': ['bg-three-red', 'bg-three-yellow']
}
```

### **Step 3: Filtering by Compatibility**
```javascript
// Only includes backgrounds compatible with the main image
// Example: main-illustration can use bg-one and bg-two
allowedBaseTypes = ['bg-one', 'bg-two'];
availableBackgrounds = ['bg-one-green', 'bg-one-pink', 'bg-two-purple', 'bg-two-orange'];
```

### **Step 4: Random Selection**
```javascript
// Randomly picks one color variation
const randomIndex = Math.floor(Math.random() * availableBackgrounds.length);
const selectedBackground = availableBackgrounds[randomIndex];
// Result: 'bg-one-pink' or 'bg-two-purple' or etc.
```

## Benefits

### **Visual Diversity**
- ✅ **Multiple color variations**: Each template gets a different color background
- ✅ **No repetition**: Unlikely to see the same color twice in one batch
- ✅ **Brand flexibility**: Supports different brand color schemes

### **User Experience**
- ✅ **More options**: Users get 5 truly different template variations
- ✅ **Better selection**: More variety to choose from
- ✅ **Professional look**: Diverse color palette looks more professional

### **Template Quality**
- ✅ **Color harmony**: Backgrounds are still compatible with main images
- ✅ **Consistent layout**: Same layout rules apply regardless of color
- ✅ **Maintained quality**: All positioning and sizing rules preserved

## Example Output

### **Before (Limited Colors)**
```
Template 1: main-illustration-1 + bg-one
Template 2: main-illustration-2 + bg-one  
Template 3: main-illustration-3 + bg-two
Template 4: main-illustration-4 + bg-two
Template 5: main-illustration-5 + bg-one
```

### **After (Full Color Randomization)**
```
Template 1: main-illustration-1 + bg-one-green
Template 2: main-illustration-2 + bg-one-pink
Template 3: main-illustration-3 + bg-two-purple
Template 4: main-illustration-4 + bg-two-orange
Template 5: main-illustration-5 + bg-one-blue
```

## Console Logging

### **Background Selection Logs**
```
🎨 Selected background: bg-one-green for main image: main-illustration-1
🎨 Selected background: bg-one-pink for main image: main-illustration-2
🎨 Selected background: bg-two-purple for main image: main-illustration-3
🎨 Selected background: bg-two-orange for main image: main-illustration-4
🎨 Selected background: bg-one-blue for main image: main-illustration-5
```

### **Fallback Handling**
```
⚠️ No backgrounds found, using fallback for main image: main-illustration-1
```

## Compatibility

### **Main Image Types**
- **main-illustration**: Can use `bg-one-*` and `bg-two-*` color variations
- **main-3d**: Can use `bg-three-*` color variations  
- **main-logo**: Can use `bg-four-*` color variations

### **Background Color Variations**
- **bg-one**: green, pink, blue, yellow, etc.
- **bg-two**: purple, orange, red, teal, etc.
- **bg-three**: red, yellow, green, blue, etc.
- **bg-four**: any available color variations

## Status

✅ **Main Project (code.js)** - Background randomization implemented
✅ **Slack Webhook Personal (code.ts)** - Background randomization implemented
✅ **Color variation support** - All available color variations included
✅ **Compatibility rules** - Maintains existing background/main image rules
✅ **Fallback handling** - Graceful fallback if no backgrounds found

## Configuration

The background color randomization is **enabled by default** and automatically:

- Scans all background components in your Figma file
- Groups them by base type and color variation
- Randomly selects compatible color variations
- Maintains all existing layout and positioning rules
- Provides console logging for debugging

Your templates will now have much more visual diversity with different color backgrounds for each variation! 