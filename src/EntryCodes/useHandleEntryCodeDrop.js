import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { messages } from '../constants/messages';
import Papa from "papaparse";
import { Context } from '../App';

const useHandleEntryCodeDrop = () => {
  const { tempEntryCodeRowData, setTempEntryCodeRowData, entryCodeHeaders, setEntryCodeHeaders, setCurrentPage, setChosenEntryCodeIndex } = useContext(Context);
  const [rawFile, setRawFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropDisabled, setDropDisabled] = useState(false);
  const [dropMessage, setDropMessage] = useState({ message: "", type: "" });
  const [tableLength, setTableLength] = useState(0);
  const [columnDefs, setColumnDefs] = useState([]);
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

  const handleSave = () => {
    setTempEntryCodeRowData(gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
    setCurrentPage("MatchingEntryCodes");
  };

  useEffect(() => {
    if (rawFile && rawFile.length > 0 && (rawFile[0].path.includes(".csv") || rawFile[0].path.includes(".xls"))) {
      processCSVFile(rawFile[0]);
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
    setChosenEntryCodeIndex
  };
};

export default useHandleEntryCodeDrop;