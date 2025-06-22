// DealPal AI-Powered Product Detection Service
class AIProductDetectionService {
  constructor() {
    this.isInitialized = false;
    this.localModelReady = false;
    this.cloudAIEnabled = true;
    this.cache = new Map();
    this.performanceMetrics = {
      totalDetections: 0,
      successfulDetections: 0,
      averageLatency: 0,
      cacheHits: 0
    };
    
    console.log('🤖 DealPal AI Service: Initializing...');
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize local AI capabilities
      await this.initializeLocalAI();
      
      // Setup cloud AI fallback
      this.initializeCloudAI();
      
      // Load cached results
      await this.loadCache();
      
      this.isInitialized = true;
      console.log('🤖 DealPal AI Service: Ready');
    } catch (error) {
      console.error('🤖 DealPal AI Service: Initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async initializeLocalAI() {
    // For now, we'll use a lightweight rule-based AI classifier
    // In future iterations, we'll add ONNX.js transformer models
    this.localClassifier = new LocalContentClassifier();
    this.localExtractor = new LocalProductExtractor();
    this.localModelReady = true;
    console.log('🤖 Local AI models loaded');
  }

  initializeCloudAI() {
    // Setup cloud AI configuration
    this.cloudAI = {
      enabled: true,
      maxRetries: 2,
      timeout: 5000,
      rateLimitDelay: 1000
    };
    console.log('🤖 Cloud AI configured');
  }

  async loadCache() {
    try {
      const cachedData = await chrome.storage.local.get(['aiDetectionCache']);
      if (cachedData.aiDetectionCache) {
        this.cache = new Map(Object.entries(cachedData.aiDetectionCache));
        console.log(`🤖 Loaded ${this.cache.size} cached AI results`);
      }
    } catch (error) {
      console.warn('🤖 Failed to load AI cache:', error);
    }
  }

  async saveCache() {
    try {
      const cacheObj = Object.fromEntries(this.cache);
      await chrome.storage.local.set({ aiDetectionCache: cacheObj });
    } catch (error) {
      console.warn('🤖 Failed to save AI cache:', error);
    }
  }

  // Main AI detection pipeline
  async detectProduct(pageContent) {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(pageContent);

    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        this.performanceMetrics.cacheHits++;
        console.log('🤖 AI Cache hit');
        return this.cache.get(cacheKey);
      }

      // Step 1: Fast content preprocessing
      const processedContent = this.preprocessContent(pageContent);
      
      // Step 2: Local AI classification
      const localResult = await this.runLocalAI(processedContent);
      
      // Step 3: Cloud AI enhancement (if needed)
      let finalResult = localResult;
      if (localResult.confidence < 0.8 || localResult.needsEnhancement) {
        console.log('🤖 Local AI confidence low, using Cloud AI enhancement');
        finalResult = await this.runCloudAI(processedContent, localResult);
      }

      // Step 4: Validate and cache result
      const validatedResult = this.validateResult(finalResult);
      this.cache.set(cacheKey, validatedResult);
      
      // Update metrics
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, true);
      
      // Save cache periodically
      if (this.cache.size % 10 === 0) {
        this.saveCache();
      }

      console.log(`🤖 AI Detection completed in ${latency.toFixed(2)}ms`);
      return validatedResult;

    } catch (error) {
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, false);
      console.error('🤖 AI Detection failed:', error);
      throw error;
    }
  }

  preprocessContent(pageContent) {
    return {
      url: pageContent.url,
      hostname: pageContent.hostname,
      title: pageContent.title,
      structuredData: this.extractStructuredData(pageContent.document),
      visualContent: this.extractVisualContent(pageContent.document),
      textContent: this.extractCleanText(pageContent.document),
      interactiveElements: this.findInteractiveElements(pageContent.document),
      metadata: this.extractMetadata(pageContent.document)
    };
  }

  extractStructuredData(document) {
    const structuredData = [];
    
    // Extract JSON-LD
    const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdElements.forEach(element => {
      try {
        const data = JSON.parse(element.textContent);
        structuredData.push(data);
      } catch (e) {
        console.debug('🤖 JSON-LD parse error:', e);
      }
    });

    // Extract Open Graph data
    const ogData = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (property && content) {
        ogData[property] = content;
      }
    });

    // Extract product schema data
    const productSchemas = document.querySelectorAll('[itemtype*="Product"]');
    const schemaData = Array.from(productSchemas).map(element => {
      return this.extractItemScope(element);
    });

    return {
      jsonLd: structuredData,
      openGraph: ogData,
      productSchemas: schemaData
    };
  }

  extractItemScope(element) {
    const data = {};
    const itemProps = element.querySelectorAll('[itemprop]');
    
    itemProps.forEach(prop => {
      const name = prop.getAttribute('itemprop');
      let value = prop.getAttribute('content') || prop.textContent.trim();
      
      if (prop.tagName === 'IMG') {
        value = prop.src;
      } else if (prop.tagName === 'A') {
        value = prop.href;
      }
      
      data[name] = value;
    });
    
    return data;
  }

  extractVisualContent(document) {
    const images = [];
    const productImages = document.querySelectorAll('img[src*="product"], img[alt*="product"], .product-image img, [class*="product"] img');
    
    productImages.forEach(img => {
      if (img.src && img.src.startsWith('http')) {
        images.push({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    });

    return { images };
  }

  extractCleanText(document) {
    // Remove script, style, and navigation elements
    const elementsToRemove = ['script', 'style', 'nav', 'header', 'footer', '.advertisement'];
    const clone = document.cloneNode(true);
    
    elementsToRemove.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    return {
      fullText: clone.body?.textContent?.trim() || '',
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()),
      paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim()).filter(text => text.length > 20)
    };
  }

  findInteractiveElements(document) {
    const buttons = [];
    const forms = [];
    
    // Find purchase-related buttons
    const purchaseButtons = document.querySelectorAll(`
      button[class*="add-to-cart"], 
      button[class*="buy-now"], 
      button[id*="add-to-cart"],
      button[data-testid*="add-to-cart"],
      .add-to-cart,
      .buy-now,
      [class*="purchase"]
    `);
    
    purchaseButtons.forEach(button => {
      buttons.push({
        text: button.textContent.trim(),
        type: 'purchase',
        visible: button.offsetParent !== null
      });
    });

    return { buttons, forms };
  }

  extractMetadata(document) {
    const meta = {};
    
    // Extract all meta tags
    document.querySelectorAll('meta').forEach(metaTag => {
      const name = metaTag.getAttribute('name') || metaTag.getAttribute('property');
      const content = metaTag.getAttribute('content');
      
      if (name && content) {
        meta[name] = content;
      }
    });

    return {
      title: document.title,
      meta: meta,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      description: meta.description || meta['og:description']
    };
  }

  async runLocalAI(processedContent) {
    console.log('🤖 Running Local AI analysis...');
    
    // Fast classification
    const isProductPage = this.localClassifier.classify(processedContent);
    
    if (!isProductPage.isProduct) {
      return {
        isProductPage: false,
        confidence: isProductPage.confidence,
        source: 'local-ai',
        message: 'Not detected as product page'
      };
    }

    // Extract product information
    const productInfo = this.localExtractor.extract(processedContent);
    
    return {
      isProductPage: true,
      confidence: Math.min(isProductPage.confidence, productInfo.confidence),
      source: 'local-ai',
      product: productInfo.product,
      deals: productInfo.deals,
      needsEnhancement: productInfo.confidence < 0.8
    };
  }

  async runCloudAI(processedContent, localResult) {
    if (!this.cloudAI.enabled) {
      return localResult;
    }

    console.log('🤖 Running Cloud AI enhancement...');
    
    try {
      // This would call OpenAI/Claude API in production
      // For now, we'll simulate enhanced results
      const enhancedResult = await this.simulateCloudAI(processedContent, localResult);
      
      return {
        ...enhancedResult,
        source: 'cloud-ai-enhanced',
        confidence: Math.max(enhancedResult.confidence, 0.9)
      };
      
    } catch (error) {
      console.warn('🤖 Cloud AI failed, using local result:', error);
      return localResult;
    }
  }

  async simulateCloudAI(processedContent, localResult) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Enhanced extraction with better confidence
    return {
      ...localResult,
      confidence: Math.min(localResult.confidence + 0.2, 1.0),
      product: {
        ...localResult.product,
        // Enhanced fields that cloud AI might provide
        category: this.inferCategory(processedContent),
        brand: this.extractBrand(processedContent),
        description: this.generateDescription(processedContent)
      }
    };
  }

  inferCategory(processedContent) {
    const text = processedContent.textContent.fullText.toLowerCase();
    const title = processedContent.title.toLowerCase();
    
    const categories = {
      'electronics': ['laptop', 'phone', 'tablet', 'computer', 'electronic'],
      'fashion': ['shirt', 'dress', 'shoes', 'clothing', 'fashion', 'apparel'],
      'home': ['furniture', 'decor', 'kitchen', 'home', 'appliance'],
      'books': ['book', 'novel', 'author', 'publisher', 'isbn'],
      'beauty': ['makeup', 'skincare', 'cosmetic', 'beauty', 'perfume']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword) || text.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  extractBrand(processedContent) {
    // Look for brand in structured data first
    const structuredData = processedContent.structuredData;
    
    if (structuredData.jsonLd) {
      for (const data of structuredData.jsonLd) {
        if (data.brand) {
          return typeof data.brand === 'string' ? data.brand : data.brand.name;
        }
      }
    }

    // Look in meta tags
    if (structuredData.openGraph['og:brand']) {
      return structuredData.openGraph['og:brand'];
    }

    return 'Unknown';
  }

  generateDescription(processedContent) {
    const paragraphs = processedContent.textContent.paragraphs;
    
    // Find the longest meaningful paragraph as description
    const description = paragraphs
      .filter(p => p.length > 50 && p.length < 500)
      .sort((a, b) => b.length - a.length)[0];
    
    return description || 'No description available';
  }

  validateResult(result) {
    // Basic validation of AI results
    if (!result.isProductPage) {
      return result;
    }

    const product = result.product;
    
    // Validate product name
    if (!product.productName || product.productName.length < 5) {
      result.confidence *= 0.7;
    }

    // Validate price
    if (!product.price || product.price === 'Price not found') {
      result.confidence *= 0.8;
    }

    // Ensure minimum confidence
    if (result.confidence < 0.5) {
      result.isProductPage = false;
      result.message = 'Low confidence in product detection';
    }

    return result;
  }

  generateCacheKey(pageContent) {
    // Create a simple hash of URL and key content for caching
    const keyString = pageContent.url + pageContent.title;
    return btoa(keyString).substring(0, 32);
  }

  updateMetrics(latency, success) {
    this.performanceMetrics.totalDetections++;
    
    if (success) {
      this.performanceMetrics.successfulDetections++;
    }
    
    // Update running average latency
    const total = this.performanceMetrics.totalDetections;
    const current = this.performanceMetrics.averageLatency;
    this.performanceMetrics.averageLatency = ((current * (total - 1)) + latency) / total;
  }

  getMetrics() {
    return {
      ...this.performanceMetrics,
      successRate: this.performanceMetrics.successfulDetections / this.performanceMetrics.totalDetections,
      cacheHitRate: this.performanceMetrics.cacheHits / this.performanceMetrics.totalDetections
    };
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIProductDetectionService;
} else {
  window.AIProductDetectionService = AIProductDetectionService;
}
