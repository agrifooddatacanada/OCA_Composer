import i18next from "i18next";
import { languageCodesObject, codesToLanguages, languageNameToAlpha3Codes } from "../constants/isoCodes";

/**
 * Language Manager - Centralized language utilities for OCA Composer
 * 
 * Core Principles:
 * 1. Pure Functions: Most utilities are pure (no side effects)
 * 2. Clear Separation: UI state management vs data conversion utilities
 * 3. Testable: Easy to unit test without mocking i18next
 * 4. Type Safety: Clear input/output contracts
 * 
 * Handles:
 * - Language Code Conversion: UI ↔ Schema ↔ OCA format mapping
 * - UI Language Management: App interface language switching  
 * - Schema Language Logic: Multi-language schema context resolution
 */
export const LanguageUtils = {
  
  // === PURE CONVERSION UTILITIES ===
  // These functions have no side effects and are easily testable
  
  /**
   * Convert UI language code to schema language name
   * @param {string} uiLanguageCode - 2-letter code like "en", "fr"
   * @returns {string|null} Schema language name like "English", "French" or null if not found
   */
  getSchemaLanguageFromUI(uiLanguageCode) {
    if (!uiLanguageCode) return null;
    
    // Handle common variants
    const normalizedCode = uiLanguageCode.split("-")[0]; // "en-US" -> "en"
    return codesToLanguages[normalizedCode] || null;
  },

  /**
   * Convert schema language name to 2-letter UI language code
   * @param {string} schemaLanguageName - Full name like "English", "French"
   * @returns {string} 2-letter code like "en", "fr", defaults to "en"
   */
  getUILanguageCode(schemaLanguageName) {
    if (!schemaLanguageName) return "en";
    
    const normalizedName = schemaLanguageName.toLowerCase();
    return languageCodesObject[normalizedName] || "en";
  },

  /**
   * Convert schema language name to 3-letter OCA language code
   * @param {string} schemaLanguageName - Full name like "English", "French"
   * @returns {string} 3-letter code like "eng", "fra", defaults to "eng"
   */
  getOCALanguageCode(schemaLanguageName) {
    if (!schemaLanguageName) return "eng";
    
    const normalizedName = schemaLanguageName.toLowerCase();
    return languageNameToAlpha3Codes[normalizedName] || "eng";
  },

  /**
   * Convert 3-letter OCA language code to schema language name
   * @param {string} ocaLanguageCode - 3-letter code like "eng", "fra"
   * @returns {string|null} Schema language name like "English", "French" or null if not found
   */
  getSchemaLanguageFromOCA(ocaLanguageCode) {
    if (!ocaLanguageCode) return null;
    
    const normalizedCode = ocaLanguageCode.toLowerCase();
    // Build reverse lookup from languageNameToAlpha3Codes
    for (const [languageName, code] of Object.entries(languageNameToAlpha3Codes)) {
      if (code === normalizedCode) {
        // Capitalize first letter
        return languageName.charAt(0).toUpperCase() + languageName.slice(1);
      }
    }
    return null;
  },

    /**
   * Get best available language from schema, with UI language preference
   * @param {Object} schema - Schema object with available languages
   * @param {string} [preferredUILanguage] - Optional UI language preference
   * @returns {string} Best available schema language name
   * 
   * @example
   * getBestSchemaLanguage({languages: ['French', 'English']}, 'fr') 
   * // → 'French' (matches French UI preference)
   * 
   * getBestSchemaLanguage({languages: ['Spanish']}) 
   * // → 'English' (fallback when no matches)
   */
  getBestSchemaLanguage(schema, preferredUILanguage) {
    if (!schema?.languages || !Array.isArray(schema.languages)) {
      return LanguageConstants.DEFAULT_SCHEMA_LANGUAGE;
    }

    // If UI language preference provided, try to match it
    if (preferredUILanguage) {
      const preferredSchemaLanguage = this.getSchemaLanguageFromUI(preferredUILanguage);
      if (schema.languages.includes(preferredSchemaLanguage)) {
        return preferredSchemaLanguage;
      }
    }

    // Try default language
    if (schema.languages.includes(LanguageConstants.DEFAULT_SCHEMA_LANGUAGE)) {
      return LanguageConstants.DEFAULT_SCHEMA_LANGUAGE;
    }

    // Return first available language
    return schema.languages[0];
  },

  /**
   * Get default schema language (standardizes the fallback logic)
   * @param {string[]} availableLanguages - Available schema languages
   * @returns {string} Default schema language
   */
  getDefaultSchemaLanguage(availableLanguages = []) {
    return availableLanguages[0] || "English";
  },

  // === VALIDATION & INTROSPECTION ===

  /**
   * Validate if a language name is supported
   * @param {string} languageName - Language name to validate
   * @returns {boolean} True if language has OCA code mapping
   */
  isValidLanguage(languageName) {
    if (!languageName || typeof languageName !== 'string') return false;
    return languageName.toLowerCase() in languageCodesObject;
  },

  /**
   * Validate UI language code format
   * @param {string} uiLanguageCode - Code to validate
   * @returns {boolean} True if valid format
   */
  isValidUILanguageCode(uiLanguageCode) {
    if (!uiLanguageCode || typeof uiLanguageCode !== 'string') return false;
    const normalized = this.normalizeUILanguageCode(uiLanguageCode);
    return normalized in codesToLanguages;
  },

  /**
   * Get supported language mappings (for debugging/introspection)
   * @returns {Object} Complete language mapping information
   */
  getSupportedLanguages() {
    return {
      uiToSchema: codesToLanguages,
      schemaToOCA: languageCodesObject,
      supportedUICodes: Object.keys(codesToLanguages),
      supportedSchemaNames: Object.values(codesToLanguages),
      supportedOCACodes: Object.values(languageCodesObject)
    };
  },

  /**
   * Normalize UI language code (handles variants like en-US, en-CA)
   * @param {string} uiLanguageCode - UI language code
   * @returns {string} Normalized 2-letter code
   */
  normalizeUILanguageCode(uiLanguageCode) {
    if (!uiLanguageCode) return "en";
    return uiLanguageCode.split("-")[0]; // "en-US" -> "en"
  },

  // === UI TRANSLATION MANAGEMENT ===

  /**
   * Switch the application UI language
   * @param {string} uiLanguageCode - 2-letter code like "en", "fr"
   * @returns {Promise} i18next changeLanguage promise
   */
  switchUILanguage(uiLanguageCode) {
    const normalizedCode = this.normalizeUILanguageCode(uiLanguageCode);
    return i18next.changeLanguage(normalizedCode);
  },

  /**
   * Get current UI language
   * @returns {string} Current UI language code
   */
  getCurrentUILanguage() {
    return i18next.language;
  },

  /**
   * Check if UI language is currently set to specific language
   * @param {string} uiLanguageCode - Language code to check
   * @returns {boolean} True if current language matches
   */
  isUILanguage(uiLanguageCode) {
    return this.normalizeUILanguageCode(i18next.language) === this.normalizeUILanguageCode(uiLanguageCode);
  },

  // === SCHEMA LANGUAGE MANAGEMENT ===

  // === UI-AWARE UTILITIES ===
  // These functions access current UI state (i18next) - use sparingly

  /**
   * Get prioritized schema languages with UI language preference first
   * @param {string[]} schemaLanguages - Available schema languages
   * @param {string} [uiLanguageCode] - UI language code (defaults to current)
   * @returns {string[]} Reordered language array
   * @example
   * // Current UI: French, Available: ['English', 'French', 'Spanish']
   * getPrioritizedSchemaLanguages(['English', 'French', 'Spanish']) 
   * // Returns: ['French', 'English', 'Spanish']
   */
  getPrioritizedSchemaLanguages(schemaLanguages, uiLanguageCode = null) {
    if (!schemaLanguages?.length) return [];
    
    const currentUILang = uiLanguageCode || this.getCurrentUILanguage();
    const matchingSchemaLang = this.getSchemaLanguageFromUI(currentUILang);
    
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
  },

  /**
   * Resolve effective schema language with override support
   * @param {string|null} schemaLanguageOverride - Manual override
   * @param {string[]} availableLanguages - Available options
   * @param {string} [uiLanguageCode] - UI language (defaults to current)
   * @returns {string} Resolved schema language
   */
  getEffectiveSchemaLanguage(schemaLanguageOverride, availableLanguages, uiLanguageCode = null) {
    if (schemaLanguageOverride) return schemaLanguageOverride;
    
    const currentUILang = uiLanguageCode || this.getCurrentUILanguage();
    return this.getBestSchemaLanguage({languages: availableLanguages}, currentUILang);
  }
};

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

// === DIRECT FUNCTION EXPORTS ===
// For cleaner imports: import { getSchemaLanguageFromUI } from '../utils/languageUtils'
// Instead of: import { LanguageUtils } from '../utils/languageUtils'; LanguageUtils.getSchemaLanguageFromUI()

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
