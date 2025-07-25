// DealMate AI-Powered Product Detection Service - Enhanced with Real AI
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
    
    // Initialize advanced AI engines
    this.stackSmartEngine = null;
    this.priceIntelligence = null;
    
    console.log('🤖 DealMate AI Service: Initializing Enhanced AI System...');
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize local AI capabilities
      await this.initializeLocalAI();
      
      // Setup cloud AI fallback
      this.initializeCloudAI();
      
      // Initialize advanced AI engines
      await this.initializeAdvancedEngines();
      
      // Load cached results
      await this.loadCache();
      
      this.isInitialized = true;
      console.log('🤖 DealMate AI Service: Enhanced system ready with StackSmart & Price Intelligence');
    } catch (error) {
      console.error('🤖 DealMate AI Service: Initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async initializeAdvancedEngines() {
    // Initialize StackSmart Engine for offer optimization
    if (typeof StackSmartEngine !== 'undefined') {
      this.stackSmartEngine = new StackSmartEngine();
      console.log('🤖 StackSmart Engine initialized');
    }
    
    // Initialize Price Intelligence Engine
    if (typeof PriceIntelligenceEngine !== 'undefined') {
      this.priceIntelligence = new PriceIntelligenceEngine();
      console.log('🤖 Price Intelligence Engine initialized');
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
    console.log('🤖 Running Enhanced Local AI analysis...');
    
    // Step 1: Enhanced classification with multiple signals
    const classification = this.localClassifier.classify(processedContent);
    
    if (!classification.isProduct && classification.confidence > 0.8) {
      return {
        isProductPage: false,
        confidence: classification.confidence,
        source: 'local-ai-enhanced',
        classification: classification,
        message: 'Confidently determined not a product page'
      };
    }

    // Step 2: Enhanced product extraction
    const productInfo = this.localExtractor.extract(processedContent);
    
    // Step 3: Multi-signal confidence calculation
    const enhancedConfidence = this.calculateMultiSignalConfidence(
      classification, 
      productInfo, 
      processedContent
    );
    
    // Step 4: Determine enhancement needs
    const needsEnhancement = this.determineEnhancementNeeds(
      enhancedConfidence, 
      processedContent
    );
    
    return {
      isProductPage: classification.isProduct,
      confidence: enhancedConfidence.overall,
      source: 'local-ai-enhanced',
      product: productInfo.product,
      deals: productInfo.deals,
      needsEnhancement: needsEnhancement,
      confidenceBreakdown: enhancedConfidence,
      classification: classification,
      enhancement_reasons: needsEnhancement ? this.getEnhancementReasons(enhancedConfidence) : []
    };
  }

  calculateMultiSignalConfidence(classification, productInfo, processedContent) {
    // URL-based signals
    const urlSignals = this.analyzeUrlPatterns(processedContent.url);
    
    // Content-based signals  
    const contentSignals = this.analyzeContentPatterns(processedContent.textContent);
    
    // Structure-based signals
    const structureSignals = this.analyzeStructuralElements(processedContent);
    
    // Visual signals
    const visualSignals = this.analyzeVisualElements(processedContent.visualContent);
    
    // Interactive element signals
    const interactionSignals = this.analyzeInteractiveElements(processedContent.interactiveElements);
    
    // Weighted combination
    const weights = {
      classification: 0.25,
      product_extraction: 0.20,
      url: 0.15,
      content: 0.15,
      structure: 0.10,
      visual: 0.10,
      interaction: 0.05
    };
    
    const scores = {
      classification: classification.confidence,
      product_extraction: productInfo.confidence,
      url: urlSignals,
      content: contentSignals,
      structure: structureSignals,
      visual: visualSignals,
      interaction: interactionSignals
    };
    
    const overall = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (scores[key] * weight);
    }, 0);
    
    return {
      overall: Math.min(overall, 1.0),
      ...scores
    };
  }

  analyzeUrlPatterns(url) {
    const productPatterns = [
      { pattern: /\/product\/|\/item\/|\/dp\/|\/gp\/product\//, score: 0.9 },
      { pattern: /\/p\/|\/products\/|product-detail|productdetail/, score: 0.8 },
      { pattern: /\/buy\/|\/shop\/|store\/.*\/item/, score: 0.7 },
      { pattern: /\d{8,}/, score: 0.6 } // Product IDs
    ];
    
    const negativePatterns = [
      { pattern: /\/category\/|\/categories\/|\/browse\//, score: -0.3 },
      { pattern: /\/search\/|\/results\/|\/find\//, score: -0.4 },
      { pattern: /\/cart\/|\/checkout\/|\/payment\//, score: -0.5 },
      { pattern: /\/login\/|\/register\/|\/account\//, score: -0.6 }
    ];
    
    let score = 0.5; // Neutral base
    
    [...productPatterns, ...negativePatterns].forEach(({pattern, score: patternScore}) => {
      if (pattern.test(url)) {
        score += patternScore;
      }
    });
    
    return Math.max(0, Math.min(1, score));
  }

  analyzeContentPatterns(textContent) {
    const strongIndicators = [
      'add to cart', 'buy now', 'add to bag', 'purchase now',
      'price:', 'mrp:', 'was:', 'save:', 'discount',
      'free shipping', 'delivery', 'in stock', 'out of stock'
    ];
    
    const moderateIndicators = [
      'product description', 'specifications', 'features',
      'reviews', 'rating', 'stars', 'warranty', 'return policy'
    ];
    
    const text = textContent.fullText.toLowerCase();
    let score = 0;
    
    strongIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.1;
    });
    
    moderateIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 0.05;
    });
    
    return Math.min(score, 1.0);
  }

  analyzeStructuralElements(processedContent) {
    let score = 0;
    
    // Check for product schema
    if (processedContent.structuredData) {
      const hasProductSchema = processedContent.structuredData.some(data => {
        const type = data['@type'] || '';
        return type.includes('Product') || type.includes('Offer');
      });
      if (hasProductSchema) score += 0.4;
    }
    
    // Check for price elements
    const priceSelectors = [
      '[data-price]', '.price', '#price', '[class*="price"]',
      '[data-cost]', '.cost', '[class*="cost"]'
    ];
    
    // This would be implemented in the browser context
    // For now, we'll estimate based on text content
    if (processedContent.textContent.fullText.match(/\$\d+|\₹\d+|£\d+|€\d+/)) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  analyzeVisualElements(visualContent) {
    if (!visualContent || !visualContent.images) return 0.4;
    
    let score = 0;
    const images = visualContent.images.slice(0, 5);
    
    images.forEach(img => {
      const imgContext = (img.alt + ' ' + img.src + ' ' + img.className).toLowerCase();
      
      if (imgContext.includes('product') || imgContext.includes('item')) {
        score += 0.2;
      } else if (imgContext.includes('main') || imgContext.includes('hero')) {
        score += 0.15;
      } else if (imgContext.includes('gallery') || imgContext.includes('zoom')) {
        score += 0.1;
      }
    });
    
    return Math.min(score, 1.0);
  }

  analyzeInteractiveElements(interactiveElements) {
    if (!interactiveElements) return 0.3;
    
    let score = 0;
    const productActions = [
      'add to cart', 'buy', 'purchase', 'add to bag',
      'wishlist', 'favorite', 'compare', 'notify'
    ];
    
    interactiveElements.forEach(element => {
      const elementText = element.text.toLowerCase();
      productActions.forEach(action => {
        if (elementText.includes(action)) {
          score += 0.2;
        }
      });
    });
    
    return Math.min(score, 1.0);
  }

  determineEnhancementNeeds(confidence, processedContent) {
    // Always use cloud AI if overall confidence is low
    if (confidence.overall < 0.7) return true;
    
    // Use cloud AI for unknown domains with medium confidence
    const hostname = new URL(processedContent.url).hostname;
    const knownDomains = [
      'amazon', 'flipkart', 'myntra', 'shopify', 'etsy',
      'ebay', 'walmart', 'target', 'bestbuy', 'zalando'
    ];
    
    const isKnownDomain = knownDomains.some(domain => hostname.includes(domain));
    if (!isKnownDomain && confidence.overall < 0.85) return true;
    
    // Use cloud AI if signals are conflicting
    const scores = [confidence.url, confidence.content, confidence.structure, confidence.visual];
    const variance = this.calculateVariance(scores);
    if (variance > 0.2) return true;
    
    return false;
  }

  calculateVariance(scores) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  }

  getEnhancementReasons(confidence) {
    const reasons = [];
    
    if (confidence.overall < 0.7) {
      reasons.push('Low overall confidence');
    }
    if (confidence.url < 0.5) {
      reasons.push('Unclear URL pattern');
    }
    if (confidence.content < 0.6) {
      reasons.push('Ambiguous content signals');
    }
    if (confidence.structure < 0.5) {
      reasons.push('Weak structural indicators');
    }
    
    return reasons;
  }

  async runCloudAI(processedContent, localResult) {
    if (!this.cloudAI.enabled) {
      console.log('🤖 Cloud AI disabled, using local result');
      return localResult;
    }

    console.log('🤖 Running Enhanced Cloud AI with Gemini...');
    
    try {
      // Enhanced cloud analysis using our Python AI service with Gemini
      const enhancementData = {
        url: processedContent.url,
        title: processedContent.title,
        text_content: processedContent.textContent.fullText.substring(0, 3000), // Limit for API
        structured_data: processedContent.structuredData,
        local_analysis: localResult,
        images: processedContent.visualContent?.images?.slice(0, 3).map(img => img.src) || [],
        enhancement_type: 'full_analysis'
      };

      // Call our enhanced Python AI service
      const response = await fetch('http://localhost:8001/analyze/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DealMate-Source': 'browser-extension'
        },
        body: JSON.stringify(enhancementData),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`AI service responded with status: ${response.status}`);
      }

      const aiResult = await response.json();
      
      // Combine local and cloud results intelligently
      const combinedResult = this.combineAIResults(localResult, aiResult);
      
      console.log('🤖 Cloud AI enhancement completed', {
        confidence_improvement: combinedResult.confidence - localResult.confidence,
        ai_model: 'gemini',
        processing_time: aiResult.processing_time
      });

      return combinedResult;

    } catch (error) {
      console.warn('🤖 Cloud AI enhancement failed, falling back to local result:', error);
      
      // Graceful fallback - return local result with fallback indicators
      return {
        ...localResult,
        cloud_ai_attempted: true,
        cloud_ai_error: error.message,
        fallback_used: true
      };
    }
  }

  combineAIResults(localResult, cloudResult) {
    // Intelligent combination of local and cloud AI results
    const combined = {
      isProductPage: localResult.isProductPage,
      source: 'hybrid-ai-enhanced',
      local_analysis: localResult,
      cloud_analysis: cloudResult,
      processing_chain: ['local-ai', 'gemini-cloud-ai']
    };

    // Use cloud AI confidence if it's more confident and makes sense
    if (cloudResult.ai_enhancement_summary) {
      const cloudConfidence = cloudResult.ai_enhancement_summary.final_confidence;
      const localConfidence = localResult.confidence;
      
      // Trust cloud AI if it's significantly more confident
      if (cloudConfidence > localConfidence + 0.1) {
        combined.confidence = cloudConfidence;
        combined.confidence_source = 'cloud-ai';
        combined.isProductPage = cloudResult.ai_product_confidence?.is_product_page ?? localResult.isProductPage;
      } else if (Math.abs(cloudConfidence - localConfidence) < 0.1) {
        // Similar confidence - average them
        combined.confidence = (cloudConfidence + localConfidence) / 2;
        combined.confidence_source = 'averaged';
      } else {
        // Local AI is more confident
        combined.confidence = localConfidence;
        combined.confidence_source = 'local-ai';
      }
    } else {
      combined.confidence = localResult.confidence;
      combined.confidence_source = 'local-ai-fallback';
    }

    // Enhance product information with AI insights
    combined.product = this.enhanceProductWithAI(localResult.product, cloudResult);
    
    // Enhance deals with AI analysis
    combined.deals = this.enhanceDealsWithAI(localResult.deals, cloudResult);
    
    // Add AI-powered insights
    combined.ai_insights = this.extractAIInsights(cloudResult);
    
    // Final confidence level classification
    combined.confidence_level = this.classifyConfidenceLevel(combined.confidence);
    
    return combined;
  }

  enhanceProductWithAI(localProduct, cloudResult) {
    const enhanced = { ...localProduct };
    
    // Extract AI-enhanced product information
    if (cloudResult.ai_text_analysis?.content_extraction?.extracted_info) {
      const aiExtracted = cloudResult.ai_text_analysis.content_extraction.extracted_info;
      
      // Enhance product name
      if (aiExtracted.likely_product_name && !enhanced.name) {
        enhanced.name = aiExtracted.likely_product_name;
        enhanced.name_source = 'ai-extracted';
      }
      
      // Enhance brand information
      if (aiExtracted.brand_mentions && aiExtracted.brand_mentions.length > 0) {
        enhanced.brand = enhanced.brand || aiExtracted.brand_mentions[0];
        enhanced.brand_confidence = 0.8;
      }
      
      // Enhance category
      if (aiExtracted.category_indicators && aiExtracted.category_indicators.length > 0) {
        enhanced.category = enhanced.category || aiExtracted.category_indicators[0];
      }
      
      // Add AI-detected features
      if (aiExtracted.feature_keywords) {
        enhanced.ai_detected_features = aiExtracted.feature_keywords;
      }
    }
    
    // Add image analysis insights
    if (cloudResult.ai_image_analysis?.aggregated_findings) {
      const imageFindings = cloudResult.ai_image_analysis.aggregated_findings;
      
      if (imageFindings.brands_detected?.length > 0) {
        enhanced.image_detected_brands = imageFindings.brands_detected;
      }
      
      if (imageFindings.products_detected?.length > 0) {
        enhanced.image_detected_products = imageFindings.products_detected;
      }
    }
    
    return enhanced;
  }

  enhanceDealsWithAI(localDeals, cloudResult) {
    const enhanced = [...(localDeals || [])];
    
    // Add AI-detected deals
    if (cloudResult.ai_text_analysis?.content_extraction?.deal_indicators) {
      const dealIndicators = cloudResult.ai_text_analysis.content_extraction.deal_indicators;
      
      if (dealIndicators.discount_mentions) {
        dealIndicators.discount_mentions.forEach(discount => {
          enhanced.push({
            type: 'discount',
            description: discount,
            source: 'ai-detected',
            confidence: 0.7
          });
        });
      }
    }
    
    // Add AI deal quality assessment
    if (cloudResult.ai_deal_analysis) {
      enhanced.ai_quality_assessment = {
        overall_score: cloudResult.ai_deal_analysis.overall_score,
        recommendation: cloudResult.ai_deal_analysis.recommendation,
        authenticity: cloudResult.ai_deal_analysis.authenticity
      };
    }
    
    return enhanced;
  }

  extractAIInsights(cloudResult) {
    const insights = {
      confidence_factors: [],
      quality_indicators: [],
      trust_signals: [],
      warnings: []
    };
    
    // Extract confidence factors
    if (cloudResult.ai_enhancement_summary?.confidence_factors) {
      insights.confidence_factors = Object.entries(cloudResult.ai_enhancement_summary.confidence_factors)
        .map(([factor, score]) => ({ factor, score }));
    }
    
    // Extract quality indicators
    if (cloudResult.ai_text_analysis?.content_extraction?.content_quality) {
      const quality = cloudResult.ai_text_analysis.content_extraction.content_quality;
      insights.quality_indicators.push({
        completeness: quality.completeness,
        professional_language: quality.professional_language,
        trustworthiness: quality.trustworthiness
      });
    }
    
    // Extract trust signals from sentiment analysis
    if (cloudResult.ai_sentiment_analysis) {
      const sentiment = cloudResult.ai_sentiment_analysis;
      insights.trust_signals.push({
        overall_sentiment: sentiment.overall_sentiment,
        trustworthiness_score: sentiment.trustworthiness_score,
        sentiment_distribution: sentiment.sentiment_distribution
      });
    }
    
    // Extract warnings from deal analysis
    if (cloudResult.ai_deal_analysis?.authenticity?.red_flags) {
      insights.warnings = cloudResult.ai_deal_analysis.authenticity.red_flags.map(flag => ({
        type: 'deal_authenticity',
        message: flag,
        severity: 'medium'
      }));
    }
    
    return insights;
  }

  classifyConfidenceLevel(confidence) {
    if (confidence >= 0.9) return 'VERY_HIGH';
    if (confidence >= 0.8) return 'HIGH';
    if (confidence >= 0.7) return 'MEDIUM';
    if (confidence >= 0.6) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * Comprehensive AI-powered analysis combining all engines
   */
  async performComprehensiveAnalysis(pageContent, options = {}) {
    console.log('🤖 Starting comprehensive AI analysis...');
    const startTime = performance.now();
    
    try {
      // Step 1: Basic product detection and extraction
      const basicAnalysis = await this.detectProduct(pageContent);
      
      if (!basicAnalysis.isProductPage) {
        return {
          isProductPage: false,
          confidence: basicAnalysis.confidence,
          source: 'comprehensive-ai',
          analysis_type: 'non_product_page',
          processing_time: performance.now() - startTime
        };
      }

      // Step 2: Enhanced offer optimization using StackSmart
      let offerOptimization = null;
      if (this.stackSmartEngine && basicAnalysis.deals?.length > 0) {
        console.log('🤖 Running StackSmart offer optimization...');
        offerOptimization = await this.stackSmartEngine.optimizeOffers(
          basicAnalysis.product,
          basicAnalysis.deals,
          options.constraints || {}
        );
      }

      // Step 3: Price intelligence analysis
      let priceAnalysis = null;
      if (this.priceIntelligence && basicAnalysis.product?.price) {
        console.log('🤖 Running price intelligence analysis...');
        priceAnalysis = await this.priceIntelligence.analyzePriceIntelligence(
          basicAnalysis.product,
          basicAnalysis.product.price,
          options.priceAnalysis || {}
        );
      }

      // Step 4: AI-powered content enhancement
      const contentEnhancement = await this.enhanceWithAI(pageContent, basicAnalysis);

      // Step 5: Generate comprehensive insights
      const insights = this.generateComprehensiveInsights(
        basicAnalysis,
        offerOptimization,
        priceAnalysis,
        contentEnhancement
      );

      // Step 6: Calculate final confidence and recommendations
      const finalAnalysis = this.synthesizeFinalAnalysis(
        basicAnalysis,
        offerOptimization,
        priceAnalysis,
        contentEnhancement,
        insights
      );

      const processingTime = performance.now() - startTime;
      
      console.log('🤖 Comprehensive analysis completed in', processingTime.toFixed(2), 'ms');

      return {
        ...finalAnalysis,
        processing_time: processingTime,
        analysis_type: 'comprehensive_ai',
        ai_engines_used: this.getUsedEngines(offerOptimization, priceAnalysis, contentEnhancement),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('🤖 Comprehensive analysis failed:', error);
      const processingTime = performance.now() - startTime;
      
      return {
        isProductPage: false,
        error: error.message,
        source: 'comprehensive-ai-error',
        processing_time: processingTime,
        fallback_analysis: await this.detectProduct(pageContent) // Fallback to basic
      };
    }
  }

  async enhanceWithAI(pageContent, basicAnalysis) {
    const enhancements = {
      confidence_boost: 0,
      quality_score: 0,
      trust_indicators: [],
      risk_factors: [],
      content_analysis: {}
    };

    try {
      // Enhanced product name extraction using NLP patterns
      if (basicAnalysis.product) {
        const enhancedProduct = await this.enhanceProductInformation(
          basicAnalysis.product,
          pageContent
        );
        enhancements.enhanced_product = enhancedProduct;
      }

      // Advanced deal detection using pattern recognition
      const enhancedDeals = await this.enhanceOfferDetection(pageContent);
      if (enhancedDeals.length > 0) {
        enhancements.additional_deals = enhancedDeals;
      }

      // Trust and quality assessment
      const trustAssessment = this.assessPageTrustAndQuality(pageContent);
      enhancements.trust_assessment = trustAssessment;

      // Brand authenticity verification
      if (basicAnalysis.product?.brand) {
        const brandVerification = await this.verifyBrandAuthenticity(
          basicAnalysis.product.brand,
          pageContent
        );
        enhancements.brand_verification = brandVerification;
      }

    } catch (error) {
      console.warn('🤖 AI enhancement failed:', error);
      enhancements.enhancement_error = error.message;
    }

    return enhancements;
  }

  generateComprehensiveInsights(basicAnalysis, offerOptimization, priceAnalysis, contentEnhancement) {
    const insights = {
      savings_opportunities: [],
      timing_recommendations: [],
      quality_indicators: [],
      risk_alerts: [],
      personalization: {}
    };

    // Savings insights from StackSmart
    if (offerOptimization) {
      insights.savings_opportunities.push({
        type: 'offer_stacking',
        potential_savings: offerOptimization.totalSavings,
        confidence: offerOptimization.confidence,
        complexity: offerOptimization.complexity,
        message: `Save $${offerOptimization.totalSavings.toFixed(2)} with optimized offer stacking`
      });

      if (offerOptimization.alternatives?.length > 0) {
        insights.savings_opportunities.push({
          type: 'alternative_offers',
          count: offerOptimization.alternatives.length,
          message: `${offerOptimization.alternatives.length} alternative offer combinations available`
        });
      }
    }

    // Timing insights from Price Intelligence
    if (priceAnalysis) {
      if (priceAnalysis.recommendation.action === 'WAIT') {
        insights.timing_recommendations.push({
          type: 'wait_for_better_price',
          confidence: priceAnalysis.recommendation.confidence,
          reasoning: priceAnalysis.recommendation.reasoning,
          estimated_savings: priceAnalysis.price_predictions?.time_horizon_predictions?.['30_days']?.expected_change
        });
      } else if (priceAnalysis.recommendation.action === 'BUY_NOW') {
        insights.timing_recommendations.push({
          type: 'buy_now_optimal',
          confidence: priceAnalysis.recommendation.confidence,
          reasoning: priceAnalysis.recommendation.reasoning
        });
      }

      // Add seasonal insights
      if (priceAnalysis.seasonal_analysis?.next_major_sale_event) {
        const saleEvent = priceAnalysis.seasonal_analysis.next_major_sale_event;
        insights.timing_recommendations.push({
          type: 'seasonal_event',
          event: saleEvent.event,
          days_away: saleEvent.days_away,
          expected_discount: saleEvent.expected_discount
        });
      }
    }

    // Quality insights from content enhancement
    if (contentEnhancement.trust_assessment) {
      const trust = contentEnhancement.trust_assessment;
      insights.quality_indicators.push({
        type: 'page_trustworthiness',
        score: trust.trust_score,
        factors: trust.positive_factors,
        concerns: trust.concerns
      });
    }

    // Risk insights
    if (contentEnhancement.brand_verification?.risk_level === 'high') {
      insights.risk_alerts.push({
        type: 'brand_authenticity',
        level: 'high',
        message: 'Potential counterfeit or unauthorized seller detected'
      });
    }

    return insights;
  }

  synthesizeFinalAnalysis(basicAnalysis, offerOptimization, priceAnalysis, contentEnhancement, insights) {
    // Calculate enhanced confidence score
    let finalConfidence = basicAnalysis.confidence;
    
    if (contentEnhancement.trust_assessment?.trust_score) {
      finalConfidence = (finalConfidence + contentEnhancement.trust_assessment.trust_score) / 2;
    }
    
    if (priceAnalysis?.confidence_score) {
      finalConfidence = (finalConfidence + priceAnalysis.confidence_score) / 2;
    }

    // Determine overall recommendation
    const recommendation = this.generateOverallRecommendation(
      basicAnalysis,
      offerOptimization,
      priceAnalysis,
      insights
    );

    return {
      isProductPage: basicAnalysis.isProductPage,
      confidence: finalConfidence,
      source: 'comprehensive-ai-enhanced',
      
      // Core analysis
      product: this.enhanceProductWithAllData(basicAnalysis.product, contentEnhancement),
      deals: this.enhanceDealsWithOptimization(basicAnalysis.deals, offerOptimization),
      
      // Advanced analysis results
      offer_optimization: offerOptimization,
      price_intelligence: priceAnalysis,
      content_enhancement: contentEnhancement,
      
      // Synthesized insights
      insights: insights,
      recommendation: recommendation,
      
      // Confidence breakdown
      confidence_breakdown: {
        basic_detection: basicAnalysis.confidence,
        content_quality: contentEnhancement.trust_assessment?.trust_score || 0.5,
        price_analysis: priceAnalysis?.confidence_score || 0.5,
        final_weighted: finalConfidence
      }
    };
  }

  enhanceProductWithAllData(product, contentEnhancement) {
    if (!product) return null;

    const enhanced = { ...product };

    // Merge enhanced product data
    if (contentEnhancement.enhanced_product) {
      Object.assign(enhanced, contentEnhancement.enhanced_product);
    }

    // Add AI-detected attributes
    enhanced.ai_enhancements = {
      quality_verified: contentEnhancement.trust_assessment?.trust_score > 0.7,
      brand_verified: contentEnhancement.brand_verification?.authentic === true,
      content_quality: contentEnhancement.trust_assessment?.content_quality || 'unknown'
    };

    return enhanced;
  }

  enhanceDealsWithOptimization(deals, offerOptimization) {
    if (!deals || !offerOptimization) return deals;

    return deals.map(deal => ({
      ...deal,
      optimization_data: {
        stackable: offerOptimization.applicationSequence?.some(
          step => step.offer.code === deal.code
        ),
        optimal_order: offerOptimization.applicationSequence?.findIndex(
          step => step.offer.code === deal.code
        ) + 1,
        estimated_savings: offerOptimization.applicationSequence?.find(
          step => step.offer.code === deal.code
        )?.expectedSavings
      }
    }));
  }

  generateOverallRecommendation(basicAnalysis, offerOptimization, priceAnalysis, insights) {
    const factors = [];
    let recommendationScore = 50; // Base score

    // Factor in offer optimization
    if (offerOptimization?.totalSavings > 10) {
      recommendationScore += 20;
      factors.push(`$${offerOptimization.totalSavings.toFixed(2)} savings available`);
    }

    // Factor in price analysis
    if (priceAnalysis?.recommendation.action === 'BUY_NOW') {
      recommendationScore += 15;
      factors.push('Optimal purchase timing');
    } else if (priceAnalysis?.recommendation.action === 'WAIT') {
      recommendationScore -= 10;
      factors.push('Better prices expected soon');
    }

    // Factor in risk alerts
    const highRiskAlerts = insights.risk_alerts?.filter(alert => alert.level === 'high').length || 0;
    recommendationScore -= highRiskAlerts * 15;
    if (highRiskAlerts > 0) {
      factors.push(`${highRiskAlerts} high-risk factors detected`);
    }

    // Generate recommendation
    let action, confidence, reasoning;
    
    if (recommendationScore >= 70) {
      action = 'BUY_NOW';
      confidence = 0.8;
      reasoning = 'Strong positive indicators for immediate purchase';
    } else if (recommendationScore >= 50) {
      action = 'CONSIDER';
      confidence = 0.6;
      reasoning = 'Mixed signals - evaluate based on personal needs';
    } else {
      action = 'WAIT_OR_AVOID';
      confidence = 0.7;
      reasoning = 'Risk factors or better opportunities suggest waiting';
    }

    return {
      action,
      confidence,
      reasoning,
      score: recommendationScore,
      factors: factors
    };
  }

  getUsedEngines(offerOptimization, priceAnalysis, contentEnhancement) {
    const engines = ['local-ai', 'enhanced-extraction'];
    
    if (offerOptimization) engines.push('stacksmart-engine');
    if (priceAnalysis) engines.push('price-intelligence');
    if (contentEnhancement.enhanced_product) engines.push('content-enhancement');
    
    return engines;
  }

  // Additional enhancement methods
  async enhanceProductInformation(product, pageContent) {
    // Enhanced product information extraction using advanced patterns
    const enhanced = { ...product };
    
    // Better name extraction
    enhanced.name = this.extractEnhancedProductName(pageContent) || product.name;
    
    // Category inference
    enhanced.category = this.inferProductCategory(pageContent, product) || product.category;
    
    // Feature extraction
    enhanced.features = this.extractProductFeatures(pageContent);
    
    // Specification extraction
    enhanced.specifications = this.extractProductSpecifications(pageContent);
    
    return enhanced;
  }

  async enhanceOfferDetection(pageContent) {
    // Advanced pattern recognition for deals
    const deals = [];
    const text = pageContent.textContent?.fullText || '';
    
    // Enhanced regex patterns for deal detection
    const dealPatterns = [
      { pattern: /(\d+)%\s*off/gi, type: 'percentage' },
      { pattern: /save\s*\$(\d+)/gi, type: 'fixed' },
      { pattern: /buy\s*\d+\s*get\s*\d+\s*free/gi, type: 'bogo' },
      { pattern: /free\s*shipping/gi, type: 'shipping' },
      { pattern: /(\d+)%\s*cashback/gi, type: 'cashback' }
    ];
    
    for (const {pattern, type} of dealPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          deals.push({
            type: type,
            description: match,
            source: 'ai-enhanced-detection',
            confidence: 0.7
          });
        });
      }
    }
    
    return deals;
  }

  assessPageTrustAndQuality(pageContent) {
    let trustScore = 0.5; // Base score
    const positiveFactors = [];
    const concerns = [];
    
    // Check for HTTPS
    if (pageContent.url.startsWith('https://')) {
      trustScore += 0.1;
      positiveFactors.push('Secure HTTPS connection');
    }
    
    // Check for contact information
    const text = pageContent.textContent?.fullText?.toLowerCase() || '';
    if (text.includes('contact') || text.includes('support') || text.includes('help')) {
      trustScore += 0.1;
      positiveFactors.push('Contact information available');
    }
    
    // Check for return policy
    if (text.includes('return') || text.includes('refund') || text.includes('exchange')) {
      trustScore += 0.1;
      positiveFactors.push('Return policy mentioned');
    }
    
    // Check for excessive urgency language (red flag)
    const urgencyPatterns = [
      'limited time', 'hurry', 'act now', 'expires soon', 'while supplies last'
    ];
    const urgencyCount = urgencyPatterns.filter(pattern => text.includes(pattern)).length;
    if (urgencyCount > 2) {
      trustScore -= 0.1;
      concerns.push('Excessive urgency language detected');
    }
    
    // Check for professional language quality
    const wordCount = text.split(/\s+/).length;
    const errorWords = text.match(/\b(guaranted|guarentee|recieve|seperate|definately)\b/gi) || [];
    if (errorWords.length / wordCount > 0.001) {
      trustScore -= 0.05;
      concerns.push('Potential spelling/grammar issues');
    }
    
    return {
      trust_score: Math.max(0, Math.min(1, trustScore)),
      positive_factors: positiveFactors,
      concerns: concerns,
      content_quality: trustScore > 0.7 ? 'high' : trustScore > 0.5 ? 'medium' : 'low'
    };
  }

  async verifyBrandAuthenticity(brand, pageContent) {
    // Simplified brand verification - in reality would use brand databases
    const verification = {
      brand: brand,
      authentic: true, // Default assumption
      confidence: 0.7,
      risk_level: 'low',
      factors: []
    };
    
    // Check for official brand indicators
    const hostname = new URL(pageContent.url).hostname.toLowerCase();
    if (hostname.includes(brand.toLowerCase())) {
      verification.confidence += 0.2;
      verification.factors.push('Brand name in domain');
    }
    
    // Check for suspicious indicators
    const suspiciousPatterns = [
      'replica', 'copy', 'inspired by', 'style of', 'similar to'
    ];
    
    const text = pageContent.textContent?.fullText?.toLowerCase() || '';
    const suspiciousMatches = suspiciousPatterns.filter(pattern => text.includes(pattern));
    
    if (suspiciousMatches.length > 0) {
      verification.authentic = false;
      verification.risk_level = 'high';
      verification.confidence = 0.3;
      verification.factors.push('Suspicious language detected: ' + suspiciousMatches.join(', '));
    }
    
    return verification;
  }

  extractEnhancedProductName(pageContent) {
    // Try multiple methods to extract product name
    const candidates = [];
    
    // Method 1: Page title
    if (pageContent.title) {
      candidates.push({
        name: pageContent.title.split('|')[0].split('-')[0].trim(),
        confidence: 0.8,
        source: 'page_title'
      });
    }
    
    // Method 2: H1 tags
    const h1Elements = pageContent.document?.querySelectorAll('h1') || [];
    h1Elements.forEach(h1 => {
      if (h1.textContent?.trim()) {
        candidates.push({
          name: h1.textContent.trim(),
          confidence: 0.9,
          source: 'h1_tag'
        });
      }
    });
    
    // Method 3: Product name patterns in structured data
    if (pageContent.structuredData) {
      pageContent.structuredData.forEach(data => {
        if (data.name) {
          candidates.push({
            name: data.name,
            confidence: 0.95,
            source: 'structured_data'
          });
        }
      });
    }
    
    // Return the highest confidence candidate
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.confidence - a.confidence);
      return candidates[0].name;
    }
    
    return null;
  }

  inferProductCategory(pageContent, product) {
    const text = (pageContent.textContent?.fullText || '').toLowerCase();
    const title = (pageContent.title || '').toLowerCase();
    
    const categoryKeywords = {
      'electronics': ['laptop', 'phone', 'tablet', 'computer', 'electronic', 'tech', 'gadget'],
      'fashion': ['shirt', 'dress', 'shoes', 'clothing', 'fashion', 'apparel', 'wear'],
      'home': ['furniture', 'decor', 'kitchen', 'home', 'appliance', 'bedding'],
      'books': ['book', 'novel', 'author', 'publisher', 'isbn', 'paperback', 'hardcover'],
      'sports': ['sport', 'fitness', 'exercise', 'workout', 'athletic', 'outdoor'],
      'beauty': ['makeup', 'skincare', 'beauty', 'cosmetic', 'fragrance', 'hair'],
      'automotive': ['car', 'auto', 'vehicle', 'automotive', 'parts', 'accessory']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => 
        text.includes(keyword) || title.includes(keyword)
      ).length;
      
      if (matches >= 2) {
        return category;
      }
    }
    
    return product.category || 'general';
  }

  extractProductFeatures(pageContent) {
    const features = [];
    const text = pageContent.textContent?.fullText || '';
    
    // Common feature patterns
    const featurePatterns = [
      /(\w+(?:\s+\w+)*)\s*:\s*([^,\n]+)/g, // "Feature: value" format
      /•\s*([^•\n]+)/g, // Bullet points
      /✓\s*([^✓\n]+)/g  // Checkmarks
    ];
    
    featurePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null && features.length < 10) {
        const feature = match[1] || match[0];
        if (feature.length > 5 && feature.length < 100) {
          features.push(feature.trim());
        }
      }
    });
    
    return [...new Set(features)]; // Remove duplicates
  }

  extractProductSpecifications(pageContent) {
    const specs = {};
    const text = pageContent.textContent?.fullText || '';
    
    // Common specification patterns
    const specPatterns = [
      { pattern: /dimensions?:\s*([^,\n]+)/gi, key: 'dimensions' },
      { pattern: /weight:\s*([^,\n]+)/gi, key: 'weight' },
      { pattern: /material:\s*([^,\n]+)/gi, key: 'material' },
      { pattern: /color:\s*([^,\n]+)/gi, key: 'color' },
      { pattern: /size:\s*([^,\n]+)/gi, key: 'size' },
      { pattern: /brand:\s*([^,\n]+)/gi, key: 'brand' }
    ];
    
    specPatterns.forEach(({pattern, key}) => {
      const match = text.match(pattern);
      if (match && match[1]) {
        specs[key] = match[1].trim();
      }
    });
    
    return specs;
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
