// We'll store each request in memory
let interceptedRequests = [];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // If it's not from a normal tab, skip
    if (details.tabId < 0) return;

    const { url, method, timeStamp, requestBody } = details;

    // Attempt to capture body as a string (if allowed)
    let bodyText = null;
    if (method === 'POST' && requestBody) {
      if (requestBody.formData) {
        // e.g. formData: { event: ["someEvent"], foo: ["bar"] }
        // Convert it to a JSON-like string for display
        // Or just store the event field if that's all you need
        bodyText = JSON.stringify(requestBody.formData);
      } else if (requestBody.raw && requestBody.raw.length > 0) {
        // Try to decode the raw bytes
        try {
          const decoder = new TextDecoder('utf-8');
          bodyText = decoder.decode(requestBody.raw[0].bytes);
        } catch (err) {
          // parse failed
          bodyText = null;
        }
      }
    }

    // Attempt to parse an eventName for collector events (GET or POST)
    let eventName = null;
    if (url.includes('/c/events')) {
      if (method === 'GET') {
        try {
          const parsedUrl = new URL(url);
          eventName = parsedUrl.searchParams.get('event') || null;
        } catch (err) {
          // ignore
        }
      } else if (method === 'POST' && bodyText) {
        // Possibly parse the JSON or form data for an 'event' field
        try {
          // If it's JSON, parse it
          const maybeObj = JSON.parse(bodyText);
          if (maybeObj.event) {
            eventName = maybeObj.event;
          }
        } catch (err) {
          // If not valid JSON, see if it's formData JSON
          // e.g. bodyText might look like {"event":["myEventName"],"foo":["bar"]}
          try {
            const formDataObj = JSON.parse(bodyText);
            if (formDataObj.event && Array.isArray(formDataObj.event)) {
              eventName = formDataObj.event[0];
            }
          } catch (_) {
            // no luck
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
      bodyText // may be null if not a POST or not captured
    });

    // Keep memory usage in check
    if (interceptedRequests.length > 2000) {
      interceptedRequests.shift();
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"] // Attempt to observe the request body
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getRequestsForTab') {
    const requestedTabId = message.tabId;
    const relevant = interceptedRequests.filter(req => req.tabId === requestedTabId);
    sendResponse({ requests: relevant });
  }
});
