# Chrome DevTools Extension for Gamezop Analytics

This project is a Chrome DevTools extension designed to analyze analytical and advertising events fired from Gamezop products. The extension provides two key functionalities through dedicated DevTools panels.

## Features

- **Analytics Panel:**
  - Monitors and logs analytical events fired by Gamezop products.
  - Tracks events using both query parameter-based and POST request-based methods.
  
- **Ads Tracker Panel:**
  - Displays ad slots and related ad collector events.
  - Monitors Google Ad Manager (GAM) and AdSense calls, including `prev_scp` values.

## Event Tracking Methods

The extension tracks events using two primary methods:

### 1. Query Parameter Tracking
- Events are tracked via query parameters in the request URL.
- Example usage:
  - **Quizzop Tracking:**
    ![Quizzop Example](examples/collector-quizzop.png)
    - Tracks `/c/events` endpoint, extracting event name and data from query parameters.
  
  - **Gamezop Tracking:**
    ![Gamezop Example](examples/collector-gamezop.png)
    - Similar tracking for Gamezop products using query parameters.

### 2. POST Request Tracking
- Events are sent as POST requests with data included in the request body instead of query parameters.
- Example usage:
  - **Gamezop POST Tracking:**
    ![Gamezop POST Example](examples/collector-post-gamezop.png)
    - Utilizes the new analytics SDK for enhanced tracking capabilities.

## Ads Tracking

The Ads Tracker panel provides insights into ad performance and tracking by monitoring:

- **Ad Slots:** Displays available ad slots on Gamezop products.
- **Collector Events:** Tracks ad-related events to ensure accurate monitoring.
- **GAM/AdSense Calls:** Logs Google Ad Manager and AdSense calls for auditing purposes.
- **`prev_scp` Values:** Captures previous `scp` values to track ad rendering changes.

## Screenshots

View the screenshots for reference:

- [Analytics Logger](examples/analytics.png)
- [Ads Tracking](examples/ads.png)


## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/chrome-devtools-analytics.git
   ```
2. Load the unpacked extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable Developer Mode
   - Click on "Load unpacked"
   - Select the cloned project folder

## Usage

Once installed, access the extension via Chrome DevTools:

1. Open DevTools (`F12` or `Ctrl+Shift+I`).
2. Navigate to the new "Gamezop Analytics" and "Ads Tracker" panels.
3. Monitor collected event data and ad tracking information in real-time.

## Author

This project was developed in-house and authored by **Sahaj**.

## License

This project is licensed under the MIT License.

