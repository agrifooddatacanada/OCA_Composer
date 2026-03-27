import React, { useRef, useState, useEffect, createContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ReactGA from "react-ga4";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import "./App.css";
import CustomTheme from "./constants/theme";
import Home from "./Home";
import StartSchemaHelp from "./UsersHelp/Start_Schema_Help";
import Landing from "./Landing/Landing";
// import HelpStorage from "./Landing/HelpStorage";
import OCADataValidator from "./OCADataValidator/OCADataValidator";
import LearnAboutSchemaRule from "./OCADataValidator/LearnAboutSchemaRule";
import LearnAboutDataVerification from "./OCADataValidator/LearnAboutDataVerification";
import OCAMerge from "./OCAMerge/OCAMerge";
import { MultiSchemaProvider, useMultiSchema } from "./schema/schemaContext";
import { getCurrentTheme } from "./utils/themeDetector";
import { CustomPalette } from "./constants/customPalette";
// import Tutorial from "./Tutorial/Tutorial";
import { LanguageConstants } from "./utils/languageUtils";
import {
  CUSTOM_FORMAT_RULE,
  overlayItems
} from "./constants/constants";
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
  const [isZip, setIsZip] = useState(false);
  const [isZipEdited, setIsZipEdited] = useState(false);
  const [zipToReadme, setZipToReadme] = useState([]);
  const [jsonToReadme, setJsonToReadme] = useState({});
  const [currentPage, setCurrentPage] = useState("Landing");
  const [currentDataValidatorPage, setCurrentDataValidatorPage] =
    useState("StartDataValidator");
  const [currentOCAMergePage, setCurrentOCAMergePage] = useState("StartOCAMerge");
  const [history, setHistory] = useState([currentPage]);
  const [divisionGroup, setDivisionGroup] = useState({
    division: "",
    group: ""
  });
  const [customIsos, setCustomIsos] = useState({});
  const [currentSchemaId, setCurrentSchemaId] = useState(null);
  const [editingSchemaId, setEditingSchemaId] = useState(null);

  const [overlay, setOverlay] = useState(overlayItems);
  const [selectedOverlay, setSelectedOverlay] = useState("");

  // Use for OCA Validator
  const [schemaRawFile, setSchemaRawFile] = useState([]);
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

  // Re-set all fields when schema file queue (validator / landing yaml) updates
  useEffect(() => {
    setDivisionGroup({
      division: "",
      group: ""
    });

    setIsZip(false);
    setZipToReadme([]);
    // Note: ocaPackage is now in multi-schema context, cleared via clearAllSchemas()
  }, [schemaRawFile]);

  // REMOVED: Legacy useEffect that synced attributesList with editingSchemaId
  // This is now handled by MultiSchemaContext

  return (
    <div className="App">
      <ThemeProvider theme={customTheme}>
        <MultiSchemaProvider>
          <Context.Provider
            // eslint-disable-next-line react/jsx-no-constructed-context-values
            value={{
              divisionGroup,
              setDivisionGroup,
              setCurrentPage,
              history,
              setHistory,
              customIsos,
              setCustomIsos,
              isZip,
              setIsZip,
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
              schemaRawFile,
              setSchemaRawFile,
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
                      />
                    }
                  />
                  <Route path="/oca-data-verifier" element={<OCADataValidator />} />
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
