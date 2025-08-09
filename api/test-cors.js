module.exports = (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    console.log('✅ CORS test endpoint hit successfully');
    res.json({ 
      success: true, 
      message: 'CORS headers working correctly',
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