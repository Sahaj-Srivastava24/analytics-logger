// devtools.js
const requestsTableBody = document.getElementById('requests-body');
const refreshBtn = document.getElementById('refreshBtn');
const filterRadios = document.querySelectorAll('input[name="filterType"]');

// To store captured requests
let interceptedRequests = [];

// Listen for new network requests
chrome.devtools.network.onRequestFinished.addListener((request) => {
  const { url, method, postData } = request.request;
  const timeStamp = Date.now(); // DevTools doesn't give a direct timeStamp like webRequest does
  let bodyText = null;
  let eventName = null;

  // For POST requests, see if there's a body
  if (method === 'POST' && postData && postData.text) {
    bodyText = postData.text; // This is the raw string payload
  }

  // If the request is a known analytics endpoint (like /c/events),
  // try to parse out an eventName, just like your old logic.
  if (url.includes('/c/events')) {
    if (method === 'GET') {
      try {
        const parsedUrl = new URL(url);
        eventName = parsedUrl.searchParams.get('event') || null;
      } catch (_) {}
    } else if (method === 'POST' && bodyText) {
      try {
        const maybeObj = JSON.parse(bodyText);
        if (maybeObj.event) {
          eventName = maybeObj.event;
        }
      } catch (err1) {
        // attempt to parse as formData style
        try {
          const formDataObj = JSON.parse(bodyText);
          if (formDataObj.event && Array.isArray(formDataObj.event)) {
            eventName = formDataObj.event[0];
          }
        } catch (err2) {
          console.error('Error parsing event name', err1, err2);
        }
      }
    }
  }

  // Push into our local array
  interceptedRequests.push({
    url,
    method,
    timeStamp,
    eventName,
    bodyText
  });

  // For memory safety
  if (interceptedRequests.length > 2000) {
    interceptedRequests.shift();
  }

  // Optionally auto-refresh the display or call a function to update the table
  renderRequests();
});

// Called by "Refresh" button
refreshBtn.addEventListener('click', () => {
  renderRequests();
});

// Whenever a radio is changed, re-render
filterRadios.forEach(radio => {
  radio.addEventListener('change', () => renderRequests());
});

function renderRequests() {
  // Clear table body
  requestsTableBody.innerHTML = '';

  // Determine which filter is active
  const filterType = document.querySelector('input[name="filterType"]:checked')?.value || 'all';

  const filteredRequests = interceptedRequests.filter(req => {
    // "all" means no filter
    if (filterType === 'all') return true;

    // "collector" means e.g. if the url or eventName indicates /c/events
    if (filterType === 'collector') {
      return req.url.includes('/c/events');
    }

    // "ads" means e.g. if the url or body is related to "ads" (you define your logic)
    if (filterType === 'ads') {
      return req.url.includes('ads') || (req.bodyText && req.bodyText.includes('ads'));
    }

    // default: pass
    return true;
  });

  // Build rows
  filteredRequests.forEach(req => {
    const row = document.createElement('tr');

    const methodCell = document.createElement('td');
    methodCell.textContent = req.method;
    row.appendChild(methodCell);

    const middleCell = document.createElement('td');
    // show base URL or eventName or snippet of body, your call
    if (req.eventName) {
      middleCell.textContent = `Event: ${req.eventName}`;
    } else {
      // e.g. shorten the URL
      try {
        const urlObj = new URL(req.url);
        middleCell.textContent = urlObj.origin + urlObj.pathname;
      } catch {
        middleCell.textContent = req.url;
      }
    }
    row.appendChild(middleCell);

    const timeCell = document.createElement('td');
    const time = new Date(req.timeStamp).toLocaleTimeString();
    timeCell.textContent = time;
    row.appendChild(timeCell);

    // If you want to show details on row click:
    row.addEventListener('click', () => {
      showRequestDetails(req);
    });

    requestsTableBody.appendChild(row);
  });
}

// Example of showing request details
function showRequestDetails(req) {
  const detailsDiv = document.getElementById('query-details');
  const closeBtn = document.getElementById('close-details');
  const paramsBody = document.getElementById('query-params-body');

  // Clear out old rows
  paramsBody.innerHTML = '';

  // We'll parse URL params or body if we want
  try {
    const parsedUrl = new URL(req.url);
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
    console.error('No valid URL to parse');
  }

  // If body is JSON, try to parse
  if (req.bodyText) {
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(req.bodyText);
    } catch (_) {}

    if (parsedBody && typeof parsedBody === 'object') {
      Object.entries(parsedBody).forEach(([key, value]) => {
        const row = document.createElement('tr');
        const keyTd = document.createElement('td');
        keyTd.textContent = key;
        const valTd = document.createElement('td');
        // If value is an object or array, you might do more detailed rendering
        valTd.textContent = typeof value === 'object' ? JSON.stringify(value) : value;
        row.appendChild(keyTd);
        row.appendChild(valTd);
        paramsBody.appendChild(row);
      });
    } else {
      // Just show raw body text
      const row = document.createElement('tr');
      const keyTd = document.createElement('td');
      keyTd.textContent = '(raw)';
      const valTd = document.createElement('td');
      valTd.textContent = req.bodyText;
      row.appendChild(keyTd);
      row.appendChild(valTd);
      paramsBody.appendChild(row);
    }
  }

  detailsDiv.style.display = 'block';

  closeBtn.onclick = () => {
    detailsDiv.style.display = 'none';
  };
}

//
// OPTIONAL: If you want an initial call to render the table
//
renderRequests();

