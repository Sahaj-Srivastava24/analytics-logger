chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "newEvent") {
    const eventsDiv = document.getElementById("events");
    eventsDiv.textContent += JSON.stringify(message.data, null, 2) + "\n\n";
  }
});
