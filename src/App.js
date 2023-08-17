import "./App.css";
import { Box, ThemeProvider } from "@mui/material";
import { CustomTheme } from "./constants/theme";
import { useState } from "react";
import { useEffect, createContext } from "react";
import Home from "./Home";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AddEntryCodesHelp from "./UsersHelp/Add_Entry_Codes_Help";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import AttributeDetailsHelp from "./UsersHelp/Attribute_Details_Help";
import CreatingOCASchemaHelp from "./UsersHelp/Creating_OCA_Schema_Help";
import LanguageAttributeHelp from "./UsersHelp/Language_Attribute_Help";
import SchemaMetadataHelp from "./UsersHelp/Schema_Metadata_Help";
import StartSchemaHelp from "./UsersHelp/Start_Schema_Help";
import ViewSchemaHelp from "./UsersHelp/View_Schema_Help";
import OverlaysHelp from "./UsersHelp/Overlays_Help";
import { getListOfSelectedOverlays } from "./constants/getListOfSelectedOverlays";

export const Context = createContext();

const items = {
  "Attribute type-CB": { feature: "Attribute type-CB", selected: false },
  "Attributes-CB": { feature: "Attributes-CB", selected: false },
  "Classification-CB": { feature: "Classification-CB", selected: false },
  "Flagged-CB": { feature: "Flagged-CB", selected: false },
  "entry": { feature: "entry", selected: false },
  "entry code": { feature: "entry code", selected: false },
  "cardinality": { feature: "cardinality", selected: false },
  "character encoding": { feature: "character encoding", selected: false },
  "conformance": { feature: "conformance", selected: false },
  "format": { feature: "format", selected: false },
  "information": { feature: "information", selected: false },
  "label": { feature: "label", selected: false },
  "meta": { feature: "meta", selected: false },
  "unit": { feature: "unit", selected: false }
};

function App() {
  const [isZip, setIsZip] = useState(false);
  const [fileData, setFileData] = useState([]);
  const [attributesList, setAttributesList] = useState([]);
  const [currentPage, setCurrentPage] = useState("Start");
  const [schemaDescription, setSchemaDescription] = useState({
    English: { name: "", description: "" },
  });
  const [divisionGroup, setDivisionGroup] = useState({
    division: '',
    group: '',
  });
  const [languages, setLanguages] = useState(["English"]);
  const [attributeRowData, setAttributeRowData] = useState([]);
  const [entryCodeRowData, setEntryCodeRowData] = useState([]);
  const [attributesWithLists, setAttributesWithLists] = useState([]);
  const [savedEntryCodes, setSavedEntryCodes] = useState({});
  const [lanAttributeRowData, setLanAttributeRowData] = useState({});
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [customIsos, setCustomIsos] = useState({});

  // Use for Overlays
  const [characterEncodingRowData, setCharacterEncodingRowData] = useState([]);
  const [overlay, setOverlay] = useState(items);
  const [selectedOverlay, setSelectedOverlay] = useState('');

  const pagesArray = [
    "Start",
    "Metadata",
    "Details",
    "LanguageDetails",
    "Overlays",
    "View", 1
  ];

  const pageForward = () => {
    let currentIndex = pagesArray.indexOf(currentPage);
    if (currentIndex >= 0 && currentIndex < pagesArray.length - 1) {
      let newPage = pagesArray[(currentIndex += 1)];
      setCurrentPage(newPage);
    }
  };

  const pageBack = () => {
    let currentIndex = pagesArray.indexOf(currentPage);
    if (currentIndex > 0 && currentIndex < pagesArray.length) {
      let newPage = pagesArray[(currentIndex -= 1)];
      setCurrentPage(newPage);
    }
  };

  //Create Attributes List from File Data
  useEffect(() => {
    const fileAttributes = [];
    fileData.forEach((item) => {
      fileAttributes.push(item[0]);
    });
    setAttributesList(fileAttributes);
  }, [fileData]);

  //Create Attribute Row Data object when Attributes List updates
  useEffect(() => {
    const newAttributesArray = [];
    const newCharacterEncodingArray = [];
    if (attributesList.length > 0) {
      const { selectedFeatures } = getListOfSelectedOverlays(overlay);

      attributesList.forEach((item) => {
        const attributeObject = attributeRowData.find(
          (obj) => obj.Attribute === item
        );
        if (attributeObject) {
          newAttributesArray.push(attributeObject);
        } else {
          newAttributesArray.push({
            Attribute: item,
            Flagged: false,
            Unit: "",
            Type: "",
            List: false,
          });
        }

        const characterEncodingObject = characterEncodingRowData.find(
          (obj) => obj.Attribute === item
        );
        if (characterEncodingObject) {
          newCharacterEncodingArray.push(characterEncodingObject);
        } else {
          const newCharacterEncodingRow = { Attribute: item };
          selectedFeatures.forEach(feature => {
            newCharacterEncodingRow[feature] = "";
          });
          newCharacterEncodingArray.push(newCharacterEncodingRow);
        }
      });
      setAttributeRowData(newAttributesArray);
      setCharacterEncodingRowData(newCharacterEncodingArray);
    }
  }, [attributesList]);

  function createEntryCodeRowData(
    languages,
    attributesWithLists,
    savedEntryCodes
  ) {
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

  //Re-set Entry Code Row Data when items update
  useEffect(() => {
    const newEntryCodesArray = createEntryCodeRowData(
      languages,
      attributesWithLists,
      savedEntryCodes
    );
    setEntryCodeRowData(newEntryCodesArray);
  }, [languages, attributesWithLists, savedEntryCodes]);

  //Re-set all fields when fileData updates
  useEffect(() => {
    setSchemaDescription({
      English: { name: "", description: "" },
    });

    setDivisionGroup({
      division: '',
      group: '',
    });

    setLanguages(["English"]);
    setAttributeRowData([]);
    setEntryCodeRowData([]);
    setAttributesWithLists([]);
    setSavedEntryCodes({});
    setLanAttributeRowData({});
    setIsZip(false);
  }, [fileData]);

  return (
    <div className="App">
      <ThemeProvider theme={CustomTheme}>
        <Context.Provider
          value={{
            fileData,
            setFileData,
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
            customIsos,
            setCustomIsos,
            isZip,
            setIsZip,
            characterEncodingRowData,
            setCharacterEncodingRowData,
            overlay,
            setOverlay,
            selectedOverlay,
            setSelectedOverlay
          }}
        >
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <BrowserRouter>
              <Header currentPage={currentPage} />
              <Routes>
                <Route path="/" element={<Home currentPage={currentPage} pageForward={pageForward} pageBack={pageBack} showIntroCard={showIntroCard} setShowIntroCard={setShowIntroCard} />} />
                <Route path="/add_entry_codes_help" element={<AddEntryCodesHelp />} />
                <Route path="/attribute_details_help" element={<AttributeDetailsHelp />} />
                <Route path="/creating_oca_schema_help" element={<CreatingOCASchemaHelp />} />
                <Route path="/language_attribute_help" element={<LanguageAttributeHelp />} />
                <Route path="/schema_metadata_help" element={<SchemaMetadataHelp />} />
                <Route path="/start_schema_help" element={<StartSchemaHelp />} />
                <Route path="/view_schema_help" element={<ViewSchemaHelp />} />
                <Route path="/overlays_help" element={<OverlaysHelp />} />
                <Route
                  path="*"
                  element={<Navigate to="/" />}
                />
              </Routes>
            </BrowserRouter>
            <Footer />
          </Box>
        </Context.Provider>
      </ThemeProvider>
    </div>
  );
}

export default App;
