import { showPostBody, showQueryParams } from './details.js';

/**
 * Instead of storing the DOM element in a module variable, we'll store just the unique identifier.
 */
let selectedRequestId = null;  // For example, timeStamp or some other unique ID

/**
 * Renders the list of requests in the #requests-body element, with row highlighting.
 */
export function renderTable(requests) {
  const tableBody = document.getElementById('requests-body');
  tableBody.innerHTML = '';

  // Example: filter requests to only those that have `/c/events` in the URL
  const collectorRequests = requests.filter(req =>
    req.url && req.url.toLowerCase().includes('/c/events')
  );

  collectorRequests.forEach((req) => {
    const { method, timeStamp, eventName, bodyText, url } = req;

    const row = document.createElement('div');
    row.classList.add('record');

    // (Optional) Use the timeStamp as a data attribute if you like
    row.dataset.requestId = timeStamp;

    // Create columns
    const methodCol = document.createElement('div');
    methodCol.classList.add('col', 'method');
    methodCol.textContent = method;
    row.appendChild(methodCol);

    const dataCol = document.createElement('div');
    dataCol.classList.add('col', 'name');
    dataCol.textContent = eventName || 'N/A';
    row.appendChild(dataCol);

    const timeCol = document.createElement('div');
    timeCol.classList.add('col', 'time');
    timeCol.textContent = new Date(timeStamp).toLocaleTimeString();
    row.appendChild(timeCol);

    // Re-apply selection if this request is the one previously selected
    if (selectedRequestId && selectedRequestId === timeStamp) {
      row.classList.add('selected');
      // Optionally show details if you want them auto-shown
      // showDetailsForThisRequest({ method, bodyText, url });
    }

    // Click handler: highlight this row and show details
    row.addEventListener('click', () => {
      // Clear 'selected' class from any previously selected .record
      const previouslySelected = tableBody.querySelector('.record.selected');
      if (previouslySelected) {
        previouslySelected.classList.remove('selected');
      }

      // Highlight the new one
      row.classList.add('selected');

      // Store the unique ID in our global
      selectedRequestId = timeStamp;

      // Show details for this request
      if (method === 'POST') {
        showPostBody(bodyText);
      } else {
        showQueryParams(url);
      }
    });

    tableBody.appendChild(row);
  });

  // If no matching requests were found, display a fallback message
  if (collectorRequests.length === 0) {
    const noDataMessage = document.createElement('div');
    noDataMessage.classList.add('record', 'no-data');
    noDataMessage.textContent = 'No collector events found.';
    tableBody.appendChild(noDataMessage);
  }
}

/**
 * (Optional) Provide a small helper if you want to trigger the details logic
 * automatically after re-rendering if the user had something selected:
 */
function showDetailsForThisRequest({ method, bodyText, url }) {
  if (method === 'POST') {
    showPostBody(bodyText);
  } else {
    showQueryParams(url);
  }
}
