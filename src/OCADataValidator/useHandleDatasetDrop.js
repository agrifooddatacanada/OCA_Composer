import { useCallback, useContext, useEffect, useState } from 'react';
import { Context } from '../App';
import Papa from "papaparse";
import { messages } from '../constants/messages';
import * as XLSX from "xlsx";

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
    setDataEntryHeadersV2,
    setDataEntryHeaders,
    setJsonLoading,
    setJsonDropDisabled,
    jsonRawFile,
    setMatchingRowData,
    setDataSchemaHeaders,
    setDataSchemaRowData,
    setOgWorkbook
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
    setDataEntryHeadersV2([]);
    setDataEntryHeaders([]);
    setDataSchemaHeaders([]);
    setDataSchemaRowData([]);
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
          setDataEntryHeadersV2(results.data);
          setDataEntryHeaders(results.meta.fields);
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
  }, [datasetIsParsed]);

  const handleExcelDrop = useCallback((acceptedFiles) => {
    try {
      const reader = new FileReader();
      const rABS = !!reader.readAsBinaryString; // converts object to boolean
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = (e) => {
        const bstr = e.target.result;
        const workbook = XLSX.read(bstr, {
          type: rABS ? "binary" : "array",
        });

        processExcelFile(workbook);
        setOgWorkbook(workbook);

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
      };
      if (rABS) reader.readAsBinaryString(acceptedFiles);
      else reader.readAsArrayBuffer(acceptedFiles);

    } catch (error) {
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
  }, [datasetIsParsed]);

  const processExcelFile = useCallback(async (workbook) => {
    // const newWorkbook = await copyFirstWorksheet(workbook);
    const dataEntryName = "Data Entry";
    const schemaConformantDataName = "Schema conformant data";

    const jsonFromExcel = XLSX.utils.sheet_to_json(
      workbook.Sheets[dataEntryName],
      {
        raw: false,
        header: 1,
        defval: "",
      }
    );

    const jsonSchemaFromExcel = XLSX.utils.sheet_to_json(
      workbook.Sheets[schemaConformantDataName],
      {
        raw: false,
        header: 1,
        defval: "",
      }
    );

    const dataEntryExcelRowData = [];

    if (jsonFromExcel[0].length > 0) {
      for (let i = 1; i < jsonFromExcel.length; i++) {
        const objData = {};
        for (const headerIndex in jsonFromExcel[0]) {
          if (jsonFromExcel[i]?.[headerIndex]) {
            objData[jsonFromExcel[0][headerIndex]] = jsonFromExcel[i]?.[headerIndex];
          }
        }
        dataEntryExcelRowData.push(objData);
      }
    }

    const schemaConformantRowData = [];

    if (jsonSchemaFromExcel[0].length > 0) {
      for (let i = 1; i < jsonSchemaFromExcel.length; i++) {
        const objData = {};
        for (const headerIndex in jsonSchemaFromExcel[0]) {
          if (jsonSchemaFromExcel[i]?.[headerIndex]) {
            objData[jsonSchemaFromExcel[0][headerIndex]] = jsonSchemaFromExcel[i]?.[headerIndex];
          }
        }
        schemaConformantRowData.push(objData);
      }
    }

    setDataEntryHeaders(jsonFromExcel[0]);
    setDataEntryHeadersV2(dataEntryExcelRowData);
    setDataSchemaHeaders(jsonSchemaFromExcel[0]);
    setDataSchemaRowData(schemaConformantRowData);
  }, []);

  useEffect(() => {
    if (datasetRawFile && datasetRawFile.length > 0 && !datasetIsParsed && datasetRawFile[0].path.includes(".csv")) {
      processCSVFile(datasetRawFile[0]);
    } else if (datasetRawFile && datasetRawFile.length > 0 && !datasetIsParsed && (datasetRawFile[0].path.includes(".xls") || datasetRawFile[0].path.includes(".xlsx"))) {
      handleExcelDrop(datasetRawFile[0]);
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
