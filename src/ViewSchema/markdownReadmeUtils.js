import {
  catalogueInfoFormFields,
  scenarioParentIctGroupMap
} from "../constants/catalogueInfo";

const generateTable = (columns, rows) => {
  const header = `| ${columns.join(" | ")} |\n| ${columns.map(() => "---").join(" | ")} |\n`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [header, body].join("");
};

const escapeMarkdownSpecialCharacters = (pattern) =>
  pattern.replace(/([\\`*_{}[\]()#+\-.!|~])/g, "\\$1");

export const generateFrontMatter = (metaOverlay, catalogueData) => {
  const markdownContent = [
    "---\n",
    "layout: default  \n",
    `title: ${metaOverlay.name}  \n`
  ];

  if (catalogueData) {
    const isParentIctGroup = scenarioParentIctGroupMap[catalogueData.scenario];
    if (
      isParentIctGroup &&
      Object.prototype.hasOwnProperty.call(catalogueData, "ictGroup")
    ) {
      markdownContent.push(`parent: ${catalogueData.ictGroup}  \n`);
    }
  }

  markdownContent.push("---\n\n");

  return markdownContent.join("");
};

export const generateSchemaInformation = (
  metaOverlay,
  captureBaseOverlay,
  catalogueData
) => {
  const markdownContent = [
    "# Schema information\n",
    "{: .no_toc }\n\n",
    "## Table of Contents\n",
    "{: .no_toc .text-delta }\n\n",
    "1. TOC\n",
    "{:toc}\n\n",
    `**Name**: ${metaOverlay.name}  \n`,
    `**Description**: ${metaOverlay.description}  \n`
  ];

  if (captureBaseOverlay.classification) {
    markdownContent.push(`**Classification**: ${captureBaseOverlay.classification}  \n`);
  }

  if (catalogueData) {
    const scenarioFormFields = catalogueInfoFormFields[catalogueData.scenario];
    scenarioFormFields.forEach((field) => {
      markdownContent.push(`**${field.label}**: ${catalogueData[field.name]}  \n`);
    });
  }

  markdownContent.push("\n");

  return markdownContent.join("");
};

export const generateSchemaQuickView = ({
  layers,
  attributeNames,
  currentLanguageCode,
  defaultLanguageCode
}) => {
  const informationOverlay = layers.find(
    (layer) =>
      layer.layerName.includes("information") &&
      (layer.language === currentLanguageCode || layer.language === defaultLanguageCode)
  );
  const labelOverlay = layers.find(
    (layer) =>
      layer.layerName.includes("label") &&
      (layer.language === currentLanguageCode || layer.language === defaultLanguageCode)
  );
  const markdownContent = ["## Schema quick view\n\n"];

  const columns = ["Attribute", "Label", "Description"];
  const rows = attributeNames.map((attribute) => {
    const label = labelOverlay?.attribute_labels?.[attribute] || "";
    const description = informationOverlay?.attribute_information?.[attribute] || "";
    return [attribute, label, description];
  });

  markdownContent.push(generateTable(columns, rows), "\n\n");

  return markdownContent.join("");
};

// It can be safe to assume that schema name and description in at least one language exists
// because a schema bundle cannot be created without a name and description
export const generateInternationalSchemaInformation = (
  layers,
  languages,
  languageCodeLookupMap
) => {
  const markdownContent = ["## International schema information\n\n"];
  const columns = ["Language", "Name", "Description"];
  const rows = [];

  languages.forEach((language) => {
    const languageCode = languageCodeLookupMap[language.toLowerCase()];
    const metaOverlay = layers.find(
      (layer) => layer.layerName.includes("meta") && layer.language === languageCode
    );
    if (!metaOverlay) return;
    rows.push([language, metaOverlay.name, metaOverlay.description]);
  });

  markdownContent.push(generateTable(columns, rows), "\n\n");

  return markdownContent.join("");
};

export const generateEntryCodeTables = (
  layers,
  languages,
  languageCodeLookupMap,
  orderingOverlay = null
) => {
  const markdownContent = ["## Selection lists\n\n"];
  const columns = ["Entry code", "Label"];

  languages.forEach((language) => {
    const languageCode = languageCodeLookupMap[language.toLowerCase()];
    const entryOverlay = layers.find(
      (layer) => layer.layerName.includes("entry/") && layer.language === languageCode
    );
    if (!entryOverlay) return;

    markdownContent.push(`### ${language}\n\n`);

    // Generate a table for each attribute with entry codes
    for (const attribute in entryOverlay.attribute_entries) {
      if (
        Object.prototype.hasOwnProperty.call(entryOverlay.attribute_entries, attribute)
      ) {
        const rows = [];
        markdownContent.push(`#### ${attribute} entry codes\n\n`);
        const entryCodeToLabelMap = entryOverlay.attribute_entries[attribute];
        // Use entry code ordering if present
        const hasEntryCodeOrdering =
          orderingOverlay?.entry_code_ordering?.[attribute]?.length > 0;
        const entryCodes = hasEntryCodeOrdering
          ? orderingOverlay.entry_code_ordering[attribute]
          : Object.keys(entryCodeToLabelMap);

        entryCodes.forEach((entryCode) => {
          const label = entryCodeToLabelMap[entryCode];
          rows.push([entryCode, label]);
        });

        markdownContent.push(generateTable(columns, rows), "\n\n");
      }
    }
  });

  const isNoEntryOverlay = markdownContent.length === 1;

  return isNoEntryOverlay ? "" : markdownContent.join("");
};

export const generateLanguageSpecificSchemaDetailsTable = ({
  layers,
  attributeNames,
  languages,
  languageCodeLookupMap,
  orderingOverlay = null
}) => {
  const markdownContent = ["## Language-specific schema details\n\n"];
  const columns = ["Attribute", "Label", "Description", "List"];

  languages.forEach((language) => {
    markdownContent.push(`### ${language}\n\n`);
    const languageCode = languageCodeLookupMap[language.toLowerCase()];
    const informationOverlay = layers.find(
      (layer) =>
        layer.layerName.includes("information") && layer.language === languageCode
    );
    const labelOverlay = layers.find(
      (layer) => layer.layerName.includes("label") && layer.language === languageCode
    );
    const entryOverlay = layers.find(
      (layer) => layer.layerName.includes("entry/") && layer.language === languageCode
    );

    const rows = attributeNames.map((attribute) => {
      const row = [attribute];

      const label = labelOverlay?.attribute_labels?.[attribute] || "";
      const description = informationOverlay?.attribute_information?.[attribute] || "";

      // Check if an attribute is a list (has entries and entry codes)
      // If entry code ordering is present, use it to generate the ordered list of entry code labels
      const hasEntryCodeOrdering =
        orderingOverlay?.entry_code_ordering?.[attribute]?.length > 0;
      const entryCodeToLabelMap = entryOverlay?.attribute_entries[attribute];
      let list = "Not a list";

      if (entryCodeToLabelMap) {
        list = hasEntryCodeOrdering
          ? orderingOverlay.entry_code_ordering[attribute]
              .map((entryCode) => entryCodeToLabelMap[entryCode])
              .join(", ")
          : Object.values(entryCodeToLabelMap).join(", ");
      }

      row.push(label, description, list);
      return row;
    });

    markdownContent.push(generateTable(columns, rows), "\n\n");
  });

  return markdownContent.join("");
};

export const generateLanguageIndependentSchemaDetailsTable = ({
  layers,
  captureBaseOverlay,
  attributeNames
}) => {
  const markdownContent = ["## Language-independent schema details\n\n"];
  const columns = ["Attribute", "Sensitive", "Unit", "Type", "Character encoding"];

  const unitOverlay = layers.find((layer) => layer.layerName.includes("unit"));

  const characterEncodingOverlay = layers.find((layer) =>
    layer.layerName.includes("character_encoding")
  );

  const conformanceOverlay = layers.find((layer) =>
    layer.layerName.includes("conformance")
  );

  const formatOverlay = layers.find((layer) => layer.layerName.includes("format/"));

  const cardinalityOverlay = layers.find((layer) =>
    layer.layerName.includes("cardinality/")
  );

  const standardOverlay = layers.find((layer) => layer.layerName.includes("standard"));

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
    // In case of OCA bundle generated by OCA repository (JSON schema), units will be in attribute_unit
    const unit =
      unitOverlay?.attribute_units?.[attribute] ||
      unitOverlay?.attribute_unit?.[attribute] ||
      "";

    // Attribute type (a schema bundle must have this information)
    const type = captureBaseOverlay.attributes[attribute];

    const characterEncoding =
      characterEncodingOverlay?.attribute_character_encoding?.[attribute] || "";

    row.push(isSensitive, unit, type, characterEncoding);

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

  markdownContent.push(generateTable(columns, rows), "\n\n");

  return markdownContent.join("");
};

// For ZIP schema bundle
export const generateSAIDTable = (captureBaseSAID, layerToSAIDMap) => {
  const markdownContent = ["## Schema SAIDs\n\n"];
  markdownContent.push(`**Capture base**: ${captureBaseSAID}\n\n`);

  const columns = ["Layer", "SAID"];
  const rows = [];

  for (const layer in layerToSAIDMap) {
    if (Object.prototype.hasOwnProperty.call(layerToSAIDMap, layer)) {
      rows.push([layer, layerToSAIDMap[layer]]);
    }
  }

  markdownContent.push(generateTable(columns, rows), "\n\n");

  return markdownContent.join("");
};

// For JSON schema
export const generateSAIDTableForJson = (captureBaseSAID, layers) => {
  const markdownContent = ["## Schema SAIDs\n\n"];
  markdownContent.push(`**Capture base**: ${captureBaseSAID}\n\n`);

  const columns = ["Layer", "SAID", "Type"];
  const rows = [];

  layers.forEach((layer) => {
    rows.push([layer.name, layer.digest, layer.type]);
  });

  markdownContent.push(generateTable(columns, rows), "\n\n");

  return markdownContent.join("");
};

export const generateCreationTimestamp = () => {
  const date = new Date();

  const formattedDate = date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  // YYYY-MM-DD HH:MM:SS
  const formattedTimestamp = `${formattedDate} ${formattedTime}`;

  return `**Date created**: ${formattedTimestamp}\n\n`;
};

export const downloadMarkdownFile = (markdownContent, fileName) => {
  const blob = new Blob([markdownContent], { type: "text/markdown" });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
