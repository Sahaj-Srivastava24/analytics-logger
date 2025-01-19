let interceptedRequests = [];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // If you only care about normal tabs, skip tabId < 0
    if (details.tabId < 0) return;

    interceptedRequests.push({
      tabId: details.tabId,
      url: details.url,
      method: details.method,
      timeStamp: details.timeStamp
    });

    // Keep array size manageable
    if (interceptedRequests.length > 2000) {
      interceptedRequests.shift();
    }
  },
  { urls: ["<all_urls>"] } // or e.g. ["*://*/*"]
);

// Listen for requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getRequestsForTab') {
    const requestedTabId = message.tabId;
    const relevant = interceptedRequests.filter(req => req.tabId === requestedTabId);
    sendResponse({ requests: relevant });
  }
});
