module.exports = async (req, res) => {
  console.log(`🔍 slack-messages.js called with method: ${req.method}`);
  
  // Handle CORS for Figma plugin (which sends origin: null)
  const origin = req.headers.origin;
  
  // Special handling for Figma plugin requests
  if (origin === 'null' || !origin) {
    // Figma plugin requests - allow them
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Regular browser requests
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Set comprehensive CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request received from origin:', origin);
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    console.log('📤 POST request received to slack-messages endpoint');
    const { channel, text, attachments, blocks } = req.body;
    
    console.log(`📤 Sending message to channel ${channel}: ${text}`);
    if (attachments) {
      console.log('📎 Message includes attachments:', attachments);
    }
    if (blocks) {
      console.log('🧱 Message includes blocks:', blocks.length, 'blocks');
    }
    
    // Send message back to Slack using the Web API
    // You'll need to get your bot token from Slack app settings
    const botToken = process.env.SLACK_BOT_TOKEN; // Add this to your Vercel environment variables
    
    if (botToken) {
      try {
        const messagePayload = {
          channel: channel,
          text: text
        };
        
        // Add attachments if provided (for interactive buttons)
        if (attachments) {
          messagePayload.attachments = attachments;
        }
        
        // Add blocks if provided (for rich formatting)
        if (blocks) {
          messagePayload.blocks = blocks;
        }
        
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${botToken}`
          },
          body: JSON.stringify(messagePayload)
        });
        
        const data = await response.json();
        if (data.ok) {
          console.log('✅ Message sent successfully to Slack');
          res.json({ success: true, message: 'Message sent to Slack' });
        } else {
          console.log('❌ Failed to send message to Slack:', data.error);
          console.log('❌ Full error response:', JSON.stringify(data, null, 2));
          // Provide helpful error messages
          let errorMessage = data.error;
          if (data.error === 'channel_not_found') {
            errorMessage = 'Channel not found. Make sure the bot is invited to the channel.';
          } else if (data.error === 'not_in_channel') {
            errorMessage = 'Bot is not in this channel. Please invite the bot to the private channel.';
          } else if (data.error === 'missing_scope') {
            errorMessage = 'Bot is missing required permissions. Check Slack app permissions.';
          }
          res.status(500).json({ success: false, error: errorMessage, details: data });
        }
      } catch (error) {
        console.log('❌ Error sending message to Slack:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    } else {
      console.log('❌ No bot token configured');
      res.status(500).json({ success: false, error: 'No bot token configured' });
    }
  } else {
    console.log('❌ Unsupported method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 