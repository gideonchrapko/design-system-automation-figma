# Plugin Availability System

## Overview

The Plugin Availability System automatically detects when the Figma plugin is open and available to process requests. When someone tries to use the `@blog create` command in Slack but the plugin isn't open, they receive a helpful message instructing them to open the plugin.

## How It Works

### 1. Heartbeat System
- The Figma plugin sends a heartbeat signal every 5 seconds to the server
- This heartbeat indicates the plugin is active and ready to process requests
- If no heartbeat is received for 10 seconds, the server marks the plugin as unavailable

### 2. Automatic Status Detection
- When a user types `@blog create "Title"` in Slack, the system automatically checks plugin availability
- If the plugin is not available, the user receives an immediate notification
- If the plugin is available, the request proceeds normally

### 3. Real-time Status Updates
- Plugin status is checked in real-time before processing any requests
- No requests are queued if the plugin is unavailable
- Users get immediate feedback about plugin status

## Commands

### `@blog create "Your Blog Title"`
- **When plugin is available**: Processes the request and generates templates
- **When plugin is unavailable**: Sends message asking user to open the plugin

### `@blog status`
- Shows current plugin availability status
- Displays last heartbeat time
- Provides instructions for using the plugin

### `@figma reset` (Admin only)
- Resets the entire system including plugin availability status
- Clears all pending requests
- Releases system locks

## User Experience

### Plugin Available ✅
```
🎨 Processing your request for "Your Blog Title"...

⏳ This may take a minute while I generate multiple template variations for you.
```

### Plugin Unavailable ❌
```
🚫 Figma plugin is not currently open!

📱 To use the @blog create command, please:
1. Open Figma
2. Go to Plugins > AI Blog Template Generator
3. Keep the plugin open
4. Try your command again

💡 The plugin needs to be active to process your request.
```

### Status Check
```
✅ Figma plugin is currently active!

📱 Last heartbeat: 0m 3s ago
💓 Plugin is ready to process requests

🎨 You can use @blog create "Your Title" to generate templates!
```

## Technical Implementation

### Server Side (check-requests.js)
- Tracks `pluginLastHeartbeat` timestamp
- Maintains `pluginAvailable` boolean flag
- 10-second timeout for plugin availability
- Heartbeat endpoint for plugin status updates

### Plugin Side (code.ts)
- Sends heartbeat every 5 seconds via `sendHeartbeat()`
- Heartbeat includes `type: 'heartbeat'` identifier
- Automatic cleanup when plugin is closed

### Slack Integration (slack-webhook.js)
- Checks plugin status before processing requests
- Sends appropriate messages based on availability
- Handles both available and unavailable states

## Configuration

### Heartbeat Interval
- **Plugin**: 5 seconds (`HEARTBEAT_INTERVAL = 5000`)
- **Server Timeout**: 10 seconds (`PLUGIN_TIMEOUT = 10 * 1000`)

### API Endpoints
- `POST /api/check-requests` - Heartbeat and request processing
- `GET /api/check-requests?pluginStatus=true` - Plugin status check
- `GET /api/test-plugin-status` - Test endpoint for debugging

## Benefits

1. **Immediate Feedback**: Users know instantly if the plugin is available
2. **No Wasted Requests**: Requests aren't queued when plugin is unavailable
3. **Clear Instructions**: Users get step-by-step guidance on how to use the plugin
4. **Real-time Monitoring**: Plugin status is always current
5. **Automatic Cleanup**: System automatically detects when plugin is closed

## Troubleshooting

### Plugin Shows as Unavailable
1. Check if the plugin is actually open in Figma
2. Verify the plugin is not minimized or in background
3. Check browser console for heartbeat errors
4. Restart the plugin if needed

### Heartbeat Failures
1. Check network connectivity
2. Verify Vercel deployment is working
3. Check server logs for errors
4. Ensure CORS is properly configured

### Status Check Issues
1. Use `@blog status` command to check current status
2. Check server logs for detailed information
3. Verify API endpoints are accessible
4. Test with the test endpoint: `/api/test-plugin-status`

## Future Enhancements

- **Multiple Plugin Support**: Track multiple plugin instances
- **User Notifications**: Notify users when plugin becomes available
- **Queue Management**: Queue requests when plugin is unavailable
- **Analytics**: Track plugin usage patterns and availability metrics
- **Auto-recovery**: Automatic plugin restart capabilities
