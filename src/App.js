import './App.css';
import { Box, ThemeProvider } from '@mui/material';
import { CustomTheme } from './constants/theme';
import { useState } from 'react';
import { useEffect, createContext } from 'react';
import Home from './Home';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import StartSchemaHelp from './UsersHelp/Start_Schema_Help';
import { getListOfSelectedOverlays } from './constants/getListOfSelectedOverlays';
import Landing from './Landing/Landing';
import GuidanceForDesigningDataSets from './Landing/HelpDesigningDatasets';
import ReactGA from 'react-ga';
import HelpStorage from './Landing/HelpStorage';

export const Context = createContext();

//Initializing react-ga with google analytics ID
ReactGA.initialize(process.env.REACT_APP_GA_ID);

const items = {
  'Character Encoding': { feature: 'Character Encoding', selected: false },
  'Make selected entries required': {
    feature: 'Make selected entries required',
    selected: false,
  },
  'Add format rule for data': {
    feature: 'Add format rule for data',
    selected: false,
  },
  "Cardinality": { feature: "Cardinality", selected: false }
};

export const pagesArray = [
  'Start',
  'Metadata',
  'Details',
  'LanguageDetails',
  'Overlays',
  'View',
];

function App() {
  const [isZip, setIsZip] = useState(false);
  const [isZipEdited, setIsZipEdited] = useState(false);
  const [zipToReadme, setZipToReadme] = useState([]);
  const [jsonToReadme, setJsonToReadme] = useState({});
  const [fileData, setFileData] = useState([]);
  const [rawFile, setRawFile] = useState([]);
  const [attributesList, setAttributesList] = useState([]);
  const [currentPage, setCurrentPage] = useState('Landing');
  const [history, setHistory] = useState([currentPage]);
  const [schemaDescription, setSchemaDescription] = useState({
    English: { name: '', description: '' },
  });
  const [divisionGroup, setDivisionGroup] = useState({
    division: '',
    group: '',
  });
  const [languages, setLanguages] = useState(['English']);
  const [attributeRowData, setAttributeRowData] = useState([]);
  const [entryCodeRowData, setEntryCodeRowData] = useState([]);
  const [savedEntryCodes, setSavedEntryCodes] = useState({});
  const [attributesWithLists, setAttributesWithLists] = useState([]);
  const [lanAttributeRowData, setLanAttributeRowData] = useState({});
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [showDeprecationCard, setShowDeprecationCard] = useState(null);
  const [customIsos, setCustomIsos] = useState({});

  // Use for Overlays
  const [characterEncodingRowData, setCharacterEncodingRowData] = useState([]);
  const [formatRuleRowData, setFormatRuleRowData] = useState([]);
  const [overlay, setOverlay] = useState(items);
  const [selectedOverlay, setSelectedOverlay] = useState('');

  const [cardinalityData, setCardinalityData] = useState([]);

  // Entry Code upload
  const [entryCodeHeaders, setEntryCodeHeaders] = useState([]);
  const [tempEntryCodeRowData, setTempEntryCodeRowData] = useState([]);
  const [chosenEntryCodeIndex, setChosenEntryCodeIndex] = useState(-1);
  const [tempEntryCodeSummary, setTempEntryCodeSummary] = useState(undefined);
  const [tempEntryList, setTempEntryList] = useState([]);

  const [excelSheetChoice, setExcelSheetChoice] = useState(-1);

  const pageForward = () => {
    let currentIndex = pagesArray.indexOf(currentPage);
    if (currentIndex >= 0 && currentIndex < pagesArray.length - 1) {
      let newPage = pagesArray[(currentIndex += 1)];
      setCurrentPage(newPage);
      setHistory((prev) => [...prev, newPage]);
    }
  };

  const pageBack = () => {
    let currentIndex = pagesArray.indexOf(currentPage);
    if (currentIndex > 0 && currentIndex < pagesArray.length) {
      let newPage = pagesArray[(currentIndex -= 1)];
      setCurrentPage(newPage);
      setHistory((prev) => prev.slice(0, prev.length - 1));
    }
  };

  useEffect(() => {
    if (history[history.length - 1] !== currentPage) {
      setHistory((prev) => [...prev, currentPage]);
    }
  }, [currentPage]);

  //Measuring page views
  useEffect(() => {
    ReactGA.pageview('/');
  }, []);


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
            Unit: '',
            Type: '',
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
          selectedFeatures.forEach((feature) => {
            newCharacterEncodingRow[feature] = '';
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
          FormatText: '',
        });
      }
    });
    setFormatRuleRowData(newFormatRuleArray);
  }, [attributeRowData]);

  function createEntryCodeRowData(
    languages,
    attributesWithLists,
    savedEntryCodes
  ) {
    const newEntryCodesArray = [];

    const newEntryCodeRow = { Code: '' };
    languages.forEach((lang) => {
      newEntryCodeRow[lang] = '';
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
      English: { name: '', description: '' },
    });

    setDivisionGroup({
      division: '',
      group: '',
    });

    setLanguages(['English']);
    setAttributeRowData([]);
    setEntryCodeRowData([]);
    setAttributesWithLists([]);
    setSavedEntryCodes({});
    setLanAttributeRowData({});
    setIsZip(false);
    setZipToReadme([]);
  }, [fileData]);

  return (
    <div className='App'>
      <ThemeProvider theme={CustomTheme}>
        <Context.Provider
          value={{
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
            showDeprecationCard,
            setShowDeprecationCard,
            cardinalityData,
            setCardinalityData,
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
          }}
        >
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <BrowserRouter>
              <Header currentPage={currentPage} />
              <Routes>
                <Route path='/' element={<Landing />} />
                <Route
                  path='/start'
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
                <Route
                  path='/help_designing_datasets'
                  element={<GuidanceForDesigningDataSets />}
                />
                <Route path='/help_storage' element={<HelpStorage />} />
                <Route
                  path='/start_schema_help'
                  element={<StartSchemaHelp />}
                />
                <Route path='*' element={<Navigate to='/' />} />
              </Routes>
            </BrowserRouter>
            <Footer currentPage={currentPage} />
          </Box>
        </Context.Provider>
      </ThemeProvider>
    </div>
  );
}

export default App;
