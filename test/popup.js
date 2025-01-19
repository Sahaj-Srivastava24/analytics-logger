let allRequests = [];

document.addEventListener('DOMContentLoaded', () => {
  // 1. Get the current active tab's ID
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) return;
    const currentTabId = tabs[0].id;

    // 2. Ask background for requests relevant to this tab
    chrome.runtime.sendMessage({ type: 'getRequestsForTab', tabId: currentTabId }, (response) => {
      if (response && response.requests) {
        allRequests = response.requests;
        renderTable();
      }
    });
  });

  // 3. Add filter event listeners
  document.getElementById('filterCollector').addEventListener('change', renderTable);
  document.getElementById('filterAds').addEventListener('change', renderTable);

  // 4. Close details panel
  document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('query-details').style.display = 'none';
  });
});

// Renders the table with columns: Method, Event Name, Time
function renderTable() {
  const filterCollector = document.getElementById('filterCollector').checked;
  const filterAds = document.getElementById('filterAds').checked;

  const tableBody = document.getElementById('requests-body');
  tableBody.innerHTML = ''; // clear old rows

  // Filter logic
  const filteredRequests = allRequests.filter((req) => {
    const url = req.url.toLowerCase();
    const matchesCollector = url.includes('/c/events');
    const matchesAds = url.includes('/ads') || url.includes('gampad/ads');

    if (filterCollector && filterAds) {
      return matchesCollector || matchesAds;
    } else if (filterCollector) {
      return matchesCollector;
    } else if (filterAds) {
      return matchesAds;
    } else {
      return true; // no filters
    }
  });

  // Now create table rows
  filteredRequests.forEach((req) => {
    const { method, url, timeStamp } = req;
    const row = document.createElement('tr');

    // Method cell
    const methodTd = document.createElement('td');
    methodTd.textContent = method;
    row.appendChild(methodTd);

    // Event Name cell (only for collector events)
    // We'll parse the 'event=' query param if /c/events is in the URL
    let eventName = 'N/A';
    if (url.includes('/c/events')) {
      try {
        const parsed = new URL(url);
        // The query param might be named 'event'
        // If your param name is different, adjust accordingly
        eventName = parsed.searchParams.get('event') || 'N/A';
      } catch (e) {
        eventName = 'N/A';
      }
    }
    const eventTd = document.createElement('td');
    eventTd.textContent = eventName;
    row.appendChild(eventTd);

    // Time cell
    const timeTd = document.createElement('td');
    const dateObj = new Date(timeStamp);
    timeTd.textContent = dateObj.toLocaleTimeString();
    row.appendChild(timeTd);

    // Clicking the row => show query params
    row.addEventListener('click', () => {
      showQueryParams(url);
    });

    tableBody.appendChild(row);
  });
}

// Show query params in a bottom panel
function showQueryParams(fullUrl) {
  const detailsDiv = document.getElementById('query-details');
  const paramsBody = document.getElementById('query-params-body');
  paramsBody.innerHTML = ''; // clear old content

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
      paramsBody.appendChild(row);
    }
  } catch (err) {
    const row = document.createElement('tr');
    row.textContent = 'Could not parse query parameters.';
    paramsBody.appendChild(row);
  }

  detailsDiv.style.display = 'block'; // show the panel
}
