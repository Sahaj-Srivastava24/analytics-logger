/**
 * This file contains functions for displaying details about a request in the
 * details panel i.e. the second table in the analytics panel.
 */

export function showQueryParams(fullUrl) {
  const detailsDiv = document.getElementById('query-details');
  const detailsBody = document.getElementById('details-body');
  detailsBody.innerHTML = ''; // Clear existing details

  try {
    const parsedUrl = new URL(fullUrl);
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      const row = document.createElement('div');
      row.classList.add('record');

      const keyCol = document.createElement('div');
      keyCol.classList.add('col', 'key');
      keyCol.textContent = key;
      row.appendChild(keyCol);

      const valueCol = document.createElement('div');
      valueCol.classList.add('col', 'value');
      valueCol.textContent = value;
      row.appendChild(valueCol);

      detailsBody.appendChild(row);
    }
  } catch (err) {
    const row = document.createElement('div');
    row.classList.add('record', 'no-data');
    row.textContent = 'Could not parse query parameters.';
    detailsBody.appendChild(row);
  }

  detailsDiv.style.display = 'block';
}

export function showPostBody(bodyText) {
  const detailsDiv = document.getElementById('query-details');
  const detailsBody = document.getElementById('details-body');
  detailsBody.innerHTML = ''; // Clear previous details

  if (!bodyText) {
    const row = document.createElement('div');
    row.classList.add('record', 'no-data');
    row.textContent = 'No body available.';
    detailsBody.appendChild(row);
    detailsDiv.style.display = 'block';
    return;
  }

  try {
    const parsed = JSON.parse(bodyText);
    if (typeof parsed === 'object' && parsed !== null) {
      Object.keys(parsed).forEach((key) => {
        const val = Array.isArray(parsed[key]) ? parsed[key].join(', ') : String(parsed[key]);

        const row = document.createElement('div');
        row.classList.add('record');

        const keyCol = document.createElement('div');
        keyCol.classList.add('col', 'key');
        keyCol.textContent = key;
        row.appendChild(keyCol);

        const valueCol = document.createElement('div');
        valueCol.classList.add('col', 'value');
        valueCol.textContent = val;
        row.appendChild(valueCol);

        detailsBody.appendChild(row);
      });
    } else {
      const row = document.createElement('div');
      row.classList.add('record');
      row.textContent = bodyText;
      detailsBody.appendChild(row);
    }
  } catch (err) {
    const row = document.createElement('div');
    row.classList.add('record', 'no-data');
    row.textContent = 'Error parsing request body.';
    detailsBody.appendChild(row);
  }

  detailsDiv.style.display = 'block';
}
