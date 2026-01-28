// Generate markdown readme from schema bundle zip

import i18next from "i18next";
import { getLangNameFromUICode, getUICodeFromLangName } from "../utils/languageUtils";
import { DEFAULT_LANGUAGE_CODE } from "../constants/constants";
import {
  downloadMarkdownFile,
  generateCreationTimestamp,
  generateEntryCodeTables,
  generateFrontMatter,
  generateInternationalSchemaInformation,
  generateLanguageIndependentSchemaDetailsTable,
  generateLanguageSpecificSchemaDetailsTable,
  generateSAIDTable,
  generateSchemaInformation,
  generateSchemaQuickView
} from "./markdownReadmeUtils";

const useGenerateMarkdownReadMe = () => {
  // The schema bundle items are in JSON
  const generateMarkdownReadMe = (schemaBundleItems, catalogueData) => {
    let fileContent = "";
    let captureBaseSAID = "";
    let layerToSAIDMap = null;
    const layers = [];

    schemaBundleItems.forEach((bundleItem) => {
      const parsedBundleItem = JSON.parse(bundleItem);
      // If it is the meta.json file (provides key-value mappings between the file names and the names of the OCA object types)
      // The file names are the corresponding SAIDs (digests) of the OCA layers
      if (Object.prototype.hasOwnProperty.call(parsedBundleItem, "files")) {
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
    
    // Extract languages from the bundle itself (look at meta, label, information, entry overlays)
    const languageSet = new Set();
    layers.forEach(layer => {
      if (layer.language) {
        // Convert UI code (en, fr) to language name (English, French)
        const langName = getLangNameFromUICode(layer.language) || 
                        (layer.language === 'en' ? 'English' : layer.language);
        languageSet.add(langName);
      }
    });
    const languages = Array.from(languageSet);
    
    // Ensuring that the currently selected site language is one of the languages of the schema
    const currentLanguageCode = languages.some(
      (language) => language === getLangNameFromUICode(i18next.language)
    )
      ? i18next.language
      : "en";

    const metaOverlayCurrentLanguage = layers.find(
      (layer) =>
        layer.layerName.includes("meta") &&
        (layer.language === currentLanguageCode ||
          layer.language === DEFAULT_LANGUAGE_CODE)
    );
    const captureBaseOverlay = layers.find((layer) =>
      layer.layerName.includes("capture_base")
    );
    const attributeNames = Object.keys(captureBaseOverlay.attributes);

    // Build language code lookup map
    const languageCodeLookupMap = {};
    languages.forEach(lang => {
      languageCodeLookupMap[lang.toLowerCase()] = getUICodeFromLangName(lang);
    });

    fileContent += generateFrontMatter(metaOverlayCurrentLanguage, catalogueData);
    fileContent += generateSchemaInformation(
      metaOverlayCurrentLanguage,
      captureBaseOverlay,
      catalogueData
    );
    fileContent += generateSchemaQuickView({
      layers,
      attributeNames,
      currentLanguageCode,
      defaultLanguageCode: DEFAULT_LANGUAGE_CODE
    });
    fileContent += generateInternationalSchemaInformation(
      layers,
      languages,
      languageCodeLookupMap
    );
    fileContent += generateEntryCodeTables(layers, languages, languageCodeLookupMap);
    fileContent += generateLanguageIndependentSchemaDetailsTable({
      layers,
      captureBaseOverlay,
      attributeNames
    });
    fileContent += generateLanguageSpecificSchemaDetailsTable({
      layers,
      attributeNames,
      languages,
      languageCodeLookupMap
    });
    fileContent += generateSAIDTable(captureBaseSAID, layerToSAIDMap);
    fileContent += generateCreationTimestamp();

    const fileName = `${metaOverlayCurrentLanguage.name.split(" ")[0]}_OCA_schema.md`;
    downloadMarkdownFile(fileContent, fileName);
  };
  return { generateMarkdownReadMe };
};

export default useGenerateMarkdownReadMe;
