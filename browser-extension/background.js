// DealPal Background Script - Enhanced Data Processing
console.log('🎯 DealPal: Background script loaded');

const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:9002';

// Store recent product detections
let recentProducts = [];
let recentDeals = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎯 DealPal Background: Received message', request.action);
  
  if (request.action === "productDetected") {
    handleProductDetection(request.data, sender, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "getRecentProducts") {
    sendResponse({ products: recentProducts, deals: Object.fromEntries(recentDeals) });
    return false;
  }
});

async function handleProductDetection(data, sender, sendResponse) {
  try {
    const { product, deals, timestamp } = data;
    
    // Store product info
    const productInfo = {
      ...product,
      timestamp,
      tabId: sender.tab?.id,
      deals: deals
    };
    
    // Add to recent products (keep last 10)
    recentProducts.unshift(productInfo);
    if (recentProducts.length > 10) {
      recentProducts = recentProducts.slice(0, 10);
    }
    
    // Store deals for this product
    recentDeals.set(product.url, deals);
    
    // Save to Chrome storage
    chrome.storage.local.set({
      currentProduct: productInfo,
      recentProducts: recentProducts,
      lastUpdate: timestamp
    });
    
    // Try to send data to backend API
    try {
      const response = await fetch(`${API_BASE_URL}/api/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: product,
          deals: deals,
          timestamp: timestamp
        })
      });
      
      if (response.ok) {
        const apiResponse = await response.json();
        console.log('🎯 DealPal: Data sent to backend successfully', apiResponse);
        
        sendResponse({ 
          status: "success", 
          message: "Product and deals detected successfully",
          data: apiResponse 
        });
      } else {
        throw new Error(`API response: ${response.status}`);
      }
    } catch (apiError) {
      console.warn('🎯 DealPal: Backend API not available, storing locally', apiError);
      
      // Even if API fails, we still detected deals successfully
      sendResponse({ 
        status: "success", 
        message: "Deals detected and stored locally",
        warning: "Backend API unavailable"
      });
    }
    
    // Update badge with deal count
    const dealCount = (deals.coupons?.length || 0) + (deals.offers?.length || 0);
    if (dealCount > 0) {
      chrome.action.setBadgeText({
        text: dealCount.toString(),
        tabId: sender.tab?.id
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#8b5cf6',
        tabId: sender.tab?.id
      });
    }
    
  } catch (error) {
    console.error('🎯 DealPal Background Error:', error);
    sendResponse({ 
      status: "error", 
      error: error.message 
    });
  }
}

// Clear badge when tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open DealPal dashboard
  chrome.tabs.create({ url: `${FRONTEND_URL}/smart-deals` });
});

console.log('🎯 DealPal: Background script ready');
