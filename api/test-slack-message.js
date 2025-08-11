module.exports = (req, res) => {
  console.log(`🔍 test-slack-message.js called with method: ${req.method}`);
  
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
    console.log('✅ Handling POST request');
    res.json({
      success: true,
      message: 'Test endpoint working',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      success: true,
      message: 'Test endpoint working',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
}; 