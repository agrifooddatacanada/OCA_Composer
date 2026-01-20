import { useContext } from "react";
import { Context } from "../App";
import {
  codesToLanguages,
  languageCodesObject,
  languageNameToAlpha3Codes
} from "../constants/isoCodes";
import {
  ADC,
  codeToDivision,
  codeToGroup,
  CUSTOM_FORMAT_RULE,
  dataTypes,
  FIELD_RANGE_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  RANGE,
  SCHEMA_MODE_MULTI_LEVEL,
  SCHEMA_MODE_SINGLE,
  SENSITIVE,
  TYPE_CHILD_SCHEMA,
  TYPE_ARRAY_CHILD_SCHEMA
} from "../constants/constants";
import {
  getFormatRuleDescription,
  getOrderedAttributeRowData,
  hasAttributeOrdering,
  hasEntryCodeOrdering,
  hasRangeOverlay,
  hasUnitFramingOverlay,
  hasAttributeFramingOverlay,
  isMultiLevelSchema,
  replaceCharsInKeys
} from "../utils/helpers";
import convertOverlayToFormBuilder from "../Overlays/FormBuilder/utils/convertOverlayToFormBuilder";

const useZipParser = () => {
  const {
    setSchemaDescription,
    setDivisionGroup,
    setLanguages,
    setAttributeRowData,
    setLanAttributeRowData,
    setAttributesWithLists,
    setSavedEntryCodes,
    setCharacterEncodingRowData,
    setOverlay,
    setDataStandardsRowData,
    setUnitRowData,
    setAttributeFramingRowData,
    setSchemaMode,
    setFormBuilderPages,
    setFormPlaceholdersByLanguage
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
    
    // Sort languages to ensure English appears first
    const sortedLanguages = [...newLanguages].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // English always comes first
      if (aLower === 'english') return -1;
      if (bLower === 'english') return 1;
      
      // French comes second (if present)
      if (aLower === 'french') return -1;
      if (bLower === 'french') return 1;
      
      // Rest alphabetically
      return a.localeCompare(b);
    });
    
    setLanguages(sortedLanguages);
  };

  const processMetadata = (metadata) => {
    const newMetadata = {};
    for (const { language, name, description } of metadata) {
      // Removing any escape characters for " and '
      const formattedDescription = description
        ? // eslint-disable-next-line quotes
          description.replace(/\\"/g, '"').replace(/\\'/g, "'")
        : "";
      newMetadata[codesToLanguages[language.slice(0, 2)]] = {
        name,
        description: formattedDescription
      };
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
    const newRangeRowData = [];
    const newFormPlaceholdersByLanguage = {};
    const newAttributeFramingRowData = [];

    if (isMultiLevelSchema(root?.attributes || {})) {
      setSchemaMode(SCHEMA_MODE_MULTI_LEVEL);
    } else {
      setSchemaMode(SCHEMA_MODE_SINGLE);
    }

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

    const sensitiveAttributes = Array.isArray(sensitiveOverlay?.sensitive_attributes)
      ? sensitiveOverlay?.sensitive_attributes
      : Array.isArray(root?.flagged_attributes)
        ? root?.flagged_attributes
        : [];

    attributeList.forEach((item) => {
      const attributeType = Array.isArray(root?.attributes?.[item])
        ? `Array[${root?.attributes?.[item][0]}]`
        : root?.attributes?.[item];

      newAttributeRowData.push({
        Attribute: item,
        Flagged: sensitiveAttributes.includes(item),
        List: attributesWithListType.includes(item),
        // Convert refs:/refn: OCA types to "Child Schema" for UI display
        Type: dataTypes.includes(attributeType)
          ? attributeType
          : attributeType.includes("Array[ref")
            ? TYPE_ARRAY_CHILD_SCHEMA
            : attributeType.includes("ref")
              ? TYPE_CHILD_SCHEMA
              : "",
        Unit: units?.attribute_units?.[item] || units?.attribute_unit?.[item]
      });

      const newRowForCharacterEncoding = { Attribute: item };

      if (attributeType === "Numeric" || attributeType === "DateTime") {
        const formatRule =
          // eslint-disable-next-line quotes
          formatRules?.attribute_formats?.[item]?.replace(/\\"/g, '"') || "";
        newRangeRowData.push({
          Attribute: item,
          Type: attributeType,
          FormatRule: formatRule,
          LowerBound: "",
          LowerInclusive: false,
          UpperBound: "",
          UpperInclusive: false
        });
      }

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
      // Removed: setCardinalityData - managed by MultiSchemaContext during import
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

    // Parse attribute framing
    if (ocaPackageData && hasAttributeFramingOverlay(ocaPackageData)) {
      const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
      const attributeFraming =
        ocaPackageData.extensions[ADC][captureBaseSaid]?.overlays.attribute_framing;

      newAttributeRowData.forEach((row) => {
        const attribute = row?.Attribute;
        const framingData = attributeFraming?.attributes?.[attribute];

        newAttributeFramingRowData.push({
          Attribute: attribute,
          objectId: framingData?.term_id,
          description: framingData?.description,
          mappingJustification: framingData?.framing_justification,
          predicateId: framingData?.predicate_id
        });

        setOverlay((prev) => ({
          ...prev,
          "Attribute Framing": {
            ...prev["Attribute Framing"],
            selected: true
          }
        }));

        setAttributeFramingRowData(newAttributeFramingRowData);
      });
    }

    if (ocaPackageData && hasRangeOverlay(ocaPackageData)) {
      const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
      const rangeOverlay =
        ocaPackageData.extensions[ADC][captureBaseSaid].overlays[RANGE];

      newRangeRowData.forEach((row) => {
        const attributeRangeData = rangeOverlay?.attributes?.[row.Attribute] || {};

        row.LowerBound = Object.prototype.hasOwnProperty.call(attributeRangeData, "lower")
          ? attributeRangeData.lower
          : "";

        row.LowerInclusive = Object.prototype.hasOwnProperty.call(
          attributeRangeData,
          "lower_inclusive"
        )
          ? attributeRangeData.lower_inclusive
          : false;

        row.UpperBound = Object.prototype.hasOwnProperty.call(attributeRangeData, "upper")
          ? attributeRangeData.upper
          : "";

        row.UpperInclusive = Object.prototype.hasOwnProperty.call(
          attributeRangeData,
          "upper_inclusive"
        )
          ? attributeRangeData.upper_inclusive
          : false;
      });

      setOverlay((prev) => ({
        ...prev,
        [FIELD_RANGE_OVERLAY]: {
          ...prev[FIELD_RANGE_OVERLAY],
          selected: true
        }
      }));
    }

    // Parse form information (form overlay) from ADC extensions, if present
    let formOverlayForConversion = null;
    if (ocaPackageData) {
      const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
      const extensionOverlays =
        ocaPackageData.extensions?.[ADC]?.[captureBaseSaid]?.overlays || {};

      const formOverlayData = extensionOverlays.form_overlay || extensionOverlays.form;
      const formOverlayArray = Array.isArray(formOverlayData)
        ? formOverlayData
        : formOverlayData?.form_overlays || [];

      if (Array.isArray(formOverlayArray) && formOverlayArray.length > 0) {
        setOverlay((prev) => ({
          ...prev,
          [FIELD_FORM_INFORMATION_OVERLAY]: {
            ...prev[FIELD_FORM_INFORMATION_OVERLAY],
            selected: true
          }
        }));
        formOverlayForConversion = formOverlayArray;
      }
    }

    if (ocaPackageData && hasAttributeOrdering(ocaPackageData)) {
      const captureBaseSaid = ocaPackageData?.oca_bundle?.bundle?.capture_base?.d;
      const attributeOrdering = replaceCharsInKeys(
        ocaPackageData.extensions[ADC][captureBaseSaid].overlays.ordering
          .attribute_ordering
      );
      const orderedAttributeRowData = getOrderedAttributeRowData(
        newAttributeRowData,
        attributeOrdering
      );
      setAttributeRowData(orderedAttributeRowData);
      // attributesList removed - it's now derived from attributeRowData
    } else {
      // attributesList removed - it's now derived from attributeRowData
      setAttributeRowData(newAttributeRowData);
    }

    // Extract placeholders from form overlay interaction arguments
    if (formOverlayForConversion && Array.isArray(formOverlayForConversion)) {
      const interactionArgs = {};
      formOverlayForConversion.forEach((overlay) => {
        const overlayLang = overlay.language || "eng";
        if (overlay.interaction?.[0]?.arguments) {
          if (!interactionArgs[overlayLang]) {
            interactionArgs[overlayLang] = {};
          }
          Object.assign(interactionArgs[overlayLang], overlay.interaction[0].arguments);
        }
      });

      languageList.forEach((lang) => {
        const uiLanguageName = codesToLanguages[lang];
        if (!uiLanguageName || !newLangAttributeRowData[uiLanguageName]) return;

        const langCode3 =
          languageNameToAlpha3Codes[uiLanguageName?.toLowerCase()] || lang;

        const overlayLangKeys = Object.keys(interactionArgs);

        if (!newFormPlaceholdersByLanguage[uiLanguageName]) {
          newFormPlaceholdersByLanguage[uiLanguageName] = {};
        }

        newLangAttributeRowData[uiLanguageName] = newLangAttributeRowData[
          uiLanguageName
        ].map((item) => {
          const attr = item.Attribute;
          let placeholderValue = "";

          if (interactionArgs[langCode3]?.[attr]?.placeholder !== undefined) {
            const { placeholder } = interactionArgs[langCode3][attr];

            if (typeof placeholder === "string" && placeholder) {
              placeholderValue = placeholder;
            } else if (typeof placeholder === "object" && placeholder !== null) {
              placeholderValue = placeholder[langCode3] || placeholder[lang] || "";
              if (!placeholderValue) {
                const firstKey = Object.keys(placeholder)[0];
                placeholderValue = firstKey ? placeholder[firstKey] : "";
              }
            }
          }

          if (!placeholderValue) {
            for (const overlayLangKey of overlayLangKeys) {
              if (interactionArgs[overlayLangKey]?.[attr]?.placeholder !== undefined) {
                const { placeholder } = interactionArgs[overlayLangKey][attr];

                if (typeof placeholder === "string" && placeholder) {
                  placeholderValue = placeholder;
                  break;
                } else if (typeof placeholder === "object" && placeholder !== null) {
                  placeholderValue = placeholder[langCode3] || placeholder[lang] || "";
                  if (placeholderValue) break;
                  const firstKey = Object.keys(placeholder)[0];
                  if (firstKey) {
                    placeholderValue = placeholder[firstKey];
                    break;
                  }
                }
              }
            }
          }

          if (placeholderValue) {
            newFormPlaceholdersByLanguage[uiLanguageName][attr] = placeholderValue;
          }

          return {
            ...item
          };
        });
      });
    } else {
      // No form overlay present; leave formPlaceholdersByLanguage empty
    }

    // Removed: setFormatRuleRowData, setCardinalityData, setRangeRowData calls
    // These are now managed by MultiSchemaContext during OCA package import
    setDataStandardsRowData(newDataStandardsRowData);
    setCharacterEncodingRowData(newCharacterEncodingRowData);

    setLanAttributeRowData(newLangAttributeRowData);
    setFormPlaceholdersByLanguage(newFormPlaceholdersByLanguage);

    // Convert form overlay to form builder pages format
    const processedLanguages = languageList.map((lang) => codesToLanguages[lang] || lang);
    if (formOverlayForConversion && processedLanguages && processedLanguages.length > 0) {
      try {
        const finalAttributeRowData =
          ocaPackageData && hasAttributeOrdering(ocaPackageData)
            ? getOrderedAttributeRowData(
                newAttributeRowData,
                replaceCharsInKeys(
                  ocaPackageData.extensions[ADC][
                    ocaPackageData?.oca_bundle?.bundle?.capture_base?.d
                  ].overlays.ordering.attribute_ordering
                )
              )
            : newAttributeRowData;

        const convertedPages = convertOverlayToFormBuilder(
          formOverlayForConversion,
          processedLanguages,
          finalAttributeRowData,
          newFormatRuleRowData,
          newSavedEntryCodes,
          attributesWithListType,
          newLangAttributeRowData,
          newFormPlaceholdersByLanguage
        );

        if (convertedPages && convertedPages.length > 0) {
          setFormBuilderPages(convertedPages);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to convert form overlay to form builder format:", error);
      }
    }
  };

  return {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries
  };
};

export default useZipParser;
