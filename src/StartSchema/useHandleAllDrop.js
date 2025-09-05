import { useCallback, useContext, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import Papa from "papaparse";
import { Context } from "../App";
import useZipParser from "./useZipParser";
import { removeSpacesFromString } from "../constants/removeSpaces";
import { messages } from "../constants/messages";
import {
  replaceAttributeCharsInJsonString,
  replaceAttributeCharsInParsedJson
  // getUnitsFramedThatAlreadyExistInOcaPackage
} from "../constants/utils";
import { useMultiSchema } from "../context/MultiSchemaContext";

const useHandleAllDrop = (pageForward) => {
  const {
    setFileData,
    fileData,
    setCurrentPage,
    attributesList,
    setAttributesList,
    setIsZip,
    setZipToReadme,
    setJsonToReadme,
    rawFile,
    setRawFile,
    excelSheetChoice,
    setExcelSheetChoice,
    setOCAPackage
  } = useContext(Context);
  const { clearAllSchemas, switchToSchema, initializeFromOCAPackage } = useMultiSchema();
  const { processLanguages, processMetadata, processLabelsDescriptionRootUnitsEntries } =
    useZipParser();

  const [loading, setLoading] = useState(false);
  const [dropDisabled, setDropDisabled] = useState(false);
  const [dropMessage, setDropMessage] = useState({ message: "", type: "" });
  const [switchToLastPage, setSwitchToLastPage] = useState(false);
  const [excelSheetNames, setExcelSheetNames] = useState([]);
  const [tempExcel, setTempExcel] = useState(null);

  // current fileData structure: [[tableHeading, [tableValues]], [tableHeading, [tableValues]], [tableHeading, [tableValues]], ...etc]
  const processExcelFile = useCallback(
    (workbook, index = 0) => {
      const sheet_name_list = workbook.SheetNames[index];
      const jsonFromExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list], {
        raw: false,
        dateNF: "MM-DD-YYYY",
        header: 1,
        defval: ""
      });

      const rowsArray = jsonFromExcel[0];
      if (!rowsArray) {
        setDropMessage({
          message: messages.noDataUploadFail,
          type: "error"
        });
        setLoading(false);
        setTimeout(() => {
          setDropMessage({ message: "", type: "" });
        }, [2500]);

        return;
      }

      // format element: [[attribute name, [table values]], [attribute name, [table values]], [attribute name, [table values]]]
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
        type: "success"
      });

      if (blanks) {
        setTimeout(() => {
          setDropMessage({
            message: messages.blankEntries,
            type: "info"
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
    [setFileData]
  );

  const processCSVFile = useCallback(
    (file) => {
      try {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: "greedy",
          transformHeader: (header, index) => {
            if (header !== "") {
              return header;
            }
            // without this, papaparse will save blank headers as "", "_1", "_2", etc.
            return `header_empty_placeholder_${index}`;
          },
          complete: (results) => {
            if (!results.data[0] && !results.meta.fields) {
              setDropMessage({
                message: messages.noDataUploadFail,
                type: "error"
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

            // in some cases, results.data[0] is undefined, and headers are usually (but not always) present in results.meta.fields
            if (results.data[0]) {
              rowsArray = findLongest(results.meta.fields, Object.keys(results.data[0]));
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
                  type: "error"
                });
                setLoading(false);
                setTimeout(() => {
                  setDropMessage({ message: "", type: "" });
                }, [2500]);

                return;
              }
            }

            // create dataArray structure: [[attribute name, [table values]], [attribute name, [table values]], [attribute name, [table values]]]

            const dataArray = [];
            let blanks = false;
            rowsArray.forEach((value) => {
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
                  if (!noSpacesAttribute.includes("header_empty_placeholder_")) {
                    let newValue;
                    if (noSpacesAttribute.includes("__parsed_extra")) {
                      newValue = createBlankValue();
                    } else {
                      newValue = noSpacesAttribute;
                    }

                    dataArray.push([newValue, valuesArray]);
                  } else {
                    dataArray.push(["", valuesArray]);
                    blanks = true;
                  }
                } else if (!noSpacesAttribute.includes("header_empty_placeholder_")) {
                  dataArray.push([noSpacesAttribute, valuesArray]);
                }
              } else if (!noSpacesAttribute.includes("header_empty_placeholder_")) {
                let newValue;
                if (noSpacesAttribute.includes("__parsed_extra")) {
                  newValue = createBlankValue();
                } else {
                  newValue = noSpacesAttribute;
                }

                dataArray.push([newValue, []]);
              } else {
                dataArray.push(["", valuesArray]);
                blanks = true;
              }
            });

            setFileData(dataArray);
            setLoading(false);
            setDropDisabled(true);

            setDropMessage({
              message: messages.successfulUpload,
              type: "success"
            });

            if (blanks) {
              setTimeout(() => {
                setDropMessage({
                  message: messages.blankEntries,
                  type: "info"
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
          }
        });
      } catch {
        setDropMessage({ message: messages.parseUploadFail, type: "error" });
        setLoading(false);
        setTimeout(() => {
          setDropMessage({ message: "", type: "" });
        }, [2500]);
      }
    },
    [setFileData]
  );

  const handleExcelDrop = useCallback((acceptedFiles) => {
    try {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        const rABS = !!reader.readAsBinaryString; // converts object to boolean
            reader.onabort = () => {}; // console.log("file reading was aborted");
    reader.onerror = () => {}; // console.log("file reading has failed");
        reader.onload = (e) => {
          const bstr = e.target.result;
          const workbook = XLSX.read(bstr, {
            type: rABS ? "binary" : "array"
          });
          // processExcelFile(workbook);
          setTempExcel(workbook);
          setExcelSheetNames(workbook.SheetNames);
          setExcelSheetChoice(workbook.SheetNames[0]);
          setLoading(false);
          setTimeout(() => {
            setDropMessage({ message: "", type: "" });
          }, [2500]);
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
  }, []);

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
        const allZipFiles = [];
        let entryCodeSummary = {};
        let conformance;
        let characterEncoding;
        let loadUnits;
        let formatRules;
        let cardinalityData;
        let dataStandards;

        // load up metadata file in OCA bundle
        const loadMetadataFile = await zip.files["meta.json"].async("text");
        const metadataJson = JSON.parse(loadMetadataFile);
        const { root } = metadataJson;
        allZipFiles.push(loadMetadataFile);

        // loop through all files in OCA bundle
        for (const [key, file] of Object.entries(metadataJson.files[root])) {
          /* eslint-disable-next-line no-await-in-loop */
          const content = await zip.files[`${file}.json`].async("text");
          // Sanitize attributes in JSON content; replace disallowed characters in attribute names
          const convertedContent = replaceAttributeCharsInJsonString(content);
          const parsedData = JSON.parse(convertedContent);

          if (key.includes("meta")) {
            metaList.push(parsedData);
            languageList.push(key.substring(6, 8));
          }

          if (key.includes("information")) {
            informationList.push(parsedData);
          } else if (key.includes("format")) {
            // Format word is inside Information word, so we need to check if it is a format or information
            formatRules = parsedData;
          }

          if (key === "standard") {
            dataStandards = parsedData;
          }

          if (key.includes("label")) {
            labelList.push(parsedData);
          }

          if (key.includes("entry (")) {
            entryList.push(parsedData);
          }

          if (key.includes("entry_code")) {
            entryCodeSummary = parsedData;
          }

          if (key.includes("conformance")) {
            conformance = parsedData;
          }

          if (key.includes("character_encoding")) {
            characterEncoding = parsedData;
          }

          if (key.includes("unit")) {
            loadUnits = parsedData;
          }

          if (key.includes("cardinality")) {
            cardinalityData = parsedData;
          }

          allZipFiles.push(convertedContent);
        }

        const loadRoot = await zip.files[`${metadataJson.root}.json`].async("text");
        const convertedLoadRoot = replaceAttributeCharsInJsonString(loadRoot);
        allZipFiles.push(convertedLoadRoot);

        processLanguages(languageList);
        processMetadata(metaList);
        processLabelsDescriptionRootUnitsEntries(
          labelList,
          informationList,
          JSON.parse(convertedLoadRoot),
          loadUnits,
          entryCodeSummary,
          entryList,
          conformance,
          characterEncoding,
          languageList,
          formatRules,
          cardinalityData,
          dataStandards
        );
        setZipToReadme(allZipFiles);
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

  const handleBundleJSONDrop = useCallback(
    (jsonFile, ocaPackageData = null) => {
      const languageList = [];
      const informationList = [];
      const labelList = [];
      const metaList = [];
      const entryList = [];
      // const allJSONFiles = undefined;
      let loadRoot;
      let entryCodeSummary;
      let conformance;
      let characterEncoding;
      let loadUnits;
      let formatRules;
      let cardinalityData;
      let dataStandards;

      // load up metadata file in OCA bundle
      if (jsonFile?.overlays?.meta) {
        metaList.push(...jsonFile.overlays.meta);
        languageList.push(
          ...jsonFile.overlays.meta.map((meta) => meta.language.slice(0, 2))
        );
      }

      if (jsonFile?.overlays?.information) {
        informationList.push(...jsonFile.overlays.information);
      }

      if (jsonFile?.overlays?.label) {
        labelList.push(...jsonFile.overlays.label);
      }

      if (jsonFile?.capture_base) {
        loadRoot = { ...jsonFile.capture_base };
      }

      if (jsonFile?.overlays?.unit) {
        loadUnits = { ...jsonFile.overlays.unit };
      }

      if (jsonFile?.overlays?.conformance) {
        conformance = { ...jsonFile.overlays.conformance };
      }

      if (jsonFile?.overlays?.character_encoding) {
        characterEncoding = { ...jsonFile.overlays.character_encoding };
      }

      if (jsonFile?.overlays?.entry_code) {
        entryCodeSummary = { ...jsonFile.overlays.entry_code };
      }

      if (jsonFile?.overlays?.format) {
        formatRules = { ...jsonFile.overlays.format };
      }

      if (jsonFile?.overlays?.entry) {
        entryList.push(...jsonFile.overlays.entry);
      }

      if (jsonFile?.overlays?.cardinality) {
        cardinalityData = { ...jsonFile.overlays.cardinality };
      }

      if (jsonFile?.overlays?.standard) {
        dataStandards = { ...jsonFile.overlays.standard };
      }

      if (!languageList || languageList.length === 0) {
        throw new Error("No language found in the JSON file");
      }

      processLanguages(languageList);
      processMetadata(metaList);
      processLabelsDescriptionRootUnitsEntries(
        labelList,
        informationList,
        loadRoot,
        loadUnits,
        entryCodeSummary,
        entryList,
        conformance,
        characterEncoding,
        languageList,
        formatRules,
        cardinalityData,
        dataStandards,
        ocaPackageData
      );
      setJsonToReadme(jsonFile);
    },
    [
      processLabelsDescriptionRootUnitsEntries,
      processLanguages,
      processMetadata,
      setZipToReadme
    ]
  );

  const handleJsonDrop = useCallback((acceptedFiles) => {
    try {
      setLoading(true);
      // Clear multi-schema context when uploading a new file
      clearAllSchemas();

      const reader = new FileReader();

      reader.onload = async (e) => {
        const jsonFile = JSON.parse(e.target.result);
        // First check if the json file is an OCA package that has OCA bundle
        if (jsonFile?.oca_bundle?.bundle) {
          const modifiedBundle = replaceAttributeCharsInParsedJson(
            jsonFile.oca_bundle.bundle
          );
          // setUnitFramedThatAlreadyExistInOcaPackage(
          //   getUnitsFramedThatAlreadyExistInOcaPackage(jsonFile)
          // );
          setOCAPackage(jsonFile);
          
          // NEW: Initialize MultiSchemaContext with complete package data
          initializeFromOCAPackage(jsonFile);
          
          // Set editing schema to root schema
          switchToSchema(jsonFile.oca_bundle.bundle.d, jsonFile);
          handleBundleJSONDrop(modifiedBundle, jsonFile);
        } else if (jsonFile?.bundle) {
          const modifiedJsonFile = replaceAttributeCharsInParsedJson(jsonFile.bundle);
          // If dependencies exist, keep the full OCA package in context for visualization
          if (jsonFile?.dependencies && Array.isArray(jsonFile.dependencies)) {
            const sanitizedOcaPackage = { ...jsonFile, bundle: modifiedJsonFile };
            setOCAPackage(sanitizedOcaPackage);
            
            // NEW: Initialize MultiSchemaContext with complete package data
            initializeFromOCAPackage(sanitizedOcaPackage);
            
            // Set editing schema to root schema
            switchToSchema(jsonFile.bundle.d, sanitizedOcaPackage);
            handleBundleJSONDrop(modifiedJsonFile, sanitizedOcaPackage);
          } else {
            // Single schema package
            setOCAPackage(jsonFile);
            
            // NEW: Initialize MultiSchemaContext
            initializeFromOCAPackage(jsonFile);
            
            switchToSchema(jsonFile.bundle.d, jsonFile);
            handleBundleJSONDrop(modifiedJsonFile);
          }
        } else if (jsonFile?.schema?.[0]) {
          handleBundleJSONDrop(jsonFile?.schema?.[0]);
        } else {
          handleBundleJSONDrop(jsonFile);
        }
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

  const handlePageForward = useCallback(() => {
    if (rawFile[0].path.includes(".xls") || rawFile[0].path.includes(".xlsx")) {
      const index = excelSheetNames.indexOf(excelSheetChoice);
      processExcelFile(tempExcel, index);
    }
    pageForward();
  }, [excelSheetChoice, excelSheetNames, pageForward, processExcelFile, tempExcel]);

  useEffect(() => {
    if (rawFile.length > 0 && rawFile[0].size > 1000000) {
      setDropMessage({
        message: messages.fileSizeLimit,
        type: "error"
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

  // this setTimeout times the upload and will abort the process if it takes longer than 1 minute. If this happens, there is likely an uncaught issue somewhere in the parsing process
  const [timeoutId, setTimeoutId] = useState(null);
  useEffect(() => {
    if (loading) {
      const id = setTimeout(() => {
        setDropMessage({
          message: messages.tooLongUploadFail,
          type: "error"
        });
        setLoading(false);
        setDropDisabled(false);
        setFileData([]);
        setTimeout(() => {
          setDropMessage({ message: "", type: "" });
        }, [2500]);
      }, 60000);
      setTimeoutId(id);
    } else if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
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
    setIsZip,
    excelSheetNames,
    setExcelSheetChoice,
    setExcelSheetNames,
    excelSheetChoice,
    handlePageForward
  };
};

export default useHandleAllDrop;
