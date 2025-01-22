// Storing Requests, in case of scaling up, we can store in a database
let interceptedRequests = [];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;

    const { url, method, timeStamp, requestBody } = details;

    // Analytical SDK V2 uses post requests, so a separate snippet for post requests
    // ** not sure how long would this work **
    let bodyText = null;
    if (method === 'POST' && requestBody) {
      if (requestBody.formData) {
        bodyText = JSON.stringify(requestBody.formData);
      } else if (requestBody.raw && requestBody.raw.length > 0) {
        try {
          const decoder = new TextDecoder('utf-8');
          bodyText = decoder.decode(requestBody.raw[0].bytes);
        } catch (err) {
          bodyText = null;
        }
      }
    }

    let eventName = null;
    if (url.includes('/c/events')) {
      if (method === 'GET') {
        try {
          const parsedUrl = new URL(url);
          eventName = parsedUrl.searchParams.get('event') || null;
        } catch (err) {}
      } else if (method === 'POST' && bodyText) {
        try {
          const maybeObj = JSON.parse(bodyText);
          if (maybeObj.event) {
            eventName = maybeObj.event;
          }
        } catch (err) {
          try {
            const formDataObj = JSON.parse(bodyText);
            if (formDataObj.event && Array.isArray(formDataObj.event)) {
              eventName = formDataObj.event[0];
            }
          } catch (_) {
            console.log('Error parsing event name', err);
          }
        }
      }
    }

    interceptedRequests.push({
      tabId: details.tabId,
      url,
      method,
      timeStamp,
      eventName,
      bodyText
    });

    if (interceptedRequests.length > 2000) {
      interceptedRequests.shift();
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getRequestsForTab') {
    const relevant = interceptedRequests.filter(req => req.tabId === message.tabId);
    sendResponse({ requests: relevant });
  }
});
