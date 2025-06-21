// This is the service worker for the extension.
// It will handle background tasks, such as listening for messages from content scripts.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProductMetadata") {
    // In a real extension, you would make an API call to your backend here.
    // For now, we'll just log the metadata to the console.
    console.log("Product metadata:", request.data);
    // To make the sendResponse function asynchronous, you need to return true.
    (async () => {
      // Simulate an async operation, e.g., fetching from a backend
      await new Promise(resolve => setTimeout(resolve, 100));
      sendResponse({ status: "success" });
    })();
    return true; // Keep the message channel open for the async response
  }
});
