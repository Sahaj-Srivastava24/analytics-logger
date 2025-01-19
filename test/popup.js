window.addEventListener('DOMContentLoaded', function() {
  // Ask the background script for the intercepted requests
  chrome.runtime.sendMessage({ type: 'getRequests' }, function(response) {
    if (response && response.requests) {
      const requestsContainer = document.getElementById('requests');
      requestsContainer.innerHTML = '';

      response.requests.forEach(req => {
        const item = document.createElement('div');
        item.textContent = `[${req.method}] ${req.url}`;
        requestsContainer.appendChild(item);
      });
    }
  });
});
