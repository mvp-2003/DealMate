// Local AI Content Classifier
class LocalContentClassifier {
  constructor() {
    this.productPageIndicators = [
      // URL patterns
      { pattern: /\/product\/|\/item\/|\/dp\/|\/gp\/product\//, weight: 0.8, type: 'url' },
      { pattern: /product-detail|productdetail|\/p\/|\/products\//, weight: 0.7, type: 'url' },
      
      // Title patterns
      { pattern: /buy\s+|price\s+|₹|\\$|\d+\.\d+/, weight: 0.6, type: 'title' },
      
      // Content patterns
      { pattern: /add to cart|buy now|purchase|add to bag|shop now/i, weight: 0.9, type: 'content' },
      { pattern: /price|mrp|discount|offer|sale|deal/i, weight: 0.5, type: 'content' },
      
      // Structured data
      { pattern: /"@type":\s*"Product"/i, weight: 0.9, type: 'schema' },
      { pattern: /itemtype.*Product/i, weight: 0.8, type: 'schema' },
      
      // Meta tags
      { pattern: /product|item|merchandise/i, weight: 0.4, type: 'meta' }
    ];

    this.ecommerceIndicators = [
      'add-to-cart', 'buy-now', 'purchase', 'checkout', 'cart', 'price',
      'product-image', 'product-title', 'product-description', 'reviews',
      'rating', 'stars', 'discount', 'offer', 'deal', 'sale'
    ];
  }

  classify(processedContent) {
    let score = 0;
    let maxScore = 0;
    const evidence = [];

    // Check URL patterns
    const url = processedContent.url.toLowerCase();
    this.productPageIndicators.forEach(indicator => {
      if (indicator.type === 'url') {
        maxScore += indicator.weight;
        if (indicator.pattern.test(url)) {
          score += indicator.weight;
          evidence.push(`URL matches ${indicator.pattern}`);
        }
      }
    });

    // Check title patterns
    const title = processedContent.title.toLowerCase();
    this.productPageIndicators.forEach(indicator => {
      if (indicator.type === 'title') {
        maxScore += indicator.weight;
        if (indicator.pattern.test(title)) {
          score += indicator.weight;
          evidence.push(`Title matches ${indicator.pattern}`);
        }
      }
    });

    // Check content patterns
    const fullText = processedContent.textContent.fullText.toLowerCase();
    this.productPageIndicators.forEach(indicator => {
      if (indicator.type === 'content') {
        maxScore += indicator.weight;
        if (indicator.pattern.test(fullText)) {
          score += indicator.weight;
          evidence.push(`Content matches ${indicator.pattern}`);
        }
      }
    });

    // Check structured data
    const hasProductSchema = this.checkStructuredData(processedContent.structuredData);
    if (hasProductSchema.found) {
      score += 0.9;
      evidence.push('Product schema found');
    }
    maxScore += 0.9;

    // Check for e-commerce elements
    const ecommerceScore = this.checkEcommerceElements(processedContent.interactiveElements);
    score += ecommerceScore.score;
    maxScore += ecommerceScore.maxScore;
    evidence.push(...ecommerceScore.evidence);

    // Calculate confidence
    const confidence = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
    const isProduct = confidence > 0.4; // Threshold for product page detection

    console.log(`🤖 Local Classifier: ${isProduct ? 'PRODUCT' : 'NOT PRODUCT'} (confidence: ${confidence.toFixed(2)})`);
    console.log('🤖 Evidence:', evidence);

    return {
      isProduct,
      confidence,
      score,
      maxScore,
      evidence,
      details: {
        urlScore: this.getScoreForType('url', processedContent.url),
        titleScore: this.getScoreForType('title', processedContent.title),
        contentScore: this.getScoreForType('content', fullText),
        schemaScore: hasProductSchema.found ? 0.9 : 0,
        ecommerceScore: ecommerceScore.score
      }
    };
  }

  checkStructuredData(structuredData) {
    // Check JSON-LD for Product schema
    for (const data of structuredData.jsonLd || []) {
      if (typeof data === 'object' && data['@type']) {
        const type = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
        if (type.some(t => t.toLowerCase().includes('product'))) {
          return { found: true, type: 'json-ld', data };
        }
      }
    }

    // Check product schemas
    if (structuredData.productSchemas && structuredData.productSchemas.length > 0) {
      return { found: true, type: 'microdata', data: structuredData.productSchemas };
    }

    // Check Open Graph
    if (structuredData.openGraph && structuredData.openGraph['og:type'] === 'product') {
      return { found: true, type: 'open-graph', data: structuredData.openGraph };
    }

    return { found: false };
  }

  checkEcommerceElements(interactiveElements) {
    let score = 0;
    let maxScore = 0;
    const evidence = [];

    // Check for purchase buttons
    const buttons = interactiveElements.buttons || [];
    buttons.forEach(button => {
      maxScore += 0.3;
      if (button.type === 'purchase' && button.visible) {
        score += 0.3;
        evidence.push(`Purchase button found: "${button.text}"`);
      }
    });

    return { score, maxScore, evidence };
  }

  getScoreForType(type, content) {
    let score = 0;
    let maxScore = 0;

    this.productPageIndicators.forEach(indicator => {
      if (indicator.type === type) {
        maxScore += indicator.weight;
        if (indicator.pattern.test(content.toLowerCase())) {
          score += indicator.weight;
        }
      }
    });

    return maxScore > 0 ? score / maxScore : 0;
  }
}

// Local Product Information Extractor
class LocalProductExtractor {
  constructor() {
    this.pricePatterns = [
      /₹\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /\$\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /INR\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /USD\s*([0-9,]+(?:\.[0-9]{2})?)/g
    ];

    this.discountPatterns = [
      /(\d+)%\s*off/gi,
      /save\s*₹\s*([0-9,]+)/gi,
      /discount\s*of\s*₹\s*([0-9,]+)/gi,
      /(\d+)%\s*discount/gi
    ];

    this.brandPatterns = [
      /brand:\s*([^,\n]+)/gi,
      /by\s+([A-Z][a-zA-Z\s&]+)/g,
      /manufacturer:\s*([^,\n]+)/gi
    ];
  }

  extract(processedContent) {
    console.log('🤖 Local Extractor: Extracting product information...');

    const product = {
      productName: this.extractProductName(processedContent),
      price: this.extractPrice(processedContent),
      originalPrice: this.extractOriginalPrice(processedContent),
      discount: this.extractDiscount(processedContent),
      image: this.extractPrimaryImage(processedContent),
      brand: this.extractBrand(processedContent),
      description: this.extractDescription(processedContent),
      specifications: this.extractSpecifications(processedContent),
      platform: processedContent.hostname,
      url: processedContent.url,
      detected: true
    };

    const deals = this.extractDeals(processedContent);
    
    // Calculate confidence based on completeness
    const confidence = this.calculateExtractionConfidence(product, deals);

    console.log('🤖 Local Extractor: Product extracted with confidence:', confidence);
    console.log('🤖 Product summary:', {
      name: product.productName?.substring(0, 50) + '...',
      price: product.price,
      dealsFound: deals.coupons.length + deals.offers.length
    });

    return {
      product,
      deals,
      confidence
    };
  }

  extractProductName(processedContent) {
    // Priority order for product name extraction
    const sources = [
      // Structured data
      () => this.getFromStructuredData(processedContent.structuredData, ['name', 'title']),
      
      // Meta tags
      () => processedContent.metadata.meta['og:title'] || processedContent.metadata.meta['twitter:title'],
      
      // Page title (cleaned)
      () => this.cleanProductTitle(processedContent.title),
      
      // H1 headings
      () => processedContent.textContent.headings[0],
      
      // Fallback to hostname
      () => `Product from ${processedContent.hostname}`
    ];

    for (const source of sources) {
      const name = source();
      if (name && name.length > 3 && name.length < 200) {
        return this.cleanProductTitle(name);
      }
    }

    return 'Unknown Product';
  }

  cleanProductTitle(title) {
    if (!title) return '';
    
    // Remove common e-commerce suffixes
    const cleaned = title
      .replace(/\s*[-|:]\s*(Amazon|Flipkart|Myntra|Buy Online|Online Shopping|Price|Shop).*$/i, '')
      .replace(/\s*\|\s*.*$/i, '')
      .replace(/Buy\s+online.*$/i, '')
      .replace(/Price.*$/i, '')
      .trim();

    return cleaned || title;
  }

  extractPrice(processedContent) {
    // Try structured data first
    const structuredPrice = this.getFromStructuredData(processedContent.structuredData, ['price', 'lowPrice', 'highPrice']);
    if (structuredPrice) {
      return this.formatPrice(structuredPrice);
    }

    // Extract from text content
    const text = processedContent.textContent.fullText;
    for (const pattern of this.pricePatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Return the most likely price (usually the first significant one)
        const prices = matches.map(m => parseFloat(m[1].replace(/,/g, '')));
        const significantPrices = prices.filter(p => p > 10 && p < 1000000);
        
        if (significantPrices.length > 0) {
          return this.formatPrice(Math.min(...significantPrices)); // Often current price is lowest
        }
      }
    }

    return 'Price not found';
  }

  extractOriginalPrice(processedContent) {
    // Look for struck-through prices or "was" prices
    const text = processedContent.textContent.fullText;
    const wasPattern = /was\s*₹\s*([0-9,]+(?:\.[0-9]{2})?)/gi;
    const match = wasPattern.exec(text);
    
    if (match) {
      return this.formatPrice(match[1]);
    }

    return '';
  }

  extractDiscount(processedContent) {
    const text = processedContent.textContent.fullText;
    
    for (const pattern of this.discountPatterns) {
      const match = pattern.exec(text);
      if (match) {
        return match[0];
      }
    }

    return '';
  }

  extractPrimaryImage(processedContent) {
    const images = processedContent.visualContent.images || [];
    
    if (images.length === 0) return '';

    // Find the largest, most likely product image
    const productImages = images
      .filter(img => img.width > 100 && img.height > 100)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height));

    return productImages[0]?.src || images[0]?.src || '';
  }

  extractBrand(processedContent) {
    // Try structured data first
    const structuredBrand = this.getFromStructuredData(processedContent.structuredData, ['brand']);
    if (structuredBrand) {
      return typeof structuredBrand === 'string' ? structuredBrand : structuredBrand.name;
    }

    // Extract from text
    const text = processedContent.textContent.fullText;
    for (const pattern of this.brandPatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const brand = match[1].trim();
        if (brand.length > 1 && brand.length < 50) {
          return brand;
        }
      }
    }

    return 'Unknown';
  }

  extractDescription(processedContent) {
    // Try structured data first
    const structuredDesc = this.getFromStructuredData(processedContent.structuredData, ['description']);
    if (structuredDesc && structuredDesc.length > 50) {
      return structuredDesc;
    }

    // Try meta description
    const metaDesc = processedContent.metadata.meta.description;
    if (metaDesc && metaDesc.length > 50) {
      return metaDesc;
    }

    // Find longest meaningful paragraph
    const paragraphs = processedContent.textContent.paragraphs || [];
    const description = paragraphs
      .filter(p => p.length > 50 && p.length < 500)
      .sort((a, b) => b.length - a.length)[0];

    return description || 'No description available';
  }

  extractSpecifications(processedContent) {
    // This would be enhanced with more sophisticated extraction
    const specs = {};
    
    // Look for common specification patterns
    const text = processedContent.textContent.fullText;
    const specPatterns = [
      /color:\s*([^,\n]+)/gi,
      /size:\s*([^,\n]+)/gi,
      /weight:\s*([^,\n]+)/gi,
      /material:\s*([^,\n]+)/gi,
      /dimensions:\s*([^,\n]+)/gi
    ];

    specPatterns.forEach(pattern => {
      const match = pattern.exec(text);
      if (match) {
        const key = match[0].split(':')[0].toLowerCase();
        specs[key] = match[1].trim();
      }
    });

    return specs;
  }

  extractDeals(processedContent) {
    const coupons = [];
    const offers = [];
    const text = processedContent.textContent.fullText.toLowerCase();

    // Enhanced coupon detection
    const couponPatterns = [
      /coupon\s*code[:\s]*([A-Z0-9]{3,15})/gi,
      /promo\s*code[:\s]*([A-Z0-9]{3,15})/gi,
      /use\s*code[:\s]*([A-Z0-9]{3,15})/gi,
      /apply\s*code[:\s]*([A-Z0-9]{3,15})/gi
    ];

    couponPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        coupons.push({
          text: match[0],
          type: 'coupon_code',
          value: match[1],
          source: 'ai_extraction'
        });
      });
    });

    // Enhanced offer detection
    const offerPatterns = [
      /(\d+%\s*off)/gi,
      /(flat\s*₹\s*\d+\s*off)/gi,
      /(buy\s*\d+\s*get\s*\d+\s*free)/gi,
      /(free\s*shipping)/gi,
      /(cashback)/gi,
      /(bank\s*offer)/gi,
      /(exchange\s*offer)/gi
    ];

    offerPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        offers.push({
          text: match[0],
          type: this.classifyOfferType(match[0]),
          value: match[0],
          source: 'ai_extraction'
        });
      });
    });

    return { coupons, offers };
  }

  classifyOfferType(offerText) {
    const text = offerText.toLowerCase();
    
    if (text.includes('free shipping')) return 'free_shipping';
    if (text.includes('%')) return 'percentage';
    if (text.includes('₹') || text.includes('$')) return 'flat_discount';
    if (text.includes('cashback')) return 'cashback';
    if (text.includes('bank')) return 'bank_offer';
    if (text.includes('exchange')) return 'exchange';
    if (text.includes('buy') && text.includes('get')) return 'bogo';
    
    return 'general';
  }

  getFromStructuredData(structuredData, keys) {
    // Check JSON-LD first
    for (const data of structuredData.jsonLd || []) {
      for (const key of keys) {
        if (data[key]) {
          return data[key];
        }
      }
    }

    // Check product schemas
    for (const schema of structuredData.productSchemas || []) {
      for (const key of keys) {
        if (schema[key]) {
          return schema[key];
        }
      }
    }

    return null;
  }

  formatPrice(price) {
    if (typeof price === 'number') {
      return `₹${price.toLocaleString('en-IN')}`;
    }
    
    if (typeof price === 'string') {
      const num = parseFloat(price.replace(/[₹$,]/g, ''));
      if (!isNaN(num)) {
        return `₹${num.toLocaleString('en-IN')}`;
      }
    }
    
    return price.toString();
  }

  calculateExtractionConfidence(product, deals) {
    let score = 0;
    let maxScore = 0;

    // Product name confidence
    maxScore += 0.3;
    if (product.productName && product.productName !== 'Unknown Product' && product.productName.length > 5) {
      score += 0.3;
    }

    // Price confidence
    maxScore += 0.25;
    if (product.price && product.price !== 'Price not found') {
      score += 0.25;
    }

    // Image confidence
    maxScore += 0.15;
    if (product.image && product.image.startsWith('http')) {
      score += 0.15;
    }

    // Brand confidence
    maxScore += 0.1;
    if (product.brand && product.brand !== 'Unknown') {
      score += 0.1;
    }

    // Description confidence
    maxScore += 0.1;
    if (product.description && product.description.length > 20 && product.description !== 'No description available') {
      score += 0.1;
    }

    // Deals confidence
    maxScore += 0.1;
    const totalDeals = deals.coupons.length + deals.offers.length;
    if (totalDeals > 0) {
      score += Math.min(totalDeals * 0.02, 0.1);
    }

    return maxScore > 0 ? score / maxScore : 0;
  }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalContentClassifier, LocalProductExtractor };
} else {
  window.LocalContentClassifier = LocalContentClassifier;
  window.LocalProductExtractor = LocalProductExtractor;
}
