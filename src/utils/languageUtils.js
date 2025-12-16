import i18next from "i18next";
import { languageCodesObject, codesToLanguages, languageNameToAlpha3Codes } from "../constants/isoCodes";

/**
 * Language Utilities for OCA Composer
 * 
 * All functions are exported directly for cleaner imports:
 *   import { getOCALanguageCode, getUILanguageCode } from '../utils/languageUtils'
 * 
 * Handles:
 * - Language Code Conversion: UI (2-letter) ↔ Schema name ↔ OCA (3-letter)
 * - UI Language Management: App interface language switching  
 * - Schema Language Logic: Multi-language schema context resolution
 */

/**
 * Language Constants
 * Common default values used throughout the app
 */
export const LanguageConstants = {
  DEFAULT_UI_LANGUAGE: "en",
  DEFAULT_SCHEMA_LANGUAGE: "English", 
  DEFAULT_OCA_CODE: "eng",
  FALLBACK_LANGUAGES: ["English", "French"],
  SUPPORTED_UI_LANGUAGES: ["en", "fr"],
  SUPPORTED_SCHEMA_LANGUAGES: ["English", "French"]
};

// === FUNCTION EXPORTS ===

/**
 * Convert UI language code (2-letter) to schema language name
 * "en" → "English", "fr" → "French"
 */
export const getSchemaLanguageFromUI = (uiLanguageCode) => {
  if (!uiLanguageCode) return null;
  const normalizedCode = uiLanguageCode.split("-")[0];
  return codesToLanguages[normalizedCode] || null;
};

/**
 * Convert schema language name to 2-letter UI code
 * "English" → "en", "French" → "fr"
 */
export const getUILanguageCode = (schemaLanguageName) => {
  if (!schemaLanguageName) return "en";
  const normalizedName = schemaLanguageName.toLowerCase();
  return languageCodesObject[normalizedName] || "en";
};

/**
 * Convert schema language name to 3-letter OCA code
 * "English" → "eng", "French" → "fra"
 */
export const getOCALanguageCode = (schemaLanguageName) => {
  if (!schemaLanguageName) return "eng";
  const normalizedName = schemaLanguageName.toLowerCase();
  return languageNameToAlpha3Codes[normalizedName] || "eng";
};

/**
 * Convert 2-letter UI code to 3-letter OCA code
 * "en" → "eng", "fr" → "fra"
 * (Replaces toThreeLetterCode from isoCodes.js)
 */
export const toOCACode = (uiLanguageCode) => {
  const schemaLang = getSchemaLanguageFromUI(uiLanguageCode);
  return schemaLang ? getOCALanguageCode(schemaLang) : "eng";
};

/**
 * Convert 3-letter OCA code to schema language name
 * "eng" → "English", "fra" → "French"
 */
export const getSchemaLanguageFromOCA = (ocaLanguageCode) => {
  if (!ocaLanguageCode) return null;
  const normalizedCode = ocaLanguageCode.toLowerCase();
  for (const [languageName, code] of Object.entries(languageNameToAlpha3Codes)) {
    if (code === normalizedCode) {
      return languageName.charAt(0).toUpperCase() + languageName.slice(1);
    }
  }
  return null;
};

/**
 * Convert 3-letter OCA code to 2-letter UI code
 * "eng" → "en", "fra" → "fr"
 * (Used for generating OCA DSL files)
 */
export const getUICodeFromOCA = (ocaLanguageCode) => {
  const schemaLang = getSchemaLanguageFromOCA(ocaLanguageCode);
  return schemaLang ? getUILanguageCode(schemaLang) : "en";
};

// === UI-AWARE DIRECT EXPORTS ===
// These access i18next state

/**
 * Normalize UI language code (handles variants like en-US, en-CA)
 * "en-US" → "en"
 */
export const normalizeUILanguageCode = (uiLanguageCode) => {
  if (!uiLanguageCode) return "en";
  return uiLanguageCode.split("-")[0];
};

/**
 * Get current UI language from i18next
 */
export const getCurrentUILanguage = () => {
  return i18next.language;
};

/**
 * Switch the application UI language
 */
export const switchUILanguage = (uiLanguageCode) => {
  const normalizedCode = normalizeUILanguageCode(uiLanguageCode);
  return i18next.changeLanguage(normalizedCode);
};

/**
 * Get best available language from schema, with UI language preference
 */
export const getBestSchemaLanguage = (schema, preferredUILanguage) => {
  if (!schema?.languages || !Array.isArray(schema.languages)) {
    return LanguageConstants.DEFAULT_SCHEMA_LANGUAGE;
  }

  if (preferredUILanguage) {
    const preferredSchemaLanguage = getSchemaLanguageFromUI(preferredUILanguage);
    if (schema.languages.includes(preferredSchemaLanguage)) {
      return preferredSchemaLanguage;
    }
  }

  if (schema.languages.includes(LanguageConstants.DEFAULT_SCHEMA_LANGUAGE)) {
    return LanguageConstants.DEFAULT_SCHEMA_LANGUAGE;
  }

  return schema.languages[0];
};

/**
 * Get prioritized schema languages with UI language preference first
 */
export const getPrioritizedSchemaLanguages = (schemaLanguages, uiLanguageCode = null) => {
  if (!schemaLanguages?.length) return [];
  
  const currentUILang = uiLanguageCode || getCurrentUILanguage();
  const matchingSchemaLang = getSchemaLanguageFromUI(currentUILang);
  
  if (!matchingSchemaLang || !schemaLanguages.includes(matchingSchemaLang)) {
    return [...schemaLanguages];
  }
  
  const arr = [...schemaLanguages];
  const langIndex = arr.indexOf(matchingSchemaLang);
  if (langIndex > 0) {
    const [removed] = arr.splice(langIndex, 1);
    arr.unshift(removed);
  }
  return arr;
};

/**
 * Resolve effective schema language with override support
 */
export const getEffectiveSchemaLanguage = (schemaLanguageOverride, availableLanguages, uiLanguageCode = null) => {
  if (schemaLanguageOverride) return schemaLanguageOverride;
  
  const currentUILang = uiLanguageCode || getCurrentUILanguage();
  return getBestSchemaLanguage({ languages: availableLanguages }, currentUILang);
};
