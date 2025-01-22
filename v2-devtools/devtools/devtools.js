// devtools.js

chrome.devtools.panels.create(
  "Analytics",    
  "",                     // Icon path (empty string = no icon)
  "./analytics-panel/panel.html",          
  (panel) => {
    console.log("Custom Analytics DevTools panel created!", panel);
  }
);

chrome.devtools.panels.create(
  "Ads Tracker",    // Panel title
  "",                     // Icon path (empty string = no icon)
  "./ads-panel/panel.html",           // The actual UI for the panel
  (panel) => {
    console.log("Custom Ads DevTools panel created!", panel);
  }
);
