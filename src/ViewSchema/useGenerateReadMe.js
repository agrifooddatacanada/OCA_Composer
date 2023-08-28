
const readmeText = `
This is a human-readable format of an OCA schema
OCA_READ_ME/1.0

Reference for Overlays Capture Architecture (OCA): 
https://doi.org/10.5281/zenodo.7707467

Reference for OCA_READ_ME/1.0:
https://github.com/agrifooddatacanada/OCA_README

In OCA, a schema consists of a capture_base which documents the attributes and their most basic features.
A schema may also contain overlays which add details to the capture_base.
For each overlay and capture_base, a hash of their original contents has been calculated and is reported here as the SAID value.

This README format documents the capture_base and overlays that were associated together in a single OCA Bundle.
OCA_MANIFEST lists all components of the OCA Bundle.
For the OCA_BUNDLE, each section between rows of ****'s contains the details of one "layer type/version" of the OCA Bundle.\n\n`;

const useGenerateReadMe = () => {

  const toTextFile = async (jsonFilesArray) => {
    // declare the variables
    const textFile = [];
    const variablesArray = [];
    let Manifest = [];
    let layer_name = null;
    let SAID = null;

    for (const jsonFile of jsonFilesArray) {
       // the object to store other variables of an overlay other than "Layer_name" and the overaly "SAID"
      const other_variables = {};
      // flag to check if "files" property is present useful to generate the OCA_MANIFEST
      let hasFilesProperty = false; 
      const json = JSON.parse(jsonFile);

      if (json.hasOwnProperty("files")) {
        const files = json.files;
        // creating the capture_base key-value pair
        const capture_base_key_value_pair = { capture_base: Object.keys(files) };
        const other_manifest_variables = [capture_base_key_value_pair, ...Object.values(files)];
        Manifest.push(other_manifest_variables);
        hasFilesProperty = true;
      }

      // for other overalys that are not meta.json
      if (hasFilesProperty) {
        continue;
      }

      for (const key in json) {
        const value = json[key];

        if (key === "type") {
          const split_type = value.split("/");
          layer_name = split_type.slice(-2).join("/");
        } else if (key === "digest") {
          SAID = value;
        } else if (key !== "capture_base" && value != null) {
          if (Object.keys(value).length !== 0 || (Array.isArray(value) && value.length !== 0)) {
            other_variables[key] = value;
          }
        }
      }

      // variable keeps all the variables of an overlay including "Layer_name" and the overaly "SAID"
      const variables = {
        Layer_name: layer_name,
        SAID: SAID,
        ...other_variables,
      };
      variablesArray.push(variables);
      // shifting the the variableArray to have the capture_base as the first element always
      for (let i = 0; i < variablesArray.length; i++) {
        if (variablesArray[i].hasOwnProperty("classification")) {
          const classifiedVariable = variablesArray.splice(i, 1)[0];
          variablesArray.unshift(classifiedVariable);
          break;
        }
      }

    }

    // turning OCA bundle into OCA_README begins here
    textFile.push(
      readmeText,
      "BEGIN_OCA_MANIFEST\n",
      "**********************************************************************\n",
    );
    // the OCA MANIFEST (all the overlay hashes (SAIDs))
    const manifest_string = JSON.stringify(Manifest, null, 0);
    const cleaned_manifest = manifest_string.replace(/[\[\]{}]/g, '').replace(/\n/g, '').replace(/,/g, ',\n').replace(/:/g, ' SAID: ');
    textFile.push(
      cleaned_manifest,
      "\n",
      "**********************************************************************\n",
      "END_OCA_MANIFEST\n\n",
      "BEGIN_OCA_BUNDLE\n",
      "**********************************************************************"
    );

    // for each overlay individually, counting all possible cases that needs regex handling
    for (const variable of variablesArray) {
      if (variable.Layer_name === "capture_base") {
        const index = variablesArray.indexOf(variable);
        variablesArray.splice(index, 1);
        variablesArray.unshift(variable);
      }
    }
    variablesArray.forEach((variable) => {

      // renaming the overlay variables to match the OCA_READ_ME format
      const schemaAttributeKeysToRemove = ['flagged_attributes', 'attribute', 'attributes', 'attr'];

      for (const key in variable) {
        if (!schemaAttributeKeysToRemove.includes(key)) {
          const newKey = key.includes('attribute') || key.includes('attributes') || key === 'attr'
            ? 'Schema attribute'
            : key;
          variable[newKey] = variable[key];
          if (newKey !== key) {
            delete variable[key];
          }
        }
      }

      const schemaAttribute = variable["Schema attribute"];
      if (schemaAttribute && typeof schemaAttribute === 'object') {
        Object.keys(schemaAttribute).forEach(key => {
          if (!schemaAttribute[key]) {
            delete schemaAttribute[key];
          }
        });

        if (Object.keys(schemaAttribute).length === 0) {
          delete variable["Schema attribute"];
        }
      }

      // Handle the special case when the key is "attributes" {for capture_base}
      const attributesValue = variable["attributes"];
      if (attributesValue === undefined || attributesValue === null || attributesValue === '') {
        delete variable["attributes"];
      } else {
        variable["Schema attribute"] = variable["attributes"];
        delete variable["attributes"];
      }

      // handling indentation 
      const text = JSON.stringify(variable, null, 3);
      const cleaned_text = text.replace(/^ {3}/mg, '').replace(/[{}"]/g, '');

      // Remove commas only for strings not enclosed in square brackets
      const result = cleaned_text.replace(/(\[[^\]]*\]|[^[\],]+),?/g, (match, group) => {
        if (match.includes('[') && match.includes(']')) {
          // If enclosed in square brackets, keep it on the same line and remove inner whitespaces
          return group.replace(/\n/g, '').replace(/\s+/g, '');
        } else {
          return group.replace(/,/g, ''); // Otherwise, remove the commas
        }
      });

      // adding overaly name to the textFile 
      const text_with_schema_attributes = result.replace(/Schema attribute:/g, '\nSchema attribute: ' + variable.Layer_name);
      // const text_with_schema_attributes = result.replace(/Schema attribute:/g, ' Schema attribute: ' + variable.Layer_name);

      const text_with_schema_layer_name = text_with_schema_attributes.replace(/Layer_name:/g, 'Layer name:');

      if (!textFile.includes(text_with_schema_layer_name)) {
        textFile.push(
          text_with_schema_layer_name);
        textFile.push("**********************************************************************");
      }
    });

    textFile.push("\nEND_OCA_BUNDLE")

    const text = textFile.join('');
    const textBlob = new Blob([text], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(textBlob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'README_OCA_schema.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return { toTextFile };
};

export default useGenerateReadMe;