import { useContext } from 'react';
import { Context } from '../App';
import { codesToLanguages } from '../constants/isoCodes';
import { codeToDivision } from '../constants/constants';

const useZipParser = () => {
  const {
    setAttributesList,
    setSchemaDescription,
    setDivisionGroup,
    setLanguages,
    setAttributeRowData,
    setLanAttributeRowData
  } = useContext(Context);

  const processLanguages = (languages) => {
    const newLanguages = languages.map((language) => codesToLanguages[language]);
    setLanguages(newLanguages);
  };

  const processMetadata = (metadata) => {
    const newMetadata = {};
    for (const { language, name, description } of metadata) {
      newMetadata[codesToLanguages[language]] = { name, description };
    }
    setSchemaDescription(newMetadata);
  };

  const processLabelsDescriptionRootUnits = (labels, description, root, units) => {
    const attrList = new Set();
    const newLangAttributeRowData = {};
    const newAttributeRowData = [];

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
          List: "Not a List"
        });
      }
    }

    const uniqueAttrList = [...attrList];
    uniqueAttrList.forEach((item) => newAttributeRowData.push({
      Attribute: item,
      Flagged: false,
      List: false,
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
    processLabelsDescriptionRootUnits
  };
};


export default useZipParser;