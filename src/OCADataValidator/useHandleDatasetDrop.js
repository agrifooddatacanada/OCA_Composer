import { useCallback, useContext, useEffect, useState } from 'react';
import { Context } from '../App';
import Papa from "papaparse";
import { messages } from '../constants/messages';

export const useHandleDatasetDrop = () => {
  const {
    datasetLoading,
    setDatasetLoading,
    datasetDropDisabled,
    setDatasetDropDisabled,
    datasetRawFile,
    setDatasetRawFile,
    setCurrentDataValidatorPage,
    datasetIsParsed,
    setDatasetIsParsed,
    setDatasetRowData,
    setDatasetHeaders,
    setJsonLoading,
    setJsonDropDisabled,
    jsonRawFile,
    setMatchingRowData
  } = useContext(Context);

  const [datasetDropMessage, setDatasetDropMessage] = useState({ message: "", type: "" });

  const datasetLoadingState = () => {
    setDatasetLoading(true);
    setJsonLoading(true);
    setJsonDropDisabled(true);
  };

  const handleClearDataset = useCallback(() => {
    setDatasetIsParsed(false);
    setDatasetDropDisabled(false);
    setDatasetRawFile([]);
    setMatchingRowData([]);
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
          setDatasetRowData(results.data);
          setDatasetHeaders(results.meta.fields);
          setDatasetLoading(false);
          setDatasetDropDisabled(true);

          setDatasetDropMessage({
            message: messages.successfulUpload,
            type: "success",
          });

          setTimeout(() => {
            setDatasetDropDisabled(true);
            setDatasetDropMessage({ message: "", type: "" });
            setDatasetLoading(false);
            setJsonLoading(false);
            if (jsonRawFile.length === 0) {
              setJsonDropDisabled(false);
            }
            if (!datasetIsParsed) {
              setDatasetIsParsed(true);
              setCurrentDataValidatorPage("DatasetViewDataValidator");
            }
          }, 900);
        },
      });
    } catch {
      setDatasetDropMessage({ message: messages.parseUploadFail, type: "error" });
      setDatasetLoading(false);
      setJsonLoading(false);
      if (jsonRawFile.length === 0) {
        setJsonDropDisabled(false);
      }
      setTimeout(() => {
        setDatasetDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [setDatasetRawFile, datasetIsParsed]);

  useEffect(() => {
    if (datasetRawFile && datasetRawFile.length > 0 && !datasetIsParsed && datasetRawFile[0].path.includes(".csv")) {
      processCSVFile(datasetRawFile[0]);
    } else if (datasetRawFile && !datasetIsParsed && datasetRawFile.length > 0) {
      setDatasetDropMessage({ message: messages.uploadFail, type: "error" });
      setDatasetLoading(false);
      setJsonLoading(false);
      if (jsonRawFile.length === 0) {
        setJsonDropDisabled(false);
      }
      setTimeout(() => {
        setDatasetDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [processCSVFile, datasetRawFile]);

  return {
    datasetRawFile,
    setDatasetRawFile,
    datasetLoading,
    datasetLoadingState,
    datasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage,
    handleClearDataset
  };
};
