/**
 * This file contains functions for displaying the list of requests in the
 * events panel i.e. the first table in the analytics panel.
 */

import { showPostBody, showQueryParams } from './details.js';

export function renderTable(requests) {
  const tableBody = document.getElementById('requests-body');
  tableBody.innerHTML = '';

  const collectorRequests = requests.filter((req) => req.url.toLowerCase().includes('/c/events'));

  collectorRequests.forEach((req) => {
    const { method, timeStamp, eventName, bodyText } = req;
    const row = document.createElement('div');
    row.classList.add('record');

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

    row.addEventListener('click', () => {
      method === 'POST' ? showPostBody(bodyText) : showQueryParams(req.url);
    });

    tableBody.appendChild(row);
  });

  if (collectorRequests.length === 0) {
    const noDataMessage = document.createElement('div');
    noDataMessage.classList.add('record', 'no-data');
    noDataMessage.textContent = 'No collector events found.';
    tableBody.appendChild(noDataMessage);
  }
}
