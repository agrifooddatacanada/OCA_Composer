import { useCallback, useContext, useEffect, useState } from "react";
import JSZip from "jszip";
import { messages } from "../constants/messages";
import { Context } from "../App";
import useZipParser from "../StartSchema/useZipParser";
import {
  replaceAttributeCharsInJsonString,
  replaceAttributeCharsInParsedJson
} from "../constants/utils";
import yaml from "js-yaml";
import { validateForOCATranslation } from "../SchemaTranslator";
import { mapLinkMLToOCABundle } from "../SchemaTranslator";
import { transformToPackage } from "../SchemaTranslator";

const neededOverlays = ["format", "character_encoding", "conformance", "entry_code"];
// eslint-disable-next-line import/prefer-default-export
export const useHandleJsonDrop = (
  firstTimeDisplayWarning,
  setShowWarningCard = () => {}
) => {
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
    setMatchingRowData,
    setJsonParsedFile,
    firstTimeMatchingRef,
    targetResult,
    setTargetResult,
    setOCAPackage
  } = useContext(Context);
  const { processLanguages, processMetadata, processLabelsDescriptionRootUnitsEntries } =
    useZipParser();

  const [jsonDropMessage, setJsonDropMessage] = useState({
    message: "",
    type: ""
  });

  const overallLoading = useCallback(() => {
    setJsonLoading(true);
    setDatasetLoading(true);
  }, [setDatasetLoading, setJsonLoading]);

  const handleClearJSON = useCallback(() => {
    setJsonIsParsed(false);
    setJsonDropDisabled(false);
    setJsonRawFile([]);
    setMatchingRowData([]);
    firstTimeMatchingRef.current = true;
    firstTimeDisplayWarning.current = true;
    setShowWarningCard(false);
  }, []);

  const handleJsonDrop = useCallback(
    (acceptedFiles) => {
      try {
        setJsonLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
          setTargetResult(e);
          const textDecoder = new TextDecoder("utf-8");
          const jsonString = textDecoder.decode(e.target.result);
          const rawParse = JSON.parse(jsonString);
          let jsonFile = null;
          let ocaPackageData = null;
          // First check if the json file is an OCA package that has OCA bundle
          if (rawParse?.oca_bundle?.bundle) {
            ocaPackageData = rawParse;
            jsonFile = rawParse?.oca_bundle?.bundle;
            setOCAPackage(rawParse);
          } else if (rawParse?.bundle) {
            jsonFile = rawParse?.bundle;
          } else if (rawParse?.schema?.[0]) {
            jsonFile = rawParse?.schema?.[0];
          } else {
            jsonFile = rawParse;
          }

          if (!jsonFile) {
            throw new Error("No JSON file found");
          }

          jsonFile = replaceAttributeCharsInParsedJson(jsonFile);

          setJsonParsedFile(jsonFile);
          const languageList = [];
          const informationList = [];
          const labelList = [];
          const metaList = [];
          const entryList = [];
          const allJSONFiles = [];
          let loadRoot;
          let entryCodeSummary = {};
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

            // ONLY for README
            const readmeMeta = jsonFile.overlays.meta.map((meta) => JSON.stringify(meta));
            allJSONFiles.push(...readmeMeta);
          }

          if (jsonFile?.overlays?.information) {
            informationList.push(...jsonFile.overlays.information);

            // ONLY for README
            const readmeInformation = jsonFile.overlays.information.map((information) =>
              JSON.stringify(information)
            );
            allJSONFiles.push(...readmeInformation);
          }

          if (jsonFile?.overlays?.label) {
            labelList.push(...jsonFile.overlays.label);

            // ONLY for README
            const readmeLabel = jsonFile.overlays.label.map((label) =>
              JSON.stringify(label)
            );
            allJSONFiles.push(...readmeLabel);
          }

          if (jsonFile?.capture_base) {
            if (jsonFile?.capture_base?.flagged_attributes?.length > 0) {
              setShowWarningCard(true);
            }
            loadRoot = { ...jsonFile.capture_base };

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

          if (jsonFile?.overlays?.character_encoding) {
            characterEncoding = { ...jsonFile.overlays.character_encoding };

            // ONLY for README
            allJSONFiles.push(JSON.stringify(characterEncoding));
          }

          if (jsonFile?.overlays?.entry_code) {
            entryCodeSummary = { ...jsonFile.overlays.entry_code };

            // ONLY for README
            allJSONFiles.push(JSON.stringify(entryCodeSummary));
          }

          if (jsonFile?.overlays?.format) {
            formatRules = { ...jsonFile.overlays.format };

            // ONLY for README
            allJSONFiles.push(JSON.stringify(formatRules));
          }

          if (jsonFile?.overlays?.entry) {
            entryList.push(...jsonFile.overlays.entry);

            // ONLY for README
            const readmeEntry = jsonFile.overlays.entry.map((entry) =>
              JSON.stringify(entry)
            );
            allJSONFiles.push(...readmeEntry);
          }

          if (jsonFile?.overlays?.cardinality) {
            cardinalityData = { ...jsonFile.overlays.cardinality };

            // ONLY for README
            allJSONFiles.push(JSON.stringify(cardinalityData));
          }

          if (jsonFile?.overlays?.standard) {
            dataStandards = { ...jsonFile.overlays.standard };

            // ONLY for README
            allJSONFiles.push(JSON.stringify(dataStandards));
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
          setZipToReadme(allJSONFiles);
        };

        reader.readAsArrayBuffer(acceptedFiles[0]);

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
    },
    [datasetRawFile.length, jsonIsParsed]
  );

  const handleZipDrop = useCallback((acceptedFiles) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        setTargetResult(e);
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
        const bundleForValidator = { overlays: {} };

        // load up metadata file in OCA bundle
        const loadMetadataFile = await zip.files["meta.json"].async("text");
        const metadataJson = JSON.parse(loadMetadataFile);
        const { root } = metadataJson;
        allZipFiles.push(loadMetadataFile);

        // loop through all files in OCA bundle
        for (const [key, file] of Object.entries(metadataJson.files[root])) {
          // eslint-disable-next-line no-await-in-loop
          const content = await zip.files[`${file}.json`].async("text");
          // Sanitize attributes in JSON content; replace disallowed characters in attribute names
          const convertedContent = replaceAttributeCharsInJsonString(content);
          const parsedContent = JSON.parse(convertedContent);

          if (
            "type" in parsedContent &&
            neededOverlays.includes(parsedContent.type.split("/")[2])
          ) {
            bundleForValidator.overlays[parsedContent.type.split("/")[2]] = parsedContent;
          }

          if (key.includes("meta")) {
            metaList.push(parsedContent);
            languageList.push(key.substring(6, 8));
          }

          if (key.includes("information")) {
            informationList.push(parsedContent);
          } else if (key.includes("format")) {
            // Format word is inside Information word, so we need to check if it is a format or information
            formatRules = parsedContent;
          }

          if (key.includes("label")) {
            labelList.push(parsedContent);
          }

          if (key.includes("entry (")) {
            entryList.push(parsedContent);
          }

          if (key.includes("entry_code")) {
            entryCodeSummary = parsedContent;
          }

          if (key.includes("conformance")) {
            conformance = parsedContent;
          }

          if (key.includes("character_encoding")) {
            characterEncoding = parsedContent;
          }

          if (key.includes("unit")) {
            loadUnits = parsedContent;
          }

          if (key.includes("cardinality")) {
            cardinalityData = parsedContent;
          }

          if (key.includes("standard")) {
            dataStandards = parsedContent;
          }

          allZipFiles.push(convertedContent);
        }

        const loadRoot = await zip.files[`${metadataJson.root}.json`].async("text");
        const convertedLoadRoot = replaceAttributeCharsInJsonString(loadRoot);
        const parsedRoot = JSON.parse(convertedLoadRoot);
        if (parsedRoot?.flagged_attributes?.length > 0) {
          setShowWarningCard(true);
        }
        if ("type" in parsedRoot && parsedRoot.type.split("/")[1] === "capture_base") {
          bundleForValidator.capture_base = parsedRoot;
        }
        allZipFiles.push(convertedLoadRoot);

        setJsonParsedFile(bundleForValidator);
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
  }, []);

  const handleYamlDrop = useCallback((acceptedFiles) => {
    try {
      setJsonLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        setTargetResult(e);
        const textDecoder = new TextDecoder("utf-8");
        const yamlString = textDecoder.decode(e.target.result);
        
        try {
          // Parse YAML content
          const linkmlSchema = yaml.load(yamlString);
          
          // Validate the LinkML schema
          validateForOCATranslation(linkmlSchema);
          
          // Convert LinkML to OCA bundle
          const bundle = mapLinkMLToOCABundle(linkmlSchema);
          
          // Create OCA package
          const ocaPackage = transformToPackage(bundle);
          
          // Extract the bundle for processing - exactly the same structure expected by JSON processing
          const jsonFile = ocaPackage.oca_bundle.bundle;
          
          // Process the bundle the same way as JSON files
          setJsonParsedFile(jsonFile);
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
          let dataStandards = undefined;

          // load up metadata file in OCA bundle (same as handleJsonDrop)
          if (jsonFile?.overlays?.meta) {
            metaList.push(...jsonFile.overlays.meta);
            languageList.push(
              ...jsonFile.overlays.meta.map((meta) => meta.language.slice(0, 2))
            );

            // ONLY for README
            const readmeMeta = jsonFile.overlays.meta.map((meta) => {
              return JSON.stringify(meta);
            });
            allJSONFiles.push(...readmeMeta);
          }

          if (jsonFile?.overlays?.information) {
            informationList.push(...jsonFile.overlays.information);

            // ONLY for README
            const readmeInformation = jsonFile.overlays.information.map(
              (information) => {
                return JSON.stringify(information);
              }
            );
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

          if (jsonFile?.["capture_base"]) {
            if (
              jsonFile?.["capture_base"]?.["flagged_attributes"]?.length > 0
            ) {
              setShowWarningCard(true);
            }
            loadRoot = { ...jsonFile["capture_base"] };

            // ONLY for README
            allJSONFiles.push(JSON.stringify(loadRoot));
          }

          // Critical fix: For YAML processing, every overlay is in array format
          // The unit overlay is in jsonFile.overlays.unit as an array
          if (jsonFile?.overlays?.unit && Array.isArray(jsonFile.overlays.unit)) {
            loadUnits = jsonFile.overlays.unit[0];
            // ONLY for README
            allJSONFiles.push(JSON.stringify(loadUnits));
          }

          if (jsonFile?.overlays?.conformance && Array.isArray(jsonFile.overlays.conformance)) {
            conformance = jsonFile.overlays.conformance[0];
            // ONLY for README
            allJSONFiles.push(JSON.stringify(conformance));
          }

          if (jsonFile?.overlays?.["character_encoding"] && 
              Array.isArray(jsonFile.overlays["character_encoding"])) {
            characterEncoding = jsonFile.overlays["character_encoding"][0];
            // ONLY for README
            allJSONFiles.push(JSON.stringify(characterEncoding));
          }

          if (jsonFile?.overlays?.entry_code && Array.isArray(jsonFile.overlays.entry_code)) {
            entryCodeSummary = jsonFile.overlays.entry_code[0];
            // ONLY for README
            allJSONFiles.push(JSON.stringify(entryCodeSummary));
          }

          if (jsonFile?.overlays?.["format"] && Array.isArray(jsonFile.overlays["format"])) {
            formatRules = jsonFile.overlays["format"][0];
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

          if (jsonFile?.overlays?.["cardinality"] && 
              Array.isArray(jsonFile.overlays["cardinality"])) {
            cardinalityData = jsonFile.overlays["cardinality"][0];
            // ONLY for README
            allJSONFiles.push(JSON.stringify(cardinalityData));
          }

          if (jsonFile?.overlays?.standard && Array.isArray(jsonFile.overlays.standard)) {
            dataStandards = jsonFile.overlays.standard[0];
            // ONLY for README
            allJSONFiles.push(JSON.stringify(dataStandards));
          }

          if (!languageList || languageList.length === 0) {
            languageList.push("en");
          }

          // For debugging - log to console the values
          console.log("YAML processed:", {
            loadRoot,
            loadUnits,
            entryCodeSummary,
            dataStandards
          });

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
            dataStandards
          );
          setZipToReadme(allJSONFiles);
          
        } catch (error) {
          console.error("YAML processing error:", error);
          throw new Error("Invalid YAML file or conversion failed: " + error.message);
        }
      };

      reader.readAsArrayBuffer(acceptedFiles[0]);

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
      console.error("YAML drop error:", error);
      setJsonDropMessage({ message: messages.uploadFail + (error.message ? ": " + error.message : ""), type: "error" });
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
    } else if (
      jsonRawFile &&
      jsonRawFile.length > 0 &&
      jsonRawFile[0].path.includes(".zip")
    ) {
      handleZipDrop(jsonRawFile);
    } else if (
      jsonRawFile &&
      jsonRawFile.length > 0 &&
      (jsonRawFile[0].path.includes(".yaml") || jsonRawFile[0].path.includes(".yml"))
    ) {
      handleYamlDrop(jsonRawFile);
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
    handleClearJSON,
    targetResult,
    setJsonLoading
  };
};
