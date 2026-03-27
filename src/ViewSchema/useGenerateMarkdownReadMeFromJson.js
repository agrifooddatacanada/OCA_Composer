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
import { langNameFromTwoLetters, langCodeOCAFromName, langCodeOCAFromTwoLetters } from "../utils/languageUtils";
import { getPackageLanguages, getPackageDependencies } from "../utils/packageUtils";
import {
  ADC,
  DEFAULT_THREE_LETTER_LANGUAGE_CODE,
  RANGE,
  SENSITIVE,
  UNIT_FRAMING
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

const useGenerateMarkdownReadMeFromJson = () => {
  const { pkgOCA } = useMultiSchema();
  const pkg = pkgOCA;
  
  // For now, use ADC extension overlays for the top-level/main schema bundle
  const orderingOverlay =
    pkg?.extensions?.[ADC]?.[pkg?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.ordering;
  const hasAttributeOrdering = orderingOverlay?.attribute_ordering?.length > 0;

  const sensitiveOverlay =
    pkg?.extensions?.[ADC]?.[pkg?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.[SENSITIVE];
  const sensitiveAttributes = Array.isArray(sensitiveOverlay?.sensitive_attributes)
    ? sensitiveOverlay?.sensitive_attributes
    : [];

  const rangeOverlay =
    pkg?.extensions?.[ADC]?.[pkg?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.[RANGE];

  const unitFramingOverlay =
    pkg?.extensions?.[ADC]?.[pkg?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.[UNIT_FRAMING];

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

    const layers = [];
    const layersForSaidTable = [];

    for (const overlayName of Object.keys(schemaData.overlays)) {
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

    // Include extension overlays if any
    // For now, use ADC extension overlays for the top-level/main schema bundle
    if (Object.keys(pkg?.extensions || {}).length > 0) {
      const overlays =
        pkg.extensions?.[ADC]?.[pkg?.oca_bundle?.bundle?.capture_base?.d]
          ?.overlays;
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

    const metaOverlayCurrentLanguage = layers.find(
      (layer) =>
        layer.layerName.includes("meta") &&
        (layer.language === currentLanguageCode ||
          layer.language === DEFAULT_THREE_LETTER_LANGUAGE_CODE)
    );

    fileContent += generateFrontMatter(metaOverlayCurrentLanguage, catalogueData);
    fileContent += generateSchemaInformation(
      metaOverlayCurrentLanguage,
      captureBaseOverlay,
      catalogueData,
      pkg
    );
    // Build language code lookup map
    const languageCodeLookupMap = {};
    languages.forEach(lang => {
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
      languageCodeLookupMap
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
      unitFramingOverlay
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
    
    // Process child schemas if any (stored in dependencies array)
    // Use helper to handle both package formats: {dependencies: [...]} and {oca_bundle: {dependencies: [...]}}
    const childSchemas = getPackageDependencies(pkg);
    
    if (Array.isArray(childSchemas) && childSchemas.length > 0) {
      fileContent += "\n\n";
      fileContent += "BEGIN_CHILD_SCHEMAS\n";
      fileContent += "******************************************************************\n";
      
      childSchemas.forEach((childSchemaData, index) => {
        const childCaptureBase = childSchemaData.capture_base;
        const childLayers = [];
        const childLayersForSaidTable = [];
        
        // Process child schema overlays
        for (const overlayName of Object.keys(childSchemaData.overlays || {})) {
          const overlay = childSchemaData.overlays[overlayName];
          if (Array.isArray(overlay)) {
            overlay.forEach((langSpecificOverlay) => {
              const modifiedLayer = getModifiedLayer(langSpecificOverlay);
              childLayers.push(modifiedLayer);
            });
          } else {
            const modifiedLayer = getModifiedLayer(overlay);
            childLayers.push(modifiedLayer);
          }
        }
        
        const childMetaOverlay = childLayers.find(
          (layer) =>
            layer.layerName.includes("meta") &&
            (layer.language === currentLanguageCode ||
              layer.language === DEFAULT_THREE_LETTER_LANGUAGE_CODE)
        );
        
        const childAttributeNames = Object.keys(childCaptureBase.attributes || {});
        
        fileContent += `\nCHILD SCHEMA ${index + 1}\n`;
        fileContent += "******************************************************************\n";
        fileContent += `Schema SAID: ${childCaptureBase.d}\n`;
        fileContent += `Schema Name: ${childMetaOverlay?.name || 'Unnamed Child Schema'}\n`;
        fileContent += `Description: ${childMetaOverlay?.description || ''}\n\n`;
        
        fileContent += "Schema attributes: data type\n";
        childAttributeNames.forEach(attrName => {
          const attrType = childCaptureBase.attributes[attrName];
          fileContent += `    ${attrName}: ${Array.isArray(attrType) ? `Array[${attrType[0]}]` : attrType}\n`;
        });
        
        // Add child schema overlays details
        childLayers.forEach(layer => {
          if (layer.layerName !== 'meta/1.1') {
            fileContent += "\n******************************************************************\n";
            fileContent += `Layer name: spec/overlays/${layer.layerName}\n`;
            fileContent += `SAID/digest: ${layer.digest}\n`;
            if (layer.language) {
              fileContent += `Language: ${layer.language}\n`;
            }
            fileContent += "\n";
          }
        });
        
        fileContent += "******************************************************************\n";
      });
      
      fileContent += "END_CHILD_SCHEMAS\n";
      fileContent += "******************************************************************\n";
    }
    
    fileContent += generateCreationTimestamp();

    const fileName = `${metaOverlayCurrentLanguage.name.split(" ")[0]}_OCA_schema.md`;
    downloadMarkdownFile(fileContent, fileName);
  };

  return { generateMarkdownReadMeFromJson };
};

export default useGenerateMarkdownReadMeFromJson;
