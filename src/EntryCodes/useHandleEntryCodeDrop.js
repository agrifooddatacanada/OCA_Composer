import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { messages } from '../constants/messages';
import Papa from "papaparse";
import { Context } from '../App';
import { MenuItem } from '@mui/material';
import JSZip from 'jszip';

const userSelectionDropdown = ['Copy from other entry codes', 'Upload'];

const useHandleEntryCodeDrop = () => {
  const {
    tempEntryCodeRowData,
    setTempEntryCodeRowData,
    entryCodeHeaders,
    setEntryCodeHeaders,
    setCurrentPage,
    setChosenEntryCodeIndex,
    setTempEntryCodeSummary,
    setTempEntryList,
    attributeRowData,
    entryCodeRowData,
    setEntryCodeRowData,
    chosenEntryCodeIndex
  } = useContext(Context);
  const [rawFile, setRawFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropDisabled, setDropDisabled] = useState(false);
  const [dropMessage, setDropMessage] = useState({ message: "", type: "" });
  const [tableLength, setTableLength] = useState(0);
  const [columnDefs, setColumnDefs] = useState([]);
  const [fileType, setFileType] = useState("");
  const [selectionValue, setSelectionValue] = useState('Copy from other entry codes');
  const [selectedAttributesList, setSelectedAttributesList] = useState([]);
  const [selectedAttrToCopy, setSelectedAttrToCopy] = useState('');
  const gridRef = useRef(null);
  const unfilteredAttrRef = useRef([]);

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
    const entryList = [];
    let entryCodeSummary = {};

    if (jsonFile?.overlays?.entry_code) {
      entryCodeSummary = { ...jsonFile.overlays.entry_code };
    }

    if (jsonFile?.overlays?.entry) {
      entryList.push(...jsonFile.overlays.entry);
    }

    setTempEntryCodeSummary(entryCodeSummary);
    setTempEntryList(entryList);
  }, []);


  const processJSONFile = useCallback((acceptedFiles) => {
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
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

  const processZipFile = useCallback((acceptedFiles) => {
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const zip = await JSZip.loadAsync(e.target.result);

        const entryList = [];
        let entryCodeSummary = {};

        // load up metadata file in OCA bundle
        const loadMetadataFile = await zip.files["meta.json"].async("text");
        const metadataJson = JSON.parse(loadMetadataFile);
        const root = metadataJson.root;

        // loop through all files in OCA bundle
        for (const [key, file] of Object.entries(metadataJson.files[root])) {
          const content = await zip.files[file + '.json'].async("text");

          if (key.includes("entry (")) {
            entryList.push(JSON.parse(content));
          }

          if (key.includes("entry_code")) {
            entryCodeSummary = JSON.parse(content);
          }
        }

        setTempEntryCodeSummary(entryCodeSummary);
        setTempEntryList(entryList);
      };

      reader.readAsArrayBuffer(acceptedFiles);

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
  }, []);


  const handleSave = () => {
    if (selectionValue === "Upload") {
      if (fileType === "csvORxls") {
        setTempEntryCodeRowData(gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
        setCurrentPage("MatchingEntryCodes");
      } else if (fileType === "json" || fileType === "zip") {
        setCurrentPage("MatchingJSONEntryCodes");
      }
    } else {
      const fromIndex = unfilteredAttrRef.current.indexOf(selectedAttrToCopy);
      setEntryCodeRowData(prev => {
        const newObj = [...prev];
        newObj[chosenEntryCodeIndex] = newObj[fromIndex];
        return newObj;
      });
      setCurrentPage("Codes");
    }
  };

  const userSelectionListDropdown = useMemo(() => {
    return userSelectionDropdown.map((division) => {
      return (
        <MenuItem sx={{ height: '38px' }} key={division} value={division}>{division}</MenuItem>
      );
    });
  }, []);

  const attributeListDropdown = useMemo(() => {
    return selectedAttributesList.map((division) => {
      return (
        <MenuItem sx={{ height: '38px' }} key={division} value={division}>{division}</MenuItem>
      );
    });
  }, [selectedAttributesList]);

  useEffect(() => {
    if (rawFile && rawFile.length > 0 && (rawFile[0].path.includes(".csv") || rawFile[0].path.includes(".xls"))) {
      setFileType("csvORxls");
      processCSVFile(rawFile[0]);
    } else if (rawFile && rawFile.length > 0 && rawFile[0].path.includes(".json")) {
      setFileType("json");
      processJSONFile(rawFile[0]);
    } else if (rawFile && rawFile.length > 0 && rawFile[0].path.includes(".zip")) {
      setFileType("zip");
      processZipFile(rawFile[0]);
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

  useEffect(() => {
    const unfilteredAttributes = attributeRowData.filter(
      (item) => item.List === true
    );
    const filteredAttributes = unfilteredAttributes.filter((_, index) => {
      return index !== chosenEntryCodeIndex && entryCodeRowData[index]?.[0]?.Code !== '';
    });
    const attributeArray = filteredAttributes.map((item) => item.Attribute);
    unfilteredAttrRef.current = unfilteredAttributes.map((item) => item.Attribute);
    setSelectedAttributesList(attributeArray);
  }, [attributeRowData]);

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
    tableLength,
    columnDefs,
    handleSave,
    gridRef,
    setCurrentPage,
    setChosenEntryCodeIndex,
    fileType,
    selectionValue,
    setSelectionValue,
    userSelectionListDropdown,
    attributeListDropdown,
    selectedAttrToCopy,
    setSelectedAttrToCopy,
    entryCodeHeaders,
  };
};

export default useHandleEntryCodeDrop;