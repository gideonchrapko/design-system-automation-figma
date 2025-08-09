module.exports = (req, res) => {
  console.log(`🔍 test-slack-message.js called with method: ${req.method}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
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