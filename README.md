# OCA Composer

[Overlays Capture Architecture (OCA)](https://github.com/the-human-colossus-foundation/oca-spec/tree/master/docs/specification) is an international open standard for writing data schemas. Schemas are a type of documentation that describe the structure and rules for a dataset. The OCA standard is a machine-readable schema standard that is hosted by the [Human Colossus Foundation](https://humancolossus.foundation/).

[Agri-food Data Canada](https://agrifooddatacanada.ca/) at the [University of Guelph](https://www.uoguelph.ca/) has developed the OCA Composer as a tool to help researchers document their data using the OCA standard. The OCA Composer runs in a web browser and presents a graphical user interface that guides users through the process of authoring their own schemas describing their datasets.

You can learn more about schemas and see an implementation of OCA Composer live at the [Semantic Engine](https://www.semanticengine.org/).

## OCA Composer outputs

The OCA Composer is written in React and deployed to a virtual machine which serves the web app to users. The OCA Composer app takes the user inputs and generates two types of files - the OCA File and the OCA Excel Template. Both of these files can be interpreted by parsers to generate the OCA Schema Bundle which is a single JSON file that contains the contents of the schema. Currently in this implementation only the OCA Excel Template is used and parsed to generate the OCA Schema Bundle. In the future, the OCA File will be directly consumed by an OCA Repository.

## Consuming OCA Schema Bundle - Readme and Data entry Excel

The JSON schema bundle can be consumed by several tools within the ADC/OCA ecosystem.
* [OCA Readme](https://github.com/agrifooddatacanada/OCA_README) consumes the JSON schema bundle and creates a human-readable plain text schema document.
* [Data Entry Excel]() consumes the JSON schema bundle and creates an Excel sheet for data entry based on the information provided for in the schema.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Development Status

This code is created with support by [Agri-food Data Canada](https://agrifooddatacanada.ca/), funded by [CFREF](https://www.cfref-apogee.gc.ca/) through the [Food from Thought grant](https://foodfromthought.ca/) held at the [University of Guelph](https://www.uoguelph.ca/). Currently, we do not provide any warranty of any kind regarding the accuracy, security, completeness or reliability of this code or any of its parts.
