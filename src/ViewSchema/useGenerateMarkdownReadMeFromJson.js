/**
 * Hook to generate Markdown README from JSON OCA packages.
 *
 * Used by:
 * - "Generate Markdown Readme" button when a JSON file was uploaded
 *
 * Input: JSON OCA package (already parsed)
 * Output: Markdown file (.md) with formatted schema documentation including child schemas
 *
 * Note: For ZIP files, see useGenerateMarkdownReadMe.
 */

import i18next from "i18next";
import { useMultiSchema } from "../schema/schemaContext";
import {
  langNameFromTwoLetters,
  langCodeOCAFromName,
  langCodeOCAFromTwoLetters,
  normalizeToOCACode
} from "../utils/languageUtils";
import {
  getPackageLanguages,
  getPackageDependencies,
  getRootCaptureBaseId
} from "../utils/packageUtils";
import {
  ADC,
  DEFAULT_THREE_LETTER_LANGUAGE_CODE,
  RANGE,
  SENSITIVE,
  UNIT_FRAMING,
  DECIMAL_SEPARATOR,
  FILE_DELIMITER,
  ARRAY_DELIMITER
} from "../constants/constants";
import {
  downloadMarkdownFile,
  generateCreationTimestamp,
  generateEntryCodeTables,
  generateFrontMatter,
  generateInternationalSchemaInformation,
  generateLanguageIndependentSchemaDetailsTable,
  generateLanguageSpecificSchemaDetailsTable,
  generateSAIDTableForJson,
  generateSchemaInformation,
  generateSchemaQuickView,
  generateUnitFramingMetadataTable
} from "./markdownReadmeUtils";

const getModifiedLayer = (overlay) => {
  const { capture_base, type, d: digest, ...rest } = overlay;
  return {
    layerName: type.split("/").slice(-2).join("/"),
    digest,
    ...rest
  };
};

const findMetaOverlay = (layers, preferredOCACode) => {
  const preferred = normalizeToOCACode(preferredOCACode);
  const match = (code) =>
    layers.find(
      (layer) =>
        layer.layerName.includes("meta") && normalizeToOCACode(layer.language) === code
    );
  return (
    match(preferred) ||
    match(DEFAULT_THREE_LETTER_LANGUAGE_CODE) ||
    layers.find((layer) => layer.layerName.includes("meta"))
  );
};

const getLanguagesFromLayers = (layers) => {
  const languageCodes = new Set();
  layers.forEach((layer) => {
    if (layer.language) {
      languageCodes.add(normalizeToOCACode(layer.language));
    }
  });

  const languages = [];
  languageCodes.forEach((code) => {
    const languageName = langNameFromTwoLetters(code);
    if (languageName) {
      languages.push(languageName);
    }
  });

  if (
    !languages.some(
      (language) => langCodeOCAFromName(language) === DEFAULT_THREE_LETTER_LANGUAGE_CODE
    )
  ) {
    languages.unshift(
      langNameFromTwoLetters(DEFAULT_THREE_LETTER_LANGUAGE_CODE) || "English"
    );
  }

  return languages;
};

const buildLayersAndSaidRows = (schemaData) => {
  const layers = [];
  const layersForSaidTable = [];

  for (const overlayName of Object.keys(schemaData.overlays || {})) {
    const overlay = schemaData.overlays[overlayName];
    if (Array.isArray(overlay)) {
      overlay.forEach((langSpecificOverlay) => {
        const modifiedLayer = getModifiedLayer(langSpecificOverlay);
        const layerNameWithoutVersion = `${modifiedLayer.layerName.split("/")[0]}${modifiedLayer.language ? ` (${modifiedLayer.language})` : ""}`;
        layersForSaidTable.push({
          name: layerNameWithoutVersion,
          digest: modifiedLayer.digest,
          type: langSpecificOverlay.type
        });
        layers.push(modifiedLayer);
      });
    } else {
      const modifiedLayer = getModifiedLayer(overlay);
      const layerNameWithoutVersion = `${modifiedLayer.layerName.split("/")[0]}${modifiedLayer.language ? ` (${modifiedLayer.language})` : ""}`;
      layersForSaidTable.push({
        name: layerNameWithoutVersion,
        digest: modifiedLayer.digest,
        type: overlay.type
      });
      layers.push(modifiedLayer);
    }
  }

  return { layers, layersForSaidTable };
};

const useGenerateMarkdownReadMeFromJson = () => {
  const { ocaPackage } = useMultiSchema();
  const pkg = ocaPackage;
  const rootCaptureBaseId = getRootCaptureBaseId(pkg);

  const orderingOverlay = pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.ordering;
  const hasAttributeOrdering = orderingOverlay?.attribute_ordering?.length > 0;

  const sensitiveOverlay =
    pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[SENSITIVE];
  const sensitiveAttributes = Array.isArray(sensitiveOverlay?.sensitive_attributes)
    ? sensitiveOverlay?.sensitive_attributes
    : [];

  const rangeOverlay = pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[RANGE];

  const unitFramingOverlay =
    pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[UNIT_FRAMING];

  const decimalSeparatorOverlay =
    pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[DECIMAL_SEPARATOR];

  const fileDelimiterOverlay =
    pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[FILE_DELIMITER];

  const arrayDelimiterOverlay =
    pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[ARRAY_DELIMITER];

  const generateMarkdownReadMeFromJson = (schemaData, catalogueData) => {
    // Extract languages from the entire package
    const languages = getPackageLanguages(pkg);

    // Ensuring that the currently selected site language is one of the languages of the schema
    const currentLanguageCode = languages.some(
      (language) => language === langNameFromTwoLetters(i18next.language)
    )
      ? langCodeOCAFromTwoLetters(i18next.language)
      : DEFAULT_THREE_LETTER_LANGUAGE_CODE;

    let fileContent = "";
    const captureBaseOverlay = schemaData.capture_base;
    const captureBaseSAID = captureBaseOverlay.d;
    const attributeNames = hasAttributeOrdering
      ? orderingOverlay?.attribute_ordering
      : Object.keys(captureBaseOverlay.attributes);

    const { layers, layersForSaidTable } = buildLayersAndSaidRows(schemaData);

    // Include extension overlays if any
    // For now, use ADC extension overlays for the top-level/main schema bundle
    if (Object.keys(pkg?.extensions || {}).length > 0) {
      const overlays = pkg.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays;
      const overlayNames = Object.keys(overlays);
      overlayNames.forEach((overlayName) => {
        const overlay = overlays[overlayName];
        layersForSaidTable.push({
          name: overlayName,
          digest: overlay.d,
          type: overlay.type
        });
      });
    }

    const metaOverlayCurrentLanguage = findMetaOverlay(layers, currentLanguageCode) || {
      name: "Unnamed schema",
      description: ""
    };

    fileContent += generateFrontMatter(metaOverlayCurrentLanguage, catalogueData);
    fileContent += generateSchemaInformation(
      metaOverlayCurrentLanguage,
      captureBaseOverlay,
      catalogueData,
      pkg
    );
    // Build language code lookup map
    const languageCodeLookupMap = {};
    languages.forEach((lang) => {
      languageCodeLookupMap[lang.toLowerCase()] = langCodeOCAFromName(lang);
    });

    fileContent += generateSchemaQuickView({
      layers,
      attributeNames,
      currentLanguageCode,
      defaultLanguageCode: DEFAULT_THREE_LETTER_LANGUAGE_CODE
    });
    fileContent += generateInternationalSchemaInformation(
      layers,
      languages,
      languageCodeLookupMap,
      decimalSeparatorOverlay,
      fileDelimiterOverlay
    );
    fileContent += generateEntryCodeTables(
      layers,
      languages,
      languageCodeLookupMap,
      orderingOverlay
    );
    fileContent += generateLanguageIndependentSchemaDetailsTable({
      layers,
      captureBaseOverlay,
      attributeNames,
      sensitiveAttributes,
      rangeOverlay,
      unitFramingOverlay,
      arrayDelimiterOverlay
    });
    if (unitFramingOverlay?.framing_metadata) {
      fileContent += generateUnitFramingMetadataTable(
        unitFramingOverlay.framing_metadata
      );
    }
    fileContent += generateLanguageSpecificSchemaDetailsTable({
      layers,
      attributeNames,
      languages,
      languageCodeLookupMap,
      orderingOverlay
    });
    fileContent += generateSAIDTableForJson(
      {
        captureBaseSAID,
        bundleSAID: schemaData.d,
        ...(pkg?.d && { packageSAID: pkg.d })
      },
      layersForSaidTable
    );

    const childSchemas = getPackageDependencies(pkg);

    if (Array.isArray(childSchemas) && childSchemas.length > 0) {
      fileContent += "\n\n";
      fileContent += "BEGIN_CHILD_SCHEMAS\n";
      fileContent +=
        "******************************************************************\n";

      childSchemas.forEach((childSchemaData, index) => {
        const childCaptureBase = childSchemaData.capture_base;
        const childCaptureBaseId = childCaptureBase?.d;
        const childOrderingOverlay =
          pkg?.extensions?.[ADC]?.[childCaptureBaseId]?.overlays?.ordering;
        const childHasAttributeOrdering =
          childOrderingOverlay?.attribute_ordering?.length > 0;

        const childSensitiveOverlay =
          pkg?.extensions?.[ADC]?.[childCaptureBaseId]?.overlays?.[SENSITIVE];
        const childSensitiveAttributes = Array.isArray(
          childSensitiveOverlay?.sensitive_attributes
        )
          ? childSensitiveOverlay.sensitive_attributes
          : [];

        const childRangeOverlay =
          pkg?.extensions?.[ADC]?.[childCaptureBaseId]?.overlays?.[RANGE];

        const childUnitFramingOverlay =
          pkg?.extensions?.[ADC]?.[childCaptureBaseId]?.overlays?.[UNIT_FRAMING];

        const { layers: childLayers, layersForSaidTable: childLayersForSaidTable } =
          buildLayersAndSaidRows(childSchemaData);
        const childLanguages = getLanguagesFromLayers(childLayers);
        const childLanguageCodeLookupMap = {};
        childLanguages.forEach((lang) => {
          childLanguageCodeLookupMap[lang.toLowerCase()] = langCodeOCAFromName(lang);
        });

        const childMetaOverlay = findMetaOverlay(childLayers, currentLanguageCode) || {
          name: "Unnamed Child Schema",
          description: ""
        };

        const childAttributeNames = childHasAttributeOrdering
          ? childOrderingOverlay.attribute_ordering
          : Object.keys(childCaptureBase.attributes || {});

        const childExtensionOverlays =
          pkg?.extensions?.[ADC]?.[childCaptureBaseId]?.overlays;
        if (childExtensionOverlays) {
          Object.keys(childExtensionOverlays).forEach((overlayName) => {
            const overlay = childExtensionOverlays[overlayName];
            if (Array.isArray(overlay)) {
              overlay.forEach((entry) => {
                childLayersForSaidTable.push({
                  name: overlayName,
                  digest: entry.d,
                  type: entry.type
                });
              });
              return;
            }
            childLayersForSaidTable.push({
              name: overlayName,
              digest: overlay.d,
              type: overlay.type
            });
          });
        }

        fileContent += `\nCHILD SCHEMA ${index + 1}\n`;
        fileContent +=
          "******************************************************************\n";
        fileContent += generateSchemaInformation(
          childMetaOverlay,
          childCaptureBase,
          null,
          null
        );
        fileContent += generateSchemaQuickView({
          layers: childLayers,
          attributeNames: childAttributeNames,
          currentLanguageCode,
          defaultLanguageCode: DEFAULT_THREE_LETTER_LANGUAGE_CODE
        });
        fileContent += generateInternationalSchemaInformation(
          childLayers,
          childLanguages,
          childLanguageCodeLookupMap
        );
        fileContent += generateEntryCodeTables(
          childLayers,
          childLanguages,
          childLanguageCodeLookupMap,
          childOrderingOverlay
        );
        fileContent += generateLanguageIndependentSchemaDetailsTable({
          layers: childLayers,
          captureBaseOverlay: childCaptureBase,
          attributeNames: childAttributeNames,
          sensitiveAttributes: childSensitiveAttributes,
          rangeOverlay: childRangeOverlay,
          unitFramingOverlay: childUnitFramingOverlay
        });
        if (childUnitFramingOverlay?.framing_metadata) {
          fileContent += generateUnitFramingMetadataTable(
            childUnitFramingOverlay.framing_metadata
          );
        }
        fileContent += generateLanguageSpecificSchemaDetailsTable({
          layers: childLayers,
          attributeNames: childAttributeNames,
          languages: childLanguages,
          languageCodeLookupMap: childLanguageCodeLookupMap,
          orderingOverlay: childOrderingOverlay
        });
        fileContent += generateSAIDTableForJson(
          {
            captureBaseSAID: childCaptureBase.d,
            bundleSAID: childSchemaData.d
          },
          childLayersForSaidTable
        );

        fileContent +=
          "******************************************************************\n";
      });

      fileContent += "END_CHILD_SCHEMAS\n";
      fileContent +=
        "******************************************************************\n";
    }

    fileContent += generateCreationTimestamp();

    const fileName = `${metaOverlayCurrentLanguage.name.split(" ")[0]}_OCA_schema.md`;
    downloadMarkdownFile(fileContent, fileName);
  };

  return { generateMarkdownReadMeFromJson };
};

export default useGenerateMarkdownReadMeFromJson;
