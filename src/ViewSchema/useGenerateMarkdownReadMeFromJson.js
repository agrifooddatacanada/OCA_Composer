import { useContext } from "react";
import { Context } from "../App";
import i18next from "i18next";
import { codesToLanguages, languageNameToAlpha3Codes, toThreeLetterCode } from "../constants/isoCodes";
import { DEFAULT_THREE_LETTER_LANGUAGE_CODE } from "../constants/constants";
import { 
  downloadMarkdownFile, 
  generateEntryCodeTables, 
  generateExtendedSchemaDetailsTable, 
  generateFrontMatter, 
  generateInternationalSchemaInformation, 
  generateSAIDTable, 
  generateSchemaInformation, 
  generateSchemaQuickView,
  getModifiedLayer
} from "./markdownReadmeUtils";

const useGenerateMarkdownReadMeFromJson = () => {
  const { languages } = useContext(Context);

  // Ensuring that the currently selected site language is one of the languages of the schema
  const currentLanguageCode = languages.some((language) => language === codesToLanguages[i18next.language]) 
    ? toThreeLetterCode(i18next.language) 
    : DEFAULT_THREE_LETTER_LANGUAGE_CODE;

  const generateMarkdownReadMeFromJson = (schemaData) => {
    let fileContent = "";
    const captureBaseOverlay = schemaData.capture_base;
    const captureBaseSAID = captureBaseOverlay.d;
    const attributeNames = Object.keys(captureBaseOverlay.attributes);
    const layerToSAIDMap = {};
    const layers = [];

    for (const overlayName of Object.keys(schemaData.overlays)) {
      const overlay = schemaData.overlays[overlayName];
      if (Array.isArray(overlay)) {
        overlay.forEach((langSpecificOverlay) => {
          const modifiedLayer = getModifiedLayer(langSpecificOverlay);
          const layerNameWithoutVersion = `${modifiedLayer.layerName.split("/")[0]}${modifiedLayer.language ? ` (${modifiedLayer.language})` : ""}`;
          layerToSAIDMap[layerNameWithoutVersion] = modifiedLayer.digest;
          layers.push(modifiedLayer);
        });
      } else {
        const modifiedLayer = getModifiedLayer(overlay);
        const layerNameWithoutVersion = `${modifiedLayer.layerName.split("/")[0]}${modifiedLayer.language ? ` (${modifiedLayer.language})` : ""}`;
        layerToSAIDMap[layerNameWithoutVersion] = modifiedLayer.digest;
        layers.push(modifiedLayer);
      }
    }

    const metaOverlayCurrentLanguage = layers.find(
      (layer) => {
        return layer.layerName.includes("meta") && (layer.language === currentLanguageCode || layer.language === DEFAULT_THREE_LETTER_LANGUAGE_CODE)
      }
    );

    fileContent += generateFrontMatter(metaOverlayCurrentLanguage);
    fileContent += generateSchemaInformation(metaOverlayCurrentLanguage, captureBaseOverlay);
    fileContent += generateSchemaQuickView({
      layers, attributeNames, currentLanguageCode, defaultLanguageCode: DEFAULT_THREE_LETTER_LANGUAGE_CODE
    });
    fileContent += generateInternationalSchemaInformation(layers, languages, languageNameToAlpha3Codes);
    fileContent += generateEntryCodeTables(layers, languages, languageNameToAlpha3Codes);
    fileContent += generateExtendedSchemaDetailsTable({ 
      layers, captureBaseOverlay, attributeNames, languages, languageCodeLookupMap: languageNameToAlpha3Codes
    });
    fileContent += generateSAIDTable(captureBaseSAID, layerToSAIDMap);

    const fileName = `${metaOverlayCurrentLanguage.name.split(" ")[0]}_OCA_schema.md`;
    downloadMarkdownFile(fileContent, fileName);
  }

  return { generateMarkdownReadMeFromJson };
}

export default useGenerateMarkdownReadMeFromJson;
