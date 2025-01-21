// Define all possible event types
const ALL_EVENT_TYPES = ["ad-requested", "ad-loaded", "ad-failed", "ad-delayed"];

// Function to load and render ad data
function loadAdData() {
  // Query for the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs.length) return; // No active tab found (edge case)

    const currentTabId = tabs[0].id;

    // Ask the background script for intercepted requests for this tab
    chrome.runtime.sendMessage(
      { type: "getRequestsForTab", tabId: currentTabId },
      function (response) {
        if (!response || !response.requests) return;

        // Select the main table body
        const mainTableBody = document.querySelector('.main-table tbody');
        if (!mainTableBody) return;

        mainTableBody.innerHTML = ''; // Clear previous content

        let adDataMap = new Map();
        let prevScpData = new Map();

        response.requests.forEach((req) => {
          try {
            let url = new URL(req.url);
            let urlParams = url.searchParams;

            // Extract ad event details
            let event = urlParams.get("event");
            let adSpot = urlParams.get("ad-spot") || "N/A";

            if (event && ALL_EVENT_TYPES.includes(event)) {
              if (!adDataMap.has(adSpot)) {
                // Initialize all events as false
                let eventStatus = {
                  "Ad Slot": adSpot,
                  "ad-requested": false,
                  "ad-loaded": false,
                  "ad-failed": false,
                  "ad-delayed": false,
                  "Prev SCP": "N/A"
                };
                adDataMap.set(adSpot, eventStatus);
              }
              adDataMap.get(adSpot)[event] = true;
            }

            // Extract prev_scp details
            let prevScp = urlParams.get("prev_scp");
            if (prevScp) {
              let params = new URLSearchParams(prevScp);
              let pos = params.get("pos") || adSpot;
              prevScpData.set(pos, prevScp);

              if (!adDataMap.has(pos)) {
                // Initialize all events as false
                let eventStatus = {
                  "Ad Slot": pos,
                  "ad-requested": false,
                  "ad-loaded": false,
                  "ad-failed": false,
                  "ad-delayed": false,
                  "Prev SCP": "N/A"
                };
                adDataMap.set(pos, eventStatus);
              }
              adDataMap.get(pos)["Prev SCP"] = prevScp;
            }
          } catch (error) {
            console.error('Invalid URL:', req.url);
          }
        });

        // Convert Map to Array for easier iteration
        let adDataArray = Array.from(adDataMap.values());

        // Populate the main table with processed data
        adDataArray.forEach(row => {
          let tr = document.createElement('tr');

          // Pos Value Cell
          let posTd = document.createElement('td');
          posTd.textContent = row["Ad Slot"];
          tr.appendChild(posTd);

          // Tags Cell
          let tagsTd = document.createElement('td');
          tagsTd.classList.add('tags-cell');

          ALL_EVENT_TYPES.forEach(event => {
            let tagSpan = document.createElement('span');
            tagSpan.classList.add('tag');

            if (row[event]) {
              tagSpan.classList.add('success');
              tagSpan.textContent = event.replace('ad-', '').replace('-', ' ').toUpperCase();
            } else {
              tagSpan.classList.add('error');
              tagSpan.textContent = event.replace('ad-', '').replace('-', ' ').toUpperCase();
            }

            tagsTd.appendChild(tagSpan);
          });

          tr.appendChild(tagsTd);

          // Prev SCP Cell
          let prevScpTd = document.createElement('td');
          if (row["Prev SCP"] !== "N/A") {
            let viewButton = document.createElement('span');
            viewButton.classList.add('tag', 'view-details');
            viewButton.textContent = "View Details";
            viewButton.title = "View Prev SCP Details";
            viewButton.addEventListener('click', () => {
              populateDetailsTable(row["Ad Slot"], prevScpData.get(row["Ad Slot"]));
            });
            prevScpTd.appendChild(viewButton);
          } else {
            prevScpTd.textContent = "N/A";
            prevScpTd.classList.add('tag', 'error');
            prevScpTd.style.textAlign = "center";
          }
          tr.appendChild(prevScpTd);

          mainTableBody.appendChild(tr);
        });
      }
    );
  });
}

// Function to populate the Prev SCP details table
function populateDetailsTable(adSlot, prevScpString) {
  const detailsTableBody = document.querySelector('.details-table tbody');
  if (!detailsTableBody) return;

  detailsTableBody.innerHTML = ''; // Clear previous content

  if (!prevScpString) {
    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = "No details available.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    detailsTableBody.appendChild(tr);
    return;
  }

  let params = new URLSearchParams(prevScpString);
  let detailEntries = Array.from(params.entries());

  if (detailEntries.length === 0) {
    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = "No details available.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    detailsTableBody.appendChild(tr);
    return;
  }

  detailEntries.forEach(([key, value]) => {
    let tr = document.createElement('tr');

    let paramTd = document.createElement('td');
    paramTd.textContent = key;
    tr.appendChild(paramTd);

    let valueTd = document.createElement('td');
    valueTd.textContent = value;
    tr.appendChild(valueTd);

    detailsTableBody.appendChild(tr);
  });
}

// Event listener for the refresh button
document.getElementById('refreshBtn').addEventListener('click', loadAdData);

// Initial data load when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadAdData);
