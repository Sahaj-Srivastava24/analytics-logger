// Storing Requests, in case of scaling up, we can store in a database
let interceptedRequests = [];

// Toggle this as you like
let clearOnRefresh = false;

const relevantPatterns = [
  "securepubads.g.doubleclick.net/gampad/ads",
  "googleads.g.doubleclick.net/pagead/ads",
  "/c/events",
];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { url, method, timeStamp, requestBody, tabId } = details;

    // If it's not a valid tab (e.g., tabId < 0 => background page, etc.)
    if (tabId < 0) return;

    // Filter out anything that's not in our relevant patterns
    if (!relevantPatterns.some(pattern => url.includes(pattern))) {
      return;
    }

    // console.log("onBeforeRequest", details);

    let bodyText = null;
    if (method === "POST" && requestBody) {
      if (requestBody.formData) {
        bodyText = JSON.stringify(requestBody.formData);
      } else if (requestBody.raw && requestBody.raw.length > 0) {
        try {
          const decoder = new TextDecoder("utf-8");
          bodyText = decoder.decode(requestBody.raw[0].bytes);
        } catch (err) {
          bodyText = null;
        }
      }
    }

    let eventName = null;
    // Only parse the event name if the URL has /c/events
    if (url.includes("/c/events")) {
      if (method === "GET") {
        try {
          const parsedUrl = new URL(url);
          eventName = parsedUrl.searchParams.get("event") || null;
        } catch (err) {
          // ignore parse errors
        }
      } else if (method === "POST" && bodyText) {
        try {
          const maybeObj = JSON.parse(bodyText);
          if (maybeObj.event) {
            eventName = maybeObj.event;
          }
        } catch (err) {
          // For formData scenario
          try {
            const formDataObj = JSON.parse(bodyText);
            if (formDataObj.event && Array.isArray(formDataObj.event)) {
              eventName = formDataObj.event[0];
            }
          } catch (_) {
            console.error("Error parsing event name", err);
          }
        }
      }
    }

    interceptedRequests.push({
      tabId,
      url,
      method,
      timeStamp,
      eventName,
      bodyText,
    });

    // Keep memory small if there's too many
    if (interceptedRequests.length > 2000) {
      interceptedRequests.shift();
    }
  },
  { urls: ["<all_urls>"] },

  ["requestBody"]
);

// Listen for tab reloads to optionally clear requests for that tab
chrome.webNavigation.onCommitted.addListener((details) => {
  // onCommitted fires for any navigation, including reloads.
  // We'll specifically check if it's the top-level frame and a reload transition.
  if (details.frameId === 0 && details.transitionType === "reload") {
    if (clearOnRefresh) {
      console.log(`Clearing requests for tab ${details.tabId} due to reload`);
      interceptedRequests = interceptedRequests.filter(
        (req) => req.tabId !== details.tabId
      );
    }
  }
});

// Listen for requests from panel.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getRequestsForTab") {
    const relevant = interceptedRequests.filter(
      (req) => req.tabId === message.tabId
    );

    // console.log("Intercepted requests for tab:", relevant);
    sendResponse({ requests: relevant });
  }
});
