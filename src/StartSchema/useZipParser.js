import { useContext } from 'react';
import { Context } from '../App';
import { codesToLanguages, languageCodesObject } from '../constants/isoCodes';
import { codeToDivision, codeToGroup } from '../constants/constants';

const useZipParser = () => {
  const {
    setAttributesList,
    setSchemaDescription,
    setDivisionGroup,
    setLanguages,
    setAttributeRowData,
    setLanAttributeRowData,
    setAttributesWithLists,
    setSavedEntryCodes,
    setCharacterEncodingRowData,
    setOverlay
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

  const processLabelsDescriptionRootUnitsEntries = (labels, description, root, units, entryCodes, entries, conformance, characterEncoding) => {
    const newSavedEntryCodes = {};
    const attrList = new Set();
    const newLangAttributeRowData = {};
    const newAttributeRowData = [];
    const newCharacterEncodingRowData = [];
    const attributeListStringMap = {};
    let attributesWithListType = [];

    // Parse entry codes for list type attributes
    if (entries.length > 0) {
      attributesWithListType = Object.keys(entryCodes['attribute_entry_codes']);

      for (const attrWithList of attributesWithListType) {
        const newEntryCodeValueRowsForAttribute = [];
        const entryCodesForAttribute = entryCodes['attribute_entry_codes'][attrWithList];

        for (const entryCode of entryCodesForAttribute) {
          const entryCodeValueEntity = {
            Code: entryCode
          };

          for (let i = 0; i < entries.length; i++) {
            const keyName = attrWithList + '_' + entries[i].language;
            const entryCodeValue = entries[i]['attribute_entries'][attrWithList][entryCode];

            if (attributeListStringMap[keyName]) {
              attributeListStringMap[keyName] += (' | ' + entryCodeValue);
            } else {
              attributeListStringMap[keyName] = entryCodeValue;
            }

            entryCodeValueEntity[codesToLanguages[entries[i].language]] = entryCodeValue;
          }
          newEntryCodeValueRowsForAttribute.push(entryCodeValueEntity);
        }

        newSavedEntryCodes[attrWithList] = (newSavedEntryCodes[attrWithList] || []).concat(newEntryCodeValueRowsForAttribute);
      }
      setAttributesWithLists(attributesWithListType);
      setSavedEntryCodes(newSavedEntryCodes);
    }

    // Parse classification
    const classificationFromJson = root?.['classification'];
    const indexOfRDF = classificationFromJson?.indexOf('RDF');
    if (indexOfRDF !== -1 && !isNaN(classificationFromJson?.[indexOfRDF + 5])) {
      setDivisionGroup({
        division: codeToDivision?.[classificationFromJson?.substring(indexOfRDF, indexOfRDF + 5)],
        group: codeToGroup?.[classificationFromJson?.substring(indexOfRDF, indexOfRDF + 6)],
      });
    } else if (indexOfRDF !== -1 && classificationFromJson?.[indexOfRDF + 4] && !isNaN(classificationFromJson?.[indexOfRDF + 4])) {
      setDivisionGroup({
        division: codeToDivision?.[classificationFromJson?.substring(indexOfRDF, indexOfRDF + 5)],
        group: '',
      });
    }

    // meta data: label and description
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
          List: attributeListStringMap[key + '_' + language] || "Not a List"
        });
      }
    }

    // Parse attributes details such as type and unit + Parsing conformance and character encoding to characterEncodingRowData
    const uniqueAttrList = [...attrList];
    uniqueAttrList.forEach((item) => {
      newAttributeRowData.push({
        Attribute: item,
        Flagged: false,
        List: attributesWithListType.includes(item),
        Type: root?.['attributes']?.[item],
        Unit: units?.['attribute_units']?.[item]
      });

      const newRowForCharacterEncoding = { Attribute: item };
      if (conformance) {
        newRowForCharacterEncoding['Make entries required'] = conformance?.['attribute_conformance']?.[item] === "M";

        setOverlay(prev => ({
          ...prev,
          "Make entries required": {
            ...prev["Make entries required"],
            selected: true
          }
        }));
      }
      if (characterEncoding) {
        newRowForCharacterEncoding['Character Encoding'] = characterEncoding?.['attribute_character_encoding']?.[item] || characterEncoding?.['default_character_encoding'];
        setOverlay(prev => ({
          ...prev,
          "Character Encoding": {
            ...prev["Character Encoding"],
            selected: true
          }
        }));
      }
      newCharacterEncodingRowData.push(newRowForCharacterEncoding);
    });

    setCharacterEncodingRowData(newCharacterEncodingRowData);
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