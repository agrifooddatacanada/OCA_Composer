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
    jsonRawFile
  } = useContext(Context);

  const [datasetDropMessage, setDatasetDropMessage] = useState({ message: "", type: "" });

  const datasetLoadingState = () => {
    setDatasetLoading(true);
    setJsonLoading(true);
    setJsonDropDisabled(true);
  };

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
          // if (!results.data[0] && !results.meta.fields) {
          //   setDatasetDropMessage({
          //     message: messages.noDataUploadFail,
          //     type: "error",
          //   });
          //   setDatasetLoading(false);
          //   setTimeout(() => {
          //     setDatasetDropMessage({ message: "", type: "" });
          //   }, [2500]);

          //   return;
          // }

          // const findLongest = (arr1, arr2) => {
          //   const result = arr1.length > arr2.length ? arr1 : arr2;
          //   return result;
          // };

          // let rowsArray;

          // //in some cases, results.data[0] is undefined, and headers are usually (but not always) present in results.meta.fields
          // if (results.data[0]) {
          //   rowsArray = findLongest(
          //     results.meta.fields,
          //     Object.keys(results.data[0])
          //   );
          // } else {
          //   rowsArray = results.meta.fields;
          // }

          // if (!results.data[0]) {
          //   let allBlank = true;
          //   rowsArray.forEach((value) => {
          //     if (
          //       !value.includes("header_empty_placeholder_") &&
          //       !value.includes("__parsed_extra")
          //     ) {
          //       allBlank = false;
          //     }
          //   });
          //   if (allBlank === true) {
          //     setDatasetDropMessage({
          //       message: messages.noDataUploadFail,
          //       type: "error",
          //     });
          //     setDatasetLoading(false);
          //     setTimeout(() => {
          //       setDatasetDropMessage({ message: "", type: "" });
          //     }, [2500]);

          //     return;
          //   }
          // }

          // ///create dataArray structure: [[attribute name, [table values]], [attribute name, [table values]], [attribute name, [table values]]]

          // const dataArray = [];
          // let blanks = false;
          // rowsArray.forEach((value, index) => {
          //   const noSpacesAttribute = removeSpacesFromString(value);
          //   const valuesArray = [];
          //   let emptyCounter = 0;
          //   results.data.forEach((val) => {
          //     valuesArray.push(val[value]);
          //     if (!val[value]) {
          //       emptyCounter++;
          //     }
          //   });

          //   const createBlankValue = () => {
          //     blanks = true;
          //     return "";
          //   };

          //   if (valuesArray.length > 0) {
          //     if (valuesArray.length !== emptyCounter) {
          //       if (
          //         !noSpacesAttribute.includes("header_empty_placeholder_")
          //       ) {
          //         let newValue;
          //         noSpacesAttribute.includes("__parsed_extra")
          //           ? (newValue = createBlankValue())
          //           : (newValue = noSpacesAttribute);

          //         dataArray.push([newValue, valuesArray]);
          //       } else {
          //         dataArray.push(["", valuesArray]);
          //         blanks = true;
          //       }
          //     } else {
          //       if (
          //         !noSpacesAttribute.includes("header_empty_placeholder_")
          //       ) {
          //         dataArray.push([noSpacesAttribute, valuesArray]);
          //       }
          //     }
          //   } else {
          //     if (!noSpacesAttribute.includes("header_empty_placeholder_")) {
          //       let newValue;
          //       noSpacesAttribute.includes("__parsed_extra")
          //         ? (newValue = createBlankValue())
          //         : (newValue = noSpacesAttribute);

          //       dataArray.push([newValue, []]);
          //     } else {
          //       dataArray.push(["", valuesArray]);
          //       blanks = true;
          //     }
          //   }
          // });

          // setDatasetRawFile(dataArray);
          setDatasetLoading(false);
          setDatasetDropDisabled(true);

          setDatasetDropMessage({
            message: messages.successfulUpload,
            type: "success",
          });

          // if (blanks) {
          //   setTimeout(() => {
          //     setDatasetDropMessage({
          //       message: messages.blankEntries,
          //       type: "info",
          //     });
          //   }, [500]);

          //   setTimeout(() => {
          //     setDatasetDropMessage({ message: "", type: "" });
          //   }, [3500]);
          // } else {
          //   setTimeout(() => {
          //     setDatasetDropMessage({ message: "", type: "" });
          //   }, [2500]);
          // }
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
    if (datasetRawFile && datasetRawFile.length > 0 && datasetRawFile[0].path.includes(".csv")) {
      processCSVFile(datasetRawFile[0]);
    } else if (datasetRawFile && datasetRawFile.length > 0) {
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
    setDatasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage,
    setDatasetIsParsed
  };
};
