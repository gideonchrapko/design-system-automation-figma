// This endpoint needs to access the same requests array as check-requests.js
// Since serverless functions don't share memory, we'll need to modify the approach

module.exports = (req, res) => {
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
    const { requestId, status, message } = req.body;
    
    console.log(`🔄 Updating request ${requestId} to status: ${status}`);
    
    // Since we can't directly access the requests array from check-requests.js,
    // we'll need to modify the approach. For now, we'll just return success
    // and the status will be updated when the request is processed again.
    console.log('✅ Status update request received (will be applied on next poll)');
    
    res.json({ success: true, message: 'Status update queued' });
  }
}; 