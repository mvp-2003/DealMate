// DealMate Background Script - Enhanced Data Processing
console.log('🎯 DealMate: Background script loaded');

const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:9002';

// Store recent product detections
let recentProducts = [];
let recentDeals = new Map();
let contextMenusCreated = false;

// Setup context menus on install
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

function setupContextMenus() {
  if (contextMenusCreated) return;
  
  try {
    // Remove existing menus first
    chrome.contextMenus.removeAll(() => {
      // Create DealMate context menus
      chrome.contextMenus.create({
        id: 'dealmate-main',
        title: 'DealMate',
        contexts: ['selection', 'link', 'page']
      });
      
      chrome.contextMenus.create({
        id: 'dealmate-check-deals',
        parentId: 'dealmate-main',
        title: 'Check deals for "%s"',
        contexts: ['selection']
      });
      
      chrome.contextMenus.create({
        id: 'dealmate-add-to-watchlist',
        parentId: 'dealmate-main',
        title: 'Add to watchlist',
        contexts: ['link', 'page']
      });
      
      chrome.contextMenus.create({
        id: 'dealmate-compare-prices',
        parentId: 'dealmate-main',
        title: 'Compare prices',
        contexts: ['link', 'page']
      });
      
      chrome.contextMenus.create({
        id: 'dealmate-test-coupons',
        parentId: 'dealmate-main',
        title: 'Test available coupons',
        contexts: ['page']
      });
      
      contextMenusCreated = true;
      console.log('🎯 DealMate: Context menus created');
    });
  } catch (error) {
    console.error('🎯 DealMate: Context menu error:', error);
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('🎯 DealMate: Context menu clicked:', info.menuItemId);
  
  // Send message to content script to handle the action
  chrome.tabs.sendMessage(tab.id, {
    action: 'contextMenuClicked',
    menuItemId: info.menuItemId,
    selectionText: info.selectionText,
    linkUrl: info.linkUrl,
    pageUrl: info.pageUrl
  });
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
    
    // Try to send data to backend API with proper error handling
    try {
      console.log('🎯 DealMate: Sending data to backend API...');
      
      const requestBody = {
        product: {
          productName: product.productName,
          price: product.price,
          originalPrice: product.originalPrice || '',
          discount: product.discount || '',
          image: product.image || '',
          platform: product.platform,
          url: product.url
        },
        deals: {
          coupons: deals.coupons.map(coupon => ({
            text: coupon.text,
            type: coupon.type || 'general',
            value: coupon.value || coupon.text
          })),
          offers: deals.offers.map(offer => ({
            text: offer.text,
            type: offer.type || 'general', 
            value: offer.value || offer.text
          }))
        },
        timestamp: timestamp
      };
      
      console.log('🎯 DealMate: Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/api/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🎯 DealMate: API response status:', response.status);
      
      if (response.ok) {
        const apiResponse = await response.json();
        console.log('🎯 DealMate: Data sent to backend successfully', apiResponse);
        
        sendResponse({ 
          status: "success", 
          message: "Product and deals detected successfully",
          data: apiResponse 
        });
      } else {
        const errorText = await response.text();
        console.error('🎯 DealMate: API error response:', errorText);
        throw new Error(`API response: ${response.status} - ${errorText}`);
      }
    } catch (apiError) {
      console.warn('🎯 DealMate: Backend API error:', apiError.message);
      
      // Even if API fails, we still detected deals successfully
      sendResponse({ 
        status: "success", 
        message: "Deals detected and stored locally",
        warning: `Backend API unavailable: ${apiError.message}`
      });
    }
    
    // Update badge with deal count
    const dealCount = (deals.coupons?.length || 0) + (deals.offers?.length || 0);
    if (dealCount > 0 && sender.tab?.id) {
      try {
        chrome.action.setBadgeText({
          text: dealCount.toString(),
          tabId: sender.tab.id
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#8b5cf6',
          tabId: sender.tab.id
        });
      } catch (badgeError) {
        console.warn('🎯 DealMate: Badge update failed:', badgeError);
      }
    }
    
  } catch (error) {
    console.error('🎯 DealMate Background Error:', error);
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
  // Open DealMate dashboard
  chrome.tabs.create({ url: `${FRONTEND_URL}/smart-deals` });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎯 DealMate Background: Received message', request.action);
  
  if (request.action === "productDetected") {
    handleProductDetection(request.data, sender, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "getRecentProducts") {
    sendResponse({ products: recentProducts, deals: Object.fromEntries(recentDeals) });
    return false;
  }
  
  if (request.action === "setupContextMenus") {
    setupContextMenus();
    sendResponse({ success: true });
    return false;
  }
  
  if (request.action === "openPopup") {
    // Open popup programmatically
    chrome.action.openPopup();
    return false;
  }
  
  if (request.action === "getCoupons") {
    // Get available coupons for current tab
    getCouponsForTab(sender.tab?.id, sendResponse);
    return true;
  }
  
  if (request.action === "searchDeals") {
    // Search for deals based on query
    searchDeals(request.query, sendResponse);
    return true;
  }
});

console.log('🎯 DealMate: Background script ready');
