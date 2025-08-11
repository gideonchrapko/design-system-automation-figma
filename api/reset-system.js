module.exports = async (req, res) => {
  console.log('🔄 Reset system endpoint called');
  
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
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request received from origin:', origin);
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    const { adminUser } = req.body;
    console.log('🔄 Admin reset requested by:', adminUser);
    
    // Call the check-requests endpoint with reset parameter
    try {
      const resetResponse = await fetch(`${req.headers.host ? `https://${req.headers.host}` : 'https://slack-webhook-personal.vercel.app'}/api/check-requests?reset=true`, {
        method: 'GET'
      });
      
      if (resetResponse.ok) {
        const resetResult = await resetResponse.json();
        console.log('✅ System reset successful:', resetResult);
        
        res.json({ 
          success: true, 
          message: 'System reset successful',
          details: resetResult
        });
      } else {
        console.log('❌ Failed to reset system');
        res.status(500).json({ 
          success: false, 
          error: 'Failed to reset system'
        });
      }
    } catch (error) {
      console.log('❌ Error resetting system:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error resetting system'
      });
    }
  } else {
    res.json({ 
      message: 'Send POST request to reset system',
      usage: '@figma reset (admin only)'
    });
  }
}; 