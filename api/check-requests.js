// Global state for request management
let requests = [];
let isProcessing = false; // Global lock to prevent concurrent processing
let currentUser = null; // Track who is currently using the system
let lockStartTime = null; // Track when the lock was set

// Plugin availability tracking
let pluginLastHeartbeat = null; // Last time plugin sent heartbeat
let pluginAvailable = false; // Whether plugin is currently available
let pluginEverHeartbeated = false; // Whether plugin has ever sent a heartbeat
const PLUGIN_TIMEOUT = 10 * 1000; // 10 seconds timeout for plugin availability

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
    const newRequest = req.body;
    console.log('📥 Adding new request:', newRequest.blogTitle, 'from user:', newRequest.userId);
    
    // Check if this is a heartbeat from the plugin
    if (newRequest.type === 'heartbeat') {
      pluginLastHeartbeat = Date.now();
      pluginAvailable = true;
      pluginEverHeartbeated = true;
      console.log('💓 Plugin heartbeat received - plugin is available');
      return res.json({ success: true, message: 'Heartbeat received' });
    }
    
    // Check if plugin is available before processing requests
    const now = Date.now();
    if (pluginLastHeartbeat && (now - pluginLastHeartbeat) > PLUGIN_TIMEOUT) {
      pluginAvailable = false;
      console.log('⚠️ Plugin timeout - plugin is no longer available');
    }
    
    // If plugin has never heartbeated or is timed out, mark as unavailable
    if (!pluginEverHeartbeated || (pluginLastHeartbeat && (now - pluginLastHeartbeat) > PLUGIN_TIMEOUT)) {
      pluginAvailable = false;
    }
    
    // If plugin is not available, reject the request
    if (!pluginAvailable) {
      console.log('🚫 Plugin not available - rejecting request');
      return res.status(503).json({ 
        success: false, 
        error: 'Figma plugin is not currently open. Please open the plugin in Figma and try again.',
        pluginAvailable: false,
        code: 'PLUGIN_UNAVAILABLE'
      });
    }
    
    // Check if lock has been held too long (5 minutes)
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
    console.log('💓 Plugin status - Available:', pluginAvailable, 'Last heartbeat:', pluginLastHeartbeat ? new Date(pluginLastHeartbeat).toISOString() : 'Never');
    
    // Check for status update parameter
    if (req.query.updateStatus === 'true' && req.query.requestId && req.query.status) {
      const requestId = req.query.requestId;
      const newStatus = req.query.status;
      const message = req.query.message || '';
      
      console.log(`🔄 Updating request ${requestId} to status: ${newStatus}`);
      
      // Find and update the request
      const requestIndex = requests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        requests[requestIndex].status = newStatus;
        if (message) {
          requests[requestIndex].message = message;
        }
        console.log(`✅ Successfully updated request ${requestId} to ${newStatus}`);
        
        // If request is completed or errored, clear the lock
        if (newStatus === 'completed' || newStatus === 'error') {
          isProcessing = false;
          currentUser = null;
          lockStartTime = null;
          console.log('🔓 Lock cleared - request finished');
        }
        
        return res.json({ 
          success: true, 
          message: `Request ${requestId} updated to ${newStatus}`,
          request: requests[requestIndex]
        });
      } else {
        console.log(`❌ Request ${requestId} not found`);
        return res.status(404).json({ 
          success: false, 
          error: `Request ${requestId} not found` 
        });
      }
    }
    
    // Check for reset parameter
    if (req.query.reset === 'true') {
      console.log('🔄 Manual reset requested via GET parameter');
      requests = [];
      isProcessing = false;
      currentUser = null;
      lockStartTime = null;
      pluginAvailable = false;
      pluginLastHeartbeat = null;
      pluginEverHeartbeated = false;
      console.log('✅ System reset complete');
      return res.json({ 
        success: true, 
        message: 'System reset complete',
        requests: []
      });
    }
    
    // Check for plugin status parameter
    if (req.query.pluginStatus === 'true') {
      return res.json({
        success: true,
        pluginAvailable: pluginAvailable,
        lastHeartbeat: pluginLastHeartbeat,
        timeSinceLastHeartbeat: pluginLastHeartbeat ? Date.now() - pluginLastHeartbeat : null
      });
    }
    
    // Return requests with plugin status
    res.json({ 
      success: true, 
      requests: requests,
      pluginAvailable: pluginAvailable,
      lastHeartbeat: pluginLastHeartbeat
    });
  }
}; 