import React, { useRef, useState, useEffect, createContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ReactGA from "react-ga4";
import { Box, ThemeProvider } from "@mui/material";
import "./App.css";
import CustomTheme from "./constants/theme";
import Home from "./Home";
import StartSchemaHelp from "./UsersHelp/Start_Schema_Help";
import getListOfSelectedOverlays from "./constants/getListOfSelectedOverlays";
import Landing from "./Landing/Landing";
// import HelpStorage from "./Landing/HelpStorage";
import OCADataValidator from "./OCADataValidator/OCADataValidator";
import LearnAboutSchemaRule from "./OCADataValidator/LearnAboutSchemaRule";
import LearnAboutDataVerification from "./OCADataValidator/LearnAboutDataVerification";
import OCAMerge from "./OCAMerge/OCAMerge";
import SchemaVisualization from "./SchemaVisualization/SchemaVisualization";
import { getSchemaDataById } from "./SchemaVisualization/dataUtils";
import { MultiSchemaProvider } from "./context/MultiSchemaContext";
// import Tutorial from "./Tutorial/Tutorial";
import useUnitFramingUpdater from "./hooks/useUnitFramingUpdater";
import {
  CUSTOM_FORMAT_RULE,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  SCHEMA_MODE_SINGLE
} from "./constants/constants";
import {
  getUnitsFramedThatAlreadyExistInOcaPackage,
  hasUnitFramingOverlay,
  hasAttributeFramingOverlay
} from "./constants/utils";

export const Context = createContext();

// Initializing react-ga with google analytics ID
if (process.env.REACT_APP_GA_ID) {
  ReactGA.initialize(process.env.REACT_APP_GA_ID);
}

const overlayItems = {
  [FIELD_CHARACTER_ENCODING_OVERLAY]: { feature: "Character Encoding", selected: false },
  [FIELD_CONFORMANCE_OVERLAY]: {
    feature: "Make selected entries required",
    selected: false
  },
  [FIELD_FORMAT_OVERLAY]: {
    feature: "Add format rule for data",
    selected: false
  },
  [FIELD_CARDINALITY_OVERLAY]: { feature: "Cardinality", selected: false },
  [FIELD_DATA_STANDARDS_OVERLAY]: { feature: "Data Standards", selected: false },
  [FIELD_UNIT_FRAMING_OVERLAY]: { feature: "Unit Framing", selected: false },
  [FIELD_RANGE_OVERLAY]: { feature: "Add range rule for data", selected: false },
  [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: { feature: "Attribute Framing", selected: false }
};

export const pagesArray = [
  "Start",
  "Metadata",
  "Details",
  "LanguageDetails",
  "Overlays",
  "View"
];

function App() {
  const [schemaMode, setSchemaMode] = useState(SCHEMA_MODE_SINGLE);
  const [isZip, setIsZip] = useState(false);
  const [isZipEdited, setIsZipEdited] = useState(false);
  const [zipToReadme, setZipToReadme] = useState([]);
  const [jsonToReadme, setJsonToReadme] = useState({});
  const [fileData, setFileData] = useState([]);
  const [rawFile, setRawFile] = useState([]);
  const [attributesList, setAttributesList] = useState([]);
  const [currentPage, setCurrentPage] = useState("Landing");
  const [currentDataValidatorPage, setCurrentDataValidatorPage] =
    useState("StartDataValidator");
  const [currentOCAMergePage, setCurrentOCAMergePage] = useState("StartOCAMerge");
  const [history, setHistory] = useState([currentPage]);
  const [schemaDescription, setSchemaDescription] = useState({
    English: { name: "", description: "" }
  });
  const [divisionGroup, setDivisionGroup] = useState({
    division: "",
    group: ""
  });
  const [languages, setLanguages] = useState(["English"]);
  const [attributeRowData, setAttributeRowData] = useState([]);
  const [entryCodeRowData, setEntryCodeRowData] = useState([]);
  const [savedEntryCodes, setSavedEntryCodes] = useState({});
  const [attributesWithLists, setAttributesWithLists] = useState([]);
  const [lanAttributeRowData, setLanAttributeRowData] = useState({});
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [customIsos, setCustomIsos] = useState({});
  const [currentSchemaId, setCurrentSchemaId] = useState(null);
  const [editingSchemaId, setEditingSchemaId] = useState(null);

  // Use for Overlays
  const [characterEncodingRowData, setCharacterEncodingRowData] = useState([]);
  const [formatRuleRowData, setFormatRuleRowData] = useState([]);
  const [overlay, setOverlay] = useState(overlayItems);
  const [selectedOverlay, setSelectedOverlay] = useState("");
  const [cardinalityData, setCardinalityData] = useState([]);
  const [dataStandardsRowData, setDataStandardsRowData] = useState([]);
  const [rangeRowData, setRangeRowData] = useState([]);
  // the current state of units from attributeRowData
  const [unitRowData, setUnitRowData] = useState([]);
  const [currentUnitFramedRowData, setCurrentUnitFramedRowData] = useState([]);
  const [unitFramedRowData, setUnitFramedRowData] = useState([]);
  const [frameAllUnits, setFrameAllUnits] = useState(hasUnitFramingOverlay());
  const [
    unitFramedThatAlreadyExistInOcaPackage,
    setUnitFramedThatAlreadyExistInOcaPackage
  ] = useState({});
  const [unframedUnitList, setUnframedUnitList] = useState([]);
  const [unitRowDataWhenNoFrameAll, setUnitRowDataWhenNoFrameAll] = useState([]);

  // Attribute framing
  const [attributeFramingRowData, setAttributeFramingRowData] = useState([]);
  const [frameAllAttributes, setFrameAllAttributes] = useState(
    hasAttributeFramingOverlay()
  );
  const [unframedAttributeList, setUnframedAttributeList] = useState([]);

  // Use for OCA Validator
  const [jsonRawFile, setJsonRawFile] = useState([]);
  const [jsonParsedFile, setJsonParsedFile] = useState(undefined);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonDropDisabled, setJsonDropDisabled] = useState(false);
  const [jsonIsParsed, setJsonIsParsed] = useState(false);
  const [datasetRawFile, setDatasetRawFile] = useState([]);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetDropDisabled, setDatasetDropDisabled] = useState(false);
  const [datasetIsParsed, setDatasetIsParsed] = useState(false);
  const [schemaDataConformantHeader, setSchemaDataConformantHeader] = useState([]);
  const [schemaDataConformantRowData, setSchemaDataConformantRowData] = useState([]);
  const [matchingRowData, setMatchingRowData] = useState([]);
  const firstTimeMatchingRef = useRef(true);
  const [ogWorkbook, setOgWorkbook] = useState(null);
  const ogSchemaDataConformantHeaderRef = useRef([]);
  const [targetResult, setTargetResult] = useState([]);
  const [notToVerifyAttributes, setNotToVerifyAttributes] = useState([]);

  // Entry Code upload
  const [entryCodeHeaders, setEntryCodeHeaders] = useState([]);
  const [tempEntryCodeRowData, setTempEntryCodeRowData] = useState([]);
  const [chosenEntryCodeIndex, setChosenEntryCodeIndex] = useState(-1);
  const [tempEntryCodeSummary, setTempEntryCodeSummary] = useState(undefined);
  const [tempEntryList, setTempEntryList] = useState([]);
  const [firstNavigationToDataset, setFirstNavigationToDataset] = useState(false);
  const [excelSheetChoice, setExcelSheetChoice] = useState(-1);

  const [OCAFile1Raw, setOCAFile1Raw] = useState("");
  const [OCAFile2Raw, setOCAFile2Raw] = useState("");
  const [parsedOCAFile1, setParsedOCAFile1] = useState("");
  const [parsedOCAFile2, setParsedOCAFile2] = useState("");
  const [selectedOverlaysOCAFile1, setSelectedOverlaysOCAFile1] = useState({});
  const [selectedOverlaysOCAFile2, setSelectedOverlaysOCAFile2] = useState({});
  const [datasetDropMessage, setDatasetDropMessage] = useState({ message: "", type: "" });

  // Ordering extension overlay for OCA package
  const [OCAPackage, setOCAPackage] = useState(null);



  const pageForward = () => {
    let currentIndex = pagesArray.indexOf(currentPage);
    if (currentIndex >= 0 && currentIndex < pagesArray.length - 1) {
      const newPage = pagesArray[(currentIndex += 1)];
      setCurrentPage(newPage);
      setHistory((prev) => [...prev, newPage]);
    }
  };

  const pageBack = () => {
    let currentIndex = pagesArray.indexOf(currentPage);
    if (currentIndex > 0 && currentIndex < pagesArray.length) {
      const newPage = pagesArray[(currentIndex -= 1)];
      setCurrentPage(newPage);
      setHistory((prev) => prev.slice(0, prev.length - 1));
    }
  };

  useEffect(() => {
    if (
      datasetRawFile.length > 0 &&
      ogSchemaDataConformantHeaderRef.current.length === 0 &&
      schemaDataConformantHeader.length > 0
    ) {
      ogSchemaDataConformantHeaderRef.current = schemaDataConformantHeader;
    } else if (schemaDataConformantHeader.length === 0) {
      ogSchemaDataConformantHeaderRef.current = [];
    }
  }, [schemaDataConformantHeader]);

  useEffect(() => {
    if (history[history.length - 1] !== currentPage) {
      setHistory((prev) => [...prev, currentPage]);
    }
  }, [currentPage]);

  // Measuring page views
  useEffect(() => {
    // Track the initial page view
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  // Create Attributes List from File Data
  useEffect(() => {
    const fileAttributes = [];
    fileData.forEach((item) => {
      fileAttributes.push(item[0]);
    });
    setAttributesList(fileAttributes);
  }, [fileData]);

  // Create Attribute Row Data object when Attributes List updates

  useEffect(() => {
    const newAttributesArray = [];
    const newCharacterEncodingArray = [];
    if (attributesList.length > 0) {
      const { selectedFeatures } = getListOfSelectedOverlays(overlay);

      attributesList.forEach((item) => {
        const attributeObject = attributeRowData.find((obj) => obj.Attribute === item);
        if (attributeObject) {
          newAttributesArray.push(attributeObject);
        } else {
          newAttributesArray.push({
            Attribute: item,
            Flagged: false,
            Unit: "",
            Type: "",
            List: false
          });
        }

        const characterEncodingObject = characterEncodingRowData.find(
          (obj) => obj.Attribute === item
        );
        if (characterEncodingObject) {
          newCharacterEncodingArray.push(characterEncodingObject);
        } else {
          const newCharacterEncodingRow = { Attribute: item };
          selectedFeatures.forEach((feature) => {
            newCharacterEncodingRow[feature] = "";
          });
          newCharacterEncodingArray.push(newCharacterEncodingRow);
        }
      });
      setAttributeRowData(newAttributesArray);
      setCharacterEncodingRowData(newCharacterEncodingArray);
    }
  }, [attributesList]);

  useEffect(() => {
    const newFormatRuleArray = [];
    attributeRowData.forEach((item) => {
      const formatRuleObject = formatRuleRowData.find(
        (obj) => obj.Attribute === item.Attribute
      );

      if (formatRuleObject && formatRuleObject.Type === item.Type) {
        newFormatRuleArray.push(formatRuleObject);
      } else {
        newFormatRuleArray.push({
          Attribute: item.Attribute,
          Type: item.Type,
          FormatText: "",
          [CUSTOM_FORMAT_RULE]: ""
        });
      }
    });
    setFormatRuleRowData(newFormatRuleArray);
  }, [attributeRowData]);

  useEffect(() => {
    const newDataStandardsArray = [];

    attributeRowData.forEach((attributeRowItem) => {
      const dataStandardObject = dataStandardsRowData.find(
        (dataStandardRowItem) =>
          attributeRowItem.Attribute === dataStandardRowItem.Attribute
      );

      if (dataStandardObject) {
        newDataStandardsArray.push(dataStandardObject);
      } else {
        newDataStandardsArray.push({
          Attribute: attributeRowItem.Attribute,
          DataStandard: ""
        });
      }
    });

    setDataStandardsRowData(newDataStandardsArray);
  }, [attributeRowData]);

  // unit framing starts here
  useEffect(() => {
    if (OCAPackage) {
      setUnitFramedThatAlreadyExistInOcaPackage(
        getUnitsFramedThatAlreadyExistInOcaPackage(OCAPackage)
      );
    }
  }, [OCAPackage]);

  useEffect(() => {
    const newUnitRowArray = [];
    attributeRowData.forEach((item) => {
      if (!item.Unit) {
        return;
      }

      const unitRowObject = unitRowData.find(
        (obj) => obj.Attribute === item.Attribute && obj.Unit === item.Unit
      );
      // the attribute unit exits and hasn't changed from the attributeRowData.
      if (unitRowObject) {
        newUnitRowArray.push(unitRowObject);
      } else {
        newUnitRowArray.push({
          Attribute: item.Attribute,
          Unit: item.Unit,
          "UCUM Code": item["UCUM Code"] || "",
          "UCUM Label": "",
          Description: ""
        });
      }
    });

    setUnitRowData(newUnitRowArray);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeRowData]);

  /*
  Every time the unitRowData updates, we need to update the unitFramedRowData
  This is because the unitFramedRowData is used to display & create the unit framing overlay
  and the unitFramedRowData has to be updated whenever unitRowData is updated.
  */
  const framedUnits = useUnitFramingUpdater(unitRowData);

  useEffect(() => {
    if (framedUnits.length > 0) {
      setUnitFramedRowData((prev) => {
        // First, preserve all existing rows that are marked as deleted
        const deletedRows = prev.filter((row) => row.deleted === true);

        return framedUnits.map((currentFramedUnit) => {
          // Check if the row already exists in unitFramedRowData
          const existingRow = prev.find(
            (prevFramedUnit) =>
              prevFramedUnit.Attribute === currentFramedUnit.Attribute &&
              prevFramedUnit.Unit === currentFramedUnit.Unit &&
              prevFramedUnit["UCUM Code"] === currentFramedUnit["UCUM Code"]
          );

          // If it exists, keep the existing row (including its `deleted` status)
          if (existingRow) {
            return existingRow;
          }

          // Check if this unit was previously deleted
          const wasDeleted = deletedRows.some(
            (deletedRow) => deletedRow.Unit === currentFramedUnit.Unit
          );

          // If it was deleted, keep it deleted; otherwise, set to false
          return { ...currentFramedUnit, deleted: wasDeleted };
        });
      });
    }
  }, [framedUnits]);

  useEffect(() => {
    if (!frameAllUnits) {
      // framed units that already exist in the OCA package
      const existingUnits = unitFramedRowData.filter((row) =>
        Object.prototype.hasOwnProperty.call(
          unitFramedThatAlreadyExistInOcaPackage,
          row.Unit
        )
      );
      setUnitRowDataWhenNoFrameAll(existingUnits);

      // unframed units that don't exist in the OCA package
      const unframedUnits = unitFramedRowData.filter(
        (row) =>
          !Object.prototype.hasOwnProperty.call(
            unitFramedThatAlreadyExistInOcaPackage,
            row.Unit
          )
      );

      const uniqueUnframedUnits = Array.from(
        new Map(unframedUnits.map((row) => [row.Unit, row])).values()
      );
      setUnframedUnitList(uniqueUnframedUnits.map((row) => row.Unit));
    }
  }, [frameAllUnits, unitFramedRowData, unitFramedThatAlreadyExistInOcaPackage]);

  useEffect(() => {
    if (!frameAllUnits) {
      setCurrentUnitFramedRowData((prev) => {
        const deletedRows = prev.filter((row) => row.deleted === true);

        return unitRowDataWhenNoFrameAll.map((currentFramedUnit) => {
          const existingRow = prev.find(
            (prevFramedUnit) =>
              prevFramedUnit.Attribute === currentFramedUnit.Attribute &&
              prevFramedUnit.Unit === currentFramedUnit.Unit
          );

          if (existingRow) {
            return existingRow;
          }

          const wasDeleted = deletedRows.some(
            (deletedRow) => deletedRow.Unit === currentFramedUnit.Unit
          );

          return { ...currentFramedUnit, deleted: wasDeleted };
        });
      });
    }

    if (frameAllUnits) {
      setCurrentUnitFramedRowData((prev) => {
        const deletedRows = prev.filter((row) => row.deleted === true);

        return unitFramedRowData.map((currentFramedUnit) => {
          const existingRow = prev.find(
            (prevFramedUnit) =>
              prevFramedUnit.Attribute === currentFramedUnit.Attribute &&
              prevFramedUnit.Unit === currentFramedUnit.Unit
          );

          if (existingRow) {
            return existingRow;
          }

          const wasDeleted = deletedRows.some(
            (deletedRow) => deletedRow.Unit === currentFramedUnit.Unit
          );
          return { ...currentFramedUnit, deleted: wasDeleted };
        });
      });
    }
  }, [frameAllUnits, unitFramedRowData, unitRowDataWhenNoFrameAll]);

  useEffect(() => {
    const newRangeArray = [];

    attributeRowData.forEach((attributeRowItem) => {
      const rangeObject = rangeRowData.find(
        (rangeRowItem) => attributeRowItem.Attribute === rangeRowItem.Attribute
      );

      if (rangeObject) {
        newRangeArray.push(rangeObject);
      } else if (
        attributeRowItem.Type === "Numeric" ||
        attributeRowItem.Type === "DateTime"
      ) {
        newRangeArray.push({
          Attribute: attributeRowItem.Attribute,
          Type: attributeRowItem.Type,
          FormatRule: "",
          LowerBound: "",
          LowerInclusive: false,
          UpperBound: "",
          UpperInclusive: false
        });
      }
    });

    setRangeRowData(newRangeArray);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeRowData]);

  /*
  Attribute Framing starts here.
  */
  useEffect(() => {
    const newAttributeFramingArray = [];

    attributeRowData.forEach((attributeRowItem) => {
      const attributeFramingObj = attributeFramingRowData.find(
        (attributeFramingRowItem) =>
          attributeRowItem.Attribute === attributeFramingRowItem.Attribute
      );
      if (attributeFramingObj) {
        newAttributeFramingArray.push(attributeFramingObj);
      } else {
        newAttributeFramingArray.push({
          Attribute: attributeRowItem.Attribute,
          predicateId: "",
          objectId: "",
          description: "",
          mappingJustification: ""
        });
      }
    });
    setAttributeFramingRowData(newAttributeFramingArray);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeRowData]);

  // skos:exactMatch
  // semapv:ManualMappingCuratio

  useEffect(() => {
    if (jsonRawFile.length > 0) {
      const newMatchingRowData = [];
      attributesList.forEach((item, index) => {
        // if matchingRowData has data, use it
        const matchingRow = matchingRowData.find((obj) => obj.Attribute === item);
        const newObj = {
          Attribute: item,
          Dataset: ""
        };
        if (matchingRow) {
          newObj.Dataset = matchingRow.Dataset;
        }
        languages.forEach((lang) => {
          newObj[lang] = lanAttributeRowData?.[lang]?.[index]?.Label;
        });
        newMatchingRowData.push(newObj);
      });
      setMatchingRowData(newMatchingRowData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetRawFile, jsonRawFile, attributesList]);

  function createEntryCodeRowData(languages, attributesWithLists, savedEntryCodes) {
    const newEntryCodesArray = [];

    const newEntryCodeRow = { Code: "" };
    languages.forEach((lang) => {
      newEntryCodeRow[lang] = "";
    });

    if (attributesWithLists.length > 0) {
      attributesWithLists.forEach((item) => {
        const listEntryCodesArray = [];

        if (Array.isArray(item)) {
          item.forEach((subItem) => {
            const entryCodeRows = savedEntryCodes[subItem]
              ? savedEntryCodes[subItem]
              : [{ ...newEntryCodeRow }];

            entryCodeRows.forEach((entryCodeRow) => {
              listEntryCodesArray.push(entryCodeRow);
            });
          });
        } else {
          const entryCodeRows = savedEntryCodes[item]
            ? savedEntryCodes[item]
            : [{ ...newEntryCodeRow }];

          entryCodeRows.forEach((entryCodeRow) => {
            listEntryCodesArray.push(entryCodeRow);
          });
        }

        newEntryCodesArray.push(listEntryCodesArray);
      });

      return newEntryCodesArray;
    }
  }

  // Re-set Entry Code Row Data when items update
  useEffect(() => {
    const newEntryCodesArray = createEntryCodeRowData(
      languages,
      attributesWithLists,
      savedEntryCodes
    );
    setEntryCodeRowData(newEntryCodesArray);
  }, [languages, attributesWithLists, savedEntryCodes]);

  // Re-set all fields when fileData updates
  useEffect(() => {
    setSchemaDescription({
      English: { name: "", description: "" }
    });

    setDivisionGroup({
      division: "",
      group: ""
    });

    setLanguages(["English"]);
    setAttributeRowData([]);
    setEntryCodeRowData([]);
    setAttributesWithLists([]);
    setSavedEntryCodes({});
    setLanAttributeRowData({});
    setIsZip(false);
    setZipToReadme([]);
    setOCAPackage(null);
  }, [fileData, jsonRawFile]);

  // Keep attributesList in sync with the schema currently being edited
  useEffect(() => {
    try {
      if (!OCAPackage || !editingSchemaId) {
        return;
      }
      const schemaData = getSchemaDataById(OCAPackage, editingSchemaId);
      const attrs = schemaData?.attributes ? Object.keys(schemaData.attributes) : [];
      // Only update if attributesList is empty (avoid overwriting schema-aware state)
      if (attributesList.length === 0 && JSON.stringify(attrs) !== JSON.stringify(attributesList)) {
        setAttributesList(attrs);
      }
    } catch (e) {
      // no-op: defensive guard
    }
  }, [OCAPackage, editingSchemaId]);

  return (
    <div className="App">
      <ThemeProvider theme={CustomTheme}>
        <MultiSchemaProvider>
          <Context.Provider
            // eslint-disable-next-line react/jsx-no-constructed-context-values
            value={{
              schemaMode,
              setSchemaMode,
              fileData,
              setFileData,
              rawFile,
              setRawFile,
              attributesList,
              setAttributesList,
              schemaDescription,
              setSchemaDescription,
              divisionGroup,
              setDivisionGroup,
              languages,
              setLanguages,
              attributeRowData,
              setAttributeRowData,
              entryCodeRowData,
              setEntryCodeRowData,
              attributesWithLists,
              setAttributesWithLists,
              savedEntryCodes,
              setSavedEntryCodes,
              lanAttributeRowData,
              setLanAttributeRowData,
              setCurrentPage,
              history,
              setHistory,
              customIsos,
              setCustomIsos,
              isZip,
              setIsZip,
              characterEncodingRowData,
              setCharacterEncodingRowData,
              formatRuleRowData,
              setFormatRuleRowData,
              dataStandardsRowData,
              setDataStandardsRowData,
              overlay,
              setOverlay,
              selectedOverlay,
              setSelectedOverlay,
              zipToReadme,
              setZipToReadme,
              jsonToReadme,
              setJsonToReadme,
              isZipEdited,
              setIsZipEdited,
              cardinalityData,
              setCardinalityData,
              setCurrentDataValidatorPage,
              currentDataValidatorPage,
              jsonLoading,
              setJsonLoading,
              jsonDropDisabled,
              setJsonDropDisabled,
              datasetLoading,
              setDatasetLoading,
              datasetDropDisabled,
              setDatasetDropDisabled,
              jsonRawFile,
              setJsonRawFile,
              datasetRawFile,
              setDatasetRawFile,
              jsonIsParsed,
              setJsonIsParsed,
              datasetIsParsed,
              setDatasetIsParsed,
              schemaDataConformantHeader,
              setSchemaDataConformantHeader,
              matchingRowData,
              setMatchingRowData,
              firstTimeMatchingRef,
              schemaDataConformantRowData,
              setSchemaDataConformantRowData,
              ogWorkbook,
              setOgWorkbook,
              jsonParsedFile,
              setJsonParsedFile,
              ogSchemaDataConformantHeaderRef,
              entryCodeHeaders,
              setEntryCodeHeaders,
              tempEntryCodeRowData,
              setTempEntryCodeRowData,
              chosenEntryCodeIndex,
              setChosenEntryCodeIndex,
              tempEntryCodeSummary,
              setTempEntryCodeSummary,
              tempEntryList,
              setTempEntryList,
              excelSheetChoice,
              setExcelSheetChoice,
              setCurrentOCAMergePage,
              OCAFile1Raw,
              setOCAFile1Raw,
              OCAFile2Raw,
              setOCAFile2Raw,
              parsedOCAFile1,
              setParsedOCAFile1,
              parsedOCAFile2,
              setParsedOCAFile2,
              selectedOverlaysOCAFile1,
              setSelectedOverlaysOCAFile1,
              selectedOverlaysOCAFile2,
              setSelectedOverlaysOCAFile2,
              firstNavigationToDataset,
              setFirstNavigationToDataset,
              targetResult,
              setTargetResult,
              datasetDropMessage,
              setDatasetDropMessage,
              notToVerifyAttributes,
              setNotToVerifyAttributes,
              OCAPackage,
              setOCAPackage,
              rangeRowData,
              setRangeRowData,
              unitRowData,
              setUnitRowData,
              unitFramedRowData,
              setUnitFramedRowData,
              unitFramedThatAlreadyExistInOcaPackage,
              setUnitFramedThatAlreadyExistInOcaPackage,
              frameAllUnits,
              setFrameAllUnits,
              unitRowDataWhenNoFrameAll,
              setUnitRowDataWhenNoFrameAll,
              currentUnitFramedRowData,
              setCurrentUnitFramedRowData,
              unframedUnitList,
              setUnframedUnitList,
              frameAllAttributes,
              setFrameAllAttributes,
              unframedAttributeList,
              setUnframedAttributeList,
              attributeFramingRowData,
              setAttributeFramingRowData,
              currentSchemaId,
              setCurrentSchemaId,
              editingSchemaId,
              setEditingSchemaId
            }}
          >
            <Box
              sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route
                    path="/start"
                    element={
                      <Home
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        pageForward={pageForward}
                        pageBack={pageBack}
                        showIntroCard={showIntroCard}
                        setShowIntroCard={setShowIntroCard}
                      />
                    }
                  />
                  <Route path="/oca-data-verifier" element={<OCADataValidator />} />
                  <Route path="/schema-visualization" element={<SchemaVisualization />} />
                  {/* <Route
                    path='/help_designing_datasets'
                    element={<GuidanceForDesigningDataSets />}
                  /> */}
                  {/* <Route path="/help_storage" element={<HelpStorage />} /> */}
                  <Route path="/start_schema_help" element={<StartSchemaHelp />} />
                  <Route path="/learn_schema_rule" element={<LearnAboutSchemaRule />} />
                  <Route
                    path="/learn_data_verification"
                    element={<LearnAboutDataVerification />}
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                  <Route
                    path="/oca-merge"
                    element={<OCAMerge currentOCAMergePage={currentOCAMergePage} />}
                  />
                  {/* <Route path="/tutorial" element={<Tutorial />} /> */}
                </Routes>
              </BrowserRouter>
            </Box>
          </Context.Provider>
        </MultiSchemaProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
