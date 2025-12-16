import i18next from "i18next";
import { languageCodesObject, codesToLanguages, languageNameToAlpha3Codes } from "../constants/isoCodes";

/**
 * Language Utilities for OCA Composer
 * 
 * Three language formats:
 *   - UI Code (2-letter): "en", "fr" - used by i18next
 *   - Lang Name (word): "English", "French" - display names
 *   - OCA Code (3-letter): "eng", "fra" - used in OCA overlays
 * 
 * Naming convention:
 *   - get[Output]From[Input]() for all conversions
 *   - All acronyms (UI, OCA) are CAPS
 */

/**
 * Language Constants
 */
export const LanguageConstants = {
  DEFAULT_UI_CODE: "en",
  DEFAULT_LANG_NAME: "English", 
  DEFAULT_OCA_CODE: "eng",
  FALLBACK_LANG_NAMES: ["English", "French"],
  SUPPORTED_UI_CODES: ["en", "fr"],
  SUPPORTED_LANG_NAMES: ["English", "French"]
};

// =============================================================================
// STATE ACCESSORS (i18next)
// =============================================================================

/**
 * Get current UI language code from i18next
 * @returns {string} "en", "fr", etc.
 */
export const getUICode = () => {
  return i18next.language;
};

/**
 * Set the application UI language
 * @param {string} uiCode - "en", "fr", etc.
 */
export const setUICode = (uiCode) => {
  const normalized = getNormalizedUICode(uiCode);
  return i18next.changeLanguage(normalized);
};

// =============================================================================
// PURE TRANSFORMATIONS
// =============================================================================

/**
 * Normalize UI code (handles variants like "en-US" → "en")
 * @param {string} uiCode - "en-US", "en", etc.
 * @returns {string} "en"
 */
export const getNormalizedUICode = (uiCode) => {
  if (!uiCode) return "en";
  return uiCode.split("-")[0];
};

/**
 * Get language name from UI code
 * @param {string} uiCode - "en", "fr"
 * @returns {string|null} "English", "French", or null
 */
export const getLangNameFromUICode = (uiCode) => {
  if (!uiCode) return null;
  const normalized = uiCode.split("-")[0];
  return codesToLanguages[normalized] || null;
};

/**
 * Get language name from OCA code
 * @param {string} ocaCode - "eng", "fra"
 * @returns {string|null} "English", "French", or null
 */
export const getLangNameFromOCACode = (ocaCode) => {
  if (!ocaCode) return null;
  const normalized = ocaCode.toLowerCase();
  for (const [langName, code] of Object.entries(languageNameToAlpha3Codes)) {
    if (code === normalized) {
      return langName.charAt(0).toUpperCase() + langName.slice(1);
    }
  }
  return null;
};

/**
 * Get UI code from language name
 * @param {string} langName - "English", "French"
 * @returns {string} "en", "fr" (defaults to "en")
 */
export const getUICodeFromLangName = (langName) => {
  if (!langName) return "en";
  const normalized = langName.toLowerCase();
  return languageCodesObject[normalized] || "en";
};

/**
 * Get OCA code from language name
 * @param {string} langName - "English", "French"
 * @returns {string} "eng", "fra" (defaults to "eng")
 */
export const getOCACodeFromLangName = (langName) => {
  if (!langName) return "eng";
  const normalized = langName.toLowerCase();
  return languageNameToAlpha3Codes[normalized] || "eng";
};

/**
 * Get OCA code from UI code (shortcut)
 * @param {string} uiCode - "en", "fr"
 * @returns {string} "eng", "fra"
 */
export const getOCACodeFromUICode = (uiCode) => {
  const langName = getLangNameFromUICode(uiCode);
  return langName ? getOCACodeFromLangName(langName) : "eng";
};

/**
 * Get UI code from OCA code (shortcut)
 * @param {string} ocaCode - "eng", "fra"
 * @returns {string} "en", "fr"
 */
export const getUICodeFromOCACode = (ocaCode) => {
  const langName = getLangNameFromOCACode(ocaCode);
  return langName ? getUICodeFromLangName(langName) : "en";
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get best language name from available options, preferring UI language
 * @param {Object} schema - Object with languages array: { languages: ["English", "French"] }
 * @param {string} [preferredUICode] - Optional UI code preference
 * @returns {string} Best language name like "English"
 */
export const getBestLangName = (schema, preferredUICode) => {
  if (!schema?.languages || !Array.isArray(schema.languages)) {
    return LanguageConstants.DEFAULT_LANG_NAME;
  }

  if (preferredUICode) {
    const preferredLangName = getLangNameFromUICode(preferredUICode);
    if (schema.languages.includes(preferredLangName)) {
      return preferredLangName;
    }
  }

  if (schema.languages.includes(LanguageConstants.DEFAULT_LANG_NAME)) {
    return LanguageConstants.DEFAULT_LANG_NAME;
  }

  return schema.languages[0];
};

/**
 * Get language names array with UI-preferred language first
 * @param {string[]} langNames - ["English", "French", "Spanish"]
 * @param {string} [uiCode] - Optional UI code (defaults to current)
 * @returns {string[]} Reordered array like ["French", "English", "Spanish"]
 */
export const getPrioritizedLangNames = (langNames, uiCode = null) => {
  if (!langNames?.length) return [];
  
  const currentUICode = uiCode || getUICode();
  const matchingLangName = getLangNameFromUICode(currentUICode);
  
  if (!matchingLangName || !langNames.includes(matchingLangName)) {
    return [...langNames];
  }
  
  const arr = [...langNames];
  const idx = arr.indexOf(matchingLangName);
  if (idx > 0) {
    const [removed] = arr.splice(idx, 1);
    arr.unshift(removed);
  }
  return arr;
};
