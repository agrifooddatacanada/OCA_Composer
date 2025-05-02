# OCA Composer

[Overlays Capture Architecture (OCA)](https://github.com/the-human-colossus-foundation/oca-spec/tree/master/docs/specification) is an international open standard for writing data schemas. Schemas are a type of documentation that describe the structure and rules for a dataset. The OCA standard is a machine-readable schema standard that is hosted by the [Human Colossus Foundation](https://humancolossus.foundation/).

[Agri-food Data Canada](https://agrifooddatacanada.ca/) at the [University of Guelph](https://www.uoguelph.ca/) has developed the OCA Composer as a tool to help researchers document their data using the OCA standard. The OCA Composer runs in a web browser and presents a graphical user interface that guides users through the process of authoring their own schemas describing their datasets.

You can learn more about schemas and see an implementation of OCA Composer live at the [Semantic Engine](https://www.semanticengine.org/).

## OCA Composer outputs

The OCA Composer is written in React and deployed to a virtual machine which serves the web app to users. The OCA Composer app takes the user inputs and generates two types of files - the OCA File and the OCA Excel Template. Both of these files can be interpreted by parsers to generate the OCA Schema Bundle which is a single JSON file that contains the contents of the schema. Currently in this implementation only the OCA Excel Template is used and parsed to generate the OCA Schema Bundle. In the future, the OCA File will be directly consumed by an OCA Repository.

## Data uploading and OCA Composer

OCA Composer lets users upload a copy of a dataset which is stored in the users local environment, but OCA Composer only uses this to access the first row of the first sheet (if Excel) for attribute names. The data itself is not used further by OCA Composer and does not leave the users computer.

## Consuming OCA Schema Bundle - Readme and Data entry Excel

The JSON schema bundle can be consumed by several tools within the ADC/OCA ecosystem.

- [OCA Readme](https://github.com/agrifooddatacanada/OCA_README) consumes the JSON schema bundle and creates a human-readable plain text schema document.
- [Data Entry Excel](https://github.com/agrifooddatacanada/data-entry-xls) consumes the JSON schema bundle and creates an Excel sheet for data entry based on the information provided for in the schema.

## OCA Composer Theme Re-Branding
 
 The OCA Composer repository supports whitelabeling, allowing the user to customize the theme and branding when embedding it in different applications.
 
 ### Theme Configuration
 In `src/constants`, the file `themeConstants.js` contains theme configurations for different entities. 
 Here, users can add a new theme object with the specific site attributes, such as colors, logos and URLs. 
 
 Follow a format like the following:
 
 ```javascript
 // Add your custom theme here
   yourTheme: {
     primaryColor: "#000000",
     secondaryColor: "#111111",
 
     logos: {
       yourLogo: {
         url: require('../assets/your-logo.png'),
         website: "https://yourwebsite.com",
         alt: "Your Logo",
         style: { width: '200px', cursor: "pointer" }
       },
 
       // Add more logos as needed
     },
 
     typography: {
       fontFamily: "Arial, sans-serif",
     },
 
     buttonStyles: {
       light: "#000000",
       main: "#1111111",
       dark: "#abcdef",
       contrastText: "#FFFFFF",
     },
   }
   ```
 
 ### Embedding OCA Composer
 When embedding the OCA Composer in an application, the theme will be automatically detected from the embedding content. Follow the steps below:
 
 1. **Add Your Theme**:
    - Create a new theme object in `themeConstants.js`
    - Upload your logo files to the assets directory
    - Configure your colors and styles
 
 2. **Embed the Application**:
 ```html
 <iframe 
   src="https://your-oca-composer-url/oca-data-validator"
   height="2000px"
   width="100%"
   style="border: none; border-radius: 10px;"
 ></iframe>
 ```
 
 3. **Domain Detection**:
 The application automatically detects the embedding domain and applies the appropriate theme. No additional configuration is needed.
 
 ### Example Implementation
 Here's an example of embedding OCA Composer in a Shiny application:
 ```r
 # In your Shiny UI
 tags$iframe(
   id = "reactAppIframe",
   src = "https://your-oca-composer-url/oca-data-validator",
   height = "2000px",
   width = "100%",
   style = "border: none; border-radius: 10px; overflow: hidden;"
 )
 ```
 
 ### Communication Between Applications
 When embedded, OCA Composer can communicate with the parent application using postMessage:
 ```javascript
 // In parent application
 window.addEventListener('message', function(event) {
   if (event.origin === 'https://your-oca-composer-url') {
     // Handle messages from OCA Composer
     console.log('Received from OCA Composer:', event.data);
   }
 });
 
 // Sending messages to OCA Composer
 const iframe = document.getElementById('reactAppIframe');
 iframe.contentWindow.postMessage(data, 'https://your-oca-composer-url');
 ```

## Running the app locally

You can clone the project using the git command-line interface or you can download the entire project as a zip using GitHub's user-interface.

Create a `.env` file in the project root directory and add the following environment variable:

```
REACT_APP_GA_ID=0

```

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits to the code.\
You will also see any errors/warnings in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Development Status

This code is created with support by [Agri-food Data Canada](https://agrifooddatacanada.ca/), funded by [CFREF](https://www.cfref-apogee.gc.ca/) through the [Food from Thought grant](https://foodfromthought.ca/) held at the [University of Guelph](https://www.uoguelph.ca/). Currently, we do not provide any warranty of any kind regarding the accuracy, security, completeness or reliability of this code or any of its parts.


# OCA Data Validator File Listener

This document explains how to use the file listener functionality to send JSON files from a parent application to the OCA Data Validator through an iframe.

## Overview

The file listener is a React hook that enables communication between a parent application and the OCA Data Validator through `postMessage`.
It allows you to send JSON files from the parent application to the validator, which will then process them for validation.

## Implementation Details

The file listener is implemented as a React hook (`useFileListener`) that:
1. Sets up a message event listener
2. Processes incoming messages of type 'FILE'
3. Converts the received data into a File object
4. Updates the application state with the received file

## How to Use

### 1. Parent Application Setup

In your parent application, you need to:
1. Create an iframe that points to the OCA Data Validator
2. Send the JSON file using `postMessage`

Here's an example of how to set up the parent application:

```html
<!-- Parent application HTML -->
<iframe id="validatorFrame" src="https://happy-tree-080b9290f.5.azurestaticapps.net/oca-data-validator" style="width: 100%; height: 600px;"></iframe>
```

```javascript
// Parent application JavaScript
const iframe = document.getElementById('validatorFrame');

// Function to send a JSON file to the validator
function sendFileToValidator(jsonData) {
  iframe.contentWindow.postMessage({
    type: 'FILE',
    data: jsonData
  }, '*'); // Replace '*' with the actual origin of the validator for better security
}

// Example usage
const jsonData = {
  // Your JSON data here
};
sendFileToValidator(jsonData);
```

### 2. Message Format

The message sent to the validator must follow this structure:
```javascript
{
  type: 'FILE',
  data: {
    // Your JSON data here
  }
}
```

## Error Handling

The file listener includes error handling for:
- Invalid message formats
- JSON parsing errors
- File creation errors

Errors are logged to the console for debugging purposes.

## Notes

- The received file is automatically named 'schema.json'
- The file path is set to 'oca_bundle.json'
- The file type is set to 'application/json'
- The file is wrapped in an array when setting the state, as the validator expects an array of files 