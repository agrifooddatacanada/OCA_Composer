import React, { useRef, useState, useEffect, createContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ReactGA from "react-ga4";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import "./App.css";
import CustomTheme from "./constants/theme";
import Home from "./Home";
import StartSchemaHelp from "./UsersHelp/Start_Schema_Help";
import { getListOfSelectedOverlays } from "./utils/overlayUtils";
import Landing from "./Landing/Landing";
// import HelpStorage from "./Landing/HelpStorage";
import OCADataValidator from "./OCADataValidator/OCADataValidator";
import LearnAboutSchemaRule from "./OCADataValidator/LearnAboutSchemaRule";
import LearnAboutDataVerification from "./OCADataValidator/LearnAboutDataVerification";
import OCAMerge from "./OCAMerge/OCAMerge";
import SchemaVisualization from "./SchemaVisualization/SchemaVisualization";
import { getSchemaDataById } from "./SchemaVisualization/dataUtils";
import { MultiSchemaProvider, useMultiSchema } from "./schema/schemaContext";
import { getCurrentTheme } from "./utils/themeDetector";
import { CustomPalette } from "./constants/customPalette";
// import Tutorial from "./Tutorial/Tutorial";
import useUnitFramingUpdater from "./hooks/useUnitFramingUpdater";
import { LanguageConstants } from "./utils/languageUtils";
import {
  CUSTOM_FORMAT_RULE,
  overlayItems,
  SCHEMA_MODE_SINGLE
} from "./constants/constants";
import {
  getUnitsFramedThatAlreadyExistInOcaPackage,
  hasUnitFramingOverlay,
  hasAttributeFramingOverlay
} from "./utils/helpers";

// import { environVariables } from "./components/environmentConfig";

export const Context = createContext();

// Initializing react-ga with google analytics ID
if (process.env.REACT_APP_GA_ID) {
  ReactGA.initialize(process.env.REACT_APP_GA_ID);
}

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
  const [currentPage, setCurrentPage] = useState("Landing");
  const [currentDataValidatorPage, setCurrentDataValidatorPage] =
    useState("StartDataValidator");
  const [currentOCAMergePage, setCurrentOCAMergePage] = useState("StartOCAMerge");
  const [history, setHistory] = useState([currentPage]);
  const [divisionGroup, setDivisionGroup] = useState({
    division: "",
    group: ""
  });
  const [formPlaceholdersByLanguage, setFormPlaceholdersByLanguage] = useState({});
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [customIsos, setCustomIsos] = useState({});
  const [currentSchemaId, setCurrentSchemaId] = useState(null);
  const [editingSchemaId, setEditingSchemaId] = useState(null);

  // Use for Overlays
  const [characterEncodingRowData, setCharacterEncodingRowData] = useState([]);
  const [FormInformationRowData, setFormInformationRowData] = useState([]);
  const [formBuilderPages, setFormBuilderPages] = useState([]);
  const [overlay, setOverlay] = useState(overlayItems);
  
  const [selectedOverlay, setSelectedOverlay] = useState("");
  const [dataStandardsRowData, setDataStandardsRowData] = useState([]);
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

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  // Custom theme for the MUI components like buttons, etc.
  const customTheme = createTheme({
    status: {
      danger: "#e53e3e"
    },
    palette: {
      button: {
        light: CustomPalette.DARK,
        main: currentTheme?.buttonStyles?.primary ?? CustomPalette.PRIMARY,
        dark: currentTheme?.buttonStyles?.secondary ?? CustomPalette.SECONDARY,
        contrastText: currentTheme?.buttonStyles?.contrastText ?? CustomPalette.WHITE
      },
      navButton: {
        light: CustomPalette.DARK,
        main: currentTheme?.buttonStyles?.primary ?? CustomPalette.PRIMARY,
        dark: currentTheme?.buttonStyles?.secondary ?? CustomPalette.SECONDARY,
        contrastText: currentTheme?.buttonStyles?.contrastText ?? CustomPalette.WHITE
      }
    }
  });

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
    const handleThemeChange = () => {
      setCurrentTheme(getCurrentTheme());
    };

    window.addEventListener("popstate", handleThemeChange);
    return () => window.removeEventListener("popstate", handleThemeChange);
  }, []);

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

  // REMOVED: Legacy useEffects for attributesList, formatRuleRowData management
  // These are now handled by MultiSchemaContext with normalized storage

  // TODO: Unit framing logic needs to be refactored to work with multi-schema context
  // For now, this useEffect is disabled since OCAPackage is no longer in App.js
  // useEffect(() => {
  //   if (OCAPackage) {
  //     setUnitFramedThatAlreadyExistInOcaPackage(
  //       getUnitsFramedThatAlreadyExistInOcaPackage(OCAPackage)
  //     );
  //   }
  // }, [OCAPackage]);

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

  // Re-set all fields when fileData updates
  useEffect(() => {
    setDivisionGroup({
      division: "",
      group: ""
    });

    setIsZip(false);
    setZipToReadme([]);
    // Note: OCAPackage is now in multi-schema context, cleared via clearAllSchemas()
  }, [fileData, jsonRawFile]);

  // REMOVED: Legacy useEffect that synced attributesList with editingSchemaId
  // This is now handled by MultiSchemaContext

  return (
    <div className="App">
      <ThemeProvider theme={customTheme}>
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
              divisionGroup,
              setDivisionGroup,
              formPlaceholdersByLanguage,
              setFormPlaceholdersByLanguage,
              setCurrentPage,
              history,
              setHistory,
              customIsos,
              setCustomIsos,
              isZip,
              setIsZip,
              characterEncodingRowData,
              setCharacterEncodingRowData,
              FormInformationRowData,
              setFormInformationRowData,
              formBuilderPages,
              setFormBuilderPages,
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
              setEditingSchemaId,
              currentTheme,
              setCurrentTheme
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
