module.exports = (req, res) => {
  console.log('🔄 Reset lock endpoint called');
  
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
    // This would reset the global state in check-requests.js
    // For now, just return a message
    res.json({ 
      success: true, 
      message: 'Lock reset requested. Check the check-requests.js logs for lock status.',
      note: 'You may need to restart the Vercel function to fully reset the lock.'
    });
  } else {
    res.json({ 
      message: 'Send POST request to reset lock',
      currentStatus: 'Check the check-requests.js logs for current lock status'
    });
  }
}; 