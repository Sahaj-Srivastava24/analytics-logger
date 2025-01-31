// panel.js

import { loadRequests } from '../scripts/utils.js';

const ALL_EVENT_TYPES = ["ad-requested", "ad-loaded", "ad-failed", "ad-delayed"];
let intervalId = null;
let selectedAdKey = null;

document.addEventListener("DOMContentLoaded", () => {
  initResizableDivider();
  loadAdData();
  intervalId = setInterval(loadAdData, 1000);
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadAdData);
  }
});

window.addEventListener("beforeunload", () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

function getActiveTabId(callback) {
  // if 'chrome' or 'chrome.tabs' is undefined, the context is likely gone
  if (!chrome || !chrome.tabs) {
    return;
  }
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs.length ? tabs[0] : null;
      callback(activeTab ? activeTab.id : null);
    });
  } catch (err) {
    // This catches the "Extension context invalidated" error
    if (err.message && err.message.includes("Extension context invalidated")) {
      // Panel or extension was closed or reloaded. You can safely ignore or handle it.
    }
  }
}


function loadAdData() {
  getActiveTabId((tabId) => {
    if (!tabId) return;
    loadRequests(tabId, (requests) => {
      if (!requests) return;
      const parsedData = parseRequests(requests);
      renderMainTable(parsedData);
    });
  });
}

function parseRequests(requests) {
  const collectorMap = new Map();
  const adsMap = new Map();
  const prevScpMap = new Map();

  requests.forEach((req) => {
    let urlObj;
    let params = new URLSearchParams();
    try {
      urlObj = new URL(req.url);
    } catch {
      return;
    }
    if (req.method === "POST" && req.bodyText) {
      try {
        const postData = JSON.parse(req.bodyText);
        Object.entries(postData).forEach(([k, v]) => {
          params.set(k, v);
        });
      } catch {
        return;
      }
    } else {
      params = urlObj.searchParams;
    }
    const prevScp = params.get("prev_scp") || "N/A";
    let pos = "N/A";
    if (prevScp !== "N/A") {
      const p = new URLSearchParams(prevScp);
      pos = p.get("pos") || "N/A";
      prevScpMap.set(pos, prevScp);
    }
    if (req.method === "GET" && urlObj.pathname.includes("/ads")) {
      adsMap.set(pos, { pos });
    } else {
      const event = params.get("event");
      if (event && ALL_EVENT_TYPES.includes(event)) {
        const adSpot = params.get("ad-spot") || "N/A";
        const adSource = params.get("ad-demand-source") || "N/A";
        let unifiedKey = `${adSpot}-${adSource}`;
        if (adSource.toLowerCase().includes("gam") && adSpot !== "N/A" && adsMap.has(adSpot)) {
          unifiedKey = adSpot;
        }
        if (!collectorMap.has(unifiedKey)) {
          collectorMap.set(unifiedKey, {
            unifiedKey,
            "Ad Slot": adSpot,
            "Ad Demand Source": adSource,
            "ad-requested": false,
            "ad-loaded": false,
            "ad-failed": false,
            "ad-delayed": false,
            "Prev SCP": "N/A"
          });
        }
        collectorMap.get(unifiedKey)[event] = true;
        if (adSource.toLowerCase().includes("gam") && prevScpMap.has(adSpot)) {
          collectorMap.get(unifiedKey)["Prev SCP"] = prevScpMap.get(adSpot);
        } else {
          collectorMap.get(unifiedKey)["Prev SCP"] = "";
        }
      }
    }
  });
  return Array.from(collectorMap.values());
}

function renderMainTable(data) {
  const mainTableBody = document.querySelector(".main-table tbody");
  if (!mainTableBody) return;
  mainTableBody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.unifiedKey && row.unifiedKey === selectedAdKey) {
      tr.classList.add("selected");
    }
    const slotTd = document.createElement("td");
    slotTd.textContent = row["Ad Slot"];
    tr.appendChild(slotTd);
    const srcTd = document.createElement("td");
    srcTd.textContent = row["Ad Demand Source"];
    tr.appendChild(srcTd);
    const tagsTd = document.createElement("td");
    tagsTd.classList.add("tags-cell");
    ALL_EVENT_TYPES.forEach((evt) => {
      const tagSpan = document.createElement("span");
      tagSpan.classList.add("tag");
      tagSpan.textContent = evt.replace("ad-", "").replace("-", " ").toUpperCase();
      if (row[evt]) {
        tagSpan.classList.add("success");
      } else {
        tagSpan.classList.add("error");
      }
      tagsTd.appendChild(tagSpan);
    });
    tr.appendChild(tagsTd);
    const prevScpTd = document.createElement("td");
    if (row["Prev SCP"] && row["Prev SCP"] !== "N/A") {
      const viewBtn = document.createElement("span");
      viewBtn.classList.add("tag", "view-details");
      viewBtn.textContent = "View Details";
      viewBtn.title = "View Prev SCP Details";
      viewBtn.addEventListener("click", () => {
        populateDetailsTable(row["Ad Slot"], row["Ad Demand Source"], row["Prev SCP"]);
      });
      prevScpTd.appendChild(viewBtn);
    } else {
      const noScpSpan = document.createElement("span");
      noScpSpan.classList.add("tag", "error");
      noScpSpan.textContent = row["Prev SCP"] || "N/A";
      prevScpTd.appendChild(noScpSpan);
    }
    tr.appendChild(prevScpTd);
    tr.addEventListener("click", () => {
      const oldSelected = mainTableBody.querySelector("tr.selected");
      if (oldSelected) oldSelected.classList.remove("selected");
      tr.classList.add("selected");
      selectedAdKey = row.unifiedKey;
    });
    mainTableBody.appendChild(tr);
  });
}

function populateDetailsTable(adSlot, adDemandSource, prevScpString) {
  const detailsTableBody = document.querySelector(".details-table tbody");
  if (!detailsTableBody) return;
  detailsTableBody.innerHTML = "";
  if (!prevScpString || prevScpString === "N/A") {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2;
    td.textContent = "No details available.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    detailsTableBody.appendChild(tr);
    return;
  }
  const params = new URLSearchParams(prevScpString);
  const entries = Array.from(params.entries());
  if (entries.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2;
    td.textContent = "No details available.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    detailsTableBody.appendChild(tr);
    return;
  }
  entries.forEach(([key, value]) => {
    const tr = document.createElement("tr");
    const kTd = document.createElement("td");
    kTd.textContent = key;
    tr.appendChild(kTd);
    const vTd = document.createElement("td");
    vTd.textContent = value;
    tr.appendChild(vTd);
    detailsTableBody.appendChild(tr);
  });
}

function initResizableDivider() {
  const divider = document.getElementById('tableDivider');
  if (!divider) return;
  const topTable = document.querySelector('.top-table');
  const bottomTable = document.querySelector('.bottom-table');
  if (!topTable || !bottomTable) return;

  let isDragging = false;
  let startY = 0;
  let startTopHeight = 0;

  divider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    startY = e.clientY;
    startTopHeight = topTable.offsetHeight;
    document.body.style.cursor = 'row-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = e.clientY - startY;
    const newHeight = startTopHeight + delta;
    const containerRect = divider.parentElement.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const minHeight = 100; 
    const maxHeight = containerHeight - 100;
    const finalHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    topTable.style.height = finalHeight + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
    }
  });
}
