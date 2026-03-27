import { useState } from "react";
import { OcaPackage } from "oca_package";
import { useMultiSchema } from "../schema/schemaContext";
import { getDescriptiveFileName } from "../utils/helpers";
import useGenerateTextReadmeFromJson from "../ViewSchema/useGenerateTextReadmeFromJson";
import { getPackageBundleId } from "../utils/packageUtils";

const useMultiSchemaExport = () => {
  const {
    ocaPackage,
    currentSchemaId,
    getSchema,
    getSchemaById,
    rebuildOcaPackageFromEditorState
  } = useMultiSchema();

  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const [error, setError] = useState("");

  const clearError = () => setError("");

  const exportIndividualSchema = async (schemaId) => {
    try {
      const schemaState = getSchemaById(schemaId);
      if (!schemaState) {
        throw new Error(`Schema ${schemaId} not found`);
      }

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

      const ocaPackageBinary = new OcaPackage(singleSchemaPackage);
      const packageBuffer = await ocaPackageBinary.toBuffer();

      const fileName = getDescriptiveFileName(schemaState.metadata?.name || schemaId);

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

  const exportMultiSchemaPackage = async () => {
    try {
      if (!ocaPackage) {
        throw new Error("No OCA package available for export");
      }

      const exportPackage = rebuildOcaPackageFromEditorState(ocaPackage);

      const ocaPackageBinary = new OcaPackage(exportPackage);
      const packageBuffer = await ocaPackageBinary.toBuffer();

      const rootSchemaName = getPackageBundleId(exportPackage) || "schema";
      const fileName = getDescriptiveFileName(rootSchemaName);

      const blob = new Blob([packageBuffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (exportPackage.bundle?.overlays?.meta) {
        const rootId = getPackageBundleId(exportPackage);
        const rootSchemaState =
          (rootId && getSchemaById(rootId)) || getSchema();
        const readmeMeta =
          rootSchemaState?.metadata?.localized ?? null;
        jsonToTextFile(exportPackage.bundle, exportPackage, readmeMeta);
      }

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

  const exportData = async () => {
    try {
      if (currentSchemaId) {
        return await exportIndividualSchema(currentSchemaId);
      }
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
