import { useContext } from "react";
import { Context } from "../App";
import { codesToLanguages, languageCodesObject } from "../constants/isoCodes";
import {
  ADC,
  codeToDivision,
  codeToGroup,
  CUSTOM_FORMAT_RULE,
  SENSITIVE
} from "../constants/constants";
import {
  getFormatRuleDescription,
  getOrderedAttributeRowData,
  hasAttributeOrdering,
  hasEntryCodeOrdering,
  hasUnitFramingOverlay
} from "../constants/utils";

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
    setDataStandardsRowData,
    setCardinalityData,
    setUnitRowData
  } = useContext(Context);

  const processLanguages = (languages) => {
    const newLanguages = languages.map((language) => {
      if (!codesToLanguages?.[language]) {
        const randomString = `lang_${language}`;
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

  const processLabelsDescriptionRootUnitsEntries = (
    labels,
    description,
    root,
    units,
    entryCodes,
    entries,
    conformance,
    characterEncoding,
    languageList,
    formatRules,
    cardinalityData,
    dataStandards,
    ocaPackageData
  ) => {
    const newSavedEntryCodes = {};
    const newLangAttributeRowData = {};
    const newAttributeRowData = [];
    const newCharacterEncodingRowData = [];
    const newFormatRuleRowData = [];
    const newDataStandardsRowData = [];
    const attributeListStringMap = {};
    let attributesWithListType = [];
    const newUnitFramingRowData = [];

    // Parse entry codes for list type attributes
    if (entries.length > 0) {
      attributesWithListType = Object.keys(entryCodes.attribute_entry_codes);

      for (const attrWithList of attributesWithListType) {
        const newEntryCodeValueRowsForAttribute = [];
        let entryCodesForAttribute;

        if (ocaPackageData && hasEntryCodeOrdering(ocaPackageData)) {
          const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
          entryCodesForAttribute =
            ocaPackageData.extensions[ADC][captureBaseSaid]?.overlays?.ordering
              ?.entry_code_ordering[attrWithList];
        } else {
          entryCodesForAttribute = entryCodes.attribute_entry_codes[attrWithList];
        }

        if (typeof entryCodesForAttribute === "string") {
          // Possibly send to an API to get the entry codes
        } else {
          for (const entryCode of entryCodesForAttribute) {
            const entryCodeValueEntity = {
              Code: entryCode
            };

            for (let i = 0; i < entries.length; i++) {
              const keyName = `${attrWithList}_${entries[i].language.slice(0, 2)}`;
              const entryCodeValue =
                entries[i].attribute_entries[attrWithList][entryCode];

              if (attributeListStringMap[keyName]) {
                attributeListStringMap[keyName] += ` | ${entryCodeValue}`;
              } else {
                attributeListStringMap[keyName] = entryCodeValue;
              }

              entryCodeValueEntity[codesToLanguages[entries[i].language.slice(0, 2)]] =
                entryCodeValue;
            }
            newEntryCodeValueRowsForAttribute.push(entryCodeValueEntity);
          }

          newSavedEntryCodes[attrWithList] = (
            newSavedEntryCodes[attrWithList] || []
          ).concat(newEntryCodeValueRowsForAttribute);
        }
      }

      setAttributesWithLists(attributesWithListType);
      setSavedEntryCodes(newSavedEntryCodes);
    }

    // Parse classification
    const classificationFromJson = root?.classification;
    const indexOfRDF = classificationFromJson?.indexOf("RDF");
    if (indexOfRDF !== -1 && !Number.isNaN(classificationFromJson?.[indexOfRDF + 5])) {
      let divisionCode = classificationFromJson?.substring(indexOfRDF, indexOfRDF + 5);

      // Division 20 and 21 are named differently in the codeToDivision object
      if (divisionCode === "RDF20" || divisionCode === "RDF21") {
        divisionCode = "RDF20-21";
      }

      setDivisionGroup({
        division: codeToDivision?.[divisionCode || ""],
        group:
          codeToGroup?.[classificationFromJson?.substring(indexOfRDF, indexOfRDF + 6)]
      });
    } else if (
      indexOfRDF !== -1 &&
      classificationFromJson?.[indexOfRDF + 4] &&
      !Number.isNaN(classificationFromJson?.[indexOfRDF + 4])
    ) {
      setDivisionGroup({
        division:
          codeToDivision?.[classificationFromJson?.substring(indexOfRDF, indexOfRDF + 5)],
        group: ""
      });
    }

    // meta data: label and description
    const languageDescriptionMap = {};
    for (const { language, attribute_information } of description) {
      languageDescriptionMap[language.slice(0, 2)] = attribute_information;
    }

    const attributeList = Object.keys(root?.attributes || {});
    for (const lang of languageList) {
      const label = labels.find((label) => label.language.slice(0, 2) === lang);
      newLangAttributeRowData[codesToLanguages[lang]] = [];

      for (const attr of attributeList) {
        // Removing any escape characters for " and '
        const formattedDescription = languageDescriptionMap?.[lang]?.[attr]
          ? // eslint-disable-next-line quotes
            languageDescriptionMap[lang][attr].replace(/\\"/g, '"').replace(/\\'/g, "'")
          : "";
        if (
          label &&
          label.attribute_labels &&
          Object.prototype.hasOwnProperty.call(label.attribute_labels, attr)
        ) {
          newLangAttributeRowData[codesToLanguages[lang]].push({
            Attribute: attr,
            Description: formattedDescription,
            Label: label.attribute_labels[attr],
            List: attributeListStringMap[`${attr}_${lang}`] || "Not a List"
          });
        } else {
          newLangAttributeRowData[codesToLanguages[lang]].push({
            Attribute: attr,
            Description: formattedDescription,
            Label: "",
            List: attributeListStringMap?.[`${attr}_${lang}`] || "Not a List"
          });
        }
      }
    }

    // Parse attributes details such as type and unit + Parsing conformance and character encoding to characterEncodingRowData
    // Flagged attributes are retrieved from OCA package ADC community sensitive overlay
    const sensitiveOverlay =
      ocaPackageData?.extensions?.[ADC]?.[
        ocaPackageData?.oca_bundle?.bundle?.capture_base?.d
      ]?.overlays?.[SENSITIVE];

    const sensitiveAttributes = sensitiveOverlay?.sensitive_attributes || [];

    attributeList.forEach((item) => {
      newAttributeRowData.push({
        Attribute: item,
        Flagged: sensitiveAttributes.includes(item),
        List: attributesWithListType.includes(item),
        Type: Array.isArray(root?.attributes?.[item])
          ? `Array[${root?.attributes?.[item][0]}]`
          : root?.attributes?.[item],
        Unit: units?.attribute_units?.[item] || units?.attribute_unit?.[item]
      });

      const newRowForCharacterEncoding = { Attribute: item };

      if (conformance) {
        newRowForCharacterEncoding["Make selected entries required"] =
          conformance?.attribute_conformance?.[item] === "M";
        setOverlay((prev) => ({
          ...prev,
          "Make selected entries required": {
            ...prev["Make selected entries required"],
            selected: true
          }
        }));
      }

      if (characterEncoding) {
        newRowForCharacterEncoding["Character Encoding"] =
          characterEncoding?.attribute_character_encoding?.[item] ||
          characterEncoding?.default_character_encoding;
        setOverlay((prev) => ({
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

        // Remove the escape character for " in regex patterns
        // OCA file requires " to be escaped, that's why the escape character needs to be added when creating OCA file
        // However, in other situtations, the escape character is not needed
        const formatRule =
          // eslint-disable-next-line quotes
          formatRules?.attribute_formats?.[item.Attribute]?.replace(/\\"/g, '"') || "";
        const formatRuleDescription = getFormatRuleDescription(item?.Type, formatRule);

        // If format rule has a description, then it's not a custom format rule
        newFormatRuleData[formatRuleDescription ? "FormatText" : CUSTOM_FORMAT_RULE] =
          formatRule;

        setOverlay((prev) => ({
          ...prev,
          "Add format rule for data": {
            ...prev["Add format rule for data"],
            selected: true
          }
        }));

        newFormatRuleRowData.push(newFormatRuleData);
      });
    }

    // Parse data standards (Standard overlay)
    if (dataStandards) {
      newAttributeRowData.forEach((row) => {
        const newRowForDataStandard = { Attribute: row.Attribute };
        newRowForDataStandard.DataStandard =
          dataStandards?.attribute_standards?.[row.Attribute] || "";

        setOverlay((prev) => ({
          ...prev,
          "Data Standards": {
            ...prev["Data Standards"],
            selected: true
          }
        }));

        newDataStandardsRowData.push(newRowForDataStandard);
      });
    }

    // Parse cardinality
    if (cardinalityData) {
      const firstLanguage = Object.keys(newLangAttributeRowData)?.[0];
      const cardinalityDataToParse = [];
      if (newLangAttributeRowData?.[firstLanguage]) {
        for (const item of newLangAttributeRowData[firstLanguage]) {
          const cardinality = cardinalityData?.attribute_cardinality?.[item.Attribute];
          const attributeType = newAttributeRowData?.find(
            (row) => row?.Attribute === item?.Attribute
          )?.Type;
          cardinalityDataToParse.push({
            ...item,
            EntryLimit: cardinality,
            Type: attributeType
          });
        }
      }
      setOverlay((prev) => ({
        ...prev,
        Cardinality: {
          ...prev.Cardinality,
          selected: true
        }
      }));
      setCardinalityData(cardinalityDataToParse);
    }

    // Parse unit framing
    if (ocaPackageData && hasUnitFramingOverlay(ocaPackageData)) {
      const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
      const unitFraming =
        ocaPackageData.extensions[ADC][captureBaseSaid].overlays.unit_framing;

      newAttributeRowData.forEach((row) => {
        const unitFramed = row?.Unit;
        const unitFramingValue = unitFraming?.units?.[unitFramed]?.term_id || "";

        newUnitFramingRowData.push({
          Attribute: row.Attribute,
          Unit: row.Unit,
          "UCUM Code": unitFramingValue,
          "UCUM Label": "",
          Description: ""
        });

        setOverlay((prev) => ({
          ...prev,
          "Unit Framing": {
            ...prev["Unit Framing"],
            selected: true
          }
        }));
        setUnitRowData(newUnitFramingRowData);
      });
    }

    if (ocaPackageData && hasAttributeOrdering(ocaPackageData)) {
      const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
      const attributeOrdering =
        ocaPackageData.extensions[ADC][captureBaseSaid].overlays.ordering
          .attribute_ordering;
      const orderedAttributeRowData = getOrderedAttributeRowData(
        newAttributeRowData,
        attributeOrdering
      );
      setAttributeRowData(orderedAttributeRowData);
      setAttributesList(attributeOrdering);
    } else {
      setAttributesList(attributeList);
      setAttributeRowData(newAttributeRowData);
    }

    setFormatRuleRowData(newFormatRuleRowData);
    setDataStandardsRowData(newDataStandardsRowData);
    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setLanAttributeRowData(newLangAttributeRowData);
  };

  return {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries
  };
};

export default useZipParser;
