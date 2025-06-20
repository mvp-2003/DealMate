// This script runs on every page and is responsible for detecting product pages.

// For now, we'll just log a message to the console when the script is injected.
console.log("DealPal content script injected.");

// In a real extension, you would add logic here to detect if the current page
// is a product page on a supported e-commerce site. If it is, you would
// extract the product metadata and send it to the background script.

// Example of how you might send a message to the background script:
// chrome.runtime.sendMessage({
//   action: "getProductMetadata",
//   data: {
//     productName: "Example Product",
//     price: 99.99,
//     platform: "example.com",
//   },
// });
