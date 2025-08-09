module.exports = async (req, res) => {
  console.log('=== WEBHOOK HIT ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('==================');
  
  // Handle Slack URL verification
  if (req.body.type === 'url_verification') {
    console.log('Handling URL verification challenge');
    return res.json({ challenge: req.body.challenge });
  }
  
  // Handle events
  if (req.body.event) {
    const { event } = req.body;
    
    // Only process app mentions and messages
    if (event.type === 'app_mention' || event.type === 'message') {
      const { text, user, channel } = event;
      
      console.log('Processing event:', event.type);
      console.log('Text received:', text);
      
      // Process @blog create commands with both single and double quotes
      if (text && text.includes('@blog create')) {
        // Try to match both single and double quotes
        const blogTitle = text.match(/@blog create ['"]([^'"]+)['"]/)?.[1];
        
        if (blogTitle) {
          // Send immediate response to user
          const botToken = process.env.SLACK_BOT_TOKEN;
          if (botToken) {
            try {
              await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${botToken}`
                },
                body: JSON.stringify({
                  channel: channel,
                  text: `🎨 Processing your request for "${blogTitle}"...\n\n⏳ This may take a minute while I generate multiple template variations for you.`
                })
              });
              console.log('✅ Immediate response sent to user');
            } catch (error) {
              console.log('❌ Failed to send immediate response:', error);
            }
          }
          
          const request = {
            id: Date.now().toString(),
            blogTitle: blogTitle,
            userId: user,
            channelId: channel,
            timestamp: Date.now(),
            status: 'pending'
          };
          
          // Store the request via API call to ensure shared storage
          try {
            const response = await fetch(`${req.headers.host ? `https://${req.headers.host}` : 'https://slack-webhook-personal.vercel.app'}/api/check-requests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request)
            });
            
            if (response.ok) {
              console.log('✅ Added request via API:', request);
            } else if (response.status === 423) {
              // System is busy
              const errorData = await response.json();
              console.log('🚫 System busy:', errorData.error);
              
              // Send busy message to Slack
              const botToken = process.env.SLACK_BOT_TOKEN;
              if (botToken) {
                fetch('https://slack.com/api/chat.postMessage', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${botToken}`
                  },
                  body: JSON.stringify({
                    channel: channel,
                    text: `🚫 ${errorData.error}\n\nPlease wait a moment and try again.`
                  })
                });
              }
            } else {
              console.log('❌ Failed to store request via API');
            }
          } catch (error) {
            console.log('❌ Error storing request via API:', error);
          }
        } else {
          console.log('❌ Could not extract blog title from:', text);
        }
      }
      // Process @figma reset command (admin only)
      else if (text && text.includes('@figma reset')) {
        // Check if this is an admin user (you can customize this)
        const adminUsers = ['U1234567890']; // Replace with your Slack user ID
        if (adminUsers.includes(user)) {
          console.log('🔄 Admin reset command received from:', user);
          
          // Call the reset endpoint
          try {
            const response = await fetch(`${req.headers.host ? `https://${req.headers.host}` : 'https://slack-webhook-personal.vercel.app'}/api/reset-system`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adminUser: user })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ System reset successful:', result);
              
              // Send confirmation to Slack
              const botToken = process.env.SLACK_BOT_TOKEN;
              if (botToken) {
                fetch('https://slack.com/api/chat.postMessage', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${botToken}`
                  },
                  body: JSON.stringify({
                    channel: channel,
                    text: `🔄 System reset successful!\n\n✅ All requests cleared\n✅ Lock released\n✅ System ready for new requests`
                  })
                });
              }
            } else {
              console.log('❌ Failed to reset system');
            }
          } catch (error) {
            console.log('❌ Error resetting system:', error);
          }
        } else {
          console.log('🚫 Non-admin user attempted reset:', user);
          
          // Send unauthorized message
          const botToken = process.env.SLACK_BOT_TOKEN;
          if (botToken) {
            fetch('https://slack.com/api/chat.postMessage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`
              },
              body: JSON.stringify({
                channel: channel,
                text: `🚫 Unauthorized: Only administrators can reset the system.`
              })
            });
          }
        }
      } else {
        console.log('❌ Text does not contain @blog create or reset command');
      }
    }
  }
  
  res.json({ message: 'OK' });
}; 