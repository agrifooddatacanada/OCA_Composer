import { useCallback, useContext, useEffect, useState } from "react";
import { Context } from "../App";
import useZipParser from "./useZipParser";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { removeSpacesFromString } from "../constants/removeSpaces";
import { messages } from "../constants/messages";
import Papa from "papaparse";

const useHandleAllDrop = () => {
  const {
    setFileData,
    fileData,
    setCurrentPage,
    attributesList,
    setAttributesList,
    setIsZip,
    setZipToReadme,
    rawFile,
    setRawFile,
  } = useContext(Context);
  const {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries
  } = useZipParser();

  const [loading, setLoading] = useState(false);
  const [dropDisabled, setDropDisabled] = useState(false);
  const [dropMessage, setDropMessage] = useState({ message: "", type: "" });
  const [switchToLastPage, setSwitchToLastPage] = useState(false);

  // current fileData structure: [[tableHeading, [tableValues]], [tableHeading, [tableValues]], [tableHeading, [tableValues]], ...etc]

  const processExcelFile = useCallback((workbook) => {
    const sheet_name_list = workbook.SheetNames[0];
    const jsonFromExcel = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list],
      {
        raw: false,
        dateNF: "MM-DD-YYYY",
        header: 1,
        defval: "",
      }
    );

    const rowsArray = jsonFromExcel[0];
    if (!rowsArray) {
      setDropMessage({
        message: messages.noDataUploadFail,
        type: "error",
      });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);

      return;
    }

    //format element: [[attribute name, [table values]], [attribute name, [table values]], [attribute name, [table values]]]
    const dataArray = [];
    let blanks = false;

    rowsArray.forEach((value, index) => {
      const valuesArray = [];
      const noSpacesValue = removeSpacesFromString(value);
      const allEmpty = (array) => {
        let result = true;
        array.forEach((item) => {
          if (item !== "") {
            result = false;
          }
        });
        return result;
      };
      jsonFromExcel.forEach((val, subIndex) => {
        if (subIndex > 0) {
          valuesArray.push(val[index]);
        }
      });
      if (valuesArray.length) {
        if (!value && !allEmpty(valuesArray)) {
          blanks = true;
          dataArray.push(["", valuesArray]);
        }
        if (value && allEmpty(valuesArray)) {
          dataArray.push([noSpacesValue, []]);
        }
        if (value && !allEmpty(valuesArray)) {
          dataArray.push([noSpacesValue, valuesArray]);
        }
      } else {
        dataArray.push([noSpacesValue, []]);
      }
    });

    setFileData(dataArray);
    setLoading(false);
    setDropDisabled(true);
    setDropMessage({
      message: messages.successfulUpload,
      type: "success",
    });

    if (blanks) {
      setTimeout(() => {
        setDropMessage({
          message: messages.blankEntries,
          type: "info",
        });
      }, [500]);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [3500]);
    } else {
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [setFileData]);


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
          if (!results.data[0] && !results.meta.fields) {
            setDropMessage({
              message: messages.noDataUploadFail,
              type: "error",
            });
            setLoading(false);
            setTimeout(() => {
              setDropMessage({ message: "", type: "" });
            }, [2500]);

            return;
          }

          const findLongest = (arr1, arr2) => {
            const result = arr1.length > arr2.length ? arr1 : arr2;
            return result;
          };

          let rowsArray;

          //in some cases, results.data[0] is undefined, and headers are usually (but not always) present in results.meta.fields
          if (results.data[0]) {
            rowsArray = findLongest(
              results.meta.fields,
              Object.keys(results.data[0])
            );
          } else {
            rowsArray = results.meta.fields;
          }

          if (!results.data[0]) {
            let allBlank = true;
            rowsArray.forEach((value) => {
              if (
                !value.includes("header_empty_placeholder_") &&
                !value.includes("__parsed_extra")
              ) {
                allBlank = false;
              }
            });
            if (allBlank === true) {
              setDropMessage({
                message: messages.noDataUploadFail,
                type: "error",
              });
              setLoading(false);
              setTimeout(() => {
                setDropMessage({ message: "", type: "" });
              }, [2500]);

              return;
            }
          }

          //create dataArray structure: [[attribute name, [table values]], [attribute name, [table values]], [attribute name, [table values]]]

          const dataArray = [];
          let blanks = false;
          rowsArray.forEach((value, index) => {
            const noSpacesAttribute = removeSpacesFromString(value);
            const valuesArray = [];
            let emptyCounter = 0;
            results.data.forEach((val) => {
              valuesArray.push(val[value]);
              if (!val[value]) {
                emptyCounter++;
              }
            });

            const createBlankValue = () => {
              blanks = true;
              return "";
            };

            if (valuesArray.length > 0) {
              if (valuesArray.length !== emptyCounter) {
                if (
                  !noSpacesAttribute.includes("header_empty_placeholder_")
                ) {
                  let newValue;
                  noSpacesAttribute.includes("__parsed_extra")
                    ? (newValue = createBlankValue())
                    : (newValue = noSpacesAttribute);

                  dataArray.push([newValue, valuesArray]);
                } else {
                  dataArray.push(["", valuesArray]);
                  blanks = true;
                }
              } else {
                if (
                  !noSpacesAttribute.includes("header_empty_placeholder_")
                ) {
                  dataArray.push([noSpacesAttribute, valuesArray]);
                }
              }
            } else {
              if (!noSpacesAttribute.includes("header_empty_placeholder_")) {
                let newValue;
                noSpacesAttribute.includes("__parsed_extra")
                  ? (newValue = createBlankValue())
                  : (newValue = noSpacesAttribute);

                dataArray.push([newValue, []]);
              } else {
                dataArray.push(["", valuesArray]);
                blanks = true;
              }
            }
          });

          setFileData(dataArray);
          setLoading(false);
          setDropDisabled(true);

          setDropMessage({
            message: messages.successfulUpload,
            type: "success",
          });

          if (blanks) {
            setTimeout(() => {
              setDropMessage({
                message: messages.blankEntries,
                type: "info",
              });
            }, [500]);

            setTimeout(() => {
              setDropMessage({ message: "", type: "" });
            }, [3500]);
          } else {
            setTimeout(() => {
              setDropMessage({ message: "", type: "" });
            }, [2500]);
          }
        },
      });
    } catch {
      setDropMessage({ message: messages.parseUploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [setFileData]);


  const handleExcelDrop = useCallback((acceptedFiles) => {
    try {
      acceptedFiles.forEach((file) => {
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
        };
        if (rABS) reader.readAsBinaryString(file);
        else reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [processExcelFile]);


  const handleZipDrop = useCallback((acceptedFiles) => {
    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const zip = await JSZip.loadAsync(e.target.result);
        const languageList = [];
        const informationList = [];
        const labelList = [];
        const metaList = [];
        const entryList = [];
        const allJSONFiles = [];
        let entryCodeSummary = {};
        let conformance = undefined;
        let characterEncoding = undefined;
        let loadUnits = undefined;

        // load up metadata file in OCA bundle
        const loadMetadataFile = await zip.files["meta.json"].async("text");
        const metadataJson = JSON.parse(loadMetadataFile);
        const root = metadataJson.root;
        allJSONFiles.push(loadMetadataFile);

        // loop through all files in OCA bundle
        for (const [key, file] of Object.entries(metadataJson.files[root])) {
          const content = await zip.files[file + '.json'].async("text");

          if (key.includes("meta")) {
            metaList.push(JSON.parse(content));
            languageList.push(key.substring(6, 8));
          }

          if (key.includes("information")) {
            informationList.push(JSON.parse(content));
          }

          if (key.includes("label")) {
            labelList.push(JSON.parse(content));
          }

          if (key.includes("entry (")) {
            entryList.push(JSON.parse(content));
          }

          if (key.includes("entry_code")) {
            entryCodeSummary = JSON.parse(content);
          }

          if (key.includes("conformance")) {
            conformance = JSON.parse(content);
          }

          if (key.includes("character_encoding")) {
            characterEncoding = JSON.parse(content);
          }

          if (key.includes("unit")) {
            loadUnits = JSON.parse(content);
          }

          allJSONFiles.push(content);
        }

        const loadRoot = await zip.files[metadataJson.root + '.json'].async("text");
        allJSONFiles.push(loadRoot);

        processLanguages(languageList);
        processMetadata(metaList);
        processLabelsDescriptionRootUnitsEntries(labelList, informationList, JSON.parse(loadRoot), loadUnits, entryCodeSummary, entryList, conformance, characterEncoding, languageList);
        setZipToReadme(allJSONFiles);
      };

      reader.readAsArrayBuffer(acceptedFiles[0]);

      setTimeout(() => {
        setDropDisabled(true);
        setDropMessage({ message: "", type: "" });
        setLoading(false);
        setSwitchToLastPage(true);
      }, 900);
    } catch (error) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, []);

  const handleJsonDrop = useCallback((acceptedFiles) => {
    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const jsonFile = JSON.parse(e.target.result);
        console.log('jsonFile', jsonFile);
        const languageList = [];
        const informationList = [];
        const labelList = [];
        const metaList = [];
        const entryList = [];
        const allJSONFiles = [];
        let loadRoot = undefined;
        let entryCodeSummary = {};
        let conformance = undefined;
        let characterEncoding = undefined;
        let loadUnits = undefined;

        // load up metadata file in OCA bundle
        if (jsonFile?.overlays?.meta) {
          metaList.push(...jsonFile.overlays.meta);
          languageList.push(...jsonFile.overlays.meta.map((meta) => meta.language.slice(0, 2)));

          // ONLY for README
          const readmeMeta = jsonFile.overlays.meta.map((meta) => {
            return JSON.stringify(meta);
          });
          allJSONFiles.push(...readmeMeta);
        }

        if (jsonFile?.overlays?.information) {
          informationList.push(...jsonFile.overlays.information);

          // ONLY for README
          const readmeInformation = jsonFile.overlays.information.map((information) => {
            return JSON.stringify(information);
          });
          allJSONFiles.push(...readmeInformation);
        }

        if (jsonFile?.overlays?.label) {
          labelList.push(...jsonFile.overlays.label);

          // ONLY for README
          const readmeLabel = jsonFile.overlays.label.map((label) => {
            return JSON.stringify(label);
          });
          allJSONFiles.push(...readmeLabel);
        }

        if (jsonFile?.['capture_base']) {
          loadRoot = { ...jsonFile['capture_base'] };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(loadRoot));
        }

        if (jsonFile?.overlays?.unit) {
          loadUnits = { ...jsonFile.overlays.unit };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(loadUnits));
        }

        if (jsonFile?.overlays?.characterEncoding) {
          characterEncoding = { ...jsonFile.overlays.characterEncoding };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(characterEncoding));
        }

        if (jsonFile?.overlays?.entry_code) {
          entryCodeSummary = { ...jsonFile.overlays.entry_code };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(entryCodeSummary));
        }

        if (jsonFile?.overlays?.entry) {
          entryList.push(...jsonFile.overlays.entry);

          // ONLY for README
          const readmeEntry = jsonFile.overlays.entry.map((entry) => {
            return JSON.stringify(entry);
          });
          allJSONFiles.push(...readmeEntry);
        }

        processLanguages(languageList);
        processMetadata(metaList);
        processLabelsDescriptionRootUnitsEntries(labelList, informationList, loadRoot, loadUnits, entryCodeSummary, entryList, conformance, characterEncoding, languageList);
        setZipToReadme(allJSONFiles);
      };

      reader.readAsText(acceptedFiles[0]);

      setTimeout(() => {
        setDropDisabled(true);
        setDropMessage({ message: "", type: "" });
        setLoading(false);
        setSwitchToLastPage(true);
      }, 900);
    } catch (error) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, []);

  useEffect(() => {
    if (rawFile.length > 0 && rawFile[0].size > 1000000) {
      setDropMessage({
        message: messages.fileSizeLimit,
        type: "error",
      });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    } else if (rawFile.length > 0 && rawFile[0].path.includes(".csv")) {
      processCSVFile(rawFile[0]);
    } else if (rawFile.length > 0 && rawFile[0].path.includes(".xls")) {
      handleExcelDrop(rawFile);
    } else if (rawFile.length > 0 && rawFile[0].path.includes(".zip")) {
      setIsZip(true);
      handleZipDrop(rawFile);
    } else if (rawFile.length > 0 && rawFile[0].path.includes(".json")) {
      setIsZip(true);
      handleJsonDrop(rawFile);
    } else if (rawFile.length > 0) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [rawFile, handleExcelDrop, handleZipDrop, processCSVFile, setFileData]);


  useEffect(() => {
    if (fileData.length > 0 || attributesList.length > 0) {
      setDropDisabled(true);
    }
  }, [fileData]);


  //this setTimeout times the upload and will abort the process if it takes longer than 1 minute. If this happens, there is likely an uncaught issue somewhere in the parsing process
  const [timeoutId, setTimeoutId] = useState(null);
  useEffect(() => {
    if (loading) {
      const id = setTimeout(() => {
        setDropMessage({
          message: messages.tooLongUploadFail,
          type: "error",
        });
        setLoading(false);
        setDropDisabled(false);
        setFileData([]);
        setTimeout(() => {
          setDropMessage({ message: "", type: "" });
        }, [2500]);
      }, 60000);
      setTimeoutId(id);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  }, [loading]);

  return {
    setAttributesList,
    rawFile,
    setRawFile,
    attributesList,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setDropDisabled,
    setFileData,
    setCurrentPage,
    switchToLastPage,
    setIsZip
  };
};

export default useHandleAllDrop;