// DealMate Popup Script - Enhanced functionality
console.log('🎯 DealMate Popup: Script loaded');

// Import the animated loader
// Note: In a real extension, this would be loaded via manifest.json
if (typeof window.DealMateLoader === 'undefined') {
  // Fallback loader implementation
  window.DealMateLoader = {
    showLoaderInElement: function(elementId, type, size) {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = `<div style="text-align: center; padding: 20px; color: #a855f7;">
          <div style="display: inline-block; animation: spin 1s linear infinite;">🔄</div>
          <div style="margin-top: 8px; font-size: 14px;">Loading ${type}...</div>
        </div>`;
      }
    },
    hideLoader: function(elementId, content) {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = content || '';
      }
    }
  };
}

let currentProduct = null;
let detectedDeals = null;

function updateStatus(message, type = 'info', showLoader = false) {
  const statusElement = document.getElementById('detection-status');
  if (statusElement) {
    if (showLoader) {
      window.DealMateLoader.showLoaderInElement('detection-status', 'deals', 'sm');
    } else {
      statusElement.textContent = message;
      statusElement.style.color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#e2e8f0';
    }
  }
}

function showDeals(deals) {
  const dealsElement = document.getElementById('deals-found');
  if (!dealsElement) return;
  
  if (!deals || (!deals.coupons?.length && !deals.offers?.length)) {
    dealsElement.style.display = 'none';
    return;
  }
  
  let html = '';
  if (deals.coupons?.length > 0) {
    html += `<div style="font-size: 11px; color: #c084fc; margin-bottom: 4px;">💰 ${deals.coupons.length} Coupon(s)</div>`;
  }
  if (deals.offers?.length > 0) {
    html += `<div style="font-size: 11px; color: #60a5fa;">🎁 ${deals.offers.length} Offer(s)</div>`;
  }
  
  dealsElement.innerHTML = html;
  dealsElement.style.display = 'block';
}

function loadCurrentProduct() {
  chrome.storage.local.get(['currentProduct', 'lastUpdate'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('🎯 DealMate Popup: Storage error:', chrome.runtime.lastError);
      updateStatus('Error loading data', 'error');
      return;
    }
    
    if (result.currentProduct) {
      currentProduct = result.currentProduct;
      const timeDiff = Date.now() - (result.lastUpdate || 0);
      const metadata = currentProduct.metadata || {};
      
      // Show detection method
      const detectionBadge = metadata.detectionMethod === 'local-ai' || metadata.detectionMethod === 'cloud-ai-enhanced' ? 
        '🤖 AI' : '📋 Rules';
      const confidence = metadata.confidence ? ` (${Math.round(metadata.confidence * 100)}%)` : '';
      
      if (timeDiff < 30000) { // Within last 30 seconds
        updateStatus(`${detectionBadge}${confidence}: ${currentProduct.productName.substring(0, 25)}...`, 'success');
        showDeals(currentProduct.deals);
      } else {
        updateStatus(`${detectionBadge}: Product detected (scan may be outdated)`);
        showDeals(currentProduct.deals);
      }
    } else {
      // Check if we're on a supported site
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          const hostname = new URL(tabs[0].url).hostname.toLowerCase();
          const supportedSites = [
            'amazon.com', 'amazon.in', 'flipkart.com', 'myntra.com', 
            'ajio.com', 'nykaa.com', 'ebay.com', 'walmart.com', 'target.com'
          ];
          
          const isSupported = supportedSites.some(site => hostname.includes(site));
          
          if (isSupported) {
            updateStatus('🤖 AI ready - click refresh to scan');
          } else {
            updateStatus('Visit any e-commerce site to start');
          }
        } else {
          updateStatus('No product detected on current page');
        }
      });
    }
  });
}

function refreshScan() {
  updateStatus('Refreshing scan...');
  
  // Send message to content script to re-scan
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('🎯 DealMate Popup: Tab query error:', chrome.runtime.lastError);
      updateStatus('Unable to access current tab', 'error');
      return;
    }
    
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'rescan'}, (response) => {
        if (chrome.runtime.lastError) {
          console.error('🎯 DealMate Popup: Message error:', chrome.runtime.lastError);
          updateStatus('Unable to scan this page', 'error');
        } else {
          console.log('🎯 DealMate Popup: Rescan requested successfully');
          setTimeout(loadCurrentProduct, 2000);
        }
      });
    }
  });
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 DealMate Popup: DOM loaded');
  
  // Event listeners
  const refreshButton = document.getElementById('refresh-scan');
  if (refreshButton) {
    refreshButton.addEventListener('click', refreshScan);
  }
  
  // Listen for real-time updates
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.currentProduct) {
      currentProduct = changes.currentProduct.newValue;
      if (currentProduct) {
        updateStatus(`New: ${currentProduct.productName.substring(0, 30)}...`, 'success');
        showDeals(currentProduct.deals);
      }
    }
  });
  
  // Auto-load on popup open
  loadCurrentProduct();
  
  // Auto-refresh status
  setTimeout(() => {
    if (!currentProduct) {
      updateStatus('DealMate is ready! Visit any e-commerce site.');
    }
  }, 3000);
});

// Handle popup errors
window.addEventListener('error', (e) => {
  console.error('🎯 DealMate Popup Error:', e.error);
  updateStatus('Popup error occurred', 'error');
});

console.log('🎯 DealMate Popup: Script ready');