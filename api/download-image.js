// Import the shared image storage from upload-image
// Note: In a real implementation, you'd use a proper database or file storage
const imageStorage = new Map(); // This will be empty in this endpoint, but we'll handle it

module.exports = async (req, res) => {
  console.log(`🔍 download-image.js called with method: ${req.method}`);
  
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
  
  if (req.method === 'GET') {
    console.log('📥 GET request received to download-image endpoint');
    const { file, title } = req.query;
    
    console.log(`📥 Download request for file: ${file}, title: ${title}`);
    
    if (!file) {
      console.log('❌ Missing file parameter');
      return res.status(400).json({ success: false, error: 'Missing file parameter' });
    }
    
    try {
      // Create a simple placeholder image with a message
      const placeholderImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      // Set headers for file download
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
      res.setHeader('Content-Length', placeholderImage.length);
      
      console.log('✅ Sending placeholder image for download');
      console.log('💡 Note: This is a placeholder. To get real images, configure Vercel Blob storage.');
      
      res.send(placeholderImage);
      
    } catch (error) {
      console.log('❌ Error serving image:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    console.log('❌ Unsupported method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 