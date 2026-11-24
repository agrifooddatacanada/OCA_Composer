import { useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buildSchemaExport } from "@oca-composer/oca-core/src/export/schemaExport";
import {
  createResolveSaid as createSaidResolver,
  generateOcaPackageJson,
  rewriteBundleRefs,
  seedResolvedAliasTokensFromBundles as seedAliasTokens,
  setResolvedSaidForSchema as setResolvedSaid,
  throwUnresolvedReferenceError
} from "@oca-composer/oca-core/src/export/packageAssembly";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { clearDraft } from "./useSessionDraft";
import {
  getPackageBundle,
  getPackageDependencies,
  getPackageBundleId,
  getApiGeneratedBundle
} from "../utils/packageUtils";
import { ADC, overlayItems } from "../constants/constants";
import {
  generateOCABundle,
  getDescriptiveFileName,
  getFormInformationInput,
  downloadJsonFile
} from "../utils/helpers";
import useGenerateTextReadmeFromJson from "../ViewSchema/useGenerateTextReadmeFromJson";

const currentEnv = process.env.REACT_APP_ENV;

/**
 * Export OCA packages from editor state.
 *
 * Rules:
 * 1. UI state is the source of truth for export.
 * 2. refs:* tokens must resolve to materialized SAIDs; unresolved refs fail export.
 * 3. refn:* tokens are placeholders; unresolved placeholders are preserved.
 * 4. Imported and manual flows both rebuild via DSL/API and rewrite references before packaging.
 */
const useOCAExport = () => {
  const navigate = useNavigate();

  // Global settings (not schema-specific)
  const {
    customIsos,
    overlay,
    setSummaryExportMode,
    setOverlay,
    setSelectedOverlay,
    setCurrentPage
  } = useContext(Context);

  const {
    getCurrentSchemaId,
    getSchemaById,
    rebuildOcaPackageFromEditorState,
    schemaStates,
    clearAllSchemas,
    ocaPackage,
    setOcaPackage
  } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const [error, setError] = useState("");

  // Shared download utilities
  const downloadTextFile = (data, fileName) => {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deepCloneJson = (value) => JSON.parse(JSON.stringify(value));

  // Build OCA package from schema state using text DSL generation
  // Works for both single schemas and multi-schema packages
  const buildPackageFromTextDSL = (schemaId) =>
    buildSchemaExport(getSchemaById(schemaId), {
      schemaId,
      generateBundle: generateOCABundle,
      defaultOverlaySelections: overlay,
      customIsos,
      buildFormInformation: getFormInformationInput
    });

  const getSchemaMaterializationKey = (schemaId) => {
    const state = getSchemaById(schemaId);
    return state?.metadata?.localized?.eng?.name || state?.metadata?.name || schemaId;
  };

  const setResolvedSaidForSchema = (saidByReferenceToken, schemaId, said) =>
    setResolvedSaid(saidByReferenceToken, schemaId, said, getSchemaMaterializationKey);

  const createResolveSaid = (saidByReferenceToken) =>
    createSaidResolver(saidByReferenceToken, getSchemaMaterializationKey);

  const seedResolvedAliasTokensFromBundles = (schemaBundles, saidByReferenceToken) =>
    seedAliasTokens(schemaBundles, saidByReferenceToken, getSchemaMaterializationKey);

  const exportImportedPackage = async ({ download = true } = {}) => {
    const saidByReferenceToken = {};
    const originalRootId = getPackageBundleId(ocaPackage);

    const rootState = getSchemaById(originalRootId);
    if (!rootState || !rootState.initialized) {
      console.error("Root schema not initialized:", originalRootId);
      console.error("Available schemas:", Object.keys(schemaStates));
      throw new Error(
        `Root schema ${originalRootId} is not initialized. Please try reloading the schema.`
      );
    }

    const schemaIds = Object.keys(schemaStates).filter((id) => {
      const state = getSchemaById(id);
      return state?.initialized;
    });
    if (!schemaIds.includes(originalRootId)) {
      console.error("Root ID not in schemaStates:", originalRootId);
      console.error("Available:", schemaIds);
      throw new Error(`Root schema ID mismatch. Expected: ${originalRootId}`);
    }

    const pkgRebuilt = rebuildOcaPackageFromEditorState(ocaPackage);
    const pkgForExport = deepCloneJson(pkgRebuilt);
    const rootBundle = getPackageBundle(pkgForExport);
    const dependencies = getPackageDependencies(pkgForExport) || [];

    if (!rootBundle) {
      throw new Error("Could not find root schema in rebuilt package");
    }

    const adcMerged = {};
    const generatedBundleByOriginalId = {};

    const mergeExtensionsForBundle = async (schemaBundle) => {
      const bid = schemaBundle?.d;
      if (!bid) return;
      const st = getSchemaById(bid);
      if (!st?.initialized) return;
      const result = await buildPackageFromTextDSL(bid);

      const generatedBundle = getApiGeneratedBundle(result.bundle);
      if (generatedBundle?.d) {
        generatedBundleByOriginalId[bid] = generatedBundle;
        setResolvedSaidForSchema(saidByReferenceToken, bid, generatedBundle.d);
      }

      if (result?.extension?.extensions?.[ADC]) {
        Object.assign(adcMerged, result.extension.extensions[ADC]);
      }
    };

    for (const dep of dependencies) {
      // eslint-disable-next-line no-await-in-loop
      await mergeExtensionsForBundle(dep);
    }
    await mergeExtensionsForBundle(rootBundle);

    const mergedExtension = {
      extensions: {
        adc: adcMerged
      }
    };

    // UI-only aliasing: allow refn:<attribute_name> tokens to resolve via rebuilt graph.
    seedResolvedAliasTokensFromBundles(
      [rootBundle, ...dependencies],
      saidByReferenceToken
    );
    const resolveImportedSaid = createResolveSaid(saidByReferenceToken);

    const exportedRootBundle = generatedBundleByOriginalId[rootBundle.d] || rootBundle;
    const exportedDependencies = dependencies.map(
      (dep) => generatedBundleByOriginalId[dep.d] || dep
    );

    const unresolvedTokens = [];
    unresolvedTokens.push(
      ...rewriteBundleRefs({
        schemaBundle: exportedRootBundle,
        resolveSaid: resolveImportedSaid
      })
    );
    exportedDependencies.forEach((dep) => {
      unresolvedTokens.push(
        ...rewriteBundleRefs({
          schemaBundle: dep,
          resolveSaid: resolveImportedSaid
        })
      );
    });

    throwUnresolvedReferenceError(unresolvedTokens);

    const bundleWithDeps = {
      bundle: exportedRootBundle,
      dependencies: exportedDependencies
    };

    const exportPackage = generateOcaPackageJson(mergedExtension, bundleWithDeps);

    const rootBundleData = exportedRootBundle;
    const metaOverlays = rootBundleData?.overlays?.meta;
    const engMeta = Array.isArray(metaOverlays)
      ? metaOverlays.find((m) => m.language === "eng") || metaOverlays[0]
      : null;
    const schemaName = engMeta?.name || getPackageBundleId(rootBundleData) || "schema";

    if (download) {
      const packageFileName = `${schemaName.split(" ")[0]}_OCA_package.json`;
      downloadJsonFile(exportPackage, packageFileName);

      if (rootBundleData?.overlays?.meta) {
        await jsonToTextFile(rootBundleData, exportPackage);
      }

      if (currentEnv === "DEV" && rootBundleData) {
        const bundleFileName = `${schemaName.split(" ")[0]}_OCA_bundle.json`;
        downloadJsonFile(rootBundleData, bundleFileName);
      }
    }

    return exportPackage;
  };

  const exportManualPackage = async ({ download = true } = {}) => {
    const pkgFromState = rebuildOcaPackageFromEditorState(ocaPackage);
    const rootSchemaId = getPackageBundleId(pkgFromState) || currentSchemaId;

    const allSchemaIds = Object.keys(schemaStates);
    const childSchemaIds = allSchemaIds.filter((id) => id !== rootSchemaId);

    const childBuilds = [];
    for (const childId of childSchemaIds) {
      const childState = schemaStates[childId];
      if (childState?.attributes && childState.attributes.length > 0) {
        const { bundle: childApiBundle, extension: childExtension } =
          // eslint-disable-next-line no-await-in-loop
          await buildPackageFromTextDSL(childId);
        const childGeneratedBundle = getApiGeneratedBundle(childApiBundle);
        const said = childGeneratedBundle?.d;
        if (said) {
          childBuilds.push({
            schemaId: childId,
            bundle: childGeneratedBundle,
            extension: childExtension
          });
        }
      }
    }

    const { bundle, extension, textDSL } = await buildPackageFromTextDSL(rootSchemaId);
    const rootGeneratedBundle = getApiGeneratedBundle(bundle);
    const rootDigest = rootGeneratedBundle?.d;
    if (!rootDigest) {
      throw new Error("Export failed: generated root bundle is missing a digest.");
    }

    const adcMerged = {
      ...extension.extensions.adc,
      ...childBuilds
        .map((b) => b.extension)
        .reduce((acc, childExt) => {
          if (childExt?.extensions?.adc) {
            return { ...acc, ...childExt.extensions.adc };
          }
          return acc;
        }, {})
    };

    // Provisional editor ids (e.g. manual-creation-schema) must be re-keyed to the API bundle digest.
    if (adcMerged[rootSchemaId] && !adcMerged[rootDigest]) {
      adcMerged[rootDigest] = adcMerged[rootSchemaId];
      delete adcMerged[rootSchemaId];
    }

    const mergedExtension = {
      extensions: {
        adc: adcMerged
      }
    };

    const saidByReferenceToken = {};
    setResolvedSaidForSchema(saidByReferenceToken, rootSchemaId, rootDigest);
    childBuilds.forEach(({ schemaId, bundle: childBundle }) => {
      setResolvedSaidForSchema(saidByReferenceToken, schemaId, childBundle.d);
    });

    const rebuiltRootBundle = getPackageBundle(pkgFromState);
    const rebuiltDependencies = getPackageDependencies(pkgFromState) || [];
    seedResolvedAliasTokensFromBundles(
      [rebuiltRootBundle, ...rebuiltDependencies],
      saidByReferenceToken
    );

    const resolveManualSaid = createResolveSaid(saidByReferenceToken);

    const finalBundle = deepCloneJson(rootGeneratedBundle);
    const finalDependencies = childBuilds.map(({ bundle: childBundle }) =>
      deepCloneJson(childBundle)
    );
    const unresolvedTokens = [];
    unresolvedTokens.push(
      ...rewriteBundleRefs({ schemaBundle: finalBundle, resolveSaid: resolveManualSaid })
    );
    finalDependencies.forEach((dep) =>
      unresolvedTokens.push(
        ...rewriteBundleRefs({ schemaBundle: dep, resolveSaid: resolveManualSaid })
      )
    );

    throwUnresolvedReferenceError(unresolvedTokens);

    const finalPackage = {
      bundle: finalBundle,
      dependencies: finalDependencies
    };

    const exportedPackageJson = generateOcaPackageJson(mergedExtension, {
      bundle: finalPackage.bundle,
      dependencies: finalPackage.dependencies
    });

    if (download) {
      try {
        if (finalPackage.bundle?.capture_base) {
          await jsonToTextFile(finalPackage.bundle, exportedPackageJson);
        }
      } catch (readmeError) {
        console.warn("Could not generate README:", readmeError);
      }

      const rootState = getSchemaById(rootSchemaId);
      const schemaNameForFile =
        rootState?.metadata?.name || rootState?.metadata?.localized?.eng?.name || null;

      downloadJsonFile(
        exportedPackageJson,
        getDescriptiveFileName(schemaNameForFile, "OCA_package.json")
      );

      if (currentEnv === "DEV") {
        downloadTextFile(
          textDSL,
          getDescriptiveFileName(schemaNameForFile, "OCA_file.txt")
        );
        downloadJsonFile(
          finalPackage,
          getDescriptiveFileName(schemaNameForFile, "OCA_bundle.json")
        );
      }
    }

    return exportedPackageJson;
  };

  // MAIN EXPORT FUNCTION
  const exportData = async ({ download = true } = {}) => {
    try {
      setError("");
      let result;
      if (ocaPackage) {
        result = await exportImportedPackage({ download });
      } else {
        result = await exportManualPackage({ download });
      }
      if (result) clearDraft();
      return result;
    } catch (error) {
      console.error("Export failed:", error);
      setError(error.message || "Export failed");
      return false;
    }
  };

  /**
   * Reset all application state to defaults and navigate to landing page
   */
  const resetToDefaults = useCallback(() => {
    setSummaryExportMode(false);
    setOcaPackage(null);
    setOverlay(overlayItems);
    setSelectedOverlay("");

    clearAllSchemas();
    clearDraft();

    setCurrentPage("Landing");
    navigate("/");
  }, [
    setSummaryExportMode,
    setOcaPackage,
    setOverlay,
    setSelectedOverlay,
    clearAllSchemas,
    setCurrentPage,
    navigate
  ]);

  return {
    exportData,
    error,
    clearError: () => setError(""),
    isImportedPackage: !!ocaPackage,
    resetToDefaults
  };
};

export default useOCAExport;
