import i18next from "i18next";
import {
  LanguageConstants,
  getNormalizedUICode,
  langNameFromTwoLetters
} from "@oca-composer/oca-core/src/utils/languageUtils";

export * from "@oca-composer/oca-core/src/utils/languageUtils";

/**
 * Get current UI language code from i18next
 * @returns {string} "en", "fr", etc.
 */
export const getUICode = () => i18next.language;

/**
 * Get current UI language name from i18next
 * @returns {string} "English", "French", etc.
 */
export const getUILangName = () =>
  langNameFromTwoLetters(getUICode()) || LanguageConstants.DEFAULT_LANG_NAME;

/**
 * Set the application UI language
 * @param {string} uiCode - "en", "fr", etc.
 */
export const setUICode = (uiCode) => {
  const normalized = getNormalizedUICode(uiCode);
  return i18next.changeLanguage(normalized);
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
