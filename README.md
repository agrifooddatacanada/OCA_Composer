# OCA Composer

[Overlays Capture Architecture (OCA)](https://github.com/the-human-colossus-foundation/oca-spec/tree/master/docs/specification) is an international open standard for writing data schemas. Schemas describe the structure and rules for a dataset. The OCA standard is a machine-readable schema standard hosted by the [Human Colossus Foundation](https://humancolossus.foundation/).

[Agri-food Data Canada](https://agrifooddatacanada.ca/) at the [University of Guelph](https://www.uoguelph.ca/) developed the OCA Composer to help researchers document their data using the OCA standard. The OCA Composer runs in a web browser and presents a graphical interface that guides users through authoring schemas for their datasets.

You can learn more about schemas and see OCA Composer live at the [Semantic Engine](https://www.semanticengine.org/).

## Table of Contents

- [Introduction](#introduction)
- [Quick Start: Run Locally](#quick-start-run-locally)
- [What OCA Composer Outputs](#what-oca-composer-outputs)
- [Data Privacy: Uploading Data](#data-privacy-uploading-data)
- [Consuming the OCA Schema Bundle](#consuming-the-oca-schema-bundle)
- [Whitelabeling and Theme Re-Branding](#whitelabeling-and-theme-re-branding)
  - [Theme Configuration](#theme-configuration)
  - [Theme Object Components](#theme-object-components)
  - [Logo System](#logo-system)
  - [Embedding OCA Composer](#embedding-oca-composer)
- [Iframe File Listener (OCA Data Verifier)](#iframe-file-listener-oca-data-verifier)
  - [Overview](#overview)
  - [Implementation Details](#implementation-details)
  - [How to Use](#how-to-use)
  - [Receiving Data from the Iframe](#2-receiving-data-from-the-iframe-in-your-parent-component)
  - [Error Handling](#error-handling)
  - [Notes](#notes)
- [Development Status](#development-status)
- [License](#license)

## Introduction

The OCA Composer is written in React and deployed as a web application. It guides users to define and export OCA-compliant schemas that describe their datasets.

## Quick Start: Run Locally

You can clone the project or download it as a ZIP from GitHub.

Create a `.env` file in the project root and add:

```
REACT_APP_GA_ID=0

```

In the project directory, run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) in your browser.

The page reloads on edits, and you will see any errors/warnings in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It bundles React in production mode and optimizes for performance.

The build is minified and filenames include hashes.\
Your app is ready to deploy.

See [deployment docs](https://facebook.github.io/create-react-app/docs/deployment) for more information.

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
 
### Embedding OCA Composer

When embedding OCA Composer, the theme is automatically detected from the embedding context:
 
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

## Iframe File Listener (OCA Data Verifier)

This feature explains how to send JSON schema files from a parent application to the OCA Data Verifier through an iframe.

### Overview

The file listener is a React hook that enables communication between a parent application and the OCA Data Verifier through `postMessage`.
It allows you to send JSON files from the parent application to the verifier, which will then process them for verification.

### Implementation Details

The file listener is implemented as a React hook (`useFileListener`) that:
1. Sets up a message event listener
2. Processes incoming messages of type `JSON_SCHEMA`
3. Converts the received data into a File object
4. Updates the application state with the received file

### How to Use

#### 1. Parent Application Setup

In your parent application:
1. Create an iframe that points to the OCA Data verifier
2. Send the JSON file using `postMessage`

Example parent application HTML:

```html
<!-- Parent application HTML -->
<iframe id="verifierFrame" src="https://www.semanticengine.org/oca-data-verifier" style="width: 100%; height: 600px;"></iframe>
```

#### Sent Message Format

The message sent to the verifier must follow this structure:
```javascript
{
  type: 'JSON_SCHEMA',
  data: {
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
  }
  // example schema data
}
```
Include `type: 'JSON_SCHEMA'` — the verifier checks `type === 'JSON_SCHEMA'`.

```javascript
// Parent application JavaScript
const iframe = document.getElementById('verifierFrame');

// Function to send a JSON file to the verifier
function sendFileToVerifier(jsonData) {
  iframe.contentWindow.postMessage({
    type: 'JSON_SCHEMA',
    data: jsonData // add your json schema here
  }, '*'); // Replace '*' with the actual origin of the verifier for better security
}

// Example usage
const jsonData = {
  // Your JSON data here
};
sendFileToVerifier(jsonData);
```

### 2. Receiving Data from the Iframe (in your parent component)

Set up an event listener in your JavaScript code, typically on the `window` object:

```javascript
window.addEventListener('message', receiveData)

function receiveData(event) {
  // Check the origin of the message for security
  if (event.origin !== 'https://www.semanticengine.org/') {
    return // Ignore messages from unknown origins
  }

  // Check the type of the message
  if (event.data.type === 'VERIFIED_DATA') {
    const csvData = event.data.data
    // Handle the CSV data as needed
    console.log('Received CSV data:', csvData)
  }
}
```

#### Received Message Format

The message received from the Semantic Engine has this format:
```javascript
{
  type: 'VERIFIED_DATA', // Always check object.type === 'VERIFIED_DATA'
  data: // the verified data as a csv string
}
```

#### Example usage of data
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
  a.download = 'verifiedData.csv'; // Specify the filename for the download
  document.body.appendChild(a); // Append the anchor to the body
  a.click(); // Trigger the download

  // Clean up: remove the anchor and revoke the URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

#### Explanation
- This demo shows how to convert the CSV string into a downloadable CSV file.
- Alternatively, send the CSV string to your database/storage via a POST request.

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

## Development Status

This code is created with support by [Agri-food Data Canada](https://agrifooddatacanada.ca/), funded by [CFREF](https://www.cfref-apogee.gc.ca/) through the [Food from Thought grant](https://foodfromthought.ca/) held at the [University of Guelph](https://www.uoguelph.ca/). Currently, we do not provide any warranty of any kind regarding the accuracy, security, completeness or reliability of this code or any of its parts.

## License

This project is licensed under the terms of the LICENSE file included in the repository.