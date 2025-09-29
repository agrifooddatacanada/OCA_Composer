# OCA Composer

[Overlays Capture Architecture (OCA)](https://github.com/the-human-colossus-foundation/oca-spec/tree/master/docs/specification) is an international open standard for writing data schemas. Schemas describe the structure and rules for a dataset. The OCA standard is a machine-readable schema standard hosted by the [Human Colossus Foundation](https://humancolossus.foundation/).

[Agri-food Data Canada](https://agrifooddatacanada.ca/) at the [University of Guelph](https://www.uoguelph.ca/) developed the OCA Composer to help researchers document their data using the OCA standard. The OCA Composer runs in a web browser and presents a graphical interface that guides users through authoring schemas for their datasets.

You can learn more about schemas and see OCA Composer live at the [Semantic Engine](https://www.semanticengine.org/).

## Table of Contents

- [Introduction](#introduction)
- [Development (Run Locally)](#development-run-locally)
- [Deployment](#deployment)
  - [General guidance](#general-guidance)
  - [Docker Compose](#docker-compose)
- [What OCA Composer Outputs](#what-oca-composer-outputs)
- [Data Privacy: Uploading Data](#data-privacy-uploading-data)
- [Consuming the OCA Schema Bundle](#consuming-the-oca-schema-bundle)
- [Whitelabeling and Theme Re-Branding](#whitelabeling-and-theme-re-branding)
  - [Theme Configuration](#theme-configuration)
  - [Theme Object Components](#theme-object-components)
  - [Logo System](#logo-system)
  - [Embedded OCA Composer](#embedded-oca-composer)
- [Embedding OCA Composer](#embedding-oca-composer)
  - [Overview](#overview)
  - [Implementation](#implementation)
  - [Parent Application Setup](#parent-application-setup)
    - [Create an iframe that points to the OCA Data verifier](#create-an-iframe-that-points-to-the-oca-data-verifier)
    - [Send OCA Schema data as JSON to the iframe](#send-oca-schema-data-as-json-to-the-iframe)
    - [Receive verified data as CSV from the iframe](#receive-verified-data-as-csv-from-the-iframe)
  - [Error Handling](#error-handling)
  - [Notes](#notes)
- [Development Status](#development-status)
- [License](#license)

## Introduction

The OCA Composer is written in React and deployed as a web application. It guides users to define and export OCA-compliant schemas that describe their datasets.

## Development (Run Locally)

You can clone the project or download it as a ZIP from GitHub.

Create a `.env` file in the project root and add:

```
# Google Analytics ID. Use 0 if you don't want to use this feature

REACT_APP_GA_ID=0
```

In the project directory, run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) in your browser.

The page reloads on edits, and you will see any errors/warnings in the console.

## Deployment

### General guidance

This is a standard React (CRA + craco) single-page app that builds to static files under `build/` in production mode and optimizes for performance. The built app is minified and filenames include hashes.

You can deploy it with any static hosting or CDN you’re comfortable with (e.g., Nginx/Apache, Azure Static Web Apps, S3/CloudFront, Netlify, Vercel, etc.). Key points:

- Provide build-time environment variables (e.g., `REACT_APP_GA_ID`) through your CI or build command.
- Create a production build: `npm run build`.
- Serve the `build/` directory via any static server.
- SPA routing: ensure a “rewrite all to /index.html” rule (our `nginx.conf` shows an example using `try_files $uri /index.html;`).

If you already have a React deployment workflow, follow that process.

See [deployment docs](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Docker Compose

You can use Docker Compose as an alternative deployment method. This setup shines in self-hosted environments where [OCA Composer runs embedded in an external application](#oca-data-verifier-embedded-oca-composer). Drop your application into the same `docker-compose.yml`, add a service, and wire it up—no bespoke infrastructure required. You get a clean, repeatable deployment that can be embedded into larger systems without friction.

We keep Nginx as a separate service so it can be updated independently (e.g., to address CVEs) without rebuilding the app. The Compose file builds an assets-only image and serves it with `nginx:alpine`.



1) Create a `.env` file in the repo root (Docker Compose auto-loads it):

```
# Google Analytics ID. Use 0 if you don't want to use this feature

REACT_APP_GA_ID=0
```

2) Build and start:

```bash
docker compose up --build
# Or run in detached mode
docker compose up --build -d
```

3) Open the app:

```
http://localhost:3000
```

Notes:
- Re-run `docker compose up --build` to rebuild assets when the app changes.
- Nginx uses `nginx.conf` from this repo for SPA routing.

## What OCA Composer Outputs

The app generates two types of files from user inputs:

- The OCA File
- The OCA Excel Template

Both can be interpreted by parsers to generate an OCA Schema Bundle (a single JSON file containing the schema). Currently, only the OCA Excel Template is parsed to generate the bundle. In the future, the OCA File will be consumed directly by an OCA Repository.

## Data Privacy: Uploading Data

OCA Composer lets users upload a copy of a dataset, which remains in the user's local environment. OCA Composer only reads the first row of the first sheet (if Excel) to determine attribute names. The data itself is not used further and does not leave the user's computer.

## Consuming the OCA Schema Bundle

The JSON schema bundle can be consumed by tools within the ADC/OCA ecosystem:

- [OCA Readme](https://github.com/agrifooddatacanada/OCA_README): Creates a human-readable plain text schema document.
- [Data Entry Excel](https://github.com/agrifooddatacanada/data-entry-xls): Creates an Excel sheet for data entry based on the schema.

## Whitelabeling and Theme Re-Branding
 
The repository supports whitelabeling, allowing you to customize theme and branding when embedding in different applications.
 
### Theme Configuration
In `src/constants`, `themeConstants.js` contains theme configurations for different entities. Add a new theme object with your colors, logos, and URLs.

Follow a format like:
 
```javascript
// Add your custom theme here
yourTheme: {
  domains: ['yourdomain.com', 'localhost:3000'], // Domains where this theme applies
  primaryColor: "#000000",
  secondaryColor: "#111111",

  logos: {
    primaryLogo: {
      url: require('../assets/your-logo.png'),
      website: "https://yourwebsite.com",
      alt: "Your Logo",
      style: { width: '200px', cursor: "pointer" }
    },

    // Multiple supported logos - will be rendered dynamically
    supportedByLogo1: {
      url: require('../assets/supported-logo1.png'),
      alt: "Supported Logo 1",
      style: { height: "120px" }
    },
    supportedByLogo2: {
      url: require('../assets/supported-logo2.png'),
      alt: "Supported Logo 2", 
      style: { height: "120px" }
    },
    // Add more supportedByLogo objects as needed (supportedByLogo3, supportedByLogo4, etc.)
  },

  typography: {
    fontFamily: "Arial, sans-serif",
  },

  buttonStyles: {
    primary: "#000000",
    secondary: "#111111",
    contrastText: "#FFFFFF",
  }
}
``` 
 
### Theme Object Components
 
**`domains`** (Array of strings)
- Specifies which domains this theme should be applied to
- Used for automatic theme detection based on the current domain
- Example: `['yourdomain.com', 'localhost:3000', 'staging.yourdomain.com']`
- If the current domain matches any in this array, this theme will be applied
 
**`primaryColor`** (String - Hex color)
- The main brand color used throughout the application
- Used for primary buttons, links, and accent elements
- Example: `"#94002a"` (dark red)
 
**`secondaryColor`** (String - Hex color)
- Secondary brand color used for hover states and secondary elements
- Often a lighter or complementary version of the primary color
- Example: `"#ce1141"` (lighter red)
 
**`logos`** (Object)
Contains all logo configurations for the theme:
 
- **`primaryLogo`** (Object): The main branding logo
  - `url`: Path to the logo image file (use `require()` for local assets)
  - `website`: URL where clicking the logo should navigate (optional)
  - `alt`: Alt text for accessibility
  - `style`: CSS styles object for the logo (width, height, cursor, etc.)
 
- **`supportedByLogo1`, `supportedByLogo2`, etc.** (Objects): Supporting organization logos
  - These are rendered dynamically - you can add as many as needed
  - Each follows the same structure as `primaryLogo`
  - The system automatically detects and renders all `supportedByLogo` objects
  - Numbered sequentially: `supportedByLogo1`, `supportedByLogo2`, `supportedByLogo3`, etc.
 
**`typography`** (Object)
- **`fontFamily`**: CSS font-family value for the application
- Example: `"Roboto, sans-serif"`, `"Arial, sans-serif"`, `"Courier New"`
 
**`buttonStyles`** (Object)
Defines the color scheme for buttons throughout the application:
- **`primary`**: Color for primary action buttons
- **`secondary`**: Color for secondary buttons and hover states
- **`contrastText`**: Text color that provides good contrast against button backgrounds (usually white or black)
 
### Logo System

The logo system supports:

- **Primary Logo**: Main branding logo with optional website link
- **Multiple Supported Logos**: Dynamic rendering of multiple `supportedByLogo` objects
- **Automatic Detection**: Automatically detects and renders all `supportedByLogo1`, `supportedByLogo2`, etc.
- **Flexible Styling**: Each logo can have its own styling and alt text
 
### Embedded OCA Composer

When [embedding OCA Composer](#embedding-oca-composer), the theme is automatically detected from the embedding context:
 
1. **Add Your Theme**
   - Create a new theme object in `themeConstants.js`
   - Upload your logo files to the assets directory
   - Configure your colors and styles
   - Add your domains to the `domains` array
 
2. **Theme Detection**
   - The system automatically detects the theme based on the current domain
   - If no matching domain is found, it falls back to the `default` theme
   - Theme detection is handled by `src/utils/themeDetector.js`
 
3. **Dynamic Updates**
   - Themes update automatically when the domain changes
   - All components using theme colors update dynamically
   - Logo rendering is automatic based on your configuration

## Embedding OCA Composer

OCA Composer can be embedded as an iframe, especially to use the OCA Data Verifier natively inside other applications. This feature explains how to send JSON schema files from a parent application to the OCA Data Verifier through an iframe.

### Overview

The file listener is a React hook that enables communication between a parent application and the OCA Data Verifier through `postMessage`.
It allows you to send JSON files from the parent application to the verifier, which will then process them for validation.

### Implementation

The file listener is implemented as a React hook (`useFileListener`) that:
1. Sets up a message event listener
2. Processes incoming messages of type `JSON_SCHEMA`
3. Converts the received data into a File object
4. Updates the application state with the received file
5. Sends back verified data as `VERIFIED_DATA` message type

#### Parent Application Setup

In your parent application:
1. Create an iframe that points to the OCA Data verifier
2. Send the JSON file using `postMessage`
3. Receive verified data using `addEventListener`


##### Create an iframe that points to the OCA Data verifier

Example parent application HTML for the iframe:

```html
<!-- Parent application HTML -->
<iframe id="verifierFrame" src="https://www.semanticengine.org/oca-data-verifier" style="width: 100%; height: 600px;"></iframe>
```

##### Send OCA Schema data as JSON to the iframe

Example javascript to send JSON file via `postMessage`:

```javascript
// Parent application JavaScript
const iframe = document.getElementById('verifierFrame');

// Function to send a JSON file to the verifier
function sendFileToVerifier(jsonData) {
  iframe.contentWindow.postMessage({
    type: 'JSON_SCHEMA', // This type is hardcoded on OCA Composer, so you can't change it
    data: jsonData // this is your json schema here
  }, '*'); // Replace '*' with the actual origin of the verifier for better security
}

// Example usage - JSON data must follow this structure
const jsonData = {
  "bundle": {
    "v": "OCAB10JSON0010eb_",
    "d": "EMY8Z5PAJSJ4RknrB4FVHhslCAa2kecE_UuooZXHgocZ",
    "capture_base": {
      "d": "EK2EbGdxi56FIUqT42NP2wl31eSCld97wJao9dhkDr9O",
      "type": "spec/capture_base/1.0",
      "classification": "",
      "attributes": {
        "Age": "Numeric",
        "BreastWt": "Numeric",
        "Breed": "Text",
        "Farm": "Text",
        "Glucose": "Numeric",
        "Lipase": "Numeric",
        "LiveWt": "Numeric"
      },
      "flagged_attributes": []
    },
  }
};

sendFileToVerifier(jsonData);
```

##### Receive verified data as CSV from the iframe

Set up an event listener in your JavaScript code, typically on the `window` object:

```javascript
window.addEventListener('message', receiveData)

function receiveData(event) {
  // Check the origin of the message for security
  if (event.origin !== 'https://www.semanticengine.org/') {
    return // Ignore messages from unknown origins
  }

  // Check the type of the message.
  // OCA Composer has the event data type hard-coded as VERIFIED_DATA
  if (event.data.type === 'VERIFIED_DATA') {
    const csvData = event.data.data
    // Handle the CSV data as needed
    console.log('Received CSV data:', csvData)
  }
}
```

The message received from the Semantic Engine has this format:

```javascript
{
  type: 'VERIFIED_DATA', // Always check object.type === 'VERIFIED_DATA'
  data: // the verified data as a csv string
}
```

###### Example usage of verified data received

- The example below shows how to convert the CSV string into a downloadable CSV file.
- Alternatively, you can send the CSV string to your database/storage via a POST request.

```javascript
// Check the type of the message
if (event.data.type === 'VERIFIED_DATA') {
  const csvData = event.data.data; // Assuming this is the CSV string received

  // Create a Blob from the CSV string
  const blob = new Blob([csvData], { type: 'text/csv' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger the download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'validatedData.csv'; // Specify the filename for the download
  document.body.appendChild(a); // Append the anchor to the body
  a.click(); // Trigger the download

  // Clean up: remove the anchor and revoke the URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### Error Handling

The file listener includes error handling for:
- Invalid message formats
- JSON parsing errors
- File creation errors

Errors are logged to the console for debugging.

### Notes

- The received file is automatically named `schema.json`.
- The file path is set to `oca_bundle.json`.
- The file type is `application/json`.
- The file is wrapped in an array when setting state, as the verifier expects an array of files.

# Development Status

This code is created with support by [Agri-food Data Canada](https://agrifooddatacanada.ca/), funded by [CFREF](https://www.cfref-apogee.gc.ca/) through the [Food from Thought grant](https://foodfromthought.ca/) held at the [University of Guelph](https://www.uoguelph.ca/). Currently, we do not provide any warranty of any kind regarding the accuracy, security, completeness or reliability of this code or any of its parts.

# License

This project is licensed under the terms of the LICENSE file included in the repository.