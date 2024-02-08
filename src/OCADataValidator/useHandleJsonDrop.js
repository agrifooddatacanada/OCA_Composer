import { useCallback, useContext, useEffect, useState } from "react";
import { messages } from "../constants/messages";
import { Context } from "../App";
import useZipParser from "../StartSchema/useZipParser";

export const useHandleJsonDrop = () => {
  const {
    setCurrentDataValidatorPage,
    setZipToReadme,
    jsonLoading,
    setJsonLoading,
    jsonDropDisabled,
    setJsonDropDisabled,
    jsonRawFile,
    setJsonRawFile,
    jsonIsParsed,
    setJsonIsParsed,
    setDatasetLoading,
    setDatasetDropDisabled,
    datasetRawFile,
    setMatchingRowData
  } = useContext(Context);
  const {
    processLanguages,
    processMetadata,
    processLabelsDescriptionRootUnitsEntries
  } = useZipParser();

  const [jsonDropMessage, setJsonDropMessage] = useState({ message: "", type: "" });

  const overallLoading = useCallback(() => {
    setJsonLoading(true);
    setDatasetLoading(true);
    setDatasetDropDisabled(true);
  }, [setDatasetDropDisabled, setDatasetLoading, setJsonLoading]);

  const handleClearJSON = useCallback(() => {
    setJsonIsParsed(false);
    setJsonDropDisabled(false);
    setJsonRawFile([]);
    setMatchingRowData([]);
  }, []);

  const handleJsonDrop = useCallback((acceptedFiles) => {
    try {
      setJsonLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const jsonFile = JSON.parse(e.target.result)?.['bundle'];
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
        let formatRules = undefined;
        let cardinalityData = undefined;

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

        if (jsonFile?.overlays?.conformance) {
          conformance = { ...jsonFile.overlays.conformance };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(conformance));
        }

        if (jsonFile?.overlays?.['character_encoding']) {
          characterEncoding = { ...jsonFile.overlays['character_encoding'] };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(characterEncoding));
        }

        if (jsonFile?.overlays?.entry_code) {
          entryCodeSummary = { ...jsonFile.overlays.entry_code };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(entryCodeSummary));
        }

        if (jsonFile?.overlays?.['format']) {
          formatRules = { ...jsonFile.overlays['format'] };

          // ONLY for README
          allJSONFiles.push(JSON.stringify(formatRules));
        }

        if (jsonFile?.overlays?.entry) {
          entryList.push(...jsonFile.overlays.entry);

          // ONLY for README
          const readmeEntry = jsonFile.overlays.entry.map((entry) => {
            return JSON.stringify(entry);
          });
          allJSONFiles.push(...readmeEntry);
        }

        if (!languageList || languageList.length === 0) {
          throw new Error('No language found in the JSON file');
        }
        processLanguages(languageList);
        processMetadata(metaList);
        processLabelsDescriptionRootUnitsEntries(labelList, informationList, loadRoot, loadUnits, entryCodeSummary, entryList, conformance, characterEncoding, languageList, formatRules, cardinalityData);
        setZipToReadme(allJSONFiles);
      };

      reader.readAsText(acceptedFiles[0]);

      reader.onloadend = () => {
        setTimeout(() => {
          setJsonDropDisabled(true);
          setJsonDropMessage({ message: "", type: "" });
          setJsonLoading(false);
          setDatasetLoading(false);
          if (datasetRawFile.length === 0) {
            setDatasetDropDisabled(false);
          }
          if (!jsonIsParsed) {
            setJsonIsParsed(true);
            setCurrentDataValidatorPage("SchemaViewDataValidator");
          }
        }, 900);
      };
    } catch (error) {
      setJsonDropMessage({ message: messages.uploadFail, type: "error" });
      setJsonLoading(false);
      setDatasetLoading(false);
      if (datasetRawFile.length === 0) {
        setDatasetDropDisabled(false);
      }
      setTimeout(() => {
        setJsonDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [datasetRawFile.length, jsonIsParsed]);

  useEffect(() => {
    if (jsonRawFile && jsonRawFile.length > 0 && jsonRawFile[0].path.includes(".json")) {
      handleJsonDrop(jsonRawFile);
    } else if (jsonRawFile && jsonRawFile.length > 0) {
      setJsonDropMessage({ message: messages.uploadFail, type: "error" });
      setJsonLoading(false);
      setDatasetLoading(false);
      if (datasetRawFile.length === 0) {
        setDatasetDropDisabled(false);
      }
      setTimeout(() => {
        setJsonDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [handleJsonDrop, jsonRawFile]);

  return {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    overallLoading,
    jsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage,
    setCurrentDataValidatorPage,
    handleClearJSON
  };
};
