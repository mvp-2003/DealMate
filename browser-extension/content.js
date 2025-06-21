// DealPal Content Script - Enhanced Product & Coupon Detection
console.log('🎯 DealPal: Content script loaded on', window.location.hostname);

const ECOMMERCE_DOMAINS = [
  'amazon.com', 'amazon.in', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com',
  'flipkart.com', 'myntra.com', 'ajio.com', 'nykaa.com', 'shopify.com', 'meesho.com'
];

// Coupon/Deal detection patterns
const COUPON_PATTERNS = [
  /coupon/i, /promo/i, /discount/i, /offer/i, /deal/i, /sale/i,
  /save/i, /off/i, /%\s*off/i, /₹\s*\d+\s*off/i, /\$\s*\d+\s*off/i,
  /free\s*shipping/i, /cashback/i, /reward/i, /bonus/i
];

const DEAL_SELECTORS = [
  '[class*="coupon"]', '[class*="promo"]', '[class*="discount"]', 
  '[class*="offer"]', '[class*="deal"]', '[class*="sale"]',
  '[data-testid*="coupon"]', '[data-testid*="offer"]', '[data-testid*="deal"]',
  '.badge', '.tag', '.label', '[class*="badge"]', '[class*="tag"]'
];

function isEcommerceSite() {
  const hostname = window.location.hostname.toLowerCase();
  return ECOMMERCE_DOMAINS.some(domain => hostname.includes(domain)) ||
         document.querySelector('[data-testid*="add-to-cart"], [class*="add-to-cart"], [id*="add-to-cart"], [class*="buy-now"]') !== null;
}

function extractProductInfo() {
  // Enhanced selectors for different e-commerce sites
  const selectors = {
    title: [
      'h1', '[data-testid*="title"]', '.product-title', '#product-title',
      '[class*="product-name"]', '[class*="title"]', '.pdp-product-name',
      '#feature-bullets h1', '.a-size-large.product-title'
    ],
    price: [
      '[class*="price"]', '[data-testid*="price"]', '.price', '#price',
      '.a-price-whole', '.notranslate', '[class*="current-price"]',
      '.pdp-price', '.selling-price', '[class*="final-price"]'
    ],
    originalPrice: [
      '[class*="original-price"]', '[class*="list-price"]', '[class*="mrp"]',
      '.a-price.a-text-price', '[class*="strike"]', '[class*="crossed"]'
    ],
    image: [
      '[data-testid*="image"]', '.product-image img', '#product-image img',
      '#main-image', '.a-dynamic-image', '.pdp-image img', '[class*="product-img"]'
    ],
    discount: [
      '[class*="discount"]', '[class*="save"]', '[class*="off"]',
      '.percent-off', '.savings', '[class*="deal-price"]'
    ]
  };
  
  const getElement = (selectorArray) => {
    for (const selector of selectorArray) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) return element;
    }
    return null;
  };
  
  const title = getElement(selectors.title)?.textContent?.trim() || 'Unknown Product';
  const price = getElement(selectors.price)?.textContent?.trim() || 'Price not found';
  const originalPrice = getElement(selectors.originalPrice)?.textContent?.trim() || '';
  const discount = getElement(selectors.discount)?.textContent?.trim() || '';
  
  return {
    productName: title,
    price: price,
    originalPrice: originalPrice,
    discount: discount,
    image: getElement(selectors.image)?.src || '',
    platform: window.location.hostname,
    url: window.location.href,
    detected: true
  };
}

function detectCouponsAndOffers() {
  const coupons = [];
  const offers = [];
  
  // Find all elements that might contain coupon/offer information
  DEAL_SELECTORS.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const text = element.textContent.trim();
      if (text && COUPON_PATTERNS.some(pattern => pattern.test(text))) {
        const dealInfo = {
          text: text,
          type: getCouponType(text),
          value: extractValue(text),
          element: element.tagName,
          className: element.className
        };
        
        if (text.toLowerCase().includes('coupon') || text.toLowerCase().includes('code')) {
          coupons.push(dealInfo);
        } else {
          offers.push(dealInfo);
        }
      }
    });
  });
  
  // Look for specific coupon codes in text
  const bodyText = document.body.innerText;
  const codeMatches = bodyText.match(/(?:code|coupon)[\s:]*([A-Z0-9]{4,15})/gi);
  if (codeMatches) {
    codeMatches.forEach(match => {
      coupons.push({
        text: match,
        type: 'coupon_code',
        value: match.match(/[A-Z0-9]{4,15}/)[0],
        source: 'text_detection'
      });
    });
  }
  
  return { coupons, offers };
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
  
  const productData = extractProductInfo();
  const deals = detectCouponsAndOffers();
  
  console.log('🎯 DealPal: Product detected:', productData);
  console.log('🎯 DealPal: Deals found:', deals);
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: "productDetected",
    data: {
      product: productData,
      deals: deals,
      timestamp: Date.now()
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("🎯 DealPal Error:", chrome.runtime.lastError.message);
    } else {
      console.log("🎯 DealPal: Data sent to background script successfully");
    }
  });
  
  // Show notification if deals found
  if (deals.coupons.length > 0 || deals.offers.length > 0) {
    injectDealNotification(productData, deals);
  }
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
