import { useContext, useEffect, useState } from 'react';
import { Context } from '../App';
import { messages } from '../constants/messages';
import { CAPTURE_BASE, CARDINALITY, CHARACTER_ENCODING, CONFORMANCE, ENTRY, ENTRY_CODE, FORMAT, INFORMATION, LABEL, META, OVERLAYS_WORD, UNIT, overlays } from '../constants/constants';
import JSZip from 'jszip';

const useHandleOCAFileUpload = () => {
  const { setCurrentOCAMergePage, OCAFile1Raw, setOCAFile1Raw, OCAFile2Raw, setOCAFile2Raw, parsedOCAFile1, setParsedOCAFile1, parsedOCAFile2, setParsedOCAFile2, setSelectedOverlaysOCAFile1, setSelectedOverlaysOCAFile2 } = useContext(Context);
  const [OCAFile1Loading, setOCAFile1Loading] = useState(false);
  const [OCAFile2Loading, setOCAFile2Loading] = useState(false);
  const [ocaFile1DropDisabled, setOcaFile1DropDisabled] = useState(false);
  const [ocaFile1DropMessage, setOcaFile1DropMessage] = useState("");
  const [ocaFile2DropDisabled, setOcaFile2DropDisabled] = useState(false);
  const [ocaFile2DropMessage, setOcaFile2DropMessage] = useState("");
  console.log('ParsedOCAFile1', parsedOCAFile1);

  const handleClearOCAFile1 = () => {
    setOcaFile1DropDisabled(false);
    setOCAFile1Raw([]);
    setParsedOCAFile1("");
  };

  const handleClearOCAFile2 = () => {
    setOcaFile2DropDisabled(false);
    setOCAFile2Raw([]);
    setParsedOCAFile2("");
  };

  // const processOcaFile = (splittedText) => {
  //   const result = {};
  //   splittedText.forEach((line) => {
  //     if (line !== "") {
  //       const match = line.match(/ADD\s(.*?)\sATTRS/);
  //       if (match && match[1] && !(match[1] in result)) {
  //         // result.push(match[1]);
  //         result[match[1]] = [line];
  //       } else if (match && match[1] && match[1] in result) {
  //         result[match[1]].push(line);
  //       }

  //       const matchProps = line.match(/ADD\s(.*?)\sPROPS/);
  //       if (matchProps && matchProps[1] && !(matchProps[1] in result)) {
  //         // result.push(matchProps[1]);
  //         result[matchProps[1]] = [line];
  //       } else if (matchProps && matchProps[1] && matchProps[1] in result) {
  //         result[matchProps[1]].push(line);
  //       }

  //       const matchAttribute = line.match(/ADD\sATTRIBUTE/);
  //       if (matchAttribute && !("ATTRIBUTE" in result)) {
  //         // result.push("ATTRIBUTE");
  //         result["ATTRIBUTE"] = [line];
  //       } else if (matchAttribute && "ATTRIBUTE" in result) {
  //         result["ATTRIBUTE"].push(line);
  //       }
  //     }
  //   });

  //   return result;
  // };

  // const processTextFile = (file, fileNumber) => {
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     const text = reader.result;
  //     if (fileNumber === 1) {
  //       setParsedOCAFile1(text);
  //       const processedData = processOcaFile(text.split("\n"));
  //       setSelectedOverlaysOCAFile1(processedData);
  //       setOCAFile1Loading(false);
  //       setOcaFile1DropDisabled(true);
  //       setOcaFile1DropMessage({
  //         message: messages.successfulUpload,
  //         type: "success",
  //       });

  //       setTimeout(() => {
  //         setOcaFile1DropDisabled(true);
  //         setOcaFile1DropMessage({ message: "", type: "" });
  //         setOCAFile2Loading(false);
  //         if (OCAFile2Raw.length === 0) {
  //           setOcaFile2DropDisabled(false);
  //         }
  //       }, 900);
  //     } else {
  //       const processedData = processOcaFile(text.split("\n"));
  //       setSelectedOverlaysOCAFile2(processedData);

  //       setParsedOCAFile2(text);
  //       setOCAFile2Loading(false);
  //       setOcaFile2DropDisabled(true);

  //       setOcaFile2DropMessage({
  //         message: messages.successfulUpload,
  //         type: "success",
  //       });

  //       setTimeout(() => {
  //         setOcaFile2DropMessage({ message: "", type: "" });
  //         setOCAFile1Loading(false);
  //         if (OCAFile1Raw.length === 0) {
  //           setOcaFile1DropDisabled(false);
  //         }
  //       }, 900);
  //     }
  //   };
  //   reader.readAsText(file);
  // };

  const processJsonFile = (file, fileNumber) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const jsonFile = JSON.parse(e.target.result);
        if (jsonFile?.['bundle']) {
          handleBundleJSONDrop(jsonFile?.['bundle'], fileNumber);
        } else if (jsonFile?.['schema']?.[0]) {
          handleBundleJSONDrop(jsonFile?.['schema']?.[0], fileNumber);
        } else {
          handleBundleJSONDrop(jsonFile, fileNumber);
        }
      };

      reader.readAsText(file);

    } catch (error) {
      if (fileNumber === 1) {
        setOcaFile1DropDisabled({ message: messages.uploadFail, type: "error" });
        setOCAFile1Loading(false);
        setTimeout(() => {
          setOcaFile1DropMessage({ message: "", type: "" });
        }, [2500]);
      } else {
        setOcaFile2DropDisabled({ message: messages.uploadFail, type: "error" });
        setOCAFile2Loading(false);
        setTimeout(() => {
          setOcaFile2DropMessage({ message: "", type: "" });
        }, [2500]);
      }
    }
  };

  const processSelectedOverlays = (jsonFile) => {
    const selectedValue = {};
    console.log(jsonFile, 'jsonFile');
    if (CAPTURE_BASE in jsonFile) {
      selectedValue[CAPTURE_BASE] = jsonFile[CAPTURE_BASE];
    }

    const jsonOverlays = jsonFile['overlays'];
    for (const overlay of overlays) {
      if (overlay in jsonOverlays) {
        if (Array.isArray(jsonOverlays[overlay])) {
          for (const item of jsonOverlays[overlay]) {
            selectedValue[overlay + ' - ' + item?.language] = { ...item };
          }
        } else {
          selectedValue[overlay] = jsonOverlays[overlay];
        }
      }
    }

    return selectedValue;
  };

  const handleBundleJSONDrop = (jsonFile, fileNumber) => {
    const selectedValue = processSelectedOverlays(jsonFile);

    if (fileNumber === 1) {
      setParsedOCAFile1(jsonFile);
      setSelectedOverlaysOCAFile1(selectedValue);
      setOCAFile1Loading(false);
      setOcaFile1DropDisabled(true);
      setOcaFile1DropMessage({
        message: messages.successfulUpload,
        type: "success",
      });

      setTimeout(() => {
        setOcaFile1DropDisabled(true);
        setOcaFile1DropMessage({ message: "", type: "" });
        setOCAFile2Loading(false);
        if (OCAFile2Raw.length === 0) {
          setOcaFile2DropDisabled(false);
        }
      }, 900);
    } else {
      setParsedOCAFile2(jsonFile);
      console.log('jsonFile', jsonFile);
      setSelectedOverlaysOCAFile2(selectedValue);
      console.log('selectedValue', selectedValue);
      setOCAFile2Loading(false);
      setOcaFile2DropDisabled(true);

      setOcaFile2DropMessage({
        message: messages.successfulUpload,
        type: "success",
      });

      setTimeout(() => {
        setOcaFile2DropMessage({ message: "", type: "" });
        setOCAFile1Loading(false);
        if (OCAFile1Raw.length === 0) {
          setOcaFile1DropDisabled(false);
        }
      }, 900);
    }
  };

  const processZipFile = async (zip, fileNumber) => {
    console.log('zip', zip);
    const languageList = [];
    const entryList = [];
    const allZipFiles = [];
    const selectedOverlay = {};
    const ogFile = {};
    const innerOverlays = {};

    const loadMetadataFile = await zip.files["meta.json"].async("text");
    const metadataJson = JSON.parse(loadMetadataFile);

    const root = metadataJson.root;
    const loadRoot = await zip.files[metadataJson.root + '.json'].async("text");
    selectedOverlay[CAPTURE_BASE] = JSON.parse(loadRoot);
    ogFile[CAPTURE_BASE] = JSON.parse(loadRoot);

    for (const [key, file] of Object.entries(metadataJson.files[root])) {
      const content = await zip.files[file + '.json'].async("text");
      const parsedData = JSON.parse(content);

      if (key.includes(META)) {
        const languageMatch = key.match(/\(([^)]+)\)/);
        let objectKey = META;
        if (languageMatch) {
          objectKey = META + " - " + languageMatch[1];
        }
        selectedOverlay[objectKey] = parsedData;
        innerOverlays[META] = (innerOverlays[META] || []).concat([parsedData]);
      }

      if (key.includes(INFORMATION)) {
        const languageMatch = key.match(/\(([^)]+)\)/);
        let objectKey = INFORMATION;
        if (languageMatch) {
          objectKey = INFORMATION + " - " + languageMatch[1];
        }
        selectedOverlay[objectKey] = parsedData;
        innerOverlays[INFORMATION] = (innerOverlays[INFORMATION] || []).concat([parsedData]);
      } else if (key.includes(FORMAT)) {
        selectedOverlay[FORMAT] = parsedData;
        innerOverlays[FORMAT] = parsedData;
      }


      if (key.includes(LABEL)) {
        const languageMatch = key.match(/\(([^)]+)\)/);
        let objectKey = LABEL;
        if (languageMatch) {
          objectKey = LABEL + " - " + languageMatch[1];
        }
        selectedOverlay[objectKey] = parsedData;
        innerOverlays[LABEL] = (innerOverlays[LABEL] || []).concat([parsedData]);
      }

      if (key.includes(ENTRY_CODE)) {
        selectedOverlay[ENTRY_CODE] = parsedData;
        innerOverlays[ENTRY_CODE] = parsedData;
      } else if (key.includes(ENTRY)) {
        const languageMatch = key.match(/\(([^)]+)\)/);
        let objectKey = ENTRY;
        if (languageMatch) {
          objectKey = ENTRY + " - " + languageMatch[1];
        }
        selectedOverlay[objectKey] = parsedData;
        innerOverlays[ENTRY] = (innerOverlays[ENTRY] || []).concat([parsedData]);
      }

      if (key.includes(CONFORMANCE)) {
        selectedOverlay[CONFORMANCE] = parsedData;
        innerOverlays[CONFORMANCE] = parsedData;
      }

      if (key.includes(CHARACTER_ENCODING)) {
        selectedOverlay[CHARACTER_ENCODING] = parsedData;
        innerOverlays[CHARACTER_ENCODING] = parsedData;
      }

      if (key.includes(UNIT)) {
        selectedOverlay[UNIT] = parsedData;
        innerOverlays[UNIT] = parsedData;
      }

      if (key.includes(CARDINALITY)) {
        console.log('cardinality', parsedData);
        innerOverlays[CARDINALITY] = parsedData;
      }
    }
    console.log('selectedOverlay in hereee', selectedOverlay);
    ogFile[OVERLAYS_WORD] = innerOverlays;
    console.log('ogFile in hereee', ogFile);

    if (fileNumber === 1) {
      setParsedOCAFile1(ogFile);
      setSelectedOverlaysOCAFile1(selectedOverlay);

      setOCAFile1Loading(false);
      setOcaFile1DropDisabled(true);
      setOcaFile1DropMessage({
        message: messages.successfulUpload,
        type: "success",
      });

      setTimeout(() => {
        setOcaFile1DropMessage({ message: "", type: "" });
        setOCAFile2Loading(false);
        if (OCAFile2Raw.length === 0) {
          setOcaFile2DropDisabled(false);
        }
      }, 900);
    } else {
      setParsedOCAFile2(ogFile);
      setSelectedOverlaysOCAFile2(selectedOverlay);

      setOCAFile2Loading(false);
      setOcaFile2DropDisabled(true);
      setOcaFile2DropMessage({
        message: messages.successfulUpload,
        type: "success",
      });

      setTimeout(() => {
        setOcaFile2DropMessage({ message: "", type: "" });
        setOCAFile1Loading(false);
        if (OCAFile1Raw.length === 0) {
          setOcaFile1DropDisabled(false);
        }
      }, 900);
    }
  };

  const processZipBundleFile = (file, fileNumber) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const zip = await JSZip.loadAsync(e.target.result);
        processZipFile(zip, fileNumber);
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      if (fileNumber === 1) {
        setOcaFile1DropDisabled(false);
        setOcaFile1DropMessage({ message: messages.uploadFail, type: "error" });
        setOCAFile1Loading(false);
        setTimeout(() => {
          setOcaFile1DropMessage({ message: "", type: "" });
        });
      } else {
        setOcaFile2DropDisabled(false);
        setOcaFile2DropMessage({ message: messages.uploadFail, type: "error" });
        setOCAFile2Loading(false);
        setTimeout(() => {
          setOcaFile2DropMessage({ message: "", type: "" });
        });

      }
    }
  };


  useEffect(() => {
    if (OCAFile1Raw && OCAFile1Raw.length > 0 && OCAFile1Raw[0].path.includes(".json") && parsedOCAFile1 === "") {
      processJsonFile(OCAFile1Raw[0], 1);
    } else if (OCAFile2Raw && OCAFile2Raw.length > 0 && OCAFile2Raw[0].path.includes(".json") && parsedOCAFile2 === "") {
      processJsonFile(OCAFile2Raw[0], 2);
    } else if (OCAFile1Raw && OCAFile1Raw.length > 0 && OCAFile1Raw[0].path.includes(".zip") && parsedOCAFile1 === "") {
      processZipBundleFile(OCAFile1Raw[0], 1);
    } else if (OCAFile2Raw && OCAFile2Raw.length > 0 && OCAFile2Raw[0].path.includes(".zip") && parsedOCAFile2 === "") {
      processZipBundleFile(OCAFile2Raw[0], 2);
    } else if (OCAFile2Raw && OCAFile2Raw.length > 0 && parsedOCAFile2 === "") {
      setOcaFile2DropMessage({ message: messages.uploadFail, type: "error" });
      setOCAFile2Loading(false);
      setOCAFile1Loading(false);
      if (OCAFile1Raw.length === 0) {
        setOcaFile1DropDisabled(false);
      }
      setTimeout(() => {
        setOcaFile2DropMessage({ message: "", type: "" });
      }, [2500]);
    } else if (OCAFile1Raw && OCAFile1Raw.length > 0 && parsedOCAFile1 === "") {
      setOcaFile1DropMessage({ message: messages.uploadFail, type: "error" });
      setOCAFile1Loading(false);
      setOCAFile2Loading(false);
      if (OCAFile2Raw.length === 0) {
        setOcaFile2DropDisabled(false);
      }
      setTimeout(() => {
        setOcaFile1DropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [OCAFile1Raw, OCAFile2Raw]);

  return {
    setCurrentOCAMergePage,
    setOCAFile1Raw,
    setOCAFile2Raw,
    OCAFile1Loading,
    setOCAFile1Loading,
    OCAFile2Loading,
    setOCAFile2Loading,
    ocaFile1DropDisabled,
    setOcaFile1DropMessage,
    ocaFile1DropMessage,
    ocaFile2DropDisabled,
    setOcaFile2DropMessage,
    ocaFile2DropMessage,
    OCAFile1Raw,
    OCAFile2Raw,
    handleClearOCAFile1,
    handleClearOCAFile2,
    parsedOCAFile1,
    parsedOCAFile2,
  };
};

export default useHandleOCAFileUpload;