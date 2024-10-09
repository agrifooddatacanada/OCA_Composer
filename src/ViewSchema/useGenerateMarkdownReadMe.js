// Generate markdown readme from schema bundle zip

import { useContext } from "react";
import { Context } from "../App";
import i18next from "i18next";
import { codesToLanguages, languageCodesObject } from "../constants/isoCodes";

const useGenerateMarkdownReadMe = () => {
  const { languages } = useContext(Context);
  // Ensuring that the currently selected site language is one of the languages of the schema
  const currentLanguageCode = languages.some((language) => language === codesToLanguages[i18next.language]) ? i18next.language : 'en';
  
  // The schema bundle items are in JSON
  const generateMarkdownReadMe = (schemaBundleItems) => {
    let fileContent = "";
    let captureBaseSAID = "";
    let layerToSAIDMap = null;
    const layers = [];
  
    schemaBundleItems.forEach(bundleItem => {
      const parsedBundleItem = JSON.parse(bundleItem);
      // If it is the meta.json file (provides key-value mappings between the file names and the names of the OCA object types)
      // The file names are the corresponding SAIDs (digests) of the OCA layers
      if (parsedBundleItem.hasOwnProperty("files")) {
        captureBaseSAID = parsedBundleItem.root;
        layerToSAIDMap = parsedBundleItem.files[captureBaseSAID];
        return;
      }
  
      const { capture_base, type, ...rest } = parsedBundleItem;
      layers.push({
        layerName: type.split("/").slice(-2).join("/"),
        ...rest
      });
    });

    const captureBaseOverlay = layers.find((layer) => layer.layerName.includes("capture_base"));
    const attributeNames = Object.keys(captureBaseOverlay.attributes);
    
    fileContent += generateSchemaInformation(layers, captureBaseOverlay, currentLanguageCode);
    fileContent += generateSchemaQuickView(layers, attributeNames, currentLanguageCode);
    fileContent += generateInternationalSchemaInformation(layers, languages);
    fileContent += generateEntryCodeTables(layers, languages);
    fileContent += generateExtendedSchemaDetailsTable(layers, captureBaseOverlay, attributeNames, languages);
    fileContent += generateSAIDTable(captureBaseSAID, layerToSAIDMap);

    downloadMarkdownFile(fileContent);
  }
  return { generateMarkdownReadMe };
}

const generateSchemaInformation = (layers, captureBaseOverlay, currentLanguageCode) => {
  const metaOverlay = layers.find((layer) => layer.layerName.includes("meta") && layer.language === currentLanguageCode);
  const markdownContent = [
    "## Schema information\n",
    `**Name**: ${metaOverlay.name}  \n`,
    `**Description**: ${metaOverlay.description}  \n`
  ];

  if (captureBaseOverlay.classification) {
    markdownContent.push(`**Classification**: ${captureBaseOverlay.classification}  \n`);
  }

  return markdownContent.join("");
}

const generateSchemaQuickView = (layers, attributeNames, currentLanguageCode) => {
  // Label and information overlays will always exist even if attributes don't have a label and description
  // In case of no label or description, their values will be empty string
  const informationOverlay = layers.find((layer) => layer.layerName.includes("information") && layer.language === currentLanguageCode);
  const labelOverlay = layers.find((layer) => layer.layerName.includes("label") && layer.language === currentLanguageCode);
  const markdownContent = ["## Schema quick view\n"];

  const columns = ["Attribute", "Label", "Description"];
  const rows = attributeNames.map((attribute) => {
    const label = labelOverlay.attribute_labels[attribute];
    const description = informationOverlay.attribute_information[attribute];
    return [attribute, label, description];
  });

  markdownContent.push(generateTable(columns, rows), "\n");

  return markdownContent.join("");
}

// It can be safe to assume that schema name and description in at least one language exists
// because a schema bundle cannot be created without a name and description
const generateInternationalSchemaInformation = (layers, languages) => {
  const markdownContent = ["## International schema information\n"];
  const columns = ["Language", "Name", "Description"];
  const rows = [];

  languages.forEach((language) => {
    const languageCode = languageCodesObject[language.toLowerCase()];
    const metaOverlay = layers.find((layer) => layer.layerName.includes('meta') && layer.language === languageCode);
    if (!metaOverlay) return;
    rows.push([language, metaOverlay.name, metaOverlay.description]);
  });

  markdownContent.push(generateTable(columns, rows), "\n");

  return markdownContent.join("");
}

const generateEntryCodeTables = (layers, languages) => {
  const markdownContent = ["## Selection lists\n"];
  const columns = ["Entry code", "Label"];

  languages.forEach((language) => {
    const languageCode = languageCodesObject[language.toLowerCase()];
    const entryOverlay = layers.find((layer) => layer.layerName.includes('entry/') && layer.language === languageCode);
    if (!entryOverlay) return;

    markdownContent.push(`### ${language}\n`);

    // Generate a table for each attribute with entry codes
    for (const attribute in entryOverlay.attribute_entries) {
      const rows = [];
      markdownContent.push(`#### ${attribute} entry codes\n`);
      const entryCodeToLabelMap = entryOverlay.attribute_entries[attribute];

      for (const entryCode in entryCodeToLabelMap) {
        const label = entryCodeToLabelMap[entryCode];
        rows.push([entryCode, label]);
      }

      markdownContent.push(generateTable(columns, rows), "\n");
    }
  });

  const isNoEntryOverlay = markdownContent.length === 1;

  return isNoEntryOverlay ? "" : markdownContent.join("");
}

const generateExtendedSchemaDetailsTable = (layers, captureBaseOverlay, attributeNames, languages) => {
  const markdownContent = ["## Schema details\n"];
  const columns = ["Attribute", "Sensitive", "Unit", "Type", "Label", "Description", "List", "Character encoding"];

  languages.forEach((language) => {
    markdownContent.push(`### ${language}\n`);
    const languageCode = languageCodesObject[language.toLowerCase()];
    const informationOverlay = layers.find((layer) => layer.layerName.includes("information") && layer.language === languageCode);
    const labelOverlay = layers.find((layer) => layer.layerName.includes("label") && layer.language === languageCode);
    const unitOverlay = layers.find((layer) => layer.layerName.includes('unit'));
    const entryOverlay = layers.find((layer) => layer.layerName.includes('entry/') && layer.language === languageCode);
    const characterEncodingOverlay = layers.find((layer) => layer.layerName.includes('character_encoding'));
    const conformanceOverlay = layers.find((layer) => layer.layerName.includes('conformance'));
    const formatOverlay = layers.find((layer) => layer.layerName.includes('format/'));
    const cardinalityOverlay = layers.find((layer) => layer.layerName.includes('cardinality/'));
    const standardOverlay = layers.find((layer) => layer.layerName.includes('standard'));

    if (conformanceOverlay?.attribute_conformance) {
      columns.push("Required entry");
    }

    if (formatOverlay) {
      columns.push("Format rule");
    }

    if (cardinalityOverlay) {
      columns.push("Cardinality");
    }

    if (standardOverlay) {
      columns.push("Data standard");
    }

    const rows = attributeNames.map((attribute) => {
      const row = [attribute];

      const isSensitive = captureBaseOverlay.flagged_attributes.includes(attribute);
      const unit = unitOverlay?.attribute_units[attribute] || "";

      // Attribute type (a schema bundle must have this information)
      const type = captureBaseOverlay.attributes[attribute];

      const label = labelOverlay.attribute_labels[attribute];
      const description = informationOverlay.attribute_information[attribute];

      // Check if an attribute is a list (has entries and entry codes)
      const entryCodeToLabelMap = entryOverlay?.attribute_entries[attribute];
      const list = entryCodeToLabelMap ? Object.values(entryCodeToLabelMap).join(", ") : "Not a list";

      const characterEncoding = characterEncodingOverlay.attribute_character_encoding[attribute] 
        || characterEncodingOverlay.default_character_encoding;

      row.push(
        isSensitive, 
        unit, 
        type, 
        label, 
        description, 
        list, 
        characterEncoding,
      );

      if (conformanceOverlay?.attribute_conformance) {
        const isRequired = conformanceOverlay.attribute_conformance[attribute] === "M";
        row.push(isRequired);
      }

      if (formatOverlay) {
        const format = formatOverlay.attribute_formats[attribute] || "";
        const escapedFormat = escapeMarkdownSpecialCharacters(format);
        row.push(escapedFormat);
      }

      if (cardinalityOverlay) {
        const cardinality = cardinalityOverlay.attribute_cardinality[attribute] || "";
        row.push(cardinality);
      }

      if (standardOverlay) {
        const standard = standardOverlay.attr_standards[attribute] || "";
        row.push(standard);
      }

      return row;
    });

    markdownContent.push(generateTable(columns, rows), "\n");
  });

  return markdownContent.join("");
}

function generateSAIDTable(captureBaseSAID, layerToSAIDMap) {
  const markdownContent = ["## Schema SAIDs\n"];
  markdownContent.push(`**Capture base**: ${captureBaseSAID}\n`);

  const columns = ["Layer", "SAID"];
  const rows = [];

  for (const layer in layerToSAIDMap) {
    rows.push([layer, layerToSAIDMap[layer]]);
  }

  markdownContent.push(generateTable(columns, rows), "\n");

  return markdownContent.join("");
}

const generateTable = (columns, rows) => {
  const header = `| ${columns.join(" | ")} |\n| ${columns.map(() => "---").join(" | ")} |\n`;
  const body = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  return [header, body].join("");
}

const escapeMarkdownSpecialCharacters = (pattern) => {
  return pattern.replace(/([\\`*_{}[\]()#+\-.!|~])/g, '\\$1');
}

const downloadMarkdownFile = (markdownContent) => {

  const blob = new Blob([markdownContent], { type: "text/markdown" });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "README_OCA_schema.md";
  document.body.appendChild(link);
  link.click();

  // cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export default useGenerateMarkdownReadMe;