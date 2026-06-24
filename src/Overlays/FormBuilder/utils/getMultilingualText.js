import i18next from "i18next";
import { langNameFromTwoLetters } from "../../../utils/languageUtils";

const getMultilingualText = (textObj, currentLanguage, fallback = "") => {
  if (!textObj || typeof textObj !== "object") {
    return textObj || fallback;
  }

  if (currentLanguage && textObj[currentLanguage] !== undefined) {
    return textObj[currentLanguage];
  }

  const userLanguage = langNameFromTwoLetters(i18next.language);
  if (userLanguage && textObj[userLanguage] !== undefined) {
    return textObj[userLanguage];
  }

  const firstLang = Object.keys(textObj)[0];
  if (firstLang && textObj[firstLang] !== undefined) {
    return textObj[firstLang];
  }

  return fallback;
};

export default getMultilingualText;
