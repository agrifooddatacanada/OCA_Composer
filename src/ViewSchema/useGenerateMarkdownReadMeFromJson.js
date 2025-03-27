import { useContext } from "react";
import i18next from "i18next";
import { Context } from "../App";
import {
  codesToLanguages,
  languageNameToAlpha3Codes,
  toThreeLetterCode
} from "../constants/isoCodes";
import { ADC, DEFAULT_THREE_LETTER_LANGUAGE_CODE } from "../constants/constants";
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
  generateSchemaQuickView
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
  const { languages, OCAPackage } = useContext(Context);
  // For now, use ADC extension overlays for the top-level/main schema bundle
  const orderingOverlay =
    OCAPackage?.extensions?.[ADC]?.[OCAPackage?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.ordering;
  const hasAttributeOrdering = orderingOverlay?.attribute_ordering?.length > 0;

  // Ensuring that the currently selected site language is one of the languages of the schema
  const currentLanguageCode = languages.some(
    (language) => language === codesToLanguages[i18next.language]
  )
    ? toThreeLetterCode(i18next.language)
    : DEFAULT_THREE_LETTER_LANGUAGE_CODE;

  const generateMarkdownReadMeFromJson = (schemaData, catalogueData) => {
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
    if (Object.keys(OCAPackage?.extensions || {}).length > 0) {
      const overlays =
        OCAPackage.extensions?.[ADC]?.[OCAPackage?.oca_bundle?.bundle?.capture_base?.d]
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
      OCAPackage
    );
    fileContent += generateSchemaQuickView({
      layers,
      attributeNames,
      currentLanguageCode,
      defaultLanguageCode: DEFAULT_THREE_LETTER_LANGUAGE_CODE
    });
    fileContent += generateInternationalSchemaInformation(
      layers,
      languages,
      languageNameToAlpha3Codes
    );
    fileContent += generateEntryCodeTables(
      layers,
      languages,
      languageNameToAlpha3Codes,
      orderingOverlay
    );
    fileContent += generateLanguageIndependentSchemaDetailsTable({
      layers,
      captureBaseOverlay,
      attributeNames
    });
    fileContent += generateLanguageSpecificSchemaDetailsTable({
      layers,
      attributeNames,
      languages,
      languageCodeLookupMap: languageNameToAlpha3Codes,
      orderingOverlay
    });
    fileContent += generateSAIDTableForJson(
      {
        captureBaseSAID,
        bundleSAID: schemaData.d,
        ...(OCAPackage?.d && { packageSAID: OCAPackage.d })
      },
      layersForSaidTable
    );
    fileContent += generateCreationTimestamp();

    const fileName = `${metaOverlayCurrentLanguage.name.split(" ")[0]}_OCA_schema.md`;
    downloadMarkdownFile(fileContent, fileName);
  };

  return { generateMarkdownReadMeFromJson };
};

export default useGenerateMarkdownReadMeFromJson;
