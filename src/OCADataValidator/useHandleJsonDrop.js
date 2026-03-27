import { useCallback, useContext, useEffect, useState } from "react";
import yaml from "js-yaml";
import { messages } from "../constants/messages";
import { ADC, SENSITIVE } from "../constants/constants";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { replaceAttributeCharsInParsedJson } from "../utils/helpers";
import { mapLinkMLToOCABundle } from "../SchemaTranslator/mapLinkMLToOCABundle";
import { transformToPackage } from "../SchemaTranslator/linkMLToOCA";
import {
  getPackageBundleId,
  getPackageBundle,
  normalizeOcaPackageFormat
} from "../utils/packageUtils";
import { parseOcaZipArrayBuffer } from "../utils/ocaZipImport";
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
    firstTimeMatchingRef,
    targetResult,
    setTargetResult
  } = useContext(Context);
  const { clearAllSchemas, switchToSchema, initializeFromPkgUpload, setPkgUpload } = useMultiSchema();
  // useZipParser removed - data processing now handled by initializeFromPkgUpload -> OCAParser

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
          const rawParse = normalizeOcaPackageFormat(JSON.parse(jsonString));
          let jsonFile = null;
          let ocaPackageData = null;
          if (rawParse?.oca_bundle?.bundle) {
            ocaPackageData = rawParse;
            jsonFile = rawParse?.oca_bundle?.bundle;
            setPkgUpload(rawParse);
          } else if (rawParse?.schema?.[0]) {
            jsonFile = rawParse?.schema?.[0];
          } else {
            jsonFile = rawParse;
          }

          if (!jsonFile) {
            throw new Error("No JSON file found");
          }

          jsonFile = replaceAttributeCharsInParsedJson(jsonFile);

          // ALSO ensure multi-schema pkgUpload is populated so validator always uses package root
          try {
            let pkgToSet = null;
            if (ocaPackageData) {
              pkgToSet = ocaPackageData;
            } else if (jsonFile?.capture_base) {
              pkgToSet = { bundle: jsonFile };
            }

            if (pkgToSet) {
              setPkgUpload(pkgToSet);
              try {
                initializeFromPkgUpload(pkgToSet);
                const rootId = getPackageBundleId(pkgToSet);
                if (rootId) switchToSchema(rootId, pkgToSet);
              } catch (err) {
                // non-fatal; initialization failed but pkgUpload was set — downstream components
                // should handle missing initialization defensively.
                console.warn("useHandleJsonDrop: initializeFromPkgUpload failed", err);
              }
            }
          } catch (err) {
            console.error("useHandleJsonDrop: error setting pkgUpload", err);
          }

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
            const sensitiveOverlay =
              ocaPackageData?.extensions?.[ADC]?.[
                ocaPackageData?.oca_bundle?.bundle?.capture_base?.d
              ]?.overlays?.[SENSITIVE];

            const sensitiveAttributes = Array.isArray(
              sensitiveOverlay?.sensitive_attributes
            )
              ? sensitiveOverlay?.sensitive_attributes
              : Array.isArray(jsonFile?.capture_base?.flagged_attributes)
                ? jsonFile?.capture_base?.flagged_attributes
                : [];

            if (sensitiveAttributes?.length > 0) {
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

          // Data processing handled by initializeFromPkgUpload (called during upload)
          // which uses OCAParser to extract all schema data into MultiSchemaContext
          
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
        try {
          const { ocaPackage, allZipFiles, root, captureBase } =
            await parseOcaZipArrayBuffer(e.target.result);
          if (captureBase?.flagged_attributes?.length > 0) {
            setShowWarningCard(true);
          }
          setPkgUpload(ocaPackage);
          initializeFromPkgUpload(ocaPackage);
          switchToSchema(root, ocaPackage);
          setZipToReadme(allZipFiles);
        } catch (err) {
          console.warn("useHandleJsonDrop: failed to parse zip as OCA package", err);
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

  const handleYamlDrop = useCallback(
    (acceptedFiles) => {
      try {
        setJsonLoading(true);
        // Note: Do NOT call clearAllSchemas() here - it causes race conditions
        // initializeFromPkgUpload() will properly add the schemas to state
        
        const reader = new FileReader();

        reader.onload = async (e) => {
          setTargetResult(e);
          const textDecoder = new TextDecoder("utf-8");
          const yamlString = textDecoder.decode(e.target.result);

          try {
            // Parse YAML content
            const linkmlSchema = yaml.load(yamlString);

            // Convert LinkML to OCA bundle
            const bundle = mapLinkMLToOCABundle(linkmlSchema);

            // Create OCA package
            const pkg = transformToPackage(bundle);

            // Store OCA package in MultiSchema context and initialize editor state
            setPkgUpload(pkg);
            
            // Initialize schema states from the package (required for MultiSchemaContext)
            try {
              initializeFromPkgUpload(pkg);
            } catch (err) {
              console.warn("LinkML: initializeFromPkgUpload failed", err);
            }

            // Set editing schema to root schema
            const pkgBundle = getPackageBundle(pkg);
            const rootSchemaId = getPackageBundleId(pkg) || pkgBundle?.capture_base?.d || 'generated_schema';
            switchToSchema(rootSchemaId, pkg);

            // Extract the bundle for processing - exactly the same structure expected by JSON processing
            const jsonFile = pkg.oca_bundle.bundle;
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

            // load up metadata file in OCA bundle (same as handleJsonDrop)
            if (jsonFile?.overlays?.meta) {
              metaList.push(...jsonFile.overlays.meta);
              languageList.push(
                ...jsonFile.overlays.meta.map((meta) => meta.language.slice(0, 2))
              );

              // ONLY for README
              const readmeMeta = jsonFile.overlays.meta.map((meta) =>
                JSON.stringify(meta)
              );
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

            if (jsonFile.capture_base) {
              if (jsonFile.capture_base.flagged_attributes?.length > 0) {
                setShowWarningCard(true);
              }
              loadRoot = { ...jsonFile.capture_base };

              // ONLY for README
              allJSONFiles.push(JSON.stringify(loadRoot));
            }

            // Critical fix: For YAML processing, every overlay is in array format
            // The unit overlay is in jsonFile.overlays.unit as an array
            if (jsonFile?.overlays?.unit && Array.isArray(jsonFile.overlays.unit)) {
              [loadUnits] = jsonFile.overlays.unit;
              // ONLY for README
              allJSONFiles.push(JSON.stringify(loadUnits));
            }

            if (
              jsonFile?.overlays?.conformance &&
              Array.isArray(jsonFile.overlays.conformance)
            ) {
              [conformance] = jsonFile.overlays.conformance;
              // ONLY for README
              allJSONFiles.push(JSON.stringify(conformance));
            }

            if (
              jsonFile?.overlays?.character_encoding &&
              Array.isArray(jsonFile.overlays.character_encoding)
            ) {
              [characterEncoding] = jsonFile.overlays.character_encoding;
              // ONLY for README
              allJSONFiles.push(JSON.stringify(characterEncoding));
            }

            if (
              jsonFile?.overlays?.entry_code &&
              Array.isArray(jsonFile.overlays.entry_code)
            ) {
              [entryCodeSummary] = jsonFile.overlays.entry_code;
              // ONLY for README
              allJSONFiles.push(JSON.stringify(entryCodeSummary));
            }

            if (jsonFile?.overlays?.format && Array.isArray(jsonFile.overlays.format)) {
              [formatRules] = jsonFile.overlays.format;
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

            if (
              jsonFile?.overlays?.cardinality &&
              Array.isArray(jsonFile.overlays.cardinality)
            ) {
              [cardinalityData] = jsonFile.overlays.cardinality;
              // ONLY for README
              allJSONFiles.push(JSON.stringify(cardinalityData));
            }

            if (
              jsonFile?.overlays?.standard &&
              Array.isArray(jsonFile.overlays.standard)
            ) {
              [dataStandards] = jsonFile.overlays.standard;
              // ONLY for README
              allJSONFiles.push(JSON.stringify(dataStandards));
            }

            if (!languageList || languageList.length === 0) {
              languageList.push("en");
            }

            // Data processing handled by initializeFromPkgUpload -> OCAParser
            // which already extracts all metadata, labels, descriptions, etc.
            
            setZipToReadme(allJSONFiles);
          } catch (error) {
            throw new Error(`Invalid YAML file or conversion failed: ${error.message}`);
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
        setJsonDropMessage({
          message: `${messages.uploadFail}: ${error.message}`,
          type: "error"
        });
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
    [
      clearAllSchemas,
      datasetRawFile.length,
      initializeFromPkgUpload,
      jsonIsParsed,
      setCurrentDataValidatorPage,
      setDatasetDropDisabled,
      setDatasetLoading,
      setJsonDropDisabled,
      setJsonIsParsed,
      setJsonLoading,
      setPkgUpload,
      setShowWarningCard,
      setTargetResult,
      setZipToReadme,
      switchToSchema
    ]
  );

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
