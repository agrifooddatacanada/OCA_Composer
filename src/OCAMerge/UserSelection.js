import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import JSZip from "jszip";
import { Box, Button, Checkbox, List, ListItem, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { OcaPackage } from "oca_package";
import CustomPalette from "../constants/customPalette";
import { Context } from "../App";
import {
  ADC,
  CAPTURE_BASE,
  CARDINALITY,
  CHARACTER_ENCODING,
  CONFORMANCE,
  ENTRY,
  ENTRY_CODE,
  FORMAT,
  INFORMATION,
  LABEL,
  META,
  ORDERING,
  RANGE,
  SENSITIVE,
  UNIT,
  UNIT_FRAME_ID,
  UNIT_FRAME_LABEL,
  UNIT_FRAME_LOCATION,
  UNIT_FRAME_VERSION,
  UNIT_FRAMING
} from "../constants/constants";
import MergeDifferenceModal from "./MergeDifferenceModal";
import {
  generateOCABundle,
  generateOCAFileFromMergedOverlays,
  searchUnits
} from "../constants/utils";
import useGenerateReadMeV2 from "../ViewSchema/useGenerateReadMeV2";

const checkIfKeyInList = (key, list) => {
  const lowercaseSearchString = key.toLowerCase();
  const isMatch = list.some((item) => item.toLowerCase() === lowercaseSearchString);
  return isMatch;
};

const priorityKeys = ["META", "Information", "ATTRIBUTE"];

const findComparisonObject = (key) => {
  let objKey;
  switch (key) {
    case CAPTURE_BASE:
      objKey = "attributes";
      break;
    case CHARACTER_ENCODING:
      objKey = "attribute_character_encoding";
      break;
    case FORMAT:
      objKey = "attribute_formats";
      break;
    case UNIT:
      objKey = "attribute_unit";
      break;
    case ENTRY_CODE:
      objKey = "attribute_entry_codes";
      break;
    case LABEL:
      objKey = "attribute_labels";
      break;
    case INFORMATION:
      objKey = "attribute_information";
      break;
    case ENTRY:
      objKey = "attribute_entries";
      break;
    case CONFORMANCE:
      objKey = "attribute_conformance";
      break;
    case CARDINALITY:
      objKey = "attribute_cardinality";
      break;
    default:
      break;
  }
  return objKey;
};

// Ensures incompatible entry overlays are not selected
const shouldEnableEntrySelection = (
  item,
  overlayComparisonData,
  selectedOverlaysOCAFile1,
  selectedOverlaysOCAFile2,
  fileNumber
) => {
  // Only apply this logic to entry and ordering overlays
  const isEntryOverlay = item.key.includes(ENTRY) && item.key !== ENTRY_CODE;
  const isOrderingOverlay = item.key === ORDERING;
  if (!isEntryOverlay && !isOrderingOverlay) return true;

  const entryCodeItem = overlayComparisonData.find((i) => i.key === ENTRY_CODE);
  if (!entryCodeItem && isOrderingOverlay) return true;

  const entryCodeValue1 = selectedOverlaysOCAFile1?.[ENTRY_CODE]?.attribute_entry_codes;
  const entryCodeValue2 = selectedOverlaysOCAFile2?.[ENTRY_CODE]?.attribute_entry_codes;
  const entryCodesAreSame =
    JSON.stringify(entryCodeValue1) === JSON.stringify(entryCodeValue2);

  if (entryCodesAreSame) return true;

  // If entry codes are different, only enable entry and ordering overlays from the same file
  if (entryCodeItem.ocaFile1Checked) {
    return fileNumber === 1 && item.ocafile1 !== "NONE";
  }

  if (entryCodeItem.ocaFile2Checked) {
    return fileNumber === 2 && item.ocafile2 !== "NONE";
  }

  return false;
};

const UserSelection = () => {
  const { t } = useTranslation();
  const {
    selectedOverlaysOCAFile1,
    selectedOverlaysOCAFile2,
    parsedOCAFile1,
    OCAFile1Raw,
    OCAFile2Raw
  } = useContext(Context);
  const [data, setData] = useState([]);
  const [showDifference, setShowDifference] = useState(false);
  const [dataDifference, setDataDifference] = useState({
    title: "",
    rowData: []
  });

  const { jsonToTextFile } = useGenerateReadMeV2();

  const fileName1 = OCAFile1Raw[0].path;
  const fileName1WithoutExt = fileName1.substring(0, fileName1.lastIndexOf("."));
  const fileName2 = OCAFile2Raw[0].path;
  const fileName2WithoutExt = fileName2.substring(0, fileName2.lastIndexOf("."));

  const processComparisonForDifference = (item) => {
    if (item.ocafile1 === "NONE" && item.ocafile2 === "NONE") {
      return;
    }

    const value1 = selectedOverlaysOCAFile1?.[item.key];
    const value2 = selectedOverlaysOCAFile2?.[item.key];

    if (item.key.includes(META)) {
      const descriptionObj = {
        comparisonValue: "description",
        ocaFile1: value1?.description,
        ocaFile2: value2?.description
      };
      const nameObj = {
        comparisonValue: "name",
        ocaFile1: value1?.name,
        ocaFile2: value2?.name
      };
      setDataDifference({
        title: item.key,
        rowData: [descriptionObj, nameObj]
      });
    } else if (item.key === CAPTURE_BASE) {
      const classificationObj = {
        comparisonValue: "classification",
        ocaFile1: value1?.classification,
        ocaFile2: value2?.classification
      };
      const uniqueKeys = new Set([
        ...Object.keys(value1.attributes || {}),
        ...Object.keys(value2.attributes || {})
      ]);

      const attributesComparison = Array.from(uniqueKeys).map((key) => ({
        comparisonValue: key,
        ocaFile1: value1.attributes?.[key],
        ocaFile2: value2.attributes?.[key]
      }));

      setDataDifference({
        title: item.key,
        rowData: [classificationObj, ...attributesComparison]
      });
    } else if (
      item.key === CHARACTER_ENCODING ||
      item.key.includes(LABEL) ||
      item.key.includes(INFORMATION) ||
      item.key.includes(CONFORMANCE) ||
      item.key === UNIT ||
      item.key.includes(CARDINALITY) ||
      item.key.includes(FORMAT) ||
      item.key.includes(ENTRY_CODE)
    ) {
      const comparisonObj = findComparisonObject(item.key.split(" - ")?.[0]);
      let overlayData1 = null;
      let overlayData2 = null;
      if (item.key === UNIT) {
        // In case of zip bundle, the unit is in attribute_units
        overlayData1 = value1?.[comparisonObj] || value1?.attribute_units || {};
        overlayData2 = value2?.[comparisonObj] || value2?.attribute_units || {};
      } else if (item.key.includes(INFORMATION)) {
        const informationOverlayData1 = value1?.[comparisonObj] || {};
        const informationOverlayData2 = value2?.[comparisonObj] || {};

        // Removing any escape characters for " and '
        overlayData1 = Object.keys(informationOverlayData1).reduce((acc, key) => {
          acc[key] = informationOverlayData1[key]
            // eslint-disable-next-line quotes
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'");
          return acc;
        }, {});

        overlayData2 = Object.keys(informationOverlayData2).reduce((acc, key) => {
          acc[key] = informationOverlayData2[key]
            // eslint-disable-next-line quotes
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'");
          return acc;
        }, {});
      } else {
        overlayData1 = value1?.[comparisonObj] || {};
        overlayData2 = value2?.[comparisonObj] || {};
      }
      const uniqueKeys = new Set([
        ...Object.keys(overlayData1),
        ...Object.keys(overlayData2)
      ]);

      const attributesComparison = Array.from(uniqueKeys).map((key) => ({
        comparisonValue: key,
        ocaFile1: overlayData1?.[key],
        ocaFile2: overlayData2?.[key]
      }));

      setDataDifference({
        title: item.key,
        rowData: attributesComparison
      });
    } else if (item.key.includes(ENTRY)) {
      const comparisonObj = findComparisonObject(item.key.split(" - ")?.[0]);
      const uniqueKeys = new Set([
        ...Object.keys(value1?.[comparisonObj] || {}),
        ...Object.keys(value2?.[comparisonObj] || {})
      ]);

      const attributesComparison = Array.from(uniqueKeys).map((key) => {
        const parsedValue1 = value1?.[comparisonObj]?.[key];
        const parsedValue2 = value2?.[comparisonObj]?.[key];
        return {
          comparisonValue: key,
          ocaFile1: parsedValue1,
          ocaFile2: parsedValue2
        };
      });

      setDataDifference({
        title: item.key,
        rowData: attributesComparison
      });
    } else if (item.key.includes(ORDERING)) {
      const attributeOrderingComparison = {
        comparisonValue: "attribute_ordering",
        ocaFile1: value1?.attribute_ordering,
        ocaFile2: value2?.attribute_ordering
      };

      const uniqueEntryKeys = new Set([
        ...Object.keys(value1?.entry_code_ordering || {}),
        ...Object.keys(value2?.entry_code_ordering || {})
      ]);

      const entryCodeOrderingComparisons = Array.from(uniqueEntryKeys).map((key) => ({
        comparisonValue: `entry_code_ordering - ${key}`,
        ocaFile1: value1?.entry_code_ordering?.[key],
        ocaFile2: value2?.entry_code_ordering?.[key]
      }));

      setDataDifference({
        title: item.key,
        rowData: [attributeOrderingComparison, ...entryCodeOrderingComparisons]
      });

      setShowDifference(true);
    } else if (item.key === UNIT_FRAMING) {
      const unitOverlayData1 =
        selectedOverlaysOCAFile1.unit?.attribute_unit ||
        selectedOverlaysOCAFile1.unit?.attribute_units ||
        {};

      const unitOverlayData2 =
        selectedOverlaysOCAFile2.unit?.attribute_unit ||
        selectedOverlaysOCAFile2.unit?.attribute_units ||
        {};

      const uniqueAttributes = new Set([
        ...Object.keys(unitOverlayData1),
        ...Object.keys(unitOverlayData2)
      ]);

      const unitFramingComparison = [];

      uniqueAttributes.forEach((attribute) => {
        const attributeUnit1 = unitOverlayData1[attribute];
        const attributeUnit2 = unitOverlayData2[attribute];
        const unitFramingData1 = value1?.units?.[attributeUnit1] || {};
        const unitFramingData2 = value2?.units?.[attributeUnit2] || {};
        let parsedValue1 = "";
        let parsedValue2 = "";

        if (attributeUnit1 && unitFramingData1.term_id) {
          parsedValue1 += `Unit: ${attributeUnit1}\nUCUM Code: ${unitFramingData1.term_id}`;
          const { firstMatch } = searchUnits(unitFramingData1.term_id);
          if (firstMatch?.label) {
            parsedValue1 += `\nUCUM Label: ${firstMatch.label}`;
          }
          if (firstMatch?.description) {
            parsedValue1 += `\nDescription: ${firstMatch.description}`;
          }
        }
        if (attributeUnit2 && unitFramingData2.term_id) {
          parsedValue2 += `Unit: ${attributeUnit2}\nUCUM Code: ${unitFramingData2.term_id}`;
          const { firstMatch } = searchUnits(unitFramingData2.term_id);
          if (firstMatch?.label) {
            parsedValue2 += `\nUCUM Label: ${firstMatch.label}`;
          }
          if (firstMatch?.description) {
            parsedValue2 += `\nDescription: ${firstMatch.description}`;
          }
        }
        unitFramingComparison.push({
          comparisonValue: attribute,
          ocaFile1: parsedValue1,
          ocaFile2: parsedValue2
        });
      });

      setDataDifference({
        title: item.key,
        rowData: unitFramingComparison
      });
    } else if (item.key.includes(SENSITIVE)) {
      const sensitiveAttributesComparison = {
        comparisonValue: "sensitive_attributes",
        ocaFile1: value1?.sensitive_attributes,
        ocaFile2: value2?.sensitive_attributes
      };

      setDataDifference({
        title: item.key,
        rowData: [sensitiveAttributesComparison]
      });
    } else if (item.key.includes(RANGE)) {
      const attributes = Object.keys(value1?.attributes || value2?.attributes || {});
      const attributeRangeComparison = [];
      attributes.forEach((attribute) => {
        const rangeData1 = value1?.attributes?.[attribute] || {};
        const rangeData2 = value2?.attributes?.[attribute] || {};
        let parsedValue1 = "";
        let parsedValue2 = "";

        if (rangeData1.lower !== "") {
          parsedValue1 += `Lower Bound: ${rangeData1.lower} (${rangeData1.lower_inclusive ? "Inclusive" : "Exclusive"})\n`;
        }

        if (rangeData1.upper !== "") {
          parsedValue1 += `Upper Bound: ${rangeData1.upper} (${rangeData1.upper_inclusive ? "Inclusive" : "Exclusive"})`;
        }

        if (rangeData2.lower !== "") {
          parsedValue2 += `Lower Bound: ${rangeData2.lower} (${rangeData2.lower_inclusive ? "Inclusive" : "Exclusive"})\n`;
        }

        if (rangeData2.upper !== "") {
          parsedValue2 += `Upper Bound: ${rangeData2.upper} (${rangeData2.upper_inclusive ? "Inclusive" : "Exclusive"})`;
        }

        attributeRangeComparison.push({
          comparisonValue: attribute,
          ocaFile1: parsedValue1,
          ocaFile2: parsedValue2
        });
      });

      setDataDifference({
        title: item.key,
        rowData: attributeRangeComparison
      });
    }

    setShowDifference(true);
  };

  const handleChange = (index, key) => {
    setData((prev) => {
      const newData = [...prev];
      const currentItem = newData[index];

      // Reset entry and ordering if entry code selection changes
      if (currentItem.key === ENTRY_CODE && key !== "same") {
        const overlays = newData.filter(
          (item) =>
            item.key === ORDERING || (item.key.includes(ENTRY) && item.key !== ENTRY_CODE)
        );

        overlays.forEach((overlay) => {
          overlay.ocaFile1Checked = false;
          overlay.ocaFile2Checked = false;
        });
      }

      if (key === "ocaFile1Checked") {
        newData[index].ocaFile1Checked = !newData[index].ocaFile1Checked;
        newData[index].ocaFile2Checked = false;
      } else if (key === "ocaFile2Checked") {
        newData[index].ocaFile2Checked = !newData[index].ocaFile2Checked;
        newData[index].ocaFile1Checked = false;
      } else if (key === "same") {
        newData[index].same = !newData[index].same;
      }
      return newData;
    });
  };

  const getMergedOverlaysForJSONExport = () => {
    const coreOverlays = {};
    const extensionOverlays = {};

    data.forEach((item) => {
      const { key } = item;
      let value = null;
      if ((item.ocaFile1Checked && key in selectedOverlaysOCAFile1) || item.same) {
        value = selectedOverlaysOCAFile1[key];
      } else if (item.ocaFile2Checked && key in selectedOverlaysOCAFile2) {
        value = selectedOverlaysOCAFile2[key];
      }

      if (value && key === CAPTURE_BASE) {
        coreOverlays[key] = value;
      }

      const overlayKey = key.split(" - ")?.[0];
      // Non-language specific overlays
      if (
        overlayKey === CHARACTER_ENCODING ||
        overlayKey === FORMAT ||
        overlayKey === CONFORMANCE ||
        overlayKey === ENTRY_CODE ||
        overlayKey === UNIT
      ) {
        if (value) {
          coreOverlays[overlayKey] = value;
        }
        // Language specific overlays
      } else if (
        overlayKey === META ||
        overlayKey === LABEL ||
        overlayKey === INFORMATION ||
        overlayKey === ENTRY
      ) {
        if (value && overlayKey in coreOverlays) {
          coreOverlays[overlayKey].push(value);
        } else if (value) {
          coreOverlays[overlayKey] = [value];
        }
        // OCA package extension overlays
      } else if ([ORDERING, SENSITIVE, RANGE, UNIT_FRAMING].includes(key)) {
        if (value) {
          extensionOverlays[overlayKey] = value;
        }
      }
    });

    return { coreOverlays, extensionOverlays };
  };

  const exportToJsonFile = (data) => {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_schema.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportOcaPackage = async () => {
    const mergedOverlays = getMergedOverlaysForJSONExport();
    const ocaFileContent = generateOCAFileFromMergedOverlays(mergedOverlays.coreOverlays);
    const bundle = await generateOCABundle(ocaFileContent);

    // For now, we only have ADC community ordering extension overlay for top-level/main schema bundle
    const sensitiveAttributes =
      mergedOverlays.extensionOverlays?.[SENSITIVE]?.sensitive_attributes || [];
    const extension = {
      extensions: {
        [ADC]: {
          [bundle.bundle.d]: [
            {
              ordering_overlay: {
                type: ORDERING,
                attribute_ordering:
                  mergedOverlays.extensionOverlays?.[ORDERING]?.attribute_ordering || [],
                entry_code_ordering:
                  mergedOverlays.extensionOverlays?.[ORDERING]?.entry_code_ordering || {}
              }
            },
            ...(mergedOverlays.extensionOverlays?.[RANGE]?.attributes
              ? [
                  {
                    range_overlay: {
                      type: RANGE,
                      attributes: mergedOverlays.extensionOverlays?.[RANGE]?.attributes
                    }
                  }
                ]
              : []),
            ...(sensitiveAttributes.length > 0
              ? [
                  {
                    sensitive_overlay: {
                      type: SENSITIVE,
                      sensitive_attributes: sensitiveAttributes
                    }
                  }
                ]
              : []),
            ...(mergedOverlays.extensionOverlays?.[UNIT_FRAMING]?.units
              ? [
                  {
                    unit_framing_overlay: {
                      type: UNIT_FRAMING,
                      properties: {
                        id: UNIT_FRAME_ID,
                        label: UNIT_FRAME_LABEL,
                        location: UNIT_FRAME_LOCATION,
                        version: UNIT_FRAME_VERSION
                      },
                      units: mergedOverlays.extensionOverlays?.[UNIT_FRAMING]?.units
                    }
                  }
                ]
              : [])
          ]
        }
      }
    };

    const ocaPackageService = new OcaPackage(extension, bundle);
    const ocaPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());

    jsonToTextFile(bundle.bundle, ocaPackage);

    exportToJsonFile(ocaPackage);
  };

  const preparedZipToExport = () => {
    const exportedFile = [];
    const rootDigest = parsedOCAFile1?.capture_base?.digest;
    const metaJSON = {
      files: {
        [rootDigest]: {}
      },
      root: rootDigest
    };

    data.forEach((item) => {
      const { key } = item;
      let value = null;
      if ((item.ocaFile1Checked && key in selectedOverlaysOCAFile1) || item.same) {
        value = selectedOverlaysOCAFile1[key];
      } else if (item.ocaFile2Checked && key in selectedOverlaysOCAFile2) {
        value = selectedOverlaysOCAFile2[key];
      }
      if (key === CHARACTER_ENCODING) {
        exportedFile.push(value);
        metaJSON.files[rootDigest][CHARACTER_ENCODING] = value?.digest;
      } else if (key === FORMAT) {
        exportedFile.push(value);
        metaJSON.files[rootDigest][FORMAT] = value?.digest;
      } else if (key === ENTRY_CODE) {
        exportedFile.push(value);
        metaJSON.files[rootDigest][ENTRY_CODE] = value?.digest;
      } else if (key === CONFORMANCE) {
        exportedFile.push(value);
        metaJSON.files[rootDigest][CONFORMANCE] = value?.digest;
      } else if (key === UNIT) {
        exportedFile.push(value);
        metaJSON.files[rootDigest][UNIT] = value?.digest;
      } else if (key === CARDINALITY) {
        exportedFile.push(value);
        metaJSON.files[rootDigest][CARDINALITY] = value?.digest;
      } else if (
        key.includes(INFORMATION) ||
        key.includes(LABEL) ||
        key.includes(META) ||
        key.includes(ENTRY)
      ) {
        exportedFile.push(value);
        const splitKey = key.split(" - ");
        let newKey;
        if (splitKey.length > 1) {
          newKey = `${splitKey[0]} (${splitKey[1]})`;
        } else {
          // eslint-disable-next-line prefer-destructuring
          newKey = splitKey[0];
        }
        metaJSON.files[rootDigest][newKey] = value?.digest;
      } else if (key === CAPTURE_BASE) {
        exportedFile.push(value);
      }
    });
    exportedFile.push(metaJSON);
    return exportedFile;
  };

  const exportZipFile = async (data) => {
    const zip = new JSZip();

    for (const item of data) {
      if (item && "root" in item) {
        zip.file("meta.json", JSON.stringify(item, null, 2));
      } else if (item) {
        zip.file(`${item?.digest}.json`, JSON.stringify(item, null, 2));
      }
    }

    const content = await zip.generateAsync({ type: "blob" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "merged_schema.zip";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (OCAFile1Raw[0].path.includes(".json") || OCAFile2Raw[0].path.includes(".json")) {
      handleExportOcaPackage();
    } else {
      const exportedFile = preparedZipToExport();
      exportZipFile(exportedFile);
    }
  };

  const compareValues = (key) => {
    const splitKey = key.split(" - ")?.[0];
    if (key.includes(META)) {
      const value1 = selectedOverlaysOCAFile1[key];
      const value2 = selectedOverlaysOCAFile2[key];
      return value1?.description === value2?.description && value1?.name === value2?.name;
    }
    if (key.includes(ORDERING)) {
      const value1 = selectedOverlaysOCAFile1[key];
      const value2 = selectedOverlaysOCAFile2[key];

      const attributeOrderingEqual =
        JSON.stringify(value1?.attribute_ordering) ===
        JSON.stringify(value2?.attribute_ordering);

      const entryCodeOrderingEqual =
        JSON.stringify(value1?.entry_code_ordering) ===
        JSON.stringify(value2?.entry_code_ordering);

      return attributeOrderingEqual && entryCodeOrderingEqual;
    }
    if (key.includes(SENSITIVE)) {
      const value1 = selectedOverlaysOCAFile1[key];
      const value2 = selectedOverlaysOCAFile2[key];
      const sensitiveAttributesEqual =
        JSON.stringify(value1?.sensitive_attributes) ===
        JSON.stringify(value2?.sensitive_attributes);
      return sensitiveAttributesEqual;
    }
    if (key.includes(RANGE)) {
      const value1 = selectedOverlaysOCAFile1[key];
      const value2 = selectedOverlaysOCAFile2[key];
      const rangeOverlayEqual =
        JSON.stringify(value1?.attributes || {}) ===
        JSON.stringify(value2?.attributes || {});
      return rangeOverlayEqual;
    }
    if (key.includes(UNIT_FRAMING)) {
      const value1 = selectedOverlaysOCAFile1[key];
      const value2 = selectedOverlaysOCAFile2[key];
      const unitFramingOverlayEqual =
        JSON.stringify(value1?.units || {}) === JSON.stringify(value2?.units || {});
      return unitFramingOverlayEqual;
    }
    const objKey = findComparisonObject(splitKey);
    const value1 = selectedOverlaysOCAFile1[key]?.[objKey];
    const value2 = selectedOverlaysOCAFile2[key]?.[objKey];

    if (key.includes(INFORMATION)) {
      // Removing any escape characters for " and '
      const parsedValue1 = Object.keys(value1).reduce((acc, key) => {
        acc[key] = value1[key]
          // eslint-disable-next-line quotes
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");
        return acc;
      }, {});

      const parsedValue2 = Object.keys(value2).reduce((acc, key) => {
        acc[key] = value2[key]
          // eslint-disable-next-line quotes
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");
        return acc;
      }, {});

      return JSON.stringify(parsedValue1) === JSON.stringify(parsedValue2);
    }

    return JSON.stringify(value1) === JSON.stringify(value2);
  };

  useEffect(() => {
    const keysObj1 = Object.keys(selectedOverlaysOCAFile1);
    const keysObj2 = Object.keys(selectedOverlaysOCAFile2);
    const uniqueKeys = [...new Set([...keysObj1, ...keysObj2])];
    const temp = [];

    const combinedList = uniqueKeys.reduce((acc, key) => {
      if (!temp?.includes(key.toLowerCase())) {
        temp.push(key.toLowerCase());
        const same =
          keysObj1.includes(key) && keysObj2.includes(key) ? compareValues(key) : false;
        const checkIfKeyInListObj1 = checkIfKeyInList(key, keysObj1);
        const newEntry = {
          key,
          ocafile1: checkIfKeyInListObj1 ? key : "NONE",
          ocafile2: checkIfKeyInList(key, keysObj2) ? key : "NONE"
        };
        if (same) {
          newEntry.same = true;
        } else {
          newEntry.ocaFile1Checked = false;
          newEntry.ocaFile2Checked = false;
        }
        acc.push(newEntry);
      }
      return acc;
    }, []);

    const sortedList = combinedList.sort((a, b) => {
      const aPriority = priorityKeys.findIndex((keyword) => a.key.includes(keyword));
      const bPriority = priorityKeys.findIndex((keyword) => b.key.includes(keyword));

      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      if (aPriority !== -1) {
        return -1;
      }
      if (bPriority !== -1) {
        return 1;
      }
      return a.key.localeCompare(b.key);
    });

    setData(sortedList);
  }, [selectedOverlaysOCAFile1, selectedOverlaysOCAFile2]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: "2rem"
      }}
    >
      {showDifference && (
        <MergeDifferenceModal
          file1Name={fileName1WithoutExt}
          file2Name={fileName2WithoutExt}
          setShowCard={setShowDifference}
          dataDifference={dataDifference}
        />
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          marginBottom: "1rem"
        }}
      >
        <Button
          color="button"
          variant="contained"
          onClick={handleExport}
          sx={{
            alignSelf: "flex-end",
            width: "12rem",
            display: "flex",
            justifyContent: "space-around",
            p: 1
          }}
          // disabled={exportDisabled}
        >
          {t("Finish and Export")} <CheckCircleIcon />
        </Button>
      </Box>
      <Box sx={{ display: "flex", width: "100%" }}>
        <Box
          sx={{
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "40%"
          }}
        >
          <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
            {fileName1WithoutExt}
          </Typography>
        </Box>
        <Box
          sx={{
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "20%"
          }}
        >
          <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
            {t("Selection")}
          </Typography>
        </Box>
        <Box
          sx={{
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "40%"
          }}
        >
          <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>
            {fileName2WithoutExt}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", width: "100%", flexDirection: "column" }}>
        {data.map((item, index) => (
          <Box
            key={item.key}
            sx={{ display: item.key === CAPTURE_BASE ? "none" : "flex", width: "100%" }}
          >
            <Box
              sx={{
                paddingLeft: "10px",
                paddingRight: "10px",
                borderBottom:
                  index === data.length - 1 && `2px solid ${CustomPalette.GREY_300}`,
                borderLeft: `2px solid ${CustomPalette.GREY_300}`,
                borderRight: `2px solid ${CustomPalette.GREY_300}`,
                // Checking if index is 1 since we're hiding the first row (capture base)
                borderTop: index === 1 && `2px solid ${CustomPalette.GREY_300}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "40%"
              }}
            >
              <Typography
                sx={{
                  fontWeight: item?.ocafile1 === "NONE" ? "500" : "normal",
                  cursor: "pointer"
                }}
                onClick={() => processComparisonForDifference(item)}
              >
                {item?.ocafile1}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "20%"
              }}
            >
              <List sx={{ display: "flex", flexDirection: "row", padding: 0 }}>
                <ListItem>
                  <Checkbox
                    sx={{
                      "&.Mui-checked": {
                        color: CustomPalette.PRIMARY
                      }
                    }}
                    checked={item?.ocaFile1Checked}
                    onClick={() => handleChange(index, "ocaFile1Checked")}
                    disabled={
                      item?.ocafile1 === "NONE" ||
                      item?.ocaFile1Checked === undefined ||
                      !shouldEnableEntrySelection(
                        item,
                        data,
                        selectedOverlaysOCAFile1,
                        selectedOverlaysOCAFile2,
                        1
                      )
                    }
                  />
                </ListItem>
                <ListItem sx={{ background: CustomPalette.GREY_300 }}>
                  <Checkbox
                    sx={{
                      "&.Mui-checked": {
                        color: CustomPalette.PRIMARY
                      }
                    }}
                    checked={item?.same}
                    onClick={() => handleChange(index, "same")}
                    disabled={
                      item?.ocaFile1Checked !== undefined ||
                      item?.ocaFile2Checked !== undefined
                    }
                  />
                </ListItem>
                <ListItem>
                  <Checkbox
                    sx={{
                      "&.Mui-checked": {
                        color: CustomPalette.PRIMARY
                      }
                    }}
                    checked={item?.ocaFile2Checked}
                    onClick={() => handleChange(index, "ocaFile2Checked")}
                    disabled={
                      item?.ocafile2 === "NONE" ||
                      item?.ocaFile2Checked === undefined ||
                      !shouldEnableEntrySelection(
                        item,
                        data,
                        selectedOverlaysOCAFile1,
                        selectedOverlaysOCAFile2,
                        2
                      )
                    }
                  />
                </ListItem>
              </List>
            </Box>
            <Box
              sx={{
                paddingLeft: "10px",
                paddingRight: "10px",
                borderBottom:
                  index === data.length - 1 && `2px solid ${CustomPalette.GREY_300}`,
                borderLeft: `2px solid ${CustomPalette.GREY_300}`,
                borderRight: `2px solid ${CustomPalette.GREY_300}`,
                // Checking if index is 1 since we're hiding the first row (capture base)
                borderTop: index === 1 && `2px solid ${CustomPalette.GREY_300}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "40%",
                justifyContent: "center"
              }}
            >
              <Typography
                sx={{
                  fontWeight: item?.ocafile2 === "NONE" ? "500" : "normal",
                  cursor: "pointer"
                }}
                onClick={() => processComparisonForDifference(item)}
              >
                {item?.ocafile2}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserSelection;
