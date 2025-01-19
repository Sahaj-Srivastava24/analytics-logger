import { loadRequests, getSelectedFilter, extractBaseUrl } from './utils.js';
import { renderTable } from './render.js';
import { showPostBody, showQueryParams } from './details.js';

let allRequests = [];
let currentTabId = null;

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length) {
      currentTabId = tabs[0].id;
      loadRequests(currentTabId, (requests) => {
        allRequests = requests;
        renderTable(allRequests);
      });
    }
  });

  document.querySelectorAll('input[name="filterType"]').forEach((radio) => {
    radio.addEventListener('change', () => renderTable(allRequests));
  });

  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    loadRequests(currentTabId, (requests) => {
      allRequests = requests;
      renderTable(allRequests);
    });
  });

  document.getElementById('close-details').addEventListener('click', () => {
    document.getElementById('query-details').style.display = 'none';
  });
});

export {};