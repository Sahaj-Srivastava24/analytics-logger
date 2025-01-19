chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.url.includes("/c/events")) {
      const eventData = {
        url: details.url,
        method: details.method,
        statusCode: details.statusCode,
        timeStamp: details.timeStamp
      };

      console.log("Intercepted Event:", eventData);

      // Store captured events in local storage
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ events: [] }, function (result) {
          const updatedEvents = [...result.events, eventData];
          chrome.storage.local.set({ events: updatedEvents }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error saving event data:", chrome.runtime.lastError);
            } else {
              console.log("Event saved successfully!");
            }
          });
        });
      } else {
        console.error("chrome.storage API is not available.");
      }
    }
  },
  { urls: ["<all_urls>"] }
);
