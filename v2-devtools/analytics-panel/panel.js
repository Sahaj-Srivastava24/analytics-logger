import { loadRequests } from '../scripts/utils.js';
import { renderTable } from '../scripts/render.js';

let allRequests = [];
let currentTabId = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  currentTabId = chrome.devtools.inspectedWindow.tabId;

  const refreshRequests = () => {
    loadRequests(currentTabId, (requests) => {
      allRequests = requests;
      console.log("allRequests", allRequests);
      renderTable(allRequests);
    });
  };

  refreshRequests();

  refreshInterval = setInterval(refreshRequests, 1000);

  document.querySelectorAll('input[name="filterType"]').forEach((radio) => {
    radio.addEventListener('change', () => renderTable(allRequests));
  });

  document.getElementById('refreshBtn')?.addEventListener('click', refreshRequests);

  document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('query-details').style.display = 'none';
  });

  window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  });
});
