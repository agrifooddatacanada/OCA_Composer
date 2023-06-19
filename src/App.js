import "./App.css";
import { Box, ThemeProvider } from "@mui/material";
import StartSchema from "./StartSchema/StartSchema";
import { CustomTheme } from "./constants/theme";
import Header from "./Header/Header";
import { useState } from "react";
import SchemaMetadata from "./SchemaMetadata/SchemaMetadata";
import AttributeDetails from "./AttributeDetails/AttributeDetails";
import { useEffect, createContext } from "react";
import EntryCodes from "./EntryCodes/EntryCodes";
import LanguageDetails from "./LanguageDetails/LanguageDetails";
import ViewSchema from "./ViewSchema/ViewSchema";
import CreateManually from "./CreateManually/CreateManually";
import Footer from "./Footer/Footer";

export const Context = createContext();

function App() {
  const [fileData, setFileData] = useState([]);
  const [attributesList, setAttributesList] = useState([]);
  const [currentPage, setCurrentPage] = useState("Start");
  const [schemaDescription, setSchemaDescription] = useState({
    English: { name: "", description: "" },
  });
  const [languages, setLanguages] = useState(["English"]);
  const [attributeRowData, setAttributeRowData] = useState([]);
  const [entryCodeRowData, setEntryCodeRowData] = useState([]);
  const [attributesWithLists, setAttributesWithLists] = useState([]);
  const [savedEntryCodes, setSavedEntryCodes] = useState({});
  const [lanAttributeRowData, setLanAttributeRowData] = useState({});
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [customIsos, setCustomIsos] = useState({});

  const pagesArray = [
    "Start",
    "Metadata",
    "Details",
    "LanguageDetails",
    "View",
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
    if (attributesList.length > 0) {
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
      });
      setAttributeRowData(newAttributesArray);
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

    setLanguages(["English"]);
    setAttributeRowData([]);
    setEntryCodeRowData([]);
    setAttributesWithLists([]);
    setSavedEntryCodes({});
    setLanAttributeRowData({});
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
          }}
        >
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header currentPage={currentPage} />
            <Box sx={{ flex: 1 }}>
              {currentPage === "Start" && (
                <StartSchema pageForward={pageForward} />
              )}
              {currentPage === "Metadata" && (
                <SchemaMetadata
                  pageBack={pageBack}
                  pageForward={pageForward}
                  showIntroCard={showIntroCard}
                  setShowIntroCard={setShowIntroCard}
                />
              )}
              {currentPage === "Details" && (
                <AttributeDetails pageBack={pageBack} pageForward={pageForward} />
              )}
              {currentPage === "Codes" && <EntryCodes />}

              {currentPage === "LanguageDetails" && (
                <LanguageDetails pageBack={pageBack} pageForward={pageForward} />
              )}
              {currentPage === "View" && <ViewSchema pageBack={pageBack} />}
              {currentPage === "Create" && <CreateManually />}
            </Box>
            <Footer />
          </Box>
        </Context.Provider>
      </ThemeProvider>
    </div>
  );
}

export default App;
