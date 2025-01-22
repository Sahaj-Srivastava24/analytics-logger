export function loadRequests(tabId, callback) {
  if (tabId == null) return;
  chrome.runtime.sendMessage({ type: 'getRequestsForTab', tabId }, (response) => {
    if (response?.requests) {
      callback(response.requests);
    }
  });
}

export function getSelectedFilter() {
  const radio = document.querySelector('input[name="filterType"]:checked');
  return radio ? radio.value : 'all';
}

export function extractBaseUrl(fullUrl) {
  try {
    const parsed = new URL(fullUrl);
    return parsed.origin + parsed.pathname;
  } catch {
    return fullUrl;
  }
}
