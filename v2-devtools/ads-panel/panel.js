const ALL_EVENT_TYPES = ["ad-requested", "ad-loaded", "ad-failed", "ad-delayed"];
let intervalId;

document.addEventListener("DOMContentLoaded", () => {
  loadAdData();
  intervalId = setInterval(loadAdData, 500);
});

window.addEventListener('unload', () => {
  clearInterval(intervalId);
});

document.getElementById("refreshBtn").addEventListener("click", loadAdData);

function getActiveTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs.length ? tabs[0] : null;
    callback(activeTab ? activeTab.id : null);
  });
}

function getRequestsForTab(tabId, callback) {
  if (!tabId) return callback(null);
  chrome.runtime.sendMessage({ type: "getRequestsForTab", tabId }, callback);
}

function parseRequests(requests) {
  const adsMap = new Map();
  const collectorMap = new Map();
  const prevScpMap = new Map();

  requests.forEach((req) => {
    let urlObj;
    try {
      urlObj = new URL(req.url);
    } catch (e) {
      return;
    }
    const urlParams = urlObj.searchParams;
    const pathname = urlObj.pathname;

    // Extract prev_scp and parse pos from it
    const prevScp = urlParams.get("prev_scp") || "N/A";
    let pos = "N/A";

    if (prevScp !== "N/A") {
      const prevScpParams = new URLSearchParams(prevScp);
      pos = prevScpParams.get("pos") || "N/A";

      // Store prev_scp for future mapping
      prevScpMap.set(pos, prevScp);
    }

    if (pathname.includes("/ads")) {
      if (!adsMap.has(pos)) {
        adsMap.set(pos, { pos });
      }
    } else {
      const event = urlParams.get("event");
      if (event && ALL_EVENT_TYPES.includes(event)) {
        const adSpot = urlParams.get("ad-spot") || "N/A";
        const adDemandSource = urlParams.get("ad-demand-source") || "N/A";

        let unifiedKey = `${adSpot}-${adDemandSource}`;
        if (adDemandSource.toLowerCase().includes("gam") && adSpot !== "N/A" && adsMap.has(adSpot)) {
          unifiedKey = adSpot;
        }

        if (!collectorMap.has(unifiedKey)) {
          collectorMap.set(unifiedKey, {
            "Ad Slot": adSpot,
            "Ad Demand Source": adDemandSource,
            "ad-requested": false,
            "ad-loaded": false,
            "ad-failed": false,
            "ad-delayed": false,
            "Prev SCP": "N/A"  // Default to "N/A" initially
          });
        }

        collectorMap.get(unifiedKey)[event] = true;

        // Add Prev SCP only if ad-demand-source contains "gam"
        if (adDemandSource.toLowerCase().includes("gam") && prevScpMap.has(adSpot)) {
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

    const posTd = document.createElement("td");
    posTd.textContent = row["Ad Slot"];
    tr.appendChild(posTd);

    const sourceTd = document.createElement("td");
    sourceTd.textContent = row["Ad Demand Source"];
    tr.appendChild(sourceTd);

    const tagsTd = document.createElement("td");
    tagsTd.classList.add("tags-cell");
    ALL_EVENT_TYPES.forEach((evt) => {
      const tagSpan = document.createElement("span");
      tagSpan.classList.add("tag");
      if (row[evt]) {
        tagSpan.classList.add("success");
      } else {
        tagSpan.classList.add("error");
      }
      tagSpan.textContent = evt.replace("ad-", "").replace("-", " ").toUpperCase();
      tagsTd.appendChild(tagSpan);
    });
    tr.appendChild(tagsTd);

    const prevScpTd = document.createElement("td");
    if (row["Prev SCP"] && row["Prev SCP"] !== "N/A" && row["Prev SCP"] !== "no prev_scp") {
      const viewButton = document.createElement("span");
      viewButton.classList.add("tag", "view-details");
      viewButton.textContent = "View Details";
      viewButton.title = "View Prev SCP Details";
      viewButton.addEventListener("click", () => {
        populateDetailsTable(row["Ad Slot"], row["Ad Demand Source"], row["Prev SCP"]);
      });
      prevScpTd.appendChild(viewButton);
    } else {
      const span = document.createElement("span");
      span.classList.add("tag", "error");
      span.textContent = row["Prev SCP"];
      if (!span.textContent || span.textContent === "N/A") span.textContent = "N/A";
      prevScpTd.appendChild(span);
    }
    tr.appendChild(prevScpTd);

    mainTableBody.appendChild(tr);
  });
}

function populateDetailsTable(adSlot, adDemandSource, prevScpString) {
  const detailsTableBody = document.querySelector(".details-table tbody");
  if (!detailsTableBody) return;
  detailsTableBody.innerHTML = "";

  if (!prevScpString || prevScpString === "N/A" || prevScpString === "no prev_scp") {
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
  const detailEntries = Array.from(params.entries());
  if (detailEntries.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2;
    td.textContent = "No details available.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    detailsTableBody.appendChild(tr);
    return;
  }

  detailEntries.forEach(([key, value]) => {
    const tr = document.createElement("tr");
    const paramTd = document.createElement("td");
    paramTd.textContent = key;
    tr.appendChild(paramTd);

    const valueTd = document.createElement("td");
    valueTd.textContent = value;
    tr.appendChild(valueTd);
    detailsTableBody.appendChild(tr);
  });
}

function loadAdData() {
  getActiveTabId((tabId) => {
    getRequestsForTab(tabId, (response) => {
      if (!response || !response.requests) return;
      const parsedData = parseRequests(response.requests);
      renderMainTable(parsedData);
    });
  });
}
