import { useContext, useMemo, useState } from "react";
import { OcaPackage } from "oca_package";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { languageCodesObject } from "../constants/isoCodes";
import {
  ADC,
  CUSTOM_FORMAT_RULE,
  divisionCodes,
  groupCodes,
  ORDERING,
  UNIT_FRAMING,
  UNIT_FRAME_ID,
  UNIT_FRAME_LABEL,
  UNIT_FRAME_LOCATION,
  UNIT_FRAME_VERSION,
  SENSITIVE,
  FIELD_FORMAT_OVERLAY,
  FIELD_RANGE_OVERLAY,
  RANGE,
  ATTRIBUTE_FRAMING
} from "../constants/constants";
import {
  generateOCABundle,
  getDescriptiveFileName,
  getRangeOverlayInput,
  getTransformedEntryCodes,
  getUnitFramingInput,
  getAttributeFramingInput
} from "../constants/utils";
import useGenerateReadMeV2 from "../ViewSchema/useGenerateReadMeV2";

/**
 * Multi-Schema Export Hook
 * 
 * This hook handles exporting OCA packages with multi-schema support.
 * It can export individual schemas or the entire multi-schema package.
 */
const useMultiSchemaExport = () => {
  const {
    OCAPackage,
    languages,
    customIsos,
    divisionGroup
  } = useContext(Context);

  const { 
    currentSchemaId,
    getSchemaState,
    exportSchemaChanges
  } = useMultiSchema();

  const { jsonToTextFile } = useGenerateReadMeV2();
  const [error, setError] = useState("");

  // Clear error
  const clearError = () => setError("");

  // Export individual schema
  const exportIndividualSchema = async (schemaId) => {
    try {
      const schemaState = getSchemaState(schemaId);
      if (!schemaState) {
        throw new Error(`Schema ${schemaId} not found`);
      }

      // Create a single-schema OCA package
      const singleSchemaPackage = {
        bundle: {
          d: schemaId,
          capture_base: {
            attributes: schemaState.attributes.reduce((acc, attr) => {
              acc[attr.Attribute] = attr.Type;
              return acc;
            }, {})
          },
          overlays: schemaState.overlays || {}
        }
      };

      // Generate the OCA package
      const ocaPackage = new OcaPackage(singleSchemaPackage);
      const packageBuffer = await ocaPackage.toBuffer();

      // Create filename
      const fileName = getDescriptiveFileName(schemaState.metadata?.name || schemaId);

      // Download the file
      const blob = new Blob([packageBuffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      setError(`Error exporting schema ${schemaId}: ${err.message}`);
      return false;
    }
  };

  // Export entire multi-schema package
  const exportMultiSchemaPackage = async () => {
    try {
      if (!OCAPackage) {
        throw new Error("No OCA package available for export");
      }

      // Always export with all changes integrated
      const exportPackage = exportSchemaChanges(OCAPackage);

      // Generate the OCA package
      const ocaPackage = new OcaPackage(exportPackage);
      const packageBuffer = await ocaPackage.toBuffer();

      // Create filename
      const rootSchemaName = exportPackage.bundle?.d || "schema";
      const fileName = getDescriptiveFileName(rootSchemaName);

      // Download OCA_package.json
      const blob = new Blob([packageBuffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Generate README_OCA_schema.txt
      if (exportPackage.bundle?.overlays?.meta) {
        jsonToTextFile(exportPackage.bundle, exportPackage);
      }

      // Download OCA_bundle.json only on testing site
      const currentEnv = process.env.REACT_APP_ENV;
      if (currentEnv === "DEV" && exportPackage.bundle) {
        const bundleBlob = new Blob([JSON.stringify(exportPackage.bundle, null, 2)], {
          type: "application/json"
        });
        const bundleUrl = URL.createObjectURL(bundleBlob);
        const bundleLink = document.createElement("a");
        bundleLink.href = bundleUrl;
        bundleLink.download = getDescriptiveFileName(rootSchemaName, "OCA_bundle.json");
        document.body.appendChild(bundleLink);
        bundleLink.click();
        document.body.removeChild(bundleLink);
        URL.revokeObjectURL(bundleUrl);
      }

      return true;
    } catch (err) {
      setError(`Error exporting multi-schema package: ${err.message}`);
      return false;
    }
  };

  // Main export function
  const exportData = async () => {
    try {
      // If we're editing a specific schema, export that schema
      if (currentSchemaId) {
        return await exportIndividualSchema(currentSchemaId);
      } 
        // Otherwise export the entire multi-schema package
        return await exportMultiSchemaPackage();
      
    } catch (err) {
      setError(`Export failed: ${err.message}`);
      return false;
    }
  };

  return {
    exportData,
    exportIndividualSchema,
    exportMultiSchemaPackage,
    error,
    clearError,
    currentSchemaId
  };
};

export default useMultiSchemaExport;



