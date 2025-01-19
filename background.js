chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes("/c/events")) {
      const eventData = {
        url: details.url,
        method: details.method,
        body: details.requestBody
      };
      console.log("Intercepted Event:", eventData);

      // Send data to the popup
      chrome.runtime.sendMessage({ type: "newEvent", data: eventData });
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);
