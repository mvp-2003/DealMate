// DealPal Content Script - Enhanced Product & Coupon Detection
console.log('🎯 DealPal: Content script loaded on', window.location.hostname);

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

function injectDealNotification(productData, deals) {
  // Remove existing notification
  const existing = document.getElementById('dealpal-notification');
  if (existing) existing.remove();
  
  // Only show if we found actual deals
  if (deals.coupons.length === 0 && deals.offers.length === 0) return;
  
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
        <strong style="font-size: 14px;">DealPal Found Deals!</strong>
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
  
  console.log('🎯 DealPal: E-commerce site detected, scanning for products and deals...');
  
  try {
    const productData = extractProductInfo();
    const deals = detectCouponsAndOffers();
    
    console.log('🎯 DealPal: Product detected:', productData);
    console.log('🎯 DealPal: Deals found:', deals);
    
    // Validate product data
    if (!productData.productName || productData.productName === 'Unknown Product') {
      console.warn('🎯 DealPal: Could not extract product name properly');
    }
    
    if (!productData.price || productData.price === 'Price not found') {
      console.warn('🎯 DealPal: Could not extract price properly');
    }
    
    // Send to background script with enhanced error handling
    chrome.runtime.sendMessage({
      action: "productDetected",
      data: {
        product: productData,
        deals: deals,
        timestamp: Date.now(),
        url: window.location.href,
        hostname: window.location.hostname
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("🎯 DealPal Error:", chrome.runtime.lastError.message);
        showErrorNotification("Extension connection error");
      } else if (response) {
        console.log("🎯 DealPal: Data sent successfully", response);
        if (response.warning) {
          console.warn("🎯 DealPal Warning:", response.warning);
        }
        if (response.status === 'success') {
          showSuccessNotification(productData, deals);
        }
      } else {
        console.log("🎯 DealPal: No response from background script");
        showInfoNotification("Product detected, but backend unavailable");
      }
    });
    
    // Show notification if deals found, even if backend fails
    if (deals.coupons.length > 0 || deals.offers.length > 0) {
      injectDealNotification(productData, deals);
    } else if (productData.productName !== 'Unknown Product') {
      // Show notification that product was detected but no deals found
      showInfoNotification(`Product detected: ${productData.productName.substring(0, 30)}...`);
    }
    
  } catch (error) {
    console.error('🎯 DealPal: Error in product detection:', error);
    showErrorNotification("Product detection failed");
  }
}

function showSuccessNotification(productData, deals) {
  const dealCount = (deals.coupons?.length || 0) + (deals.offers?.length || 0);
  const message = dealCount > 0 ? 
    `Found ${dealCount} deals for ${productData.productName.substring(0, 30)}...` :
    `Product detected: ${productData.productName.substring(0, 30)}...`;
  console.log(`🎯 DealPal: ${message}`);
}

function showInfoNotification(message) {
  console.log(`🎯 DealPal: ${message}`);
}

function showErrorNotification(message) {
  console.error(`🎯 DealPal: ${message}`);
}

// Enhanced detection with multiple triggers
function initDealPal() {
  console.log('🎯 DealPal: Initializing...');
  detectProductPage();
  
  // Watch for dynamic content changes (SPA navigation)
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldCheck = true;
      }
    });
    
    if (shouldCheck) {
      setTimeout(detectProductPage, 1000); // Debounce
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check when URL changes (for SPAs)
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(detectProductPage, 2000);
    }
  }, 1000);
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
