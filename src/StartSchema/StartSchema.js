import React, { useState, useEffect, useContext, useCallback } from "react";
import { Button, Box, Typography } from "@mui/material";
import StartIntro from "./StartIntro";
import Drop from "./Drop";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Context } from "../App";
import { messages } from "../constants/messages";
import { removeSpacesFromString } from "../constants/removeSpaces";
import { CustomPalette } from "../constants/customPalette";
import JSZip from "jszip";
import useZipParser from "./useZipParser";

export default function StartSchema({ pageForward }) {
  const {
    setFileData,
    fileData,
    setCurrentPage,
    attributesList,
    setAttributesList,
    setIsZip,
    setZipToReadme
  } = useContext(Context);
  const {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries
  } = useZipParser();
  const [file, setFile] = useState([]);
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

          allJSONFiles.push(content);
        }

        const loadRoot = await zip.files[metadataJson.root + '.json'].async("text");
        allJSONFiles.push(loadRoot);

        // loadUnits does not need to add to allJSONFiles since it is already added when looping above
        const loadUnits = await zip.files[metadataJson.files[root].unit + '.json'].async("text");

        processLanguages(languageList);
        processMetadata(metaList);
        processLabelsDescriptionRootUnitsEntries(labelList, informationList, JSON.parse(loadRoot), JSON.parse(loadUnits), entryCodeSummary, entryList);
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

  useEffect(() => {
    if (switchToLastPage) {
      setCurrentPage('View');
    }
  }, [switchToLastPage]);

  useEffect(() => {
    if (file.length > 0 && file[0].size > 1000000) {
      setDropMessage({
        message: messages.fileSizeLimit,
        type: "error",
      });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    } else if (file.length > 0 && file[0].path.includes(".csv")) {
      processCSVFile(file[0]);
    } else if (file.length > 0 && file[0].path.includes(".xls")) {
      handleExcelDrop(file);
    } else if (file.length > 0 && file[0].path.includes(".zip")) {
      setIsZip(true);
      handleZipDrop(file);
    } else if (file.length > 0) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [file, handleExcelDrop, handleZipDrop, processCSVFile, setFileData]);


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

  return (
    <Box sx={{ mt: 5, mb: 3 }}>
      <Box width="80%" margin="auto">
        <Typography variant="h5">
          <Box sx={{ marginTop: 2 }}>
            Welcome to Agri-food Data Canada's schema writer for helping researchers write better, machine-actionable, context for their research data.
          </Box>
        </Typography>
      </Box>
      <Box
        display="flex"
        sx={{
          flexDirection: "column",
          alignItems: "center",
          width: 600,
          margin: "auto",
          marginBottom: 10,
        }}
      >
        <Box
          sx={{
            height: "3rem",
            alignSelf: "flex-end",
            transform: "translateY(2.5rem)",
          }}
        >
          {attributesList.length > 0 && (
            <Button
              variant="text"
              color="navButton"
              sx={{ fontSize: "1.2rem", color: CustomPalette.PRIMARY }}
              onClick={pageForward}
            >
              Next <ArrowForwardIosIcon />
            </Button>
          )}
        </Box>
        <Drop
          setFile={setFile}
          setLoading={setLoading}
          loading={loading}
          dropDisabled={dropDisabled}
          dropMessage={dropMessage}
          setDropMessage={setDropMessage}
        />
        {attributesList.length > 0 ? (
          <Box display="flex">
            <Button
              variant="contained"
              color="button"
              onClick={() => {
                setDropDisabled(false);
                setFileData([]);
                setAttributesList([]);
              }}
              sx={{ width: 170, mr: 2 }}
            >
              New File
            </Button>
            <Button
              variant="contained"
              color="button"
              sx={{ width: 170, ml: 2 }}
              onClick={() => setCurrentPage("Create")}
            >
              Edit
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="button"
            sx={{ width: 170 }}
            onClick={() => setCurrentPage("Create")}
          >
            Create Manually
          </Button>
        )}
      </Box>
      <StartIntro />
    </Box>
  );
}
