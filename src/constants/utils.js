import i18next from "i18next";
import { codesToLanguages } from "./isoCodes";
import { DEFAULT_LANGUAGE } from "./constants";

export const getCurrentData = (currentApi, includedError) => {
  const newData = [];
  currentApi.forEachNode((node) => {
    const newObject = { ...node?.data };
    if (!includedError) {
      delete newObject.error;
    }
    newData.push(newObject);
  });
  return newData;
};

export const getDescriptiveFileName = (schemaDescription, commonFileName) => {
  const currentLanguage = codesToLanguages[i18next.language] || DEFAULT_LANGUAGE;
  const schemaName = schemaDescription[currentLanguage]?.name;
  const fileName = `${schemaName ? `${schemaName.split(" ")[0]}_` : ""}${commonFileName}`;
  return fileName;
};
