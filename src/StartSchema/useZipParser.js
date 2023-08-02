import { useContext } from 'react';
import { Context } from '../App';
import { codesToLanguages, languageCodesObject } from '../constants/isoCodes';
import { codeToDivision } from '../constants/constants';

const useZipParser = () => {
  const {
    setAttributesList,
    setSchemaDescription,
    setDivisionGroup,
    setLanguages,
    setAttributeRowData,
    setLanAttributeRowData,
    setAttributesWithLists,
    setSavedEntryCodes
  } = useContext(Context);

  const processLanguages = (languages) => {
    const newLanguages = languages.map((language) => {
      if (!codesToLanguages[language]) {
        const randomString = 'lang_' + language;
        codesToLanguages[language] = randomString;
        languageCodesObject[randomString] = language;
      }
      return codesToLanguages[language];
    });
    setLanguages(newLanguages);
  };

  const processMetadata = (metadata) => {
    const newMetadata = {};
    for (const { language, name, description } of metadata) {
      newMetadata[codesToLanguages[language]] = { name, description };
    }
    setSchemaDescription(newMetadata);
  };

  const processLabelsDescriptionRootUnitsEntries = (labels, description, root, units, entryCodes, entries) => {
    const newSavedEntryCodes = {};
    const attrList = new Set();
    const newLangAttributeRowData = {};
    const newAttributeRowData = [];
    const listStringMap = {};
    let attributesListType = [];

    if (entries.length > 0) {
      attributesListType = Object.keys(entryCodes['attribute_entry_codes']);
      for (const attrWithList of attributesListType) {
        const newRow = [];

        for (const option of entryCodes['attribute_entry_codes'][attrWithList]) {
          const newObject = {
            Code: option
          };
          for (let i = 0; i < entries.length; i++) {
            if (listStringMap[attrWithList + '_' + entries[i].language]) {
              listStringMap[attrWithList + '_' + entries[i].language] += (' | ' + entries[i]['attribute_entries'][attrWithList][option]);
            } else {
              listStringMap[attrWithList + '_' + entries[i].language] = entries[i]['attribute_entries'][attrWithList][option];
            }
            newObject[codesToLanguages[entries[i]['language']]] = entries[i]['attribute_entries'][attrWithList][option];
          }
          newRow.push(newObject);
        }

        newSavedEntryCodes[attrWithList] = (newSavedEntryCodes[attrWithList] || []).concat(newRow);
      }
      setAttributesWithLists(attributesListType);
      setSavedEntryCodes(newSavedEntryCodes);
    }

    const divisionCode = root['classification'].split(':')[1];
    setDivisionGroup({
      division: codeToDivision[divisionCode],
      group: '',
    });

    const languageDescriptionMap = {};
    for (const { language, attribute_information } of description) {
      languageDescriptionMap[language] = attribute_information;
    }

    for (const { language, attribute_labels } of labels) {
      Object.keys(attribute_labels).forEach((key) => attrList.add(key));
      newLangAttributeRowData[codesToLanguages[language]] = [];

      for (const [key, value] of Object.entries(attribute_labels)) {
        newLangAttributeRowData[codesToLanguages[language]].push({
          Attribute: key,
          Description: languageDescriptionMap[language][key],
          Label: value,
          List: listStringMap[key + '_' + language] || "Not a List"
        });
      }
    }

    const uniqueAttrList = [...attrList];
    uniqueAttrList.forEach((item) => newAttributeRowData.push({
      Attribute: item,
      Flagged: false,
      List: attributesListType.includes(item),
      Type: root['attributes'][item],
      Unit: units['attribute_units'][item]
    }));

    setLanAttributeRowData(newLangAttributeRowData);
    setAttributesList(uniqueAttrList);
    setAttributeRowData(newAttributeRowData);
  };


  return {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries,
  };
};


export default useZipParser;