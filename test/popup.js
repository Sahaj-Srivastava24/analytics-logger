/***** popup.js *****/

// We'll store all requests from the background
let allRequests = [];
// We'll track the current tab ID
let currentTabId = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Find the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) return;
    currentTabId = tabs[0].id;

    // 2. Initially load requests for this tab
    loadRequests();
  });

  // 3. Listen to radio-filter changes (All / Collector / Ads)
  const radios = document.querySelectorAll('input[name="filterType"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', renderTable);
  });

  // 4. Refresh button to re-fetch new requests
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadRequests);
  }

  // 5. Close the detail panel
  document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('query-details').style.display = 'none';
  });
});

// Fetch requests from the background script for the current tab
function loadRequests() {
  if (currentTabId == null) return;
  chrome.runtime.sendMessage({ type: 'getRequestsForTab', tabId: currentTabId }, (response) => {
    if (response && response.requests) {
      allRequests = response.requests;
      renderTable();
    }
  });
}

// Build the table based on the selected filter
function renderTable() {
  const selectedFilter = getSelectedFilter(); // "all", "collector", or "ads"
  const tableBody = document.getElementById('requests-body');
  tableBody.innerHTML = '';

  // Adjust the middle column header text (optional)
  const middleHeader = document.getElementById('middle-col-header');
  if (selectedFilter === 'collector') {
    middleHeader.textContent = 'Event Name (POST shows eventName)';
  } else if (selectedFilter === 'ads') {
    middleHeader.textContent = 'Base URL (POST shows eventName if any)';
  } else {
    middleHeader.textContent = 'Base URL / Event Name';
  }

  // Filter our stored requests
  const filtered = allRequests.filter((req) => {
    const url = req.url.toLowerCase();
    const isCollector = url.includes('/c/events');
    const isAds = url.includes('/ads') || url.includes('gampad/ads');

    if (selectedFilter === 'collector') {
      return isCollector;
    } else if (selectedFilter === 'ads') {
      return isAds;
    } else {
      // 'all'
      return true;
    }
  });

  // Populate table rows
  filtered.forEach((req) => {
    const { method, url, timeStamp, eventName, bodyText } = req;

    const row = document.createElement('tr');

    // 1) Method cell
    const methodTd = document.createElement('td');
    methodTd.textContent = method;
    row.appendChild(methodTd);

    // 2) Middle cell
    // For POST, we only show eventName (or "N/A" if none found)
    // For GET, if it's a collector event, show eventName. Otherwise, show Base URL.
    let middleValue;
    if (method === 'POST') {
      // Show only event name
      middleValue = eventName || 'N/A';
    } else {
      // GET request
      if (selectedFilter === 'collector') {
        // if it's collector, we might have eventName
        middleValue = eventName || 'N/A';
      } else {
        middleValue = extractBaseUrl(url);
      }
    }

    const middleTd = document.createElement('td');
    middleTd.textContent = middleValue;
    row.appendChild(middleTd);

    // 3) Time cell
    const timeTd = document.createElement('td');
    const dateObj = new Date(timeStamp);
    timeTd.textContent = dateObj.toLocaleTimeString();
    row.appendChild(timeTd);

    // On row click => show details
    // - If POST => show entire body in key-value or raw form
    // - If GET => show query params
    row.addEventListener('click', () => {
      if (method === 'POST') {
        showPostBody(bodyText);
      } else {
        showQueryParams(url);
      }
    });

    tableBody.appendChild(row);
  });
}

// Which radio filter is selected?
function getSelectedFilter() {
  const radio = document.querySelector('input[name="filterType"]:checked');
  return radio ? radio.value : 'all';
}

// Extract the base URL (omit query params)
function extractBaseUrl(fullUrl) {
  try {
    const parsed = new URL(fullUrl);
    return parsed.origin + parsed.pathname;
  } catch {
    return fullUrl;
  }
}

// Show query params in the detail panel (for GET requests)
function showQueryParams(fullUrl) {
  const detailsDiv = document.getElementById('query-details');
  const tableBody = document.getElementById('query-params-body');
  tableBody.innerHTML = '';

  try {
    const parsedUrl = new URL(fullUrl);
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      const row = document.createElement('tr');
      const keyTd = document.createElement('td');
      keyTd.textContent = key;
      const valTd = document.createElement('td');
      valTd.textContent = value;
      row.appendChild(keyTd);
      row.appendChild(valTd);
      tableBody.appendChild(row);
    }
  } catch (err) {
    const row = document.createElement('tr');
    row.textContent = 'Could not parse query parameters.';
    tableBody.appendChild(row);
  }

  detailsDiv.style.display = 'block';
}

// Show the entire POST body in the detail panel
function showPostBody(bodyText) {
  const detailsDiv = document.getElementById('query-details');
  const tableBody = document.getElementById('query-params-body');
  tableBody.innerHTML = '';

  if (!bodyText) {
    const row = document.createElement('tr');
    row.textContent = 'No body available.';
    tableBody.appendChild(row);
    detailsDiv.style.display = 'block';
    return;
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(bodyText);
    // If it's an object, iterate keys
    if (typeof parsed === 'object' && parsed !== null) {
      Object.keys(parsed).forEach((key) => {
        const val = parsed[key];
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);

        const row = document.createElement('tr');
        const keyTd = document.createElement('td');
        keyTd.textContent = key;
        const valTd = document.createElement('td');
        valTd.textContent = displayVal;
        row.appendChild(keyTd);
        row.appendChild(valTd);
        tableBody.appendChild(row);
      });
    } else {
      // It's a primitive
      const row = document.createElement('tr');
      row.textContent = bodyText;
      tableBody.appendChild(row);
    }
  } catch (err) {
    // Not valid JSON, just show the raw text
    const row = document.createElement('tr');
    row.textContent = bodyText;
    tableBody.appendChild(row);
  }

  detailsDiv.style.display = 'block';
}
