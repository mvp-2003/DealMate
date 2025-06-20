// This is the service worker for the extension.
// It will handle background tasks, such as listening for messages from content scripts.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProductMetadata") {
    // In a real extension, you would make an API call to your backend here.
    // For now, we'll just log the metadata to the console.
    console.log("Product metadata:", request.data);
    sendResponse({ status: "success" });
  }
});
