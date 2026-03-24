import { useCallback, useContext, useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { messages } from "../constants/messages";
import { Context } from "../App";

/**
 * Decode CSV/TSV bytes: UTF-8 BOM / UTF-16 LE / UTF-16 BE, then strict UTF-8 or legacy ANSI.
 * - Papa strips UTF-8 BOM only for string input, not File streaming.
 * - UTF-16 exports must not be read as UTF-8.
 * - Excel "ANSI" / Windows-1252 uses byte 0xB0 for °; that byte is invalid UTF-8 alone, so
 *   default TextDecoder replaces it with U+FFFD (�). We use fatal UTF-8 and fall back to
 *   windows-1252 when the file is not valid UTF-8.
 */
function decodeWindows1252OrLatin1(buf) {
  try {
    return new TextDecoder("windows-1252").decode(buf);
  } catch {
    return new TextDecoder("iso-8859-1").decode(buf);
  }
}

function decodeBytesToString(buf) {
  if (buf.length === 0) {
    return "";
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buf.slice(3));
    } catch {
      return decodeWindows1252OrLatin1(buf.slice(3));
    }
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buf.slice(2));
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buf.slice(2));
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return decodeWindows1252OrLatin1(buf);
  }
}

function readDelimitedFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = new Uint8Array(e.target.result);
      resolve(decodeBytesToString(buf));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * UTF-8 C2 A1 is ¡ (U+00A1); C2 B0 is ° (U+00B0). Some TSV/CSV exports mis-encode the degree
 * sign as ¡. CP1252 byte 0xA1 is also ¡ vs 0xB0 for °. Replace ¡ with ° only when a digit
 * precedes ¡ (e.g. 45¡30, -12.5¡) so leading Spanish ¡ is not touched.
 */
function normalizeInvertedExclamationAsDegree(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (/\d\s*\u00A1/.test(value)) {
    return value.replace(/\u00A1/g, "\u00B0");
  }
  return value;
}

export default function useHandleDatasetDrop() {
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
    setJsonLoading,
    setJsonDropDisabled,
    jsonRawFile,
    setMatchingRowData,
    setSchemaDataConformantHeader,
    setSchemaDataConformantRowData,
    ogWorkbook,
    setOgWorkbook,
    firstTimeMatchingRef,
    excelSheetChoice,
    setExcelSheetChoice,
    firstNavigationToDataset,
    setFirstNavigationToDataset,
    datasetDropMessage,
    setDatasetDropMessage
  } = useContext(Context);

  const [excelSheetNames, setExcelSheetNames] = useState([]);

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
    setOgWorkbook(null);
    setSchemaDataConformantHeader([]);
    setSchemaDataConformantRowData([]);
    setExcelSheetNames([]);
    setExcelSheetChoice(-1);
    setFirstNavigationToDataset(false);
    firstTimeMatchingRef.current = true;
  }, []);

  const processDelimitedTextFile = useCallback(async (file, delimiter) => {
    let text;
    try {
      text = await readDelimitedFileAsText(file);
    } catch {
      setDatasetDropMessage({ message: messages.parseUploadFail, type: "error" });
      setDatasetLoading(false);
      setJsonLoading(false);
      if (jsonRawFile.length === 0) {
        setJsonDropDisabled(false);
      }
      setTimeout(() => {
        setDatasetDropMessage({ message: "", type: "" });
      }, 2500);
      return;
    }

    try {
      Papa.parse(text, {
        delimiter,
        header: true,
        skipEmptyLines: "greedy",
        fastMode: false,
        transform: normalizeInvertedExclamationAsDegree,
        transformHeader: (header, index) => {
          const raw =
            header !== ""
              ? header
              : `header_empty_placeholder_${index}`;
          return normalizeInvertedExclamationAsDegree(raw);
        },
        complete: (results) => {
          setSchemaDataConformantHeader(results.meta.fields);
          setSchemaDataConformantRowData(results.data);

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
              if (jsonRawFile.length > 0) {
                setCurrentDataValidatorPage("AttributeMatchDataValidator");
              } 
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
      }, 2500);
    }
  }, [datasetIsParsed, jsonRawFile]);

  const handleExcelDrop = useCallback((acceptedFiles) => {

    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString; // converts object to boolean
    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.onload = async (e) => {
      try {
        const bstr = e.target.result;
        const workbook = XLSX.read(bstr, {
          type: rABS ? "binary" : "array",
        });

        setExcelSheetNames(workbook.SheetNames);
        setExcelSheetChoice(workbook.SheetNames[0]);
        setOgWorkbook(workbook);

        setDatasetLoading(false);
        setDatasetDropDisabled(true);
        setDatasetDropMessage({
          message: messages.successfulUpload,
          type: "success",
        });

        setTimeout(() => {
          setDatasetDropMessage({ message: "", type: "" });
          setDatasetLoading(false);
          setJsonLoading(false);
          if (jsonRawFile.length === 0) {
            setJsonDropDisabled(false);
          }
        }, 900);
      } catch (error) {
        setDatasetDropMessage({ message: error.message ? error.message : messages.parseUploadFail, type: "error" });
        setDatasetLoading(false);
        setJsonLoading(false);
        if (jsonRawFile.length === 0) {
          setJsonDropDisabled(false);
        }
        setTimeout(() => {
          setDatasetDropMessage({ message: "", type: "" });
        }, [2500]);
      }

    };

    if (rABS) reader.readAsBinaryString(acceptedFiles);
    else reader.readAsArrayBuffer(acceptedFiles);
  }, [datasetIsParsed, jsonRawFile]);

  const processExcelFile = useCallback(async (workbook, index) => {

    const schemaConformantDataName = workbook.SheetNames[index];

    const worksheet = workbook.Sheets[schemaConformantDataName];

    if (!worksheet) {
      handleClearDataset();
      return;
    }

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    // Find the last row index.
    let lastRowIndex = range.s.r;
    let lastColIndex = range.s.c;
    for (let row = range.e.r; row >= range.s.r; row--) {
      for (let col = range.e.c; col >= range.s.c; col--) {
        const cellAddress = { c: col, r: row };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = worksheet[cellRef];

        if (cell && cell.v !== undefined && cell.v !== "") {
          if (row > lastRowIndex) {
            lastRowIndex = row;
          }

          if (col > lastColIndex) {
            lastColIndex = col;
            break;
          }
        }
      }
    }

    const rangeToParse = {
      s: { r: range.s.r, c: range.s.c },
      e: { r: lastRowIndex, c: lastColIndex }
    };

    const jsonSchemaFromExcel = XLSX.utils.sheet_to_json(
      workbook.Sheets[schemaConformantDataName],
      {
        raw: false,
        header: 1,
        defval: "",
        range: rangeToParse
      }
    );
    const schemaConformantRowData = [];

    if (jsonSchemaFromExcel?.[0] && jsonSchemaFromExcel?.[0]?.length > 0) {
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

    setSchemaDataConformantHeader(jsonSchemaFromExcel[0]);
    setSchemaDataConformantRowData(schemaConformantRowData);
    return true;
  }, []);

  const handleDataSheetForwards = useCallback((dataValidatorPage = "AttributeMatchDataValidator") => {
    setFirstNavigationToDataset(true);
    const index = excelSheetNames.indexOf(excelSheetChoice);
    processExcelFile(ogWorkbook, index);
    setDatasetDropDisabled(true);
    if (!datasetIsParsed) {
      setDatasetIsParsed(true);
      setCurrentDataValidatorPage(dataValidatorPage);
    }
  }, [datasetIsParsed, excelSheetChoice, excelSheetNames, ogWorkbook, processExcelFile, setCurrentDataValidatorPage, setDatasetIsParsed]);

  useEffect(() => {
    if (datasetRawFile && datasetRawFile.length > 0 && !datasetIsParsed && datasetRawFile[0].path.includes(".csv")) {
      processDelimitedTextFile(datasetRawFile[0], ",");
    } else if (datasetRawFile && datasetRawFile.length > 0 && !datasetIsParsed && datasetRawFile[0].path.includes(".tsv")) {
      processDelimitedTextFile(datasetRawFile[0], "\t");
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
  }, [datasetRawFile]);

  return {
    datasetRawFile,
    setDatasetRawFile,
    datasetLoading,
    datasetLoadingState,
    datasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage,
    handleClearDataset,
    excelSheetNames,
    excelSheetChoice,
    setExcelSheetChoice,
    handleDataSheetForwards,
    firstNavigationToDataset,
    setDatasetLoading
  };
}
