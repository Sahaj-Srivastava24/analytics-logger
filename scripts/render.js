import { getSelectedFilter, extractBaseUrl } from './utils.js';
import { showPostBody, showQueryParams } from './details.js';

export function renderTable(requests) {
  const filter = getSelectedFilter();
  const tableBody = document.getElementById('requests-body');
  tableBody.innerHTML = '';

  const middleHeader = document.getElementById('middle-col-header');
  middleHeader.textContent = filter === 'collector' ? 'Event Name (POST shows eventName)' :
                             filter === 'ads' ? 'Base URL (POST shows eventName if any)' :
                             'Base URL / Event Name';

  const filteredRequests = requests.filter((req) => {
    const url = req.url.toLowerCase();
    return filter === 'collector' ? url.includes('/c/events') :
           filter === 'ads' ? url.includes('/ads') || url.includes('gampad/ads') :
           true;
  });

  filteredRequests.forEach((req) => {
    const { method, url, timeStamp, eventName, bodyText } = req;
    const row = document.createElement('tr');

    const methodTd = document.createElement('td');
    methodTd.textContent = method;
    row.appendChild(methodTd);

    const middleTd = document.createElement('td');
    middleTd.textContent = method === 'POST' ? (eventName || 'N/A') :
                           filter === 'collector' ? (eventName || 'N/A') :
                           extractBaseUrl(url);
    row.appendChild(middleTd);

    const timeTd = document.createElement('td');
    timeTd.textContent = new Date(timeStamp).toLocaleTimeString();
    row.appendChild(timeTd);

    row.addEventListener('click', () => {
      method === 'POST' ? showPostBody(bodyText) : showQueryParams(url);
    });

    tableBody.appendChild(row);
  });
}
