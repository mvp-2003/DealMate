// This is the service worker for the extension.
// It will handle background tasks, such as listening for messages from content scripts.

const API_BASE_URL = 'http://localhost:8000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProductMetadata") {
    console.log("Product metadata:", request.data);
    
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/deals?product_url=${encodeURIComponent(request.data.url)}`);
        const deals = await response.json();
        
        // Store deals in extension storage
        chrome.storage.local.set({
          currentProduct: request.data,
          deals: deals
        });
        
        sendResponse({ status: "success", deals });
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        sendResponse({ status: "error", error: error.message });
      }
    })();
    
    return true;
  }
});
