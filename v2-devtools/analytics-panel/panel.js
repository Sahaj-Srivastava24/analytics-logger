import { loadRequests } from '../scripts/utils.js';
import { renderTable } from '../scripts/render.js';

let allRequests = [];
let currentTabId = null;
let refreshInterval = null;
let currentFilterTxt = '';
let currentlySelectedTab = null;

function initResizableDivider() {
  const divider = document.getElementById('tableDivider');
  const topTable = document.querySelector('.top-table');
  const bottomTable = document.querySelector('.bottom-table');
  let isDragging = false;
  let startY;
  let startHeights;

  divider.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startHeights = {
      top: topTable.offsetHeight,
      bottom: bottomTable.offsetHeight
    };
    document.body.style.cursor = 'row-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = e.clientY - startY;
    const containerHeight = topTable.parentElement.offsetHeight;
    const newTopHeight = Math.max(100, Math.min(startHeights.top + delta, containerHeight - 100));
    const newBottomHeight = Math.max(100, containerHeight - newTopHeight - divider.offsetHeight);
    topTable.style.height = `${newTopHeight}px`;
    bottomTable.style.height = `${newBottomHeight}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = '';
  });
}

function refreshRequests() {
  if (!currentTabId) return;
  loadRequests(currentTabId, (requests) => {
    allRequests = requests;
    let filteredRequests = allRequests;
    if (currentFilterTxt) {
      const filterLower = currentFilterTxt.toLowerCase();
      filteredRequests = allRequests.filter(req => {
        const evtName = (req.eventName || '').toLowerCase();
        return evtName.startsWith(filterLower);
      });
    }
    renderTable(filteredRequests);
    if (currentlySelectedTab) {
      const someSelectEl = document.getElementById('someSelectId');
      if (someSelectEl) {
        someSelectEl.value = currentlySelectedTab;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  currentTabId = chrome.devtools.inspectedWindow.tabId;
  initResizableDivider();
  refreshRequests();
  refreshInterval = setInterval(refreshRequests, 1000);
  const eventFilter = document.getElementById('eventFilter');
  if (eventFilter) {
    eventFilter.addEventListener('input', (e) => {
      currentFilterTxt = e.target.value;
      const filterLower = currentFilterTxt.toLowerCase();
      const filtered = allRequests.filter(req => {
        const evtName = (req.eventName || '').toLowerCase();
        return evtName.startsWith(filterLower);
      });
      renderTable(filtered);
    });
  }
  const mySelectEl = document.getElementById('someSelectId');
  if (mySelectEl) {
    mySelectEl.addEventListener('change', (e) => {
      currentlySelectedTab = e.target.value;
    });
  }
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshRequests);
  }
  window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  });
});
