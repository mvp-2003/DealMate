// This script runs on every page and is responsible for detecting product pages.

function detectProductPage() {
  // In a real extension, you would add logic here to detect if the current page
  // is a product page on a supported e-commerce site.
  // For now, we'll simulate detecting a product page.
  const isProductPage = document.querySelector('h1') !== null;

  if (isProductPage) {
    const productData = {
      productName: document.querySelector('h1').innerText,
      price: Math.floor(Math.random() * 1000) + 100, // Simulate a random price
      platform: window.location.hostname,
    };

    chrome.runtime.sendMessage({
      action: "getProductMetadata",
      data: productData,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else if (response && response.status === "success") {
        console.log("Successfully sent product metadata to the background script.");
      } else {
        console.warn("Received an unexpected response from the background script.");
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
