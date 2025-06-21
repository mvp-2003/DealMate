const ECOMMERCE_DOMAINS = [
  'amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com',
  'flipkart.com', 'myntra.com', 'ajio.com', 'nykaa.com', 'shopify.com'
];

function isEcommerceSite() {
  const hostname = window.location.hostname.toLowerCase();
  return ECOMMERCE_DOMAINS.some(domain => hostname.includes(domain)) ||
         document.querySelector('[data-testid*="add-to-cart"], [class*="add-to-cart"], [id*="add-to-cart"]') !== null;
}

function extractProductInfo() {
  const selectors = {
    title: ['h1', '[data-testid*="title"]', '.product-title', '#product-title'],
    price: ['[class*="price"]', '[data-testid*="price"]', '.price', '#price'],
    image: ['[data-testid*="image"]', '.product-image img', '#product-image img']
  };
  
  const getElement = (selectorArray) => {
    for (const selector of selectorArray) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  };
  
  return {
    productName: getElement(selectors.title)?.textContent?.trim() || 'Unknown Product',
    price: getElement(selectors.price)?.textContent?.trim() || 'Price not found',
    image: getElement(selectors.image)?.src || '',
    platform: window.location.hostname,
    url: window.location.href
  };
}

function detectProductPage() {
  if (isEcommerceSite()) {
    const productData = extractProductInfo();
    
    chrome.runtime.sendMessage({
      action: "getProductMetadata",
      data: productData,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else if (response && response.status === "success") {
        console.log("Successfully sent product metadata to the background script.");
      }
    });
  }
}

// Run the detection logic when the page has finished loading.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectProductPage);
} else {
  detectProductPage();
}
