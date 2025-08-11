// Try to import Vercel Blob, but fallback if not available
let put;
try {
  const blobModule = require('@vercel/blob');
  put = blobModule.put;
} catch (error) {
  console.log('⚠️ Vercel Blob not available, using fallback');
  put = null;
}

module.exports = async (req, res) => {
  console.log(`🔍 upload-image.js called with method: ${req.method}`);
  
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
    console.log('📤 POST request received to upload-image endpoint');
    const { imageData, fileName, blogTitle } = req.body;
    
    if (!imageData || !fileName) {
      console.log('❌ Missing imageData or fileName');
      return res.status(400).json({ success: false, error: 'Missing imageData or fileName' });
    }
    
    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, 'base64');
      
      // Generate unique filename with better naming for template variations
      const timestamp = Date.now();
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFileName = `${cleanFileName}_${timestamp}.webp`;
      
      let downloadUrl;
      
      if (put) {
        // Try Vercel Blob storage
        try {
          const { url } = await put(uniqueFileName, imageBuffer, {
            access: 'public',
            contentType: 'image/webp'
          });
          
          console.log('✅ Image uploaded to Vercel Blob:', url);
          downloadUrl = url;
        } catch (blobError) {
          console.log('❌ Vercel Blob upload failed:', blobError.message);
          throw blobError;
        }
      } else {
        // Fallback: return a placeholder URL
        console.log('⚠️ Using fallback - no Blob storage available');
        downloadUrl = `https://slack-webhook-personal.vercel.app/api/download-image?file=${uniqueFileName}&title=${encodeURIComponent(blogTitle)}`;
      }
      
      res.json({ 
        success: true, 
        downloadUrl: downloadUrl,
        fileName: uniqueFileName
      });
      
    } catch (error) {
      console.log('❌ Error processing image:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        details: 'Image upload failed. Check Vercel Blob configuration.'
      });
    }
  } else {
    console.log('❌ Unsupported method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 