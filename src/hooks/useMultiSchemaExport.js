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
    activeSchemaId,
    getSchemaState,
    exportSchemaChanges,
    getModifiedSchemas
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

      // Get modified schemas
      const modifiedSchemas = getModifiedSchemas();
      
      let exportPackage;
      if (modifiedSchemas.length > 0) {
        // Export with modifications
        exportPackage = exportSchemaChanges(OCAPackage);
      } else {
        // Export original package
        exportPackage = OCAPackage;
      }

      // Generate the OCA package
      const ocaPackage = new OcaPackage(exportPackage);
      const packageBuffer = await ocaPackage.toBuffer();

      // Create filename
      const rootSchemaName = exportPackage.bundle?.d || "schema";
      const fileName = getDescriptiveFileName(rootSchemaName);

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

      // Also generate README
      if (exportPackage.bundle?.overlays?.meta) {
        jsonToTextFile(exportPackage, exportPackage);
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
      if (activeSchemaId) {
        return await exportIndividualSchema(activeSchemaId);
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
    activeSchemaId,
    modifiedSchemas: getModifiedSchemas()
  };
};

export default useMultiSchemaExport;



