import { loadRequests } from '../scripts/utils.js';
import { renderTable } from '../scripts/render.js';

let allRequests = [];
let currentTabId = null;

document.addEventListener('DOMContentLoaded', () => {
  // In a DevTools panel, get the tabId from devtools API:
  currentTabId = chrome.devtools.inspectedWindow.tabId;

  // Initially load requests for this tab
  loadRequests(currentTabId, (requests) => {
    allRequests = requests;
    console.log("allRequests", allRequests);
    renderTable(allRequests);
  });

  // Add event listeners for filter radios
  document.querySelectorAll('input[name="filterType"]').forEach((radio) => {
    radio.addEventListener('change', () => renderTable(allRequests));
  });

  // Refresh button
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    loadRequests(currentTabId, (requests) => {
      allRequests = requests;
      renderTable(allRequests);
    });
  });

  // Close details panel
  document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('query-details').style.display = 'none';
  });
});
