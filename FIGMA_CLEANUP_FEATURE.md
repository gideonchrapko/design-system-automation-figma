# Figma Cleanup Feature

## Overview
Added automatic cleanup functionality to delete generated frames from Figma after they've been exported and uploaded to blob hosting. This keeps your Figma file clean and organized.

## How It Works

### **Automatic Cleanup Process**
1. **Template Generation**: Creates frames in Figma for each template variation
2. **Export & Upload**: Exports frames as PNG, converts to WebP, uploads to Vercel Blob
3. **Cleanup**: Automatically deletes the generated frames from Figma
4. **Result**: Clean Figma file with only the original components

### **Cleanup Strategy**

#### **Main Project (code.js)**
- ✅ **Batch cleanup**: Collects all frames and deletes them after all templates are processed
- ✅ **Error handling**: Cleans up frames immediately if upload fails
- ✅ **Success tracking**: Only deletes frames that were successfully uploaded
- ✅ **Logging**: Shows cleanup progress in console

#### **Slack Webhook Personal (code.ts)**
- ✅ **Same functionality**: Applied identical cleanup logic
- ✅ **TypeScript support**: Properly typed cleanup function
- ✅ **Error handling**: Graceful cleanup even if errors occur

## Technical Implementation

### **Updated createTemplate Function**
```javascript
// Before
const pngBytes = yield createTemplate(selection, components);

// After  
const { pngBytes, frame } = yield createTemplate(selection, components);
```

### **Cleanup Function**
```javascript
function cleanupGeneratedFrames(frames) {
  try {
    console.log(`🧹 Cleaning up ${frames.length} generated frames...`);
    frames.forEach((frame, index) => {
      if (frame && frame.parent) {
        frame.remove();
        console.log(`✅ Deleted frame ${index + 1}`);
      }
    });
    console.log('✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}
```

### **Batch Cleanup in createAllTemplates**
```javascript
const generatedFrames = []; // Collect frames for cleanup

for (let i = 0; i < topPicks.length; i++) {
  const { pngBytes, frame } = yield createTemplate(aiSelection, components);
  
  if (uploadResult.success) {
    generatedFrames.push(frame); // Add to cleanup list
  } else {
    cleanupGeneratedFrames([frame]); // Clean up immediately if failed
  }
}

// Cleanup all generated frames after processing
if (generatedFrames.length > 0) {
  cleanupGeneratedFrames(generatedFrames);
}
```

## Benefits

### **File Organization**
- ✅ **Clean workspace**: No leftover template frames cluttering your Figma file
- ✅ **Better performance**: Fewer objects in the document
- ✅ **Easier navigation**: Only original components remain visible

### **User Experience**
- ✅ **Automatic**: No manual cleanup required
- ✅ **Reliable**: Cleanup happens after successful uploads
- ✅ **Safe**: Only deletes frames that were successfully processed

### **Development Workflow**
- ✅ **Iterative design**: Can generate multiple variations without clutter
- ✅ **Version control**: Clean commits without temporary frames
- ✅ **Collaboration**: Team members see clean, organized files

## User Flow

### **Before Cleanup**
1. User sends: `@figma create "My Blog Title"`
2. App generates: 5 template frames in Figma
3. App exports: All frames to PNG/WebP
4. App uploads: Files to Vercel Blob
5. **Result**: 5 template frames remain in Figma file

### **After Cleanup**
1. User sends: `@figma create "My Blog Title"`
2. App generates: 5 template frames in Figma
3. App exports: All frames to PNG/WebP
4. App uploads: Files to Vercel Blob
5. App cleans up: Deletes all generated frames
6. **Result**: Clean Figma file, templates available for download

## Console Logging

### **Cleanup Progress**
```
🧹 Cleaning up 5 generated frames...
✅ Deleted frame 1
✅ Deleted frame 2
✅ Deleted frame 3
✅ Deleted frame 4
✅ Deleted frame 5
✅ Cleanup completed successfully
```

### **Error Handling**
```
❌ Failed to upload template 3
✅ Deleted frame 3 (immediate cleanup)
```

## Status

✅ **Main Project (code.js)** - Cleanup implemented
✅ **Slack Webhook Personal (code.ts)** - Cleanup implemented
✅ **Error handling** - Graceful cleanup on failures
✅ **Batch processing** - Efficient cleanup after all templates

## Configuration

The cleanup feature is **enabled by default** and requires no configuration. It automatically:

- Deletes frames after successful uploads
- Handles errors gracefully
- Logs cleanup progress
- Maintains clean Figma workspace

Your Figma files will now stay clean and organized, with only the original components remaining after template generation! 