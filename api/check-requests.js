// Global state for request management
let requests = [];
let isProcessing = false; // Global lock to prevent concurrent processing
let currentUser = null; // Track who is currently using the system
let lockStartTime = null; // Track when the lock was set

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
    const newRequest = req.body;
    console.log('📥 Adding new request:', newRequest.blogTitle, 'from user:', newRequest.userId);
    
    // Check if lock has been held too long (5 minutes)
    const now = Date.now();
    if (lockStartTime && (now - lockStartTime) > 5 * 60 * 1000) {
      console.log('⏰ Lock timeout - clearing old lock');
      isProcessing = false;
      currentUser = null;
      lockStartTime = null;
    }
    
    // Check if system is already in use
    if (isProcessing && currentUser && currentUser !== newRequest.userId) {
      console.log('🚫 System busy - rejecting request from:', newRequest.userId);
      return res.status(423).json({ 
        success: false, 
        error: 'System is currently in use by another user. Please wait a moment and try again.',
        busy: true,
        currentUser: currentUser
      });
    }
    
    // If this is a new request (not a button click), set the lock
    if (!newRequest.selectedGraphicIndex) {
      if (isProcessing) {
        console.log('🚫 System busy - rejecting new request from:', newRequest.userId);
        return res.status(423).json({ 
          success: false, 
          error: 'System is currently in use by another user. Please wait a moment and try again.',
          busy: true,
          currentUser: currentUser
        });
      }
      
      // Set the lock
      isProcessing = true;
      currentUser = newRequest.userId;
      lockStartTime = now;
      console.log('🔒 System locked by user:', currentUser);
    }
    
    // Add the request
    requests.push(newRequest);
    console.log('✅ Request added. Total requests:', requests.length);
    
    res.json({ success: true, message: 'Request added successfully' });
    
  } else if (req.method === 'GET') {
    console.log('📋 GET request for requests');
    console.log('🔒 System status - Processing:', isProcessing, 'Current user:', currentUser);
    
    // Check for reset parameter
    if (req.query.reset === 'true') {
      console.log('🔄 Manual reset requested via GET parameter');
      requests = [];
      isProcessing = false;
      currentUser = null;
      lockStartTime = null;
      console.log('✅ System reset complete');
      return res.json({ 
        success: true, 
        message: 'System reset complete',
        requests: []
      });
    }
    
    // Check for status update parameter
    if (req.query.updateStatus && req.query.requestId && req.query.status) {
      console.log(`🔄 Status update requested: ${req.query.requestId} -> ${req.query.status}`);
      const request = requests.find(r => r.id === req.query.requestId);
      if (request) {
        request.status = req.query.status;
        console.log('✅ Request status updated successfully');
      } else {
        console.log('❌ Request not found for status update');
      }
    }
    
    // Filter out old requests (older than 5 minutes) and clean up duplicates
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    // Remove old requests and duplicates
    const seenTitles = new Set();
    requests = requests.filter(r => {
      // Keep only recent requests (less than 5 minutes old)
      if (r.timestamp < fiveMinutesAgo) {
        console.log(`🗑️ Removing old request: ${r.blogTitle} (age: ${Math.floor((now - r.timestamp) / 60000)}m)`);
        return false;
      }
      
      // Keep only the most recent request for each unique title
      if (seenTitles.has(r.blogTitle)) {
        console.log(`🗑️ Removing duplicate request: ${r.blogTitle}`);
        return false;
      }
      
      seenTitles.add(r.blogTitle);
      return true;
    });
    
    console.log(`🧹 Cleaned up requests. Now have ${requests.length} active requests`);
    
    // If no pending requests, clear the lock
    const pendingRequests = requests.filter(r => r.status === 'pending');
    console.log('📊 Current requests:', requests.map(r => `${r.blogTitle} (${r.status})`));
    console.log('⏳ Pending requests:', pendingRequests.length);
    
    // Remove completed requests that are older than 2 minutes
    const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'error');
    if (completedRequests.length > 0) {
      const twoMinutesAgo = now - (2 * 60 * 1000);
      const oldCompleted = completedRequests.filter(r => r.timestamp < twoMinutesAgo);
      if (oldCompleted.length > 0) {
        console.log(`🗑️ Removing ${oldCompleted.length} old completed requests`);
        requests = requests.filter(r => !(r.status === 'completed' || r.status === 'error') || r.timestamp >= twoMinutesAgo);
      }
    }
    
    if (pendingRequests.length === 0 && isProcessing) {
      console.log('🔓 Clearing lock - no pending requests');
      isProcessing = false;
      currentUser = null;
      lockStartTime = null;
    }
    
    console.log(`📋 Found ${requests.length} total requests`);
    res.json({ requests: requests });
  }
}; 