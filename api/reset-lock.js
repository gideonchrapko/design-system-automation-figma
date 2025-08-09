module.exports = (req, res) => {
  console.log('🔄 Reset lock endpoint called');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
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