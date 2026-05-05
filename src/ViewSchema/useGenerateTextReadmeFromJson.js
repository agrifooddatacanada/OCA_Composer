import {
  getDescriptiveFileName,
  getOrderedAttributeMap,
  getOrderedEntries,
  normalizeEscapedQuotes
} from "../utils/helpers";
import { getPackageDependencies } from "../utils/packageUtils";
import {
  ADC,
  FORM,
  RANGE,
  SENSITIVE,
  UNIT_FRAMING,
  DECIMAL_SEPARATOR,
  FILE_DELIMITER,
  ARRAY_DELIMITER
} from "../constants/constants";

const readmeText = `
BEGIN_REFERENCE_MATERIAL
******************************************************************
OCA_READ_ME/1.0
This is a human-readable schema, based on the OCA schema standard.

Reference for Overlays Capture Architecture (OCA):
https://doi.org/10.5281/zenodo.7707467

Reference for OCA_READ_ME/1.0:
https://github.com/agrifooddatacanada/OCA_README

A schema describes details about a dataset.
In OCA, a schema consists of a capture_base which documents the attributes and their most basic features.
A schema may also contain overlays which add details to the capture_base.
For each overlay and capture_base, a hash of their original contents has been calculated and is reported here as the SAID value.

This README format documents the capture_base and overlays that were associated together in a single OCA Bundle.
OCA_MANIFEST lists all components of the OCA Bundle.
For the OCA_BUNDLE, each section between rows of ****'s contains the details of one "layer type/version" of the OCA Bundle.
******************************************************************
END_REFERENCE_MATERIAL\n\n`;

// Helper: build overlay SAID map + overlay text blocks for a schema bundle
// Returns { overlaySaids, overlayTexts }
const buildOverlayMaps = (bundle = {}, orderingOverlay = {}) => {
  const overlaySaids = {};
  const overlayTexts = {};

  const hasAttrOrder = orderingOverlay?.attribute_ordering?.length > 0;
  const hasEntryCodeOrder = Object.keys(orderingOverlay?.entry_code_ordering || {}).length > 0;

  // capture_base (if present)
  if (bundle.capture_base) {
    const said = bundle.capture_base.d;
    const layer_name = bundle.capture_base.type;
    const { classification } = bundle.capture_base;
    const schema_attributes = hasAttrOrder
      ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, bundle.capture_base.attributes)
      : bundle.capture_base.attributes;

    overlaySaids[layer_name] = said;
    overlayTexts.capture_base =
      `Layer name: ${layer_name}\n` +
      `SAID/digest: ${said}\n` +
      `Classification: ${classification}\n` +
      "\n" +
      `Schema attributes: data type\n` +
      `${Object.entries(schema_attributes)
        .map(([key, value]) => `    ${key}: ${Array.isArray(value) ? `Array[${value[0]}]` : value}`)
        .join("\n")}\n` +
      "\n";
  }

  const overlays = bundle.overlays || {};

  // meta (language-specific; array or single)
  if (overlays.meta) {
    const metas = Array.isArray(overlays.meta) ? overlays.meta : [overlays.meta];
    overlayTexts.meta = metas
      .map((overlay) => {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const { description } = overlay;
        overlaySaids[`${layer_name} (${lang})`] = said;
        return (
          `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `Language: ${lang}\n` +
          `Description: ${description ? normalizeEscapedQuotes(description) : ""}\n` +
          "\n"
        );
      })
      .join("");
  }

  // label (language-specific)
  if (overlays.label) {
    const labels = Array.isArray(overlays.label) ? overlays.label : [overlays.label];
    overlayTexts.label = labels
      .map((overlay) => {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const schema_attributes = hasAttrOrder
          ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, overlay.attribute_labels)
          : overlay.attribute_labels;
        overlaySaids[`${layer_name} (${lang})`] = said;
        return (
          `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `Language: ${lang}\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${value}`)
            .join("\n")}\n` +
          "\n"
        );
      })
      .join("");
  }

  // information (language-specific)
  if (overlays.information) {
    const infos = Array.isArray(overlays.information) ? overlays.information : [overlays.information];
    overlayTexts.information = infos
      .map((overlay) => {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const schema_attributes = hasAttrOrder
          ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, overlay.attribute_information)
          : overlay.attribute_information;
        overlaySaids[`${layer_name} (${lang})`] = said;
        return (
          `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `Language: ${lang}\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${normalizeEscapedQuotes(value)}`)
            .join("\n")}\n` +
          "\n"
        );
      })
      .join("");
  }

  // unit (single object)
  if (overlays.unit) {
    const overlay = overlays.unit;
    const said = overlay.d;
    const layer_name = overlay.type;
    const { measurement_system } = overlay;
    const attributeUnits = overlay.attribute_unit || overlay.attribute_units || {};
    const schema_attributes = hasAttrOrder
      ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, attributeUnits)
      : attributeUnits;

    overlaySaids[layer_name] = said;
    overlayTexts.unit =
      `Layer name: ${layer_name}\n` +
      `SAID/digest: ${said}\n` +
      `Measurement system: ${measurement_system}\n` +
      "\n" +
      `Schema attributes: ${layer_name}\n` +
      `${Object.entries(schema_attributes).map(([key, value]) => `    ${key}: ${value}`).join("\n")}\n` +
      "\n";
  }

  // conformance
  if (overlays.conformance) {
    const overlay = overlays.conformance;
    const said = overlay.d;
    const schema_attributes = hasAttrOrder
      ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, overlay.attribute_conformance)
      : overlay.attribute_conformance;
    const layer_name = overlay.type;
    overlaySaids[layer_name] = said;
    overlayTexts.conformance =
      `Layer name: ${layer_name}\n` +
      `SAID/digest: ${said}\n` +
      "\n" +
      `Schema attributes: ${layer_name}\n` +
      `${Object.entries(schema_attributes).map(([key, value]) => `    ${key}: ${value}`).join("\n")}\n` +
      "\n";
  }

  // character_encoding
  if (overlays.character_encoding) {
    const overlay = overlays.character_encoding;
    const said = overlay.d;
    const layer_name = overlay.type;
    const schema_attributes = hasAttrOrder
      ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, overlay.attribute_character_encoding)
      : overlay.attribute_character_encoding;
    overlaySaids[layer_name] = said;
    overlayTexts.character_encoding =
      `Layer name: ${layer_name}\n` +
      `SAID/digest: ${said}\n` +
      "\n" +
      `Schema attributes: ${layer_name}\n` +
      `${Object.entries(schema_attributes).map(([key, value]) => `    ${key}: ${value}`).join("\n")}\n` +
      "\n";
  }

  // format
  if (overlays.format) {
    const overlay = overlays.format;
    const said = overlay.d;
    const layer_name = overlay.type;
    const schema_attributes = hasAttrOrder
      ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, overlay.attribute_formats)
      : overlay.attribute_formats;
    overlaySaids[layer_name] = said;
    overlayTexts.format =
      `Layer name: ${layer_name}\n` +
      `SAID/digest: ${said}\n` +
      "\n" +
      `Schema attributes: ${layer_name}\n` +
      `${Object.entries(schema_attributes).map(([key, value]) => `    ${key}: ${value}`).join("\n")}\n` +
      "\n";
  }

  // entry_code
  if (overlays.entry_code) {
    const overlay = overlays.entry_code;
    const said = overlay.d;
    const layer_name = overlay.type;
    const schema_attributes = hasEntryCodeOrder
      ? orderingOverlay.entry_code_ordering
      : overlay.attribute_entry_codes;
    overlaySaids[layer_name] = said;
    overlayTexts.entry_code =
      `Layer name: ${layer_name}\n` +
      `SAID/digest: ${said}\n` +
      "\n" +
      `Schema attributes: ${layer_name}\n` +
      `${Object.entries(schema_attributes).map(([key, value]) => `    ${key}: [${value}]`).join("\n")}\n` +
      "\n";
  }

  // entry (language-specific array)
  if (overlays.entry) {
    const entries = Array.isArray(overlays.entry) ? overlays.entry : [overlays.entry];
    overlayTexts.entry = entries
      .map((overlay) => {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const schema_attributes = hasEntryCodeOrder
          ? getOrderedEntries(orderingOverlay.entry_code_ordering, overlay.attribute_entries)
          : overlay.attribute_entries;
        overlaySaids[`${layer_name} (${lang})`] = said;
        const body = Object.entries(schema_attributes)
          .map(([key, value]) => {
            if (typeof value === "object" && value !== null) {
              return `    ${key}: ${Object.values(value).join(", ")}`;
            }
            return `    ${key}: ${value}`;
          })
          .join("\n");
        return `Layer name: ${layer_name}\nSAID/digest: ${said}\nSchema attributes: ${layer_name}\n${body}\n\n`;
      })
      .join("");
  }

  return { overlaySaids, overlayTexts };
};

const getFormOverlayArray = (extensionOverlays = {}) => {
  const formOverlayData =
    extensionOverlays.form_overlay ||
    extensionOverlays.form ||
    extensionOverlays[FORM];

  return Array.isArray(formOverlayData)
    ? formOverlayData
    : formOverlayData?.form_overlays || [];
};

const getNormalizedExtensionOverlays = (ocaPackage, captureBaseId) => {
  const extensionArray = ocaPackage?.extensions?.[ADC]?.[captureBaseId];
  const extensionOverlays = {};

  if (!extensionArray) return extensionOverlays;

  if (Array.isArray(extensionArray)) {
    extensionArray.forEach((overlayObj) => {
      Object.entries(overlayObj || {}).forEach(([key, value]) => {
        const overlayType = key.replace(/_overlay$/, "");
        extensionOverlays[overlayType] = value;
      });
    });
    return extensionOverlays;
  }

  if (extensionArray?.overlays) {
    Object.assign(extensionOverlays, extensionArray.overlays);
    return extensionOverlays;
  }

  Object.assign(extensionOverlays, extensionArray);
  return extensionOverlays;
};

const getExtensionManifestEntries = (extensionOverlays = {}) => {
  const manifestEntries = [];

  Object.values(extensionOverlays).forEach((overlay) => {
    if (Array.isArray(overlay)) {
      overlay.forEach((entry) => {
        if (entry?.type && entry?.d) {
          const lang = entry.language ? ` (${entry.language})` : "";
          manifestEntries.push(`${entry.type}${lang} SAID/digest: "${entry.d}"\n`);
        }
      });
      return;
    }
    if (overlay?.type && overlay?.d) {
      manifestEntries.push(`${overlay.type} SAID/digest: "${overlay.d}"\n`);
    }
  });

  return manifestEntries;
};

const getExtensionSectionLines = (extensionOverlays = {}, schemaBundle = {}) => {
  const lines = [];

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, "ordering")) {
    const orderingOverlay = extensionOverlays.ordering;
    const entryCodeOrdering = orderingOverlay?.entry_code_ordering || {};
    const hasAttributeOrdering = orderingOverlay?.attribute_ordering?.length > 0;
    const hasEntryCodeOrdering = Object.keys(entryCodeOrdering).length > 0;

    lines.push(
      `Layer name: ${orderingOverlay.type}\n`,
      `SAID/digest: ${orderingOverlay.d}\n`
    );

    if (hasAttributeOrdering) {
      lines.push(`Attribute ordering: ${orderingOverlay.attribute_ordering.join(", ")}\n`);
    }

    if (hasEntryCodeOrdering) {
      lines.push("Entry code ordering:\n");
      Object.entries(entryCodeOrdering).forEach(([key, value]) => {
        lines.push(`    ${key}: ${value.join(", ")}\n`);
      });
    }

    lines.push("\n", "******************************************************************\n");
  }

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, SENSITIVE)) {
    const sensitiveOverlay = extensionOverlays[SENSITIVE];
    const sensitiveAttributes = Array.isArray(sensitiveOverlay?.sensitive_attributes)
      ? sensitiveOverlay?.sensitive_attributes
      : [];

    if (sensitiveAttributes.length > 0) {
      lines.push(
        `Layer name: ${sensitiveOverlay.type}\n`,
        `SAID/digest: ${sensitiveOverlay.d}\n`,
        `Sensitive attributes: ${sensitiveAttributes.join(", ")}\n`,
        "\n",
        "******************************************************************\n"
      );
    }
  }

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, RANGE)) {
    const rangeOverlay = extensionOverlays[RANGE];
    const rangeAttributes = Object.keys(rangeOverlay?.attributes || {});

    if (rangeAttributes.length > 0) {
      lines.push(
        `Layer name: ${rangeOverlay.type}\n`,
        `SAID/digest: ${rangeOverlay.d}\n\n`,
        `Schema attributes: ${rangeOverlay.type}\n`
      );

      rangeAttributes.forEach((attribute) => {
        const rangeData = rangeOverlay.attributes[attribute];
        if (rangeData.lower === "" && rangeData.upper === "") return;

        let rangeText = `   ${attribute}: `;

        if (rangeData.lower !== "") {
          rangeText += `lower_bound: ${rangeData.lower} (${rangeData.lower_inclusive ? "Inclusive" : "Exclusive"})`;
        }

        if (rangeData.upper !== "") {
          rangeText += `, upper_bound: ${rangeData.upper} (${rangeData.upper_inclusive ? "Inclusive" : "Exclusive"})`;
        }

        lines.push(rangeText, "\n");
      });

      lines.push("\n", "******************************************************************\n");
    }
  }

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, UNIT_FRAMING)) {
    const unitFramingOverlay = extensionOverlays[UNIT_FRAMING];

    const unitOverlayData =
      schemaBundle?.overlays?.unit?.attribute_unit ||
      schemaBundle?.overlays?.unit?.attribute_units ||
      {};

    if (Object.keys(unitFramingOverlay?.units || {}).length > 0) {
      lines.push(
        `Layer name: ${unitFramingOverlay.type}\n`,
        `SAID/digest: ${unitFramingOverlay.d}\n\n`
      );

      if (unitFramingOverlay.framing_metadata) {
        lines.push("Unit frame\n");
        Object.entries(unitFramingOverlay.framing_metadata).forEach(([key, value]) => {
          lines.push(`   "${key}": "${value}"\n`);
        });
        lines.push("\n");
      }

      lines.push(`Schema attributes: ${unitFramingOverlay.type}\n`);

      Object.entries(unitOverlayData).forEach(([attribute, unit]) => {
        const unitFramingData = unitFramingOverlay.units[unit];
        if (!unitFramingData) return;
        lines.push(`   ${attribute}: unit: ${unit}, UCUM code: ${unitFramingData.term_id}`, "\n");
      });

      lines.push("\n", "******************************************************************\n");
    }
  }

  // Data Separator overlays (ADC extensions): decimal_separator, file_delimiter, array_delimiter.
  // Raw characters like "\t" wouldn't render cleanly, so we prettify them here.
  const prettyDelimiter = (value) => {
    if (value === "\t") return "\\t (tab)";
    if (value === undefined || value === null || value === "") return "";
    return `"${value}"`;
  };

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, DECIMAL_SEPARATOR)) {
    const decimalOverlay = extensionOverlays[DECIMAL_SEPARATOR];
    if (decimalOverlay?.delimiter) {
      lines.push(
        `Layer name: ${decimalOverlay.type}\n`,
        ...(decimalOverlay.d ? [`SAID/digest: ${decimalOverlay.d}\n`] : []),
        "\n",
        `Decimal separator: ${prettyDelimiter(decimalOverlay.delimiter)}\n`,
        "\n",
        "******************************************************************\n"
      );
    }
  }

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, FILE_DELIMITER)) {
    const fileOverlay = extensionOverlays[FILE_DELIMITER];
    if (fileOverlay?.delimiter !== undefined) {
      lines.push(
        `Layer name: ${fileOverlay.type}\n`,
        ...(fileOverlay.d ? [`SAID/digest: ${fileOverlay.d}\n`] : []),
        "\n",
        `Field delimiter: ${prettyDelimiter(fileOverlay.delimiter)}\n`,
        `Quote character: ${prettyDelimiter(fileOverlay.quote_char)}\n`,
        `Escape character: ${prettyDelimiter(fileOverlay.escape_char)}\n`,
        `Line terminator: ${fileOverlay.line_terminator || ""}\n`,
        `Data start row: ${fileOverlay.data_start_row ?? ""}\n`,
        "\n",
        "******************************************************************\n"
      );
    }
  }

  if (Object.prototype.hasOwnProperty.call(extensionOverlays, ARRAY_DELIMITER)) {
    const arrayOverlay = extensionOverlays[ARRAY_DELIMITER];
    const arrayAttributes = arrayOverlay?.attributes || {};

    if (Object.keys(arrayAttributes).length > 0) {
      lines.push(
        `Layer name: ${arrayOverlay.type}\n`,
        ...(arrayOverlay.d ? [`SAID/digest: ${arrayOverlay.d}\n`] : []),
        "\n",
        `Schema attributes: ${arrayOverlay.type}\n`
      );

      Object.entries(arrayAttributes).forEach(([attribute, delimiter]) => {
        lines.push(`   ${attribute}: ${prettyDelimiter(delimiter)}\n`);
      });

      lines.push("\n", "******************************************************************\n");
    }
  }

  const formOverlayArray = getFormOverlayArray(extensionOverlays);
  if (Array.isArray(formOverlayArray) && formOverlayArray.length > 0) {
    const form_overlays_txt = [];
    for (const overlay of formOverlayArray) {
      const lang = overlay.language || "unknown";
      const captureBase = overlay.capture_base || "";

      let formText = "-\n";

      if (captureBase) {
        formText += `capture_base: ${captureBase}\n`;
      }
      formText += `language: ${lang}\n`;

      if (overlay.title) {
        formText += `title: ${overlay.title}\n`;
      }

      if (Array.isArray(overlay.pages) && overlay.pages.length > 0) {
        formText += "    pages:\n";
        overlay.pages.forEach((page) => {
          formText += "      -";

          if (page.attribute_order) {
            const attrOrder = page.attribute_order;
            if (Array.isArray(attrOrder) && attrOrder.length > 0) {
              if (typeof attrOrder[0] === "object") {
                formText += "    attribute_order:\n";
                attrOrder.forEach((subSection) => {
                  if (subSection.named_section) {
                    formText += `          - named_section: ${subSection.named_section}\n`;
                  }
                  if (
                    Array.isArray(subSection.attribute_order) &&
                    subSection.attribute_order.length > 0
                  ) {
                    formText += "    attribute_order:\n";
                    subSection.attribute_order.forEach((attr) => {
                      formText += `              - ${attr}\n`;
                    });
                  }
                });
              } else {
                formText += "    attribute_order:\n";
                attrOrder.forEach((attr) => {
                  formText += `          - ${attr}\n`;
                });
              }
            }
          }

          if (page.named_section) {
            formText += `          - named_section: ${page.named_section}\n`;
          }
        });
      }

      if (Array.isArray(overlay.page_order) && overlay.page_order.length > 0) {
        formText += "    page_order:\n";
        overlay.page_order.forEach((pageId) => {
          formText += `      - ${pageId}\n`;
        });
      }

      if (overlay.page_labels && Object.keys(overlay.page_labels).length > 0) {
        formText += "    page_labels:\n";
        Object.entries(overlay.page_labels).forEach(([pageId, label]) => {
          formText += `      - ${pageId}: ${label}\n`;
        });
      }

      if (overlay.sidebar_label && Object.keys(overlay.sidebar_label).length > 0) {
        formText += "    sidebar_label:\n";
        Object.entries(overlay.sidebar_label).forEach(([pageId, label]) => {
          formText += `      - ${pageId}: ${label}\n`;
        });
      }

      if (overlay.description && Object.keys(overlay.description).length > 0) {
        formText += "    description:\n";
        Object.entries(overlay.description).forEach(([pageId, desc]) => {
          formText += `      - ${pageId}: ${desc}\n`;
        });
      }

      if (Array.isArray(overlay.interaction) && overlay.interaction.length > 0) {
        formText += "    interaction:\n";
        overlay.interaction.forEach((interaction) => {
          formText += "      -";
          if (interaction.arguments && Object.keys(interaction.arguments).length > 0) {
            formText += "arguments:\n";
            Object.entries(interaction.arguments).forEach(([attr, config]) => {
              formText += `          ${attr}:\n`;
              if (config.type) {
                formText += `            type: ${config.type}\n`;
              }
              if (config.placeholder) {
                formText += `            placeholder: ${config.placeholder}\n`;
              }
              if (Array.isArray(config.options) && config.options.length > 0) {
                formText += "            options:\n";
                config.options.forEach((option) => {
                  formText += `              - '${option}'\n`;
                });
              }
              Object.keys(config).forEach((key) => {
                if (!["type", "placeholder", "options"].includes(key)) {
                  const value = config[key];
                  if (typeof value === "string") {
                    formText += `            ${key}: ${value}\n`;
                  } else if (typeof value === "boolean" || typeof value === "number") {
                    formText += `            ${key}: ${value}\n`;
                  } else if (Array.isArray(value)) {
                    formText += `            ${key}:\n`;
                    value.forEach((item) => {
                      formText += `              - ${item}\n`;
                    });
                  } else if (typeof value === "object" && value !== null) {
                    formText += `            ${key}:\n`;
                    Object.entries(value).forEach(([k, v]) => {
                      formText += `              ${k}: ${v}\n`;
                    });
                  }
                }
              });
            });
          }
        });
      }

      form_overlays_txt.push(formText);
    }
    if (form_overlays_txt.length > 0) {
      const firstOverlay = formOverlayArray[0];
      const layer_name = firstOverlay?.type || FORM;
      const firstSaid = firstOverlay?.d;
      lines.push(
        `Layer name: ${layer_name}\n${firstSaid ? `SAID/digest: ${firstSaid}\n` : ""}\n`
      );
      lines.push(form_overlays_txt.join(""));
      lines.push("\n******************************************************************\n");
    }
  }

  return lines;
};

/**
 * Hook to generate text-based README (OCA_READ_ME/1.0 format) from JSON OCA packages.
 * 
 * Used by:
 * - "Download README" button in ViewSchema
 * - "Download README" button in Landing page accordions
 * - Export flow in useOCAExport
 * 
 * Input: JSON OCA package (already parsed)
 * Output: Text file (.txt) with human-readable schema documentation
 * 
 * @param {Object} jsonData - The JSON bundle data
 * @param {Object} ocaPackage - The full OCA package (optional, used for ordering/extensions)
 * @param {string|Object} schemaNameOrDescription - Optional: schema name string or legacy schemaDescription object
 */
const useGenerateTextReadmeFromJson = () => {
  const jsonToTextFile = async (jsonData, ocaPackage = null, schemaNameOrDescription = null) => {
    // Step 1: --- Read json schema bundle
    const json_bundle = jsonData;

    // Check if ordering overlay can be retrieved from oca package
    const orderingOverlay =
      ocaPackage?.extensions?.[ADC]?.[json_bundle.capture_base.d]?.overlays?.ordering;

    // Step 2: __init__ of OCA ReadMe file
    const text_file = [];

    const bundle_said = json_bundle.d;
    text_file.push(
      readmeText,
      "BEGIN_OCA_MANIFEST\n",
      "******************************************************************\n"
    );

    if (ocaPackage?.type?.includes("oca_package")) {
      text_file.push(`Package SAID/digest: ${ocaPackage.d}\n`);
    }

    text_file.push(`Bundle SAID/digest: ${bundle_said}\n\n`);

    const overlay_saids = {};
    const overlay_texts = {};

    // Step 3: --- Converting schema overlays from objects to texts
    const { overlaySaids: rootSaids, overlayTexts: rootTexts } = buildOverlayMaps(json_bundle, orderingOverlay || {});
    Object.assign(overlay_saids, rootSaids);
    Object.assign(overlay_texts, rootTexts);


    // Step 4: --- Constructing OCA ReadMe file
    const manifest = [];
    Object.entries(overlay_saids).forEach(([key, value]) => {
      manifest.push(`${key} SAID/digest: "${value}"\n`);
    });

    const rootExtensionOverlays = getNormalizedExtensionOverlays(
      ocaPackage,
      json_bundle.capture_base.d
    );
    const rootExtensionManifestEntries = getExtensionManifestEntries(rootExtensionOverlays);
    if (rootExtensionManifestEntries.length > 0) {
      manifest.push("\n", ...rootExtensionManifestEntries);
    }

    text_file.push(...manifest);
    text_file.push(
      "******************************************************************\n",
      "END_OCA_MANIFEST\n\n",
      "BEGIN_OCA_BUNDLE\n",
      "******************************************************************\n"
    );
    text_file.push(overlay_texts.capture_base);
    text_file.push(
      "******************************************************************\n"
    );
    if (overlay_texts.meta) {
      text_file.push(overlay_texts.meta);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "label")) {
      text_file.push(overlay_texts.label);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "information")) {
      text_file.push(overlay_texts.information);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "unit")) {
      text_file.push(overlay_texts.unit);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "conformance")) {
      text_file.push(overlay_texts.conformance);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "character_encoding")) {
      text_file.push(overlay_texts.character_encoding);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "format")) {
      text_file.push(overlay_texts.format);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "entry_code")) {
      text_file.push(overlay_texts.entry_code);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "entry")) {
      text_file.push(overlay_texts.entry);
      text_file.push(
        "******************************************************************\n"
      );
    }

    text_file.push("END_OCA_BUNDLE\n");

    const rootExtensionLines = getExtensionSectionLines(rootExtensionOverlays, json_bundle);
    if (rootExtensionLines.length > 0) {
      text_file.push(
        "\n",
        "BEGIN_OCA_PACKAGE_EXTENSIONS\n",
        "******************************************************************\n"
      );
      text_file.push(...rootExtensionLines);
      text_file.push("END_OCA_PACKAGE_EXTENSIONS\n");
    }

    // Document child schemas if any (stored in dependencies array)
    // Use helper to handle both package formats: {dependencies: [...]} and {oca_bundle: {dependencies: [...]}}
    const childSchemas = getPackageDependencies(ocaPackage);
    
    if (Array.isArray(childSchemas) && childSchemas.length > 0) {
      text_file.push("\nBEGIN_CHILD_SCHEMAS\n");
      text_file.push("******************************************************************\n");
      
      childSchemas.forEach((childBundle, index) => {
        const childCaptureBase = childBundle?.capture_base;
        
        if (!childCaptureBase) return;
        
        // Get child meta overlay for name/description
        const childMetaOverlays = childBundle?.overlays?.meta || [];
        const childMetaOverlay = Array.isArray(childMetaOverlays) 
          ? childMetaOverlays[0] 
          : childMetaOverlays;
        
        text_file.push(`\nCHILD SCHEMA ${index + 1}\n`);
        text_file.push("******************************************************************\n");
        text_file.push(`Schema SAID: ${childCaptureBase.d}\n`);
        text_file.push(`Schema Name: ${childMetaOverlay?.name || "Unnamed Child Schema"}\n`);
        text_file.push(`Description: ${childMetaOverlay?.description || ""}\n\n`);
        
        text_file.push("Schema attributes: data type\n");
        const childAttributes = childCaptureBase.attributes || {};
        Object.keys(childAttributes).forEach((attrName) => {
          const attrType = childAttributes[attrName];
          const typeDisplay = Array.isArray(attrType) ? `Array[${attrType[0]}]` : attrType;
          text_file.push(`    ${attrName}: ${typeDisplay}\n`);
        });

        // --- Include overlays for the child schema (reuse shared helper)
        const childOrderingOverlay =
          ocaPackage?.extensions?.[ADC]?.[childCaptureBase.d]?.overlays?.ordering ||
          childBundle?.overlays?.ordering;
        const { overlaySaids: childSaids, overlayTexts: childTexts } = buildOverlayMaps(
          childBundle,
          childOrderingOverlay || {}
        );

        const childExtensionOverlays = getNormalizedExtensionOverlays(
          ocaPackage,
          childCaptureBase.d
        );
        const childExtensionManifestEntries = getExtensionManifestEntries(
          childExtensionOverlays
        );
        const childExtensionLines = getExtensionSectionLines(
          childExtensionOverlays,
          childBundle
        );

        text_file.push(
          "\nBEGIN_OCA_MANIFEST\n",
          "******************************************************************\n"
        );
        text_file.push(`Bundle SAID/digest: ${childBundle.d || ""}\n\n`);
        Object.entries(childSaids).forEach(([key, value]) => {
          text_file.push(`${key} SAID/digest: "${value}"\n`);
        });
        if (childExtensionManifestEntries.length > 0) {
          text_file.push("\n", ...childExtensionManifestEntries);
        }
        text_file.push(
          "******************************************************************\n",
          "END_OCA_MANIFEST\n\n",
          "BEGIN_OCA_BUNDLE\n",
          "******************************************************************\n"
        );

        if (childTexts.capture_base) {
          text_file.push(childTexts.capture_base, "******************************************************************\n");
        }

        // render in same order as root
        ["meta","label","information","unit","conformance","character_encoding","format","entry_code","entry"].forEach((k) => {
          if (childTexts[k]) {
            text_file.push(childTexts[k]);
            text_file.push("******************************************************************\n");
          }
        });

        text_file.push("END_OCA_BUNDLE\n");

        if (childExtensionLines.length > 0) {
          text_file.push(
            "\nBEGIN_OCA_PACKAGE_EXTENSIONS\n",
            "******************************************************************\n"
          );
          text_file.push(...childExtensionLines);
          text_file.push("END_OCA_PACKAGE_EXTENSIONS\n");
        }










      });
      
      text_file.push("END_CHILD_SCHEMAS\n");
      text_file.push("******************************************************************\n");
    }

    const text = text_file.join("");
    const textBlob = new Blob([text], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(textBlob);
    
    // Extract schema name from JSON bundle if not provided
    let nameForFile = schemaNameOrDescription;
    if (!nameForFile && json_bundle?.overlays?.meta) {
      // Get English meta overlay or first available
      const metaOverlays = Array.isArray(json_bundle.overlays.meta) 
        ? json_bundle.overlays.meta 
        : [json_bundle.overlays.meta];
      const engMeta = metaOverlays.find((m) => m.language === "eng") || metaOverlays[0];
      nameForFile = engMeta?.name || null;
    }
    
    // Filename format: <Schema>_OCA_package_README.txt (matches package naming + _README)
    const descriptiveFileName = getDescriptiveFileName(
      nameForFile,
      "OCA_package_README.txt"
    );

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = descriptiveFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return { jsonToTextFile };
};

export default useGenerateTextReadmeFromJson;
