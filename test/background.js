// We'll store our intercepted request info in an array.
let interceptedRequests = [];

// Use the onBeforeRequest event to catch requests before they are sent.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Collect only the data you need to display in the popup.
    // You might want to also collect headers, requestBody, etc.
    interceptedRequests.push({
      url: details.url,
      method: details.method,
      timeStamp: details.timeStamp
    });

    // For memory reasons, you may want to limit how many requests you keep
    if (interceptedRequests.length > 1000) {
      interceptedRequests.shift(); // remove the oldest
    }
  },
  { urls: ["<all_urls>"] } // Match any URL
  // ,["requestBody"]        // You can also request to see the requestBody if needed
);

// Listen for messages from the popup to retrieve the current list of requests.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getRequests') {
    sendResponse({ requests: interceptedRequests });
  }
});
