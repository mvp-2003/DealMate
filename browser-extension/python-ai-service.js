// Python AI Service Integration for DealMate Browser Extension
// This module handles communication with the backend Python AI service

class PythonAIService {
  constructor() {
    this.baseURL = 'http://localhost:8001'; // AI service URL
    this.timeout = 10000; // 10 seconds
    this.enabled = true;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    console.log('🐍 Python AI Service: Initialized');
  }

  async enhanceProductDetection(pageContent, localResult) {
    if (!this.enabled) {
      console.log('🐍 Python AI Service: Disabled');
      return localResult;
    }

    try {
      console.log('🐍 Calling Python AI service for product enhancement...');
      
      // Check cache first
      const cacheKey = this.generateCacheKey(pageContent.url);
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log('🐍 Python AI: Cache hit');
          return cached.result;
        }
      }

      const requestData = this.buildDetectionRequest(pageContent, localResult);
      
      const response = await this.callAPI('/detect-product', requestData);
      
      if (response && response.is_product_page !== undefined) {
        const enhancedResult = this.processDetectionResponse(response, localResult);
        
        // Cache the result
        this.cache.set(cacheKey, {
          result: enhancedResult,
          timestamp: Date.now()
        });
        
        console.log('🐍 Python AI enhancement successful:', enhancedResult);
        return enhancedResult;
      } else {
        console.warn('🐍 Python AI: Invalid response format');
        return localResult;
      }
      
    } catch (error) {
      console.error('🐍 Python AI enhancement failed:', error);
      return localResult; // Fallback to local result
    }
  }

  async analyzeSentiment(reviews, productName) {
    if (!this.enabled || !reviews || reviews.length === 0) {
      return null;
    }

    try {
      console.log(`🐍 Analyzing sentiment for ${reviews.length} reviews...`);
      
      const requestData = {
        reviews: reviews.slice(0, 20), // Limit to 20 reviews
        product_name: productName
      };
      
      const response = await this.callAPI('/analyze-sentiment', requestData);
      
      if (response) {
        console.log('🐍 Sentiment analysis successful:', response);
        return response;
      }
      
    } catch (error) {
      console.error('🐍 Sentiment analysis failed:', error);
    }
    
    return null;
  }

  async predictPrice(productName, currentPrice, category, historicalPrices = null) {
    if (!this.enabled) {
      return null;
    }

    try {
      console.log(`🐍 Predicting price for ${productName}...`);
      
      const requestData = {
        product_name: productName,
        current_price: parseFloat(currentPrice.replace(/[^\d.]/g, '')) || 0,
        category: category || 'general',
        historical_prices: historicalPrices
      };
      
      const response = await this.callAPI('/predict-price', requestData);
      
      if (response) {
        console.log('🐍 Price prediction successful:', response);
        return response;
      }
      
    } catch (error) {
      console.error('🐍 Price prediction failed:', error);
    }
    
    return null;
  }

  buildDetectionRequest(pageContent, localResult) {
    return {
      url: pageContent.url,
      page_title: pageContent.title,
      text_content: this.extractTextContent(pageContent.document),
      structured_data: this.extractStructuredData(pageContent.document),
      images: this.extractImages(pageContent.document),
      local_ai_result: {
        ...localResult,
        source: 'browser-extension-local'
      }
    };
  }

  extractTextContent(document) {
    // Get clean text content from the page
    const elementsToRemove = ['script', 'style', 'nav', 'header', 'footer'];
    const clone = document.cloneNode(true);
    
    elementsToRemove.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    return clone.body?.textContent?.trim()?.substring(0, 5000) || '';
  }

  extractStructuredData(document) {
    const data = {};
    
    // Extract JSON-LD
    const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
    data.json_ld = [];
    jsonLdElements.forEach(element => {
      try {
        const parsed = JSON.parse(element.textContent);
        data.json_ld.push(parsed);
      } catch (e) {
        // Ignore invalid JSON-LD
      }
    });

    // Extract Open Graph data
    data.open_graph = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (property && content) {
        data.open_graph[property] = content;
      }
    });

    return data;
  }

  extractImages(document) {
    // Extract product images (limit to first 3 for performance)
    const images = [];
    const productImages = document.querySelectorAll(
      'img[src*="product"], img[alt*="product"], .product-image img, [class*="product"] img'
    );
    
    for (let i = 0; i < Math.min(productImages.length, 3); i++) {
      const img = productImages[i];
      if (img.src && img.src.startsWith('http')) {
        // For now, just send the URL - in future could convert to base64
        images.push(img.src);
      }
    }
    
    return images;
  }

  processDetectionResponse(pythonResponse, localResult) {
    // Combine Python AI response with local result
    return {
      isProductPage: pythonResponse.is_product_page,
      confidence: pythonResponse.confidence,
      source: 'python-ai-enhanced',
      product: this.mergeProductInfo(pythonResponse.product, localResult.product),
      deals: localResult.deals || {},
      analysis: {
        local: localResult,
        python: pythonResponse.analysis,
        processing_time: pythonResponse.processing_time
      },
      enhancement: {
        improved_confidence: pythonResponse.confidence > (localResult.confidence || 0),
        ai_reasoning: pythonResponse.analysis?.llm_analysis?.reasoning,
        detection_methods: [
          localResult.source || 'local-ai',
          pythonResponse.source
        ]
      }
    };
  }

  mergeProductInfo(pythonProduct, localProduct) {
    if (!pythonProduct && !localProduct) return null;
    
    return {
      ...localProduct,
      ...pythonProduct,
      // Prefer local product info for URLs and platform-specific data
      url: localProduct?.url || pythonProduct?.url,
      platform: localProduct?.platform || pythonProduct?.platform,
      detected: true,
      enhanced_by_ai: !!pythonProduct
    };
  }

  async callAPI(endpoint, data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Python AI service timeout');
      }
      
      throw error;
    }
  }

  generateCacheKey(url) {
    // Simple cache key based on URL
    return btoa(url).substring(0, 32);
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const health = await response.json();
        console.log('🐍 Python AI Service health:', health);
        return health;
      }
    } catch (error) {
      console.warn('🐍 Python AI Service health check failed:', error);
    }
    
    return null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🐍 Python AI Service: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  clearCache() {
    this.cache.clear();
    console.log('🐍 Python AI Service: Cache cleared');
  }

  getStats() {
    return {
      enabled: this.enabled,
      cache_size: this.cache.size,
      base_url: this.baseURL,
      timeout: this.timeout
    };
  }
}

// Export the service
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PythonAIService;
} else {
  window.PythonAIService = PythonAIService;
}
