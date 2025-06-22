// DealPal Content Script - AI-Powered Product & Coupon Detection
console.log('🎯 DealPal: Content script loaded on', window.location.hostname);

// Initialize AI services
let aiService = null;
let pythonAIService = null;
let isAIEnabled = true;

// Load AI service modules when DOM is ready
(async function initializeAIServices() {
  try {
    // Initialize local AI service
    aiService = new AIProductDetectionService();
    console.log('🤖 DealPal: Local AI service initialized');
    
    // Initialize Python AI service
    pythonAIService = new PythonAIService();
    console.log('🐍 DealPal: Python AI service initialized');
    
    // Health check for Python AI service
    const health = await pythonAIService.healthCheck();
    if (health) {
      console.log('🐍 Python AI service is available');
    } else {
      console.log('🐍 Python AI service not available - using local AI only');
      pythonAIService.setEnabled(false);
    }
    
    console.log('🎯 DealPal: AI-powered detection enabled');
  } catch (error) {
    console.warn('🎯 DealPal: AI service unavailable, falling back to rule-based detection');
    isAIEnabled = false;
  }
})();

const ECOMMERCE_DOMAINS = [
  'amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.ca', 'amazon.de',
  'flipkart.com', 'myntra.com', 'ajio.com', 'nykaa.com', 'shopify.com', 'meesho.com',
  'ebay.com', 'ebay.in', 'walmart.com', 'target.com', 'bestbuy.com',
  'paytmmall.com', 'snapdeal.com', 'limeroad.com', 'jabong.com', 'koovs.com',
  'tatacliq.com', 'reliancedigital.in', 'croma.com', 'vijaysales.com',
  'bigbasket.com', 'grofers.com', 'swiggy.com', 'zomato.com', 'urbancompany.com'
];

// Coupon/Deal detection patterns - Enhanced
const COUPON_PATTERNS = [
  /coupon/i, /promo/i, /discount/i, /offer/i, /deal/i, /sale/i,
  /save/i, /off/i, /%\s*off/i, /₹\s*\d+\s*off/i, /\$\s*\d+\s*off/i,
  /free\s*shipping/i, /cashback/i, /reward/i, /bonus/i,
  /flat\s*\d+/i, /upto\s*\d+/i, /up\s*to\s*\d+/i, /extra\s*\d+/i,
  /instant\s*discount/i, /bank\s*offer/i, /card\s*offer/i, /exchange\s*offer/i
];

const DEAL_SELECTORS = [
  // Generic coupon/deal selectors
  '[class*="coupon"]', '[class*="promo"]', '[class*="discount"]', 
  '[class*="offer"]', '[class*="deal"]', '[class*="sale"]',
  '[data-testid*="coupon"]', '[data-testid*="offer"]', '[data-testid*="deal"]',
  '.badge', '.tag', '.label', '[class*="badge"]', '[class*="tag"]',
  
  // Amazon specific
  '.priceBlockStrikePriceString', '.a-price-strike', '.apexPriceToPay',
  '.a-badge-text', '.promoPriceBlockMessage', '.reinventPriceAccordionT2',
  
  // Flipkart specific  
  '._3Ay6Sb', '._30jeq3', '._25b18c', '._16Jk6d', '._3xgqrz',
  
  // Myntra specific
  '.discount-percent', '.discount-price', '.product-discountedPrice',
  
  // Generic modern selectors
  '[data-automation-id*="price"]', '[data-automation-id*="discount"]',
  '[aria-label*="discount"]', '[aria-label*="offer"]', '[title*="discount"]'
];

function isEcommerceSite() {
  const hostname = window.location.hostname.toLowerCase();
  const url = window.location.href.toLowerCase();
  
  // Check against known domains
  const isDomainMatch = ECOMMERCE_DOMAINS.some(domain => hostname.includes(domain));
  
  // Check for e-commerce indicators in the page
  const hasEcommerceElements = 
    document.querySelector('[data-testid*="add-to-cart"], [class*="add-to-cart"], [id*="add-to-cart"], [class*="buy-now"]') !== null ||
    document.querySelector('[class*="price"], [data-testid*="price"], #price') !== null ||
    document.querySelector('[class*="product"], [data-testid*="product"]') !== null ||
    document.querySelector('button[class*="cart"], button[id*="cart"]') !== null ||
    document.querySelector('[class*="checkout"], [id*="checkout"]') !== null;
  
  // Check URL patterns
  const hasEcommerceURL = 
    url.includes('/product/') || url.includes('/item/') || 
    url.includes('/dp/') || url.includes('/gp/product/') ||
    url.includes('product-detail') || url.includes('productdetail') ||
    url.includes('/p/') || url.includes('/products/');
  
  const isEcommerce = isDomainMatch || hasEcommerceElements || hasEcommerceURL;
  
  if (isEcommerce) {
    console.log('🎯 DealPal: E-commerce detected -', {
      domain: isDomainMatch,
      elements: hasEcommerceElements,
      url: hasEcommerceURL,
      hostname: hostname
    });
  }
  
  return isEcommerce;
}

function extractProductInfo() {
  // Enhanced selectors for different e-commerce sites
  const selectors = {
    title: [
      // Generic selectors
      'h1', '[data-testid*="title"]', '.product-title', '#product-title',
      '[class*="product-name"]', '[class*="title"]', '.pdp-product-name',
      
      // Amazon specific
      '#feature-bullets h1', '.a-size-large.product-title', '#productTitle',
      '.product-title', '.a-size-large', '.a-size-base-plus',
      
      // Flipkart specific
      '._35KyD6', '.B_NuCI', '._35KyD6.col-12-12', '.yhZ8up .B_NuCI',
      
      // Myntra specific
      '.pdp-product-name', '.pdp-name', '.product-name',
      
      // Generic fallbacks
      '[itemProp="name"]', 'meta[property="og:title"]', 'title'
    ],
    price: [
      // Generic price selectors
      '[class*="price"]', '[data-testid*="price"]', '.price', '#price',
      '.selling-price', '[class*="current-price"]', '[class*="final-price"]',
      
      // Amazon specific
      '.a-price-whole', '.a-price .a-offscreen', '.apexPriceToPay',
      '.a-price-range', '.reinventPricePriceToPayMargin',
      
      // Flipkart specific
      '._25b18c', '._30jeq3 ._16Jk6d', '._1_WHN1',
      
      // Myntra specific
      '.pdp-price', '.product-discountedPrice strong',
      
      // Generic
      '[itemProp="price"]', '.notranslate'
    ],
    originalPrice: [
      // Generic original price
      '[class*="original-price"]', '[class*="list-price"]', '[class*="mrp"]',
      '[class*="strike"]', '[class*="crossed"]', '[class*="was-price"]',
      
      // Amazon specific
      '.a-price.a-text-price', '.priceBlockStrikePriceString',
      '.a-price-strike', '.a-text-strike',
      
      // Flipkart specific  
      '._3I9_wc', '._2Tpdn3', '._3auQ3N',
      
      // Myntra specific
      '.product-price .product-strike'
    ],
    image: [
      // Generic image selectors
      '[data-testid*="image"]', '.product-image img', '#product-image img',
      '[class*="product-img"]', '.product-photo img',
      
      // Amazon specific
      '#main-image', '.a-dynamic-image', '#landingImage',
      '.a-button-thumbnail img', '#altImages img:first-child',
      
      // Flipkart specific
      '._2r_T1I img', '._396cs4 img', '.q6DClP img',
      
      // Myntra specific
      '.pdp-image img', '.image-grid-image',
      
      // Generic
      '[itemProp="image"]', 'meta[property="og:image"]'
    ],
    discount: [
      // Generic discount selectors
      '[class*="discount"]', '[class*="save"]', '[class*="off"]',
      '.percent-off', '.savings', '[class*="deal-price"]',
      '[class*="you-save"]', '[class*="save-amount"]',
      
      // Amazon specific
      '.savingsPercentage', '.reinventPriceSavingsPercentageMargin',
      
      // Flipkart specific
      '._3Ay6Sb', '._2Tpdn3 ._1uv9Cb',
      
      // Myntra specific
      '.discount-percent', '.product-discount'
    ]
  };
  
  const getElement = (selectorArray) => {
    for (const selector of selectorArray) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim()) {
          return element;
        }
        // For meta tags, check content attribute
        if (element && element.getAttribute && element.getAttribute('content')) {
          return {
            textContent: element.getAttribute('content'),
            src: element.getAttribute('content')
          };
        }
      } catch (e) {
        console.debug('🎯 DealPal: Selector error:', selector, e);
      }
    }
    return null;
  };
  
  const getImageSrc = (selectorArray) => {
    for (const selector of selectorArray) {
      try {
        const element = document.querySelector(selector);
        if (element && element.src) {
          return element.src;
        }
        if (element && element.getAttribute && element.getAttribute('content')) {
          return element.getAttribute('content');
        }
      } catch (e) {
        console.debug('🎯 DealPal: Image selector error:', selector, e);
      }
    }
    return '';
  };
  
  const title = getElement(selectors.title)?.textContent?.trim() || 
                document.title?.trim() || 'Unknown Product';
  const price = getElement(selectors.price)?.textContent?.trim() || 'Price not found';
  const originalPrice = getElement(selectors.originalPrice)?.textContent?.trim() || '';
  const discount = getElement(selectors.discount)?.textContent?.trim() || '';
  const image = getImageSrc(selectors.image);
  
  console.log('🎯 DealPal: Extracted product info:', {
    title: title.substring(0, 50) + '...',
    price,
    originalPrice,
    discount,
    hasImage: !!image,
    platform: window.location.hostname
  });
  
  return {
    productName: title,
    price: price,
    originalPrice: originalPrice,
    discount: discount,
    image: image,
    platform: window.location.hostname,
    url: window.location.href,
    detected: true
  };
}

function detectCouponsAndOffers() {
  const coupons = [];
  const offers = [];
  
  console.log('🎯 DealPal: Starting coupon/offer detection...');
  
  // Find all elements that might contain coupon/offer information
  DEAL_SELECTORS.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 200) {
          // Check if text matches coupon patterns
          const matchesPattern = COUPON_PATTERNS.some(pattern => pattern.test(text));
          
          if (matchesPattern) {
            const dealInfo = {
              text: text,
              type: getCouponType(text),
              value: extractValue(text),
              element: element.tagName,
              className: element.className,
              selector: selector
            };
            
            // Categorize as coupon or offer
            if (text.toLowerCase().includes('coupon') || 
                text.toLowerCase().includes('code') || 
                text.toLowerCase().includes('promo')) {
              coupons.push(dealInfo);
            } else {
              offers.push(dealInfo);
            }
            
            console.log('🎯 DealPal: Found deal:', dealInfo);
          }
        }
      });
    } catch (e) {
      console.debug('🎯 DealPal: Selector error:', selector, e);
    }
  });
  
  // Look for specific coupon codes in text content
  try {
    const bodyText = document.body.innerText || '';
    const codeMatches = bodyText.match(/(?:code|coupon)[\s:]*([A-Z0-9]{3,15})/gi);
    if (codeMatches) {
      codeMatches.forEach(match => {
        const codeValue = match.match(/[A-Z0-9]{3,15}/);
        if (codeValue) {
          coupons.push({
            text: match,
            type: 'coupon_code',
            value: codeValue[0],
            source: 'text_detection'
          });
        }
      });
    }
  } catch (e) {
    console.debug('🎯 DealPal: Text analysis error:', e);
  }
  
  // Remove duplicates based on text similarity
  const uniqueCoupons = removeDuplicateDeals(coupons);
  const uniqueOffers = removeDuplicateDeals(offers);
  
  console.log('🎯 DealPal: Detection complete:', {
    coupons: uniqueCoupons.length,
    offers: uniqueOffers.length,
    total: uniqueCoupons.length + uniqueOffers.length
  });
  
  return { 
    coupons: uniqueCoupons, 
    offers: uniqueOffers 
  };
}

function removeDuplicateDeals(deals) {
  const seen = new Set();
  return deals.filter(deal => {
    const key = deal.text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getCouponType(text) {
  if (text.toLowerCase().includes('free shipping')) return 'free_shipping';
  if (text.includes('%')) return 'percentage';
  if (text.includes('₹') || text.includes('$')) return 'flat_discount';
  if (text.toLowerCase().includes('cashback')) return 'cashback';
  if (text.toLowerCase().includes('buy') && text.toLowerCase().includes('get')) return 'bogo';
  return 'general';
}

function extractValue(text) {
  // Extract percentage values
  const percentMatch = text.match(/(\d+)%/);
  if (percentMatch) return `${percentMatch[1]}%`;
  
  // Extract rupee values
  const rupeeMatch = text.match(/₹\s*(\d+)/);
  if (rupeeMatch) return `₹${rupeeMatch[1]}`;
  
  // Extract dollar values
  const dollarMatch = text.match(/\$\s*(\d+)/);
  if (dollarMatch) return `$${dollarMatch[1]}`;
  
  return text.substring(0, 50); // First 50 chars if no specific value found
}

function injectDealNotification(productData, deals, metadata) {
  // Remove existing notification
  const existing = document.getElementById('dealpal-notification');
  if (existing) existing.remove();
  
  // Only show if we found actual deals
  if (deals.coupons.length === 0 && deals.offers.length === 0) return;
  
  const detectionBadge = metadata?.source === 'local-ai' || metadata?.source === 'cloud-ai-enhanced' ? 
    '🤖 AI' : '📋 Rules';
  const confidence = metadata?.confidence ? `${Math.round(metadata.confidence * 100)}%` : '';
  
  const notification = document.createElement('div');
  notification.id = 'dealpal-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 320px;
      font-family: system-ui, -apple-system, sans-serif;
      border: 1px solid rgba(139, 92, 246, 0.3);
      backdrop-filter: blur(10px);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        ">🎯</div>
        <div style="flex: 1;">
          <strong style="font-size: 14px;">DealPal Found Deals!</strong>
          <div style="font-size: 10px; color: #c084fc; margin-top: 2px;">
            ${detectionBadge} Detection ${confidence}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
        ">×</button>
      </div>
      
      ${deals.coupons.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; color: #c084fc; margin-bottom: 4px;">💰 Coupons Found:</div>
          ${deals.coupons.slice(0, 3).map(coupon => `
            <div style="font-size: 11px; background: rgba(139, 92, 246, 0.2); padding: 4px 8px; border-radius: 6px; margin-bottom: 2px;">
              ${coupon.text}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${deals.offers.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; color: #60a5fa; margin-bottom: 4px;">🎁 Offers Found:</div>
          ${deals.offers.slice(0, 2).map(offer => `
            <div style="font-size: 11px; background: rgba(59, 130, 246, 0.2); padding: 4px 8px; border-radius: 6px; margin-bottom: 2px;">
              ${offer.text}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <a href="http://localhost:9002/smart-deals" target="_blank" style="
        display: block;
        background: linear-gradient(45deg, #8b5cf6, #3b82f6);
        color: white;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 6px;
        text-align: center;
        font-size: 12px;
        margin-top: 8px;
      ">View All Deals in DealPal</a>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.getElementById('dealpal-notification')) {
      notification.remove();
    }
  }, 10000);
}

function detectProductPage() {
  if (!isEcommerceSite()) {
    console.log('🎯 DealPal: Not an e-commerce site');
    return;
  }
  
  console.log('🎯 DealPal: E-commerce site detected, starting AI-powered analysis...');
  
  try {
    if (isAIEnabled && aiService && aiService.isInitialized) {
      // Use AI-powered detection
      detectProductWithAI();
    } else {
      // Fallback to rule-based detection
      console.log('🎯 DealPal: Using fallback rule-based detection');
      detectProductLegacy();
    }
  } catch (error) {
    console.error('🎯 DealPal: Error in product detection:', error);
    // Always fallback to legacy detection
    detectProductLegacy();
  }
}

async function detectProductWithAI() {
  console.log('🤖 DealPal: Running AI-powered product detection...');
  
  try {
    // Prepare content for AI analysis
    const pageContent = {
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
      document: document
    };

    // Step 1: Run local AI detection
    const localAIResult = await aiService.detectProduct(pageContent);
    console.log('🤖 Local AI Detection Result:', localAIResult);

    // Step 2: Enhance with Python AI service if available
    let finalResult = localAIResult;
    if (pythonAIService && pythonAIService.enabled) {
      try {
        console.log('🐍 Enhancing with Python AI service...');
        finalResult = await pythonAIService.enhanceProductDetection(pageContent, localAIResult);
        console.log('🐍 Python AI Enhancement Result:', finalResult);
      } catch (error) {
        console.warn('🐍 Python AI enhancement failed, using local result:', error);
        finalResult = localAIResult;
      }
    }

    if (finalResult.isProductPage && finalResult.confidence > 0.5) {
      // AI successfully detected a product
      handleSuccessfulDetection(finalResult.product, finalResult.deals, finalResult);
    } else {
      // AI didn't detect a product with sufficient confidence
      console.log('🤖 AI detection confidence too low, trying legacy detection as backup');
      detectProductLegacy();
    }

  } catch (error) {
    console.error('🤖 AI detection failed:', error);
    // Fallback to legacy detection
    detectProductLegacy();
  }
}

function detectProductLegacy() {
  console.log('🎯 DealPal: Running legacy rule-based detection...');
  
  const productData = extractProductInfo();
  const deals = detectCouponsAndOffers();
  
  console.log('🎯 DealPal: Legacy detection results:', {
    product: productData.productName?.substring(0, 50) + '...',
    deals: deals.coupons.length + deals.offers.length
  });

  handleSuccessfulDetection(productData, deals, {
    source: 'legacy-rules',
    confidence: 0.7, // Default confidence for rule-based detection
    isProductPage: true
  });
}

function handleSuccessfulDetection(productData, deals, metadata) {
  console.log('🎯 DealPal: Product detection successful!');
  console.log('🎯 Product:', productData);
  console.log('🎯 Deals:', deals);
  console.log('🎯 Metadata:', metadata);
  
  // Enhanced validation with better error handling
  const validationIssues = [];
  
  if (!productData.productName || productData.productName === 'Unknown Product') {
    validationIssues.push('product_name');
    console.warn('🎯 DealPal: Could not extract product name properly');
  }
  
  if (!productData.price || productData.price === 'Price not found') {
    validationIssues.push('price');
    console.warn('🎯 DealPal: Could not extract price properly');
  }
  
  // Enhanced data package for backend
  const enhancedData = {
    product: {
      ...productData,
      extractedAt: new Date().toISOString(),
      validationIssues: validationIssues
    },
    deals: {
      ...deals,
      totalCount: (deals.coupons?.length || 0) + (deals.offers?.length || 0)
    },
    metadata: {
      detectionMethod: metadata.source || 'unknown',
      confidence: metadata.confidence || 0.5,
      timestamp: Date.now(),
      url: window.location.href,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      pageLoadTime: performance.now(),
      validationIssues: validationIssues
    },
    context: {
      referrer: document.referrer,
      pageTitle: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
  };
  
  // Send to background script with enhanced error handling
  chrome.runtime.sendMessage({
    action: "productDetected",
    data: enhancedData
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("🎯 DealPal Error:", chrome.runtime.lastError.message);
      showErrorNotification("Extension connection error");
      // Store data locally as fallback
      try {
        localStorage.setItem('dealpal_last_detection', JSON.stringify(enhancedData));
      } catch (e) {
        console.warn('🎯 DealPal: Could not store detection data locally');
      }
    } else if (response) {
      console.log("🎯 DealPal: Data sent successfully", response);
      if (response.warning) {
        console.warn("🎯 DealPal Warning:", response.warning);
      }
      if (response.status === 'success') {
        showSuccessNotification(productData, deals, metadata);
        // Clear any stored fallback data
        try {
          localStorage.removeItem('dealpal_last_detection');
        } catch (e) {}
      }
    } else {
      console.log("🎯 DealPal: No response from background script");
      showInfoNotification("Product detected, but backend unavailable");
    }
  });
  
  // Enhanced notification logic
  const dealCount = (deals.coupons?.length || 0) + (deals.offers?.length || 0);
  const hasValidProduct = productData.productName && productData.productName !== 'Unknown Product';
  
  if (dealCount > 0 && hasValidProduct) {
    injectDealNotification(productData, deals, metadata);
  } else if (hasValidProduct && dealCount === 0) {
    // Show subtle notification for product detection without deals
    showInfoNotification(`Product detected: ${productData.productName.substring(0, 30)}... (No deals found)`);
  } else if (dealCount > 0 && !hasValidProduct) {
    // Show deals even if product name extraction failed
    injectDealNotification({ productName: 'Product', ...productData }, deals, metadata);
  }
  
  // Analytics tracking
  try {
    const analyticsData = {
      event: 'product_detected',
      platform: window.location.hostname,
      hasDeals: dealCount > 0,
      dealCount: dealCount,
      confidence: metadata.confidence,
      detectionMethod: metadata.source,
      validationIssues: validationIssues.length
    };
    console.log('📊 DealPal Analytics:', analyticsData);
  } catch (e) {
    console.warn('📊 Analytics tracking failed:', e);
  }
}

function showSuccessNotification(productData, deals, metadata) {
  const dealCount = (deals.coupons?.length || 0) + (deals.offers?.length || 0);
  const detectionType = metadata.source === 'local-ai' || metadata.source === 'cloud-ai-enhanced' ? '🤖 AI' : '📋 Rules';
  
  const message = dealCount > 0 ? 
    `${detectionType} found ${dealCount} deals for ${productData.productName.substring(0, 30)}...` :
    `${detectionType} detected: ${productData.productName.substring(0, 30)}...`;
    
  console.log(`🎯 DealPal: ${message}`);
}

function showInfoNotification(message) {
  console.log(`🎯 DealPal: ${message}`);
}

function showErrorNotification(message) {
  console.error(`🎯 DealPal: ${message}`);
}

// Enhanced detection with AI and multiple triggers
function initDealPal() {
  console.log('🎯 DealPal: Initializing with enhanced AI capabilities...');
  
  // Initialize AI service
  if (isAIEnabled) {
    try {
      aiService = new AIProductDetectionService();
      console.log('🤖 DealPal: AI service initialized');
    } catch (error) {
      console.warn('🤖 DealPal: AI service failed to initialize, using fallback:', error);
      isAIEnabled = false;
    }
  }
  
  // Run initial detection with delay for page load
  setTimeout(() => {
    detectProductPage();
  }, 1500);
  
  // Enhanced mutation observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    let significantChange = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if significant content was added
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (element.querySelector && (
              element.querySelector('[class*="price"]') ||
              element.querySelector('[class*="product"]') ||
              element.querySelector('[class*="deal"]') ||
              element.querySelector('[class*="offer"]')
            )) {
              significantChange = true;
              break;
            }
          }
        }
        shouldCheck = true;
      }
    });
    
    if (shouldCheck) {
      const delay = significantChange ? 500 : 2000; // Faster for significant changes
      setTimeout(detectProductPage, delay);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false, // Reduce noise
    characterData: false
  });
  
  // Enhanced URL change detection
  let currentUrl = window.location.href;
  let urlCheckInterval = setInterval(() => {
    if (window.location.href !== currentUrl) {
      const oldUrl = currentUrl;
      currentUrl = window.location.href;
      console.log('🎯 DealPal: URL changed from', oldUrl.substring(0, 50), 'to', currentUrl.substring(0, 50));
      
      // Clear any existing notifications
      const existing = document.getElementById('dealpal-notification');
      if (existing) existing.remove();
      
      // Re-analyze with appropriate delay
      setTimeout(detectProductPage, 2500);
    }
  }, 1000);

  // Performance monitoring and cleanup
  if (isAIEnabled && aiService) {
    setInterval(() => {
      const metrics = aiService.getMetrics();
      if (metrics.totalDetections > 0) {
        console.log('🤖 DealPal AI Metrics:', {
          detections: metrics.totalDetections,
          accuracy: metrics.accuracy,
          avgProcessingTime: metrics.avgProcessingTime
        });
      }
    }, 60000); // Every minute
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (urlCheckInterval) clearInterval(urlCheckInterval);
    if (observer) observer.disconnect();
  });
  
  // Enhanced error handling
  window.addEventListener('error', (e) => {
    if (e.error && e.error.message && e.error.message.includes('DealPal')) {
      console.error('🎯 DealPal Error:', e.error);
      // Attempt to reinitialize if critical error
      if (e.error.message.includes('AI service')) {
        isAIEnabled = false;
        console.log('🎯 DealPal: Falling back to rule-based detection');
      }
    }
  });
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'rescan') {
    console.log('🎯 DealPal: Popup requested rescan');
    detectProductPage();
    sendResponse({ success: true });
  }
  return true;
});

// Enhanced error handling for extension messaging
window.addEventListener('error', (e) => {
  console.error('🎯 DealPal Content Script Error:', e.error);
});

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDealPal);
} else {
  initDealPal();
}

console.log('🎯 DealPal: Content script fully loaded and ready');
