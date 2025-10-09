module.exports = async (req, res) => {
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request received from origin:', origin);
    return res.status(200).end();
  }

  // Log request details for debugging
  console.log('📥 Request received:', {
    method: req.method,
    origin: origin,
    referer: req.headers.referer,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    host: req.headers.host
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, max_tokens = 50, temperature = 0.7 } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
    }

    console.log('🤖 Calling OpenAI with prompt length:', prompt.length);

    // Retry logic with exponential backoff for rate limits
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens
          })
        });

        if (response.status === 429) {
          // Rate limit hit - extract retry time from response
          const errorData = await response.json();
          const retryAfter = errorData.error?.retry_after || 1; // Default to 1 second
          
          console.log(`⏰ Rate limit hit (attempt ${attempt}/${maxRetries}), retrying in ${retryAfter}s...`);
          
          if (attempt < maxRetries) {
            // Wait for the specified retry time, plus some jitter
            const jitter = Math.random() * 1000; // 0-1 second random jitter
            const waitTime = (retryAfter * 1000) + jitter;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue; // Try again
          } else {
            // Max retries reached
            lastError = new Error(`Rate limit exceeded after ${maxRetries} attempts`);
            break;
          }
        }

        if (!response.ok) {
          const text = await response.text();
          console.log('❌ OpenAI error:', response.status, text);
          return res.status(response.status).json({ error: 'OpenAI error', details: text });
        }

        const data = await response.json();
        const content = (data.choices?.[0]?.message?.content ?? '').trim();
        
        console.log('✅ OpenAI response successful, content length:', content.length);
        return res.json({ content });
        
      } catch (fetchError) {
        console.log(`❌ Fetch error on attempt ${attempt}:`, fetchError.message);
        lastError = fetchError;
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we get here, all retries failed
    console.log('💥 All retry attempts failed');
    return res.status(500).json({ 
      error: 'OpenAI request failed after retries', 
      details: lastError?.message || 'Unknown error' 
    });
    
  } catch (error) {
    console.log('💥 Server error:', error);
    return res.status(500).json({ error: 'Server error', details: String(error) });
  }
};


