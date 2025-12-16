import i18next from "i18next";
import { getLangNameFromUICode } from "../../../utils/languageUtils";

const getMultilingualText = (textObj, currentLanguage, fallback = "") => {
  if (!textObj || typeof textObj !== "object") {
    return textObj || fallback;
  }

  // Priority 1: Current language tab
  if (currentLanguage && textObj[currentLanguage]) {
    return textObj[currentLanguage];
  }

  // Priority 2: User's global UI language
  const userLanguage = getLangNameFromUICode(i18next.language);
  if (userLanguage && textObj[userLanguage]) {
    return textObj[userLanguage];
  }

  // Priority 3: First available language
  const firstLang = Object.keys(textObj)[0];
  if (firstLang && textObj[firstLang]) {
    return textObj[firstLang];
  }

  // Priority 4: Fallback
  return fallback;
};

export default getMultilingualText;
