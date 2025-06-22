// Cloud AI Integration for DealPal
// This module handles integration with Google Gemini AI

class GeminiAIService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-1.5-flash';
    this.rateLimiter = new RateLimiter();
    this.cache = new Map();
  }

  async initialize() {
    // Load API key from secure storage
    try {
      const result = await chrome.storage.sync.get(['gemini_api_key']);
      this.apiKey = result.gemini_api_key;
      console.log('🤖 Gemini AI: API key loaded');
    } catch (error) {
      console.warn('🤖 Gemini AI: No API key found');
    }
  }

  async enhanceProductDetection(pageContent, localResult) {
    if (!this.apiKey) {
      throw new Error('No API key configured for Gemini AI');
    }

    // Check rate limits
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = this.generateCacheKey(pageContent.url);
    if (this.cache.has(cacheKey)) {
      console.log('🤖 Gemini AI: Cache hit');
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildEnhancementPrompt(pageContent, localResult);
      const response = await this.callGemini(prompt);
      
      const enhancedResult = this.parseAIResponse(response, localResult);
      
      // Cache the result
      this.cache.set(cacheKey, enhancedResult);
      this.rateLimiter.recordRequest();
      
      return enhancedResult;

    } catch (error) {
      console.error('🤖 Cloud AI: Enhancement failed:', error);
      throw error;
    }
  }

  buildEnhancementPrompt(pageContent, localResult) {
    const prompt = `
You are an expert e-commerce product analyzer. Analyze the following web page content and enhance the product information extraction.

PAGE INFORMATION:
URL: ${pageContent.url}
Title: ${pageContent.title}
Hostname: ${pageContent.hostname}

LOCAL AI RESULT:
Product Name: ${localResult.product?.productName || 'Not detected'}
Price: ${localResult.product?.price || 'Not detected'}
Confidence: ${localResult.confidence || 0}

PAGE CONTENT (truncated):
${this.truncateContent(pageContent.textContent?.fullText || '', 2000)}

STRUCTURED DATA:
${JSON.stringify(pageContent.structuredData, null, 2).substring(0, 1000)}

TASK:
1. Determine if this is actually a product page (true/false)
2. Extract accurate product information:
   - Product name (clean, without promotional text)
   - Current price (with currency)
   - Original price (if discounted)
   - Brand
   - Category
   - Key specifications
3. Find all available deals, coupons, and offers
4. Provide confidence score (0-1)

RULES:
- Be precise and factual
- Don't hallucinate information not present on the page
- Clean product names of promotional text
- Extract numeric prices accurately
- Categorize deals properly (coupon, cashback, bank offer, etc.)

OUTPUT FORMAT (JSON):
{
  "isProductPage": boolean,
  "confidence": number,
  "product": {
    "productName": "string",
    "price": "string",
    "originalPrice": "string",
    "brand": "string",
    "category": "string",
    "description": "string",
    "specifications": {},
    "image": "string"
  },
  "deals": {
    "coupons": [{"text": "string", "type": "string", "value": "string"}],
    "offers": [{"text": "string", "type": "string", "value": "string"}],
    "bankOffers": [{"bank": "string", "discount": "string", "conditions": "string"}]
  },
  "reasoning": "Brief explanation of analysis"
}
`;

    return prompt;
  }

  async callGemini(prompt) {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert e-commerce product analyzer. Always respond with valid JSON.\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      }
    };

    const response = await fetch(
      `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Invalid response from Gemini API');
  }

  parseAIResponse(response, localResult) {
    try {
      const parsed = JSON.parse(response);
      
      // Validate the response structure
      if (!parsed.isProductPage || !parsed.product) {
        throw new Error('Invalid AI response structure');
      }

      // Merge with local result, preferring AI results
      const enhancedResult = {
        isProductPage: parsed.isProductPage,
        confidence: Math.max(parsed.confidence || 0, localResult.confidence || 0),
        source: 'cloud-ai-enhanced',
        product: {
          ...localResult.product,
          ...parsed.product,
          platform: localResult.product?.platform,
          url: localResult.product?.url,
          detected: true
        },
        deals: {
          coupons: [...(localResult.deals?.coupons || []), ...(parsed.deals?.coupons || [])],
          offers: [...(localResult.deals?.offers || []), ...(parsed.deals?.offers || [])],
          bankOffers: parsed.deals?.bankOffers || []
        },
        reasoning: parsed.reasoning
      };

      // Remove duplicates
      enhancedResult.deals.coupons = this.removeDuplicateDeals(enhancedResult.deals.coupons);
      enhancedResult.deals.offers = this.removeDuplicateDeals(enhancedResult.deals.offers);

      return enhancedResult;

    } catch (error) {
      console.error('🤖 Cloud AI: Failed to parse response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  removeDuplicateDeals(deals) {
    const seen = new Set();
    return deals.filter(deal => {
      const key = deal.text?.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  generateCacheKey(url) {
    // Simple hash function for caching
    return btoa(url).substring(0, 32);
  }
}

// Rate limiter to prevent API abuse
class RateLimiter {
  constructor() {
    this.requests = [];
    this.maxRequests = 10; // per minute
    this.timeWindow = 60000; // 1 minute
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove old requests
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }
}

// Export for use in AI service
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiAIService;
} else {
  window.GeminiAIService = GeminiAIService;
  // For backward compatibility
  window.CloudAIService = GeminiAIService;
}

/* 
FUTURE ENHANCEMENTS:

1. Gemini Model Variants:
   - gemini-1.5-flash (fast)
   - gemini-1.5-pro (accurate)
   - gemini-pro-vision (images)

2. Specialized Features:
   - Product classification
   - Price extraction  
   - Deal detection
   - Image analysis

3. Advanced Features:
   - Sentiment analysis of reviews
   - Price trend prediction
   - Competitive analysis
   - Personalized recommendations

4. Performance Optimizations:
   - Request batching
   - Response streaming
   - Model quantization
   - Edge deployment

5. Privacy Features:
   - On-device processing option
   - Data anonymization
   - Selective cloud processing
   - User consent management
*/
