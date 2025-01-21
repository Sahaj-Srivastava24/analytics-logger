// details.js
export function showQueryParams(fullUrl) {
  const detailsDiv = document.getElementById('query-details');
  const tableBody = document.getElementById('query-params-body');
  tableBody.innerHTML = '';

  try {
    const parsedUrl = new URL(fullUrl);
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${key}</td><td>${value}</td>`;
      tableBody.appendChild(row);
    }
  } catch (err) {
    const row = document.createElement('tr');
    row.textContent = 'Could not parse query parameters.';
    tableBody.appendChild(row);
  }

  detailsDiv.style.display = 'block';
}

export function showPostBody(bodyText) {
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

  try {
    const parsed = JSON.parse(bodyText);
    if (typeof parsed === 'object' && parsed !== null) {
      Object.keys(parsed).forEach((key) => {
        const val = Array.isArray(parsed[key]) ? parsed[key].join(', ') : String(parsed[key]);
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${val}</td>`;
        tableBody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.textContent = bodyText;
      tableBody.appendChild(row);
    }
  } catch (err) {
    const row = document.createElement('tr');
    row.textContent = bodyText;
    tableBody.appendChild(row);
  }

  detailsDiv.style.display = 'block';
}
