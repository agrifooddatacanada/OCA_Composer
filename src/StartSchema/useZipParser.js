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
    setOverlay,
    setFormatRuleRowData,
    setCardinalityData
  } = useContext(Context);

  const processLanguages = (languages) => {
    const newLanguages = languages.map((language) => {
      if (!codesToLanguages?.[language]) {
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
      newMetadata[codesToLanguages[language.slice(0, 2)]] = { name, description };
    }
    setSchemaDescription(newMetadata);
  };

  const processLabelsDescriptionRootUnitsEntries = (labels, description, root, units, entryCodes, entries, conformance, characterEncoding, languageList, formatRules, cardinalityData) => {
    const newSavedEntryCodes = {};
    const newLangAttributeRowData = {};
    const newAttributeRowData = [];
    const newCharacterEncodingRowData = [];
    const newFormatRuleRowData = [];
    const attributeListStringMap = {};
    let attributesWithListType = [];

    // Parse entry codes for list type attributes
    if (entries.length > 0) {
      attributesWithListType = Object.keys(entryCodes['attribute_entry_codes']);

      for (const attrWithList of attributesWithListType) {
        const newEntryCodeValueRowsForAttribute = [];
        const entryCodesForAttribute = entryCodes['attribute_entry_codes'][attrWithList];
        if (typeof entryCodesForAttribute === 'string') {
          // Possibly send to an API to get the entry codes 
        } else {
          for (const entryCode of entryCodesForAttribute) {
            const entryCodeValueEntity = {
              Code: entryCode
            };

            for (let i = 0; i < entries.length; i++) {
              const keyName = attrWithList + '_' + entries[i].language.slice(0, 2);
              const entryCodeValue = entries[i]['attribute_entries'][attrWithList][entryCode];

              if (attributeListStringMap[keyName]) {
                attributeListStringMap[keyName] += (' | ' + entryCodeValue);
              } else {
                attributeListStringMap[keyName] = entryCodeValue;
              }

              entryCodeValueEntity[codesToLanguages[entries[i].language.slice(0, 2)]] = entryCodeValue;
            }
            newEntryCodeValueRowsForAttribute.push(entryCodeValueEntity);
          }

          newSavedEntryCodes[attrWithList] = (newSavedEntryCodes[attrWithList] || []).concat(newEntryCodeValueRowsForAttribute);
        }
      }

      setAttributesWithLists(attributesWithListType);
      setSavedEntryCodes(newSavedEntryCodes);
    }

    // Parse classification
    const classificationFromJson = root?.['classification'];
    const indexOfRDF = classificationFromJson?.indexOf('RDF');
    if (indexOfRDF !== -1 && !isNaN(classificationFromJson?.[indexOfRDF + 5])) {
      let divisionCode = classificationFromJson?.substring(indexOfRDF, indexOfRDF + 5);

      // Division 20 is named differently in the codeToDivision object
      if (divisionCode === 'RDF20') {
        divisionCode = 'RDF20-21';
      }

      setDivisionGroup({
        division: codeToDivision?.[divisionCode || ''],
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
      languageDescriptionMap[language.slice(0, 2)] = attribute_information;
    }

    const attributeList = Object.keys(root?.['attributes'] || {});
    for (const lang of languageList) {
      const label = labels.find((label) => label.language.slice(0, 2) === lang);
      newLangAttributeRowData[codesToLanguages[lang]] = [];

      for (const attr of attributeList) {
        if (label && label?.attribute_labels?.hasOwnProperty(attr)) {
          newLangAttributeRowData[codesToLanguages[lang]].push({
            Attribute: attr,
            Description: languageDescriptionMap[lang][attr],
            Label: label.attribute_labels[attr],
            List: attributeListStringMap[attr + '_' + lang] || "Not a List"
          });
        } else {
          newLangAttributeRowData[codesToLanguages[lang]].push({
            Attribute: attr,
            Description: languageDescriptionMap?.[lang]?.[attr] || '',
            Label: '',
            List: attributeListStringMap?.[attr + '_' + lang] || "Not a List"
          });
        }
      }
    }

    // Parse attributes details such as type and unit + Parsing conformance and character encoding to characterEncodingRowData
    attributeList.forEach((item) => {
      newAttributeRowData.push({
        Attribute: item,
        Flagged: root?.['flagged_attributes']?.includes(item),
        List: attributesWithListType.includes(item),
        Type: root?.['attributes']?.[item],
        Unit: units?.['attribute_units']?.[item]
      });

      const newRowForCharacterEncoding = { Attribute: item };

      if (conformance) {
        newRowForCharacterEncoding['Make selected entries required'] = conformance?.['attribute_conformance']?.[item] === "M";
        setOverlay(prev => ({
          ...prev,
          "Make selected entries required": {
            ...prev["Make selected entries required"],
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

    if (formatRules) {
      newAttributeRowData.forEach((item) => {
        const newFormatRuleData = { Attribute: item?.Attribute, Type: item?.Type };

        newFormatRuleData['FormatText'] = formatRules?.['attribute_formats']?.[item.Attribute] || '';
        setOverlay(prev => ({
          ...prev,
          "Add format rule for data": {
            ...prev["Add format rule for data"],
            selected: true
          }
        }));

        newFormatRuleRowData.push(newFormatRuleData);
      });
    }

    // Parse cardinality
    if (cardinalityData) {
      const firstLanguage = Object.keys(newLangAttributeRowData)?.[0];
      const cardinalityDataToParse = [];
      for (const item of newLangAttributeRowData?.[firstLanguage]) {
        const cardinality = cardinalityData?.['attribute_cardinality']?.[item.Attribute];
        const attributeType = newAttributeRowData?.find((row) => row?.Attribute === item?.Attribute)?.Type;
        cardinalityDataToParse.push({
          ...item,
          EntryLimit: cardinality,
          Type: attributeType
        });
      }
      setOverlay(prev => ({
        ...prev,
        "Cardinality": {
          ...prev["Cardinality"],
          selected: true
        }
      }));
      setCardinalityData(cardinalityDataToParse);
    }

    setFormatRuleRowData(newFormatRuleRowData);
    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setLanAttributeRowData(newLangAttributeRowData);
    setAttributesList(attributeList);
    setAttributeRowData(newAttributeRowData);
  };


  return {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries,
  };
};


export default useZipParser;