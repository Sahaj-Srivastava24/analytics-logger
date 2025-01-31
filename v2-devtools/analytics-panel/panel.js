// panel.js
import { loadRequests } from '../scripts/utils.js';  // Adjust path if needed
import { renderTable } from '../scripts/render.js';   // Adjust path if needed

let allRequests = [];
let currentTabId = null;
let refreshInterval = null;

// Keep these in a higher scope so they persist across render calls:
let currentFilterTxt = '';
let currentlySelectedTab = null;

/**
 * Initializes the resizable divider between top and bottom sections.
 */
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

/**
 * Refreshes the requests by calling loadRequests for the current tab
 */
function refreshRequests() {
  if (!currentTabId) return;

  loadRequests(currentTabId, (requests) => {
    allRequests = requests;
    
    // Apply the currently stored filter text to the new data
    let filteredRequests = allRequests;
    if (currentFilterTxt) {
      const filterLower = currentFilterTxt.toLowerCase();
      filteredRequests = allRequests.filter(req => {
        const evtName = (req.eventName || '').toLowerCase();
        // Only include if eventName starts with the filter text
        return evtName.startsWith(filterLower);
      });
    }
    
    renderTable(filteredRequests);
    
    // Re-apply any selection state if needed
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

  // Initial data load + periodic refresh
  refreshRequests();
  refreshInterval = setInterval(refreshRequests, 1000);

  // Filter input
  const eventFilter = document.getElementById('eventFilter');
  if (eventFilter) {
    eventFilter.addEventListener('input', (e) => {
      currentFilterTxt = e.target.value;

      // Apply client-side filter to `allRequests`
      const filterLower = currentFilterTxt.toLowerCase();
      const filtered = allRequests.filter(req => {
        const evtName = (req.eventName || '').toLowerCase();
        // Only include if eventName starts with the filter text
        return evtName.startsWith(filterLower);
      });
      renderTable(filtered);
    });
  }

  // Example for some <select> element. Replace 'someSelectId' with your actual ID.
  const mySelectEl = document.getElementById('someSelectId');
  if (mySelectEl) {
    mySelectEl.addEventListener('change', (e) => {
      currentlySelectedTab = e.target.value;
      // Possibly do something with that selection, or re-render
    });
  }

  // Manual refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshRequests);
  }

  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  });
});
