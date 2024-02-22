import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { messages } from '../constants/messages';
import Papa from "papaparse";
import { Context } from '../App';

const useHandleEntryCodeDrop = () => {
  const { tempEntryCodeRowData, setTempEntryCodeRowData, entryCodeHeaders, setEntryCodeHeaders, setCurrentPage, setChosenEntryCodeIndex, setTempEntryCodeSummary, setTempEntryList } = useContext(Context);
  const [rawFile, setRawFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropDisabled, setDropDisabled] = useState(false);
  const [dropMessage, setDropMessage] = useState({ message: "", type: "" });
  const [tableLength, setTableLength] = useState(0);
  const [columnDefs, setColumnDefs] = useState([]);
  const [fileType, setFileType] = useState("");
  const gridRef = useRef(null);

  const setLoadingState = () => {
    setLoading(true);
  };

  const handleClearUpload = useCallback(() => {
    setDropDisabled(false);
    setRawFile([]);
    setEntryCodeHeaders([]);
  }, []);

  const processCSVFile = useCallback((file) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: function(header, index) {
          if (header !== "") {
            return header;
          }
          //without this, papaparse will save blank headers as "", "_1", "_2", etc.
          return `header_empty_placeholder_${index}`;
        },
        complete: function(results) {
          setTempEntryCodeRowData(results.data);
          setEntryCodeHeaders(results.meta.fields);
          setLoading(false);
          setDropDisabled(true);

          setDropMessage({
            message: messages.successfulUpload,
            type: "success",
          });

          setTimeout(() => {
            setDropDisabled(true);
            setDropMessage({ message: "", type: "" });
            setLoading(false);
          }, 900);
        },
      });
    } catch {
      setDropMessage({ message: messages.parseUploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, []);

  const handleBundleJSONDrop = useCallback((jsonFile) => {
    console.log('jsonFile', jsonFile);
    const entryList = [];
    let entryCodeSummary = {};
    // const languageList = jsonFile?.overlays?.meta?.map((meta) => {
    //   const language = meta?.language.slice(0, 2);
    //   if (!codesToLanguages?.[language]) {
    //     const randomString = 'lang_' + language;
    //     codesToLanguages[language] = randomString;
    //     languageCodesObject[randomString] = language;
    //   }
    //   return codesToLanguages[language];
    // });

    if (jsonFile?.overlays?.entry_code) {
      entryCodeSummary = { ...jsonFile.overlays.entry_code };
    }

    if (jsonFile?.overlays?.entry) {
      entryList.push(...jsonFile.overlays.entry);
    }

    // const attributesWithListType = Object.keys(entryCodeSummary?.['attribute_entry_codes']);
    // const languages = entryList.map((entry) => entry?.language);
    // console.log('languages', languages);
    // console.log('attributesWithListType', attributesWithListType);
    console.log('entryList', entryList);
    console.log('entryCodeSummary', entryCodeSummary);
    setTempEntryCodeSummary(entryCodeSummary);
    setTempEntryList(entryList);
  }, []);


  const processJSONFile = useCallback((acceptedFiles) => {
    try {
      // setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        console.log('fifth');
        const jsonFile = JSON.parse(e.target.result);

        if (jsonFile?.['bundle']) {
          handleBundleJSONDrop(jsonFile?.['bundle']);
        } else if (jsonFile?.['schema']?.[0]) {
          handleBundleJSONDrop(jsonFile?.['schema']?.[0]);
        } else {
          handleBundleJSONDrop(jsonFile);
        }
      };

      reader.readAsText(acceptedFiles);

      setTimeout(() => {
        setDropDisabled(true);
        setDropMessage({ message: "", type: "" });
        setLoading(false);
      }, 900);
    } catch (error) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [handleBundleJSONDrop]);


  const handleSave = () => {
    if (fileType === "csvORxls") {
      setTempEntryCodeRowData(gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
      setCurrentPage("MatchingEntryCodes");
    } else if (fileType === "json") {
      setCurrentPage("MatchingJSONEntryCodes");
    }
  };

  useEffect(() => {
    if (rawFile && rawFile.length > 0 && (rawFile[0].path.includes(".csv") || rawFile[0].path.includes(".xls"))) {
      setFileType("csvORxls");
      processCSVFile(rawFile[0]);
    } else if (rawFile && rawFile.length > 0 && rawFile[0].path.includes(".json")) {
      setFileType("json");
      processJSONFile(rawFile[0]);
    } else if (rawFile && rawFile.length > 0) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [processCSVFile, rawFile]);

  useEffect(() => {
    const titles = [];
    let newTableLength = 0;
    entryCodeHeaders.forEach((header) => {
      titles.push({
        headerName: header,
        field: header,
        width: 100,
        resizable: true,
        editable: true,
      });
      newTableLength += 100;
    });
    setTableLength(newTableLength);
    setColumnDefs(titles);
  }, [entryCodeHeaders]);

  return {
    rawFile,
    setRawFile,
    loading,
    setLoadingState,
    dropDisabled,
    dropMessage,
    setDropMessage,
    handleClearUpload,
    tempEntryCodeRowData,
    entryCodeHeaders,
    tableLength,
    columnDefs,
    setCurrentPage,
    handleSave,
    gridRef,
    setChosenEntryCodeIndex,
    fileType
  };
};

export default useHandleEntryCodeDrop;