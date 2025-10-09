module.exports = async (req, res) => {
  console.log('🔍 test-plugin-status.js called with method:', req.method);
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    try {
      // Check plugin status
      const response = await fetch('https://slack-webhook-personal.vercel.app/api/check-requests?pluginStatus=true');
      const data = await response.json();
      
      res.json({
        success: true,
        message: 'Plugin status check completed',
        pluginStatus: data
      });
    } catch (error) {
      console.error('❌ Error checking plugin status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check plugin status',
        details: error.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
};
