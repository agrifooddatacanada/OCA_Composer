import i18next from "i18next";
import { languageCodesObject, codesToLanguages, languageNameToAlpha3Codes } from "../constants/isoCodes";

/**
 * Language Utilities for OCA Composer
 * 
 * Three language formats:
 *   - UI Code (2-letter): "en", "fr" - i18next UI codes (ISO 639-1)
 *   - Lang Name (word): "English", "French" - display names
 *   - OCA Code (3-letter): "eng", "fra" - OCA 2.0+ spec (ISO 639-2)
 * 
 * Backward Compatibility:
 *   - Supports legacy OCA 1.0 2-letter language codes ("en", "fr")
 *   - Supports legacy OCA 1.0 locale codes ("en-US", "en-GB", "fr-CA")
 *   - All exports use modern 3-letter OCA codes
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
 * Get current UI language name from i18next
 * @returns {string} "English", "French", etc.
 */
export const getUILangName = () => {
  return langNameFromTwoLetters(getUICode()) || LanguageConstants.DEFAULT_LANG_NAME;
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
 * Get language name from 2-letter ISO 639-1 code
 * 
 * Primary use: i18next UI language codes ("en", "fr")
 * Also handles: Legacy OCA 1.0 language codes from pre-2024 spec
 *   - Simple codes: "en", "fr"
 *   - Locale codes: "en-US", "en-GB", "fr-CA" (strips country code)
 * 
 * Note: OCA spec changed in 2024 to require 3-letter ISO 639-2 codes.
 * This function provides backward compatibility for files using the old format.
 * 
 * @param {string} uiCode - "en", "fr", "en-US", "fr-CA", etc.
 * @returns {string|null} "English", "French", or null
 */
export const langNameFromTwoLetters = (uiCode) => {
  if (!uiCode) return null;
  const normalized = uiCode.split("-")[0];  // Strip locale: "en-US" → "en"
  return codesToLanguages[normalized] || null;
};

/**
 * Get language name from OCA code
 * @param {string} langCodeOCA - "eng", "fra"
 * @returns {string|null} "English", "French", or null
 */
export const langNameFromCodeOCA = (langCodeOCA) => {
  if (!langCodeOCA) return null;
  const normalized = langCodeOCA.toLowerCase();
  for (const [langName, code] of Object.entries(languageNameToAlpha3Codes)) {
    if (code === normalized) {
      return langName.charAt(0).toUpperCase() + langName.slice(1);
    }
  }
  return null;
};

/**
 * Get 2-letter code from language name
 * @param {string} langName - "English", "French"
 * @returns {string} "en", "fr" (defaults to "en")
 */
export const langTwoLettersFromName = (langName) => {
  if (!langName) return "en";
  const normalized = langName.toLowerCase();
  return languageCodesObject[normalized] || "en";
};

/**
 * Get OCA code from language name
 * @param {string} langName - "English", "French"
 * @returns {string} "eng", "fra" (defaults to "eng")
 */
export const langCodeOCAFromName = (langName) => {
  if (!langName) return "eng";
  const normalized = langName.toLowerCase();
  return languageNameToAlpha3Codes[normalized] || "eng";
};

/**
 * Get OCA code from 2-letter code
 * @param {string} uiCode - "en", "fr"
 * @returns {string} "eng", "fra"
 */
export const langCodeOCAFromTwoLetters = (uiCode) => {
  const langName = langNameFromTwoLetters(uiCode);
  return langName ? langCodeOCAFromName(langName) : "eng";
};

/**
 * Get 2-letter code from OCA code
 * @param {string} langCodeOCA - "eng", "fra"
 * @returns {string} "en", "fr"
 */
export const langTwoLettersFromCodeOCA = (langCodeOCA) => {
  const langName = langNameFromCodeOCA(langCodeOCA);
  return langName ? langTwoLettersFromName(langName) : "en";
};

/**
 * Normalize any language code to OCA 3-letter format
 * Handles both 2-letter (UI/legacy OCA) codes and 3-letter OCA codes
 * @param {string} code - Any language code: "en", "eng", "fr", "fra"
 * @returns {string} OCA 3-letter code: "eng", "fra"
 * 
 * ARCHITECTURE: This is the boundary normalization function
 * - Use when importing/parsing data that might have mixed formats
 * - Ensures internal consistency by standardizing to OCA format
 */
export const normalizeToOCACode = (code) => {
  if (!code) return LanguageConstants.DEFAULT_OCA_CODE;
  
  // Try as OCA code first (if valid, return as-is)
  const langNameFromOCA = langNameFromCodeOCA(code);
  if (langNameFromOCA) {
    return code.toLowerCase();
  }
  
  // Try as 2-letter code, convert to OCA
  const langNameFromTwo = langNameFromTwoLetters(code);
  if (langNameFromTwo) {
    return langCodeOCAFromName(langNameFromTwo);
  }
  
  // Unknown code - return as-is (lowercase)
  return code.toLowerCase();
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
    const preferredLangName = langNameFromTwoLetters(preferredUICode);
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
  const matchingLangName = langNameFromTwoLetters(currentUICode);
  
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

// =============================================================================
// DATA RESOLUTION UTILITIES
// =============================================================================

/**
 * Resolve language-keyed data with flexible key matching
 * 
 * Handles data objects keyed by any language format:
 *   - Language name: { English: [...], French: [...] }
 *   - OCA code: { eng: [...], fra: [...] }
 *   - UI code: { en: [...], fr: [...] }
 * 
 * @param {Object} dataObj - Object with language keys
 * @param {string} languageName - Language name to look up (e.g., "English")
 * @returns {any} Value for the language, or null if not found
 * 
 * @example
 * const data = { English: [1,2,3], eng: [4,5,6] };
 * resolveLanguageData(data, "English") // => [1,2,3]
 * resolveLanguageData(data, "French")  // => null
 */
export const resolveLanguageData = (dataObj, languageName) => {
  if (!dataObj || !languageName) return null;
  
  // Try direct lookup by language name
  if (dataObj[languageName] !== undefined) return dataObj[languageName];
  
  // Try OCA code (3-letter: eng, fra)
  const langCodeOCA = langCodeOCAFromName(languageName);
  if (langCodeOCA && dataObj[langCodeOCA] !== undefined) return dataObj[langCodeOCA];
  
  // Try 2-letter code: en, fr
  const twoLetterCode = langTwoLettersFromName(languageName);
  if (twoLetterCode && dataObj[twoLetterCode] !== undefined) return dataObj[twoLetterCode];
  
  return null;
};
