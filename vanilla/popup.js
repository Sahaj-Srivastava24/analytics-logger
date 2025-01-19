document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get("events", function (result) {
    const eventsDiv = document.getElementById("events");
    if (result.events && result.events.length > 0) {
      eventsDiv.textContent = result.events
        .map(event => `URL: ${event.url}\nMethod: ${event.method}\nStatus: ${event.statusCode}\n\n`)
        .join("");
    } else {
      eventsDiv.textContent = "No events captured yet.";
    }
  });
});
