import React, { useContext, useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import i18next from "i18next";
import {
  Box,
  Button,
  Typography,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { CustomPalette } from "../constants/customPalette";
import SchemaDescription from "./SchemaDescription";
import ViewGrid from "./ViewGrid";
import {
  getPrioritizedLangNames,
  getBestLangName,
  langCodeOCAFromName,
  LanguageConstants,
  getLanguageButtonBorderRadius
} from "../utils/languageUtils";
import { 
  TYPE_CHILD_SCHEMA, 
  isChildSchemaType, 
  MANUAL_CREATION_SCHEMA_ID,
  SECTION_SPACING,
  HEADER_TO_CONTENT_GAP_PX,
  BETWEEN_SECTION_SPACING
} from "../constants/constants";
import { searchUnits } from "../utils/helpers";
import Loading from "../components/Loading";
import BackNextSkeleton from "../components/BackNextSkeleton";
import useOCAExport from "../hooks/useOCAExport";
import usePrimaryColor from "../hooks/usePrimaryColor";
import useGenerateReadMe from "./useGenerateReadMe";
import useGenerateTextReadmeFromJson from "./useGenerateTextReadmeFromJson";
import { getPackageBundle, getPackageBundleId, getPackageDependencies } from "../utils/packageUtils";

import ErrorPopup from "./ErrorPopup";
import CustomRouterLink from "../components/CustomRouterLink";
import ConfirmResetCard from "./ConfirmResetCard";
import LinkCard from "./LinkCard";

// Lazy load the schema visualization component to avoid React hook issues
const SchemaVisualizationEmbed = React.lazy(
  () => import("../SchemaVisualization/SchemaVisualizationEmbed")
);

export default function ViewSchema({
  pageBack,
  isExport = true,
  addClearButton,
  pageForward,
  isPageForward = true,
  isBack = false
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    isZip, 
    isZipEdited,
    setIsZipEdited,
    setCurrentPage, 
    history,
    setHistory,
    zipToReadme,
    jsonToReadme
  } = useContext(Context);

  const {
    currentSchemaId,
    switchToSchema,
    pkgBuildFromState,
    getSchema,
    updateSchema,
    schemaStates,
    pkgUpload
  } = useMultiSchema();

  const primaryColor = usePrimaryColor();

  // Get languages from current schema's metadata (per-schema languages)
  const schemaState = getSchema();
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];

  const filteredLanguages = React.useMemo(() => {
    return getPrioritizedLangNames(languages);
  }, [languages]);

  // Schema language state - defaults to null (use i18n), can be overridden by schema buttons
  const [schemaLanguageOverride, setSchemaLanguageOverride] = useState(null);
  
  // Helper to get current effective language (standardized approach)
  const getCurrentLanguage = () => {
    return schemaLanguageOverride || getBestLangName({ languages: filteredLanguages });
  };

  // Reset schema language override when app language changes (i18n primary approach)
  useEffect(() => {
    setSchemaLanguageOverride(null); // Reset to use i18n language
    setVizVersion((v) => v + 1); // Force visualization update
  }, [t]); // Track i18n language changes

  // Language selector display logic
  const displayLanguageArray = [];
  for (let i = 0; i < filteredLanguages.length; i += 7) {
    const languageRow = filteredLanguages.slice(i, i + 7).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const createLanguageRow = (languageArray, rowIndex) => {
    const languageRowDisplay = languageArray.map((language, index) => {
      const borderRadius = getLanguageButtonBorderRadius(index, languageArray, rowIndex, displayLanguageArray, languages.length, 7);
      let minimizedLanguage = language.slice(0, 9);
      if (minimizedLanguage !== language) {
        minimizedLanguage += "...";
      }
      return (
        <Button
          onClick={() => {
            setSchemaLanguageOverride(language);
            setVizVersion((v) => v + 1); // Force visualization update
          }}
          key={language}
          color="button"
          variant="contained"
          sx={{
            backgroundColor:
              getCurrentLanguage() === language
                ? primaryColor
                : CustomPalette.WHITE,
            color:
              getCurrentLanguage() === language
                ? "white"
                : primaryColor,
            borderRadius,
            minWidth: languages.length < 5 ? "12rem" : "10rem",
            boxShadow: "none",
            border: `1px solid ${primaryColor}`,
            "&:hover": {
              backgroundColor:
                getCurrentLanguage() === language
                  ? primaryColor
                  : CustomPalette.WHITE,
              boxShadow:
                getCurrentLanguage() === language
                  ? "none"
                  : undefined
            }
          }}
        >
          <Typography variant="button">{t(minimizedLanguage, { defaultValue: minimizedLanguage })}</Typography>
        </Button>
      );
    });
    return languageRowDisplay;
  };

  const languageButtonDisplay = displayLanguageArray.map((languageSegment, index) => (
    <Box key={languageSegment.join(",")}>{createLanguageRow(languageSegment, index)}</Box>
  ));
  
  const [showLink, setShowLink] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [displayArray, setDisplayArray] = useState([]);
  const {
    exportData,
    error: exportError,
    clearError,
    resetToDefaults
  } = useOCAExport();

  // Package representation built from current editor state — kept early so
  // helper functions (display name lookup, package-level validation) can use it.
  const [pkgFromState, setPkgWithChanges] = useState(pkgUpload);

  // PACKAGE-LEVEL VALIDATION: scan all schemas in the workspace and report problems
  // Helper: return the same display name used by the visualization (meta overlay, then
  // attribute label from the parent, then schema metadata or id).
  const getSchemaDisplayName = (schemaId) => {
    const state = schemaStates[schemaId];

    // 1) Use explicit metadata name if available and not equal to the raw id
    const metaName = state?.metadata?.localized?.eng?.name || state?.metadata?.name;
    if (metaName && metaName !== schemaId) return metaName;

    // 2) Try to find a parent attribute that references this schema and use its label
    const pkg = pkgFromState || pkgUpload || (pkgBuildFromState ? pkgBuildFromState(pkgUpload) : null);
    if (pkg) {
      const bundle = getPackageBundle(pkg);
      const deps = getPackageDependencies(pkg) || [];
      const all = [bundle, ...deps].filter(Boolean);

      for (const s of all) {
        const attrs = s?.capture_base?.attributes || {};
        for (const [attrName, attrVal] of Object.entries(attrs)) {
          // Match refn:/refs: references or attribute-name-based placeholders
          const isRefMatch =
            (typeof attrVal === 'string' && (attrVal === `refn:${schemaId}` || attrVal === `refs:${schemaId}`)) ||
            (Array.isArray(attrVal) && (attrVal[0] === `refn:${schemaId}` || attrVal[0] === `refs:${schemaId}`)) ||
            attrName === schemaId;
          if (!isRefMatch) continue;

          // Try to read the attribute label from the parent schema's localized label overlays
          const parentSchemaId = s.d;
          const parentState = schemaStates[parentSchemaId];
          const lan = parentState?.lanAttributeRowData || {};
          const engRows = lan['English'] || lan['eng'] || lan[Object.keys(lan)[0]] || [];
          const row = engRows.find(r => r.Attribute === attrName);
          if (row?.Label) return row.Label;

          // Fallback to the attribute key
          return attrName;
        }
      }
    }

    // 3) Fallback to metadata name or raw id
    return metaName || schemaId;
  };

  const packageLevelMissingTypes = useMemo(() => {
    return Object.entries(schemaStates).reduce((acc, [schemaId, state]) => {
      if (!state || !state.attributes) return acc;
      const missing = state.attributes.find(attr => !attr.Type || attr.Type === "");
      if (missing) {
        const displayName = getSchemaDisplayName(schemaId);
        acc.push({ schemaId, name: displayName });
      }
      return acc;
    }, []);
  }, [schemaStates, pkgFromState, pkgUpload]);

  const packageLevelMissingEntryCodes = useMemo(() => {
    return Object.entries(schemaStates).reduce((acc, [schemaId, state]) => {
      if (!state || !state.attributes) return acc;
      const attributesWithLists = state.attributesWithLists || [];
      const entryCodes = state.entryCodes || {};
      const hasProblem = state.attributes.some(attr => {
        const isList = Array.isArray(attributesWithLists)
          ? attributesWithLists.includes(attr.Attribute)
          : attributesWithLists[attr.Attribute];
        const codes = entryCodes[attr.Attribute];
        return isList && (!codes || codes.length === 0);
      });
      if (hasProblem) {
        const displayName = getSchemaDisplayName(schemaId);
        acc.push({ schemaId, name: displayName });
      }
      return acc;
    }, []);
  }, [schemaStates, pkgFromState, pkgUpload]);

  // Package-level: detect schemas that explicitly have zero attributes
  const packageLevelEmptySchemas = useMemo(() => {
    return Object.entries(schemaStates).reduce((acc, [schemaId, state]) => {
      if (!state) return acc;
      // Only consider schemas that explicitly have an attributes array (edited or parsed)
      if (Array.isArray(state.attributes) && state.attributes.length === 0) {
        const displayName = getSchemaDisplayName(schemaId);
        acc.push({ schemaId, name: displayName });
      }
      return acc;
    }, []);
  }, [schemaStates, pkgFromState, pkgUpload]);

  const hasInvalidAttributesInPackage = packageLevelMissingTypes.length > 0;
  const hasMissingEntryCodesInPackage = packageLevelMissingEntryCodes.length > 0;
  const hasEmptySchemasInPackage = packageLevelEmptySchemas.length > 0;

  // Export is disabled only when the package contains invalid schemas (download is package-wide)
  // Empty schemas are allowed - they become refn: placeholders in the export
  const exportDisabled = hasInvalidAttributesInPackage || hasMissingEntryCodesInPackage;
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const [loading, setLoading] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState("detailed"); // "detailed" for left-right, "tree" for top-down
  const [vizVersion, setVizVersion] = useState(0);

  // Track the last known root digest to detect when package structure actually changes
  const lastRootDigestRef = useRef(null);

  // Sync currentSchemaId ONLY when package structure changes (e.g., adding first child schema)
  // Don't interfere with normal navigation to child schemas
  useEffect(() => {
    const pkg = pkgFromState || pkgUpload;
    const rootDigest = getPackageBundleId(pkg);
    
    // Only sync if the root digest has changed (package structure modified)
    if (rootDigest && lastRootDigestRef.current && rootDigest !== lastRootDigestRef.current) {
      switchToSchema(rootDigest, pkg);
    }
    
    // Update the ref for next comparison
    lastRootDigestRef.current = rootDigest;
  }, [pkgFromState, pkgUpload, switchToSchema]);

  // Enhanced schema switching with proper navigation
  const handleSchemaSwitch = useCallback(
    (schemaId) => {
      if (!schemaId) return;
      
      // Canonicalize the incoming schemaId to match how it's stored in the context
      // "root" should map to bundle.d
      const pkg = pkgFromState || pkgUpload;
      const rootDigest = getPackageBundleId(pkg);
      const canonicalSchemaId = (schemaId === "root" && rootDigest) ? rootDigest : schemaId;
      
      // Switch only if different, but always navigate to the editor
      // Use pkgFromState which includes the latest changes and placeholder dependencies
      if (canonicalSchemaId !== currentSchemaId) {
        switchToSchema(schemaId, pkgFromState || pkgUpload);
      }
      setCurrentPage("Details");
      navigate("/start");
    },
    [currentSchemaId, switchToSchema, pkgFromState, pkgUpload, setCurrentPage, navigate]
  );

  const downloadReadMe = () => {
    if (Object.keys(jsonToReadme).length > 0) {
      // Schema name will be extracted from jsonToReadme automatically
      jsonToTextFile(jsonToReadme, pkgFromState);
    } else if (zipToReadme.length > 0) {
      toTextFile(zipToReadme);
    }
  };

  // Compute which attributes are used in form overlays
  const usedAttributesInForm = React.useMemo(() => {
    const used = new Set();

    const schemaState = getSchema();
    const formBuilderPages = schemaState?.formBuilderPages || [];

    if (formBuilderPages && formBuilderPages.length > 0) {
      formBuilderPages.forEach((page) => {
        (page.questions || []).forEach((q) => q?.attribute && used.add(q.attribute));
        (page.sections || []).forEach((s) =>
          (s.questions || []).forEach((q) => q?.attribute && used.add(q.attribute))
        );
      });
      return used;
    }

    const captureBaseSaid = pkgFromState?.oca_bundle?.bundle?.capture_base?.d;
    const extensionOverlays =
      pkgFromState?.extensions?.adc?.[captureBaseSaid]?.overlays || {};

    const formOverlayData = extensionOverlays.form_overlay || extensionOverlays.form;
    const formOverlayArray = Array.isArray(formOverlayData)
      ? formOverlayData
      : formOverlayData?.form_overlays || [];

    if (Array.isArray(formOverlayArray) && formOverlayArray.length > 0) {
      formOverlayArray.forEach((fo) => {
        const interactionArgs = fo?.interaction?.[0]?.arguments || {};
        Object.keys(interactionArgs).forEach((attr) => {
          if (attr) used.add(attr);
        });
      });
    }

    return used;
  }, [getSchema, pkgFromState]);

  const moveBackward = () => {
    if (history.length > 1 && history[history.length - 2] === "Landing") {
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentPage("Landing");
      navigate("/");
    } else {
      pageBack();
    }
  };

  // readme hooks not used on this page
  // Show multi-schema visualization if:
  // 1. ANY schema in the hierarchy has Child Schema types (check schemaStates)
  // 2. Package has any dependencies (including empty placeholder schemas)
  const hasHierarchy = useMemo(() => {
    // Check if ANY schema in schemaStates has Child Schema types
    const anySchemaHasChildren = Object.values(schemaStates).some(state => {
      return state?.attributes?.some(attr => {
        const type = attr?.Type;
        return isChildSchemaType(type);
      });
    });
    
    // Check if package has any dependencies (even empty ones)
    const dependencies = getPackageDependencies(pkgFromState);
    const hasDependencies = dependencies.length > 0;
    
    return anySchemaHasChildren || hasDependencies;
  }, [schemaStates, pkgFromState]);

  // Update the package data when schemas are modified
  useEffect(() => {
    // For manual creation, pkgUpload is null - pkgBuildFromState will create the structure
    // For uploaded packages, pkgUpload contains the original structure    
    // If manual creation, ensure root schema is initialized before building
    if (!pkgUpload) {
      const rootSchemaId = MANUAL_CREATION_SCHEMA_ID;
      const rootState = schemaStates[rootSchemaId];
      
      if (!rootState) {
        setPkgWithChanges(null);
        return;
      }

      // Mark schema as initialized so pkgBuildFromState will process it
      if (!rootState.initialized) {
        updateSchema(rootSchemaId, { initialized: true });
        // Since state update is async, also update the local ref for immediate use
        schemaStates[rootSchemaId] = { ...rootState, initialized: true };
      }
    }

    // UNIFIED CODE PATH: pkgBuildFromState handles both imported and manual schemas
    // - For uploads: clones pkgUpload and applies edits
    // - For manual creation: creates fresh package structure from schemaStates
    // - Converts "Child Schema" -> refn:name and builds dependencies automatically
    const pkgFromState = pkgBuildFromState(pkgUpload);
    setPkgWithChanges(pkgFromState);
    setVizVersion((v) => v + 1);
  }, [pkgUpload, schemaStates, pkgBuildFromState]);

  // Removed in favor of global language toggle (EN/FR)

  const handleClickDownload = async () => {
    try {
      setLoading(true);

      // Unified export hook handles all scenarios:
      // - Imported packages (flat or nested) via pkgBuildFromState()
      // - Manual flat schemas via text DSL generation
      // - Manual nested schemas (throws helpful error - not yet supported)
      await exportData();

      // Clear any export errors since we successfully downloaded
      clearError();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load schema data when component mounts or when active schema changes
  useEffect(() => {
    
    const loadSchemaData = async () => {
      try {
        // Wait for schema initialization if OCA package exists but no currentSchemaId yet
        if (pkgUpload && !currentSchemaId) {
          setLoading(true);
          return;
        }

        // CRITICAL FIX: Wait for schemaStates to contain the currentSchemaId
        // When OCA package is uploaded, schemaStates updates asynchronously
        // Use direct lookup to avoid stale getSchema closure
        const currentSchema = schemaStates[currentSchemaId];
        
        if (pkgUpload && currentSchemaId && !currentSchema) {
          setLoading(true);
          return;
        }

        setLoading(true);

        // Use direct lookup instead of getSchema to avoid stale closures
        const schemaState = currentSchema || getSchema();
        
        if ((pkgUpload && currentSchemaId) || (!pkgUpload && schemaState && schemaState.attributes)) {

          // Convert schema state back to the format expected by ViewGrid
          const schemaAttributes = schemaState.attributes || [];
          const attributeFormats = schemaState.attributeFormats || {};
          const attributeRanges = schemaState.attributeRanges || {};

          // Create the display array in the format expected by ViewGrid
          const newDisplayArray = schemaAttributes.map((attr) => {
            // Get language-specific data from schema state
            const lanAttributeData = schemaState.lanAttributeRowData || {};

            // Initialize language-specific fields for all available languages
            const descriptionObj = {};
            const labelObj = {};
            const listObj = {};

            // Build a map of attribute -> entryCodes array once
            const entryCodesMap = schemaState.entryCodes || {};
            const codesForAttr = Array.isArray(entryCodesMap[attr.Attribute])
              ? entryCodesMap[attr.Attribute]
              : [];

            // Initialize for all languages with proper data (accept either display name or 3-letter code)
            filteredLanguages.forEach((lang) => {
              const langCodeOCA = langCodeOCAFromName(lang);
              // Try to find language data using both full name and 3-letter code
              const rowsByName = lanAttributeData[lang] || [];
              const rowsByCode = lanAttributeData[langCodeOCA] || [];
              const langDataRows = rowsByName.length > 0 ? rowsByName : rowsByCode;
              const langData = langDataRows.find(
                (item) => item.Attribute === attr.Attribute
              );

              descriptionObj[lang] = langData?.Description || "";
              labelObj[lang] = langData?.Label || "";

              // Build list text from entry codes for this language, or Not a List
              if (codesForAttr.length > 0) {
                const items = codesForAttr
                  .map((row) => {
                    // Entry codes are normalized at source to use language names
                    return row[lang] || row.Code;
                  })
                  .filter(Boolean);
                listObj[lang] = items.length > 0 ? items.join(" | ") : t("Not a List");
              } else {
                listObj[lang] = t("Not a List");
              }
            });

            // Handle schema references (refs/refn) - display as "Child Schema"
            let displayType = attr.Type || "";
            if (displayType.startsWith("refs:") || displayType.startsWith("refn:")) {
              displayType = TYPE_CHILD_SCHEMA;
            }

            const charEncoding = (schemaState.characterEncodingData || {})[attr.Attribute] || "";
            
            // Get range data for this attribute from object
            const range = attributeRanges[attr.Attribute] || {};
            
            // Find unit framing data for this attribute
            const unitFramingData = (schemaState.unitFramedData || []).find(
              (u) => u.Attribute === attr.Attribute
            );
            
            return {
              Attribute: attr.Attribute,
              Type: displayType,
              Description: descriptionObj,
              Label: labelObj,
              Required: !!attr.Required,
              "Format Rule": attributeFormats[attr.Attribute] || "",
              "Character Encoding": charEncoding,
              List: listObj,
              Unit: attr.Unit || "",
              Flagged: attr.Sensitive || false,
              // Add range overlay fields from object
              LowerBound: range.lower || "",
              UpperBound: range.upper || "",
              LowerInclusive: range.lower_inclusive ?? false,
              UpperInclusive: range.upper_inclusive ?? false,
              // Add unit framing field (UCUM code). If no unitFramedData exists, try to derive a UCUM code from the attribute Unit.
              "Unit Framing":
                unitFramingData?.["UCUM Code"] || (attr.Unit ? (searchUnits(attr.Unit).firstMatch?.code || "") : "")
            };
          });

          setDisplayArray(newDisplayArray);
        } else {
          // No valid schema - show empty array
          setDisplayArray([]);
        }

        setLoading(false);
      } catch (error) {
        // console.error("Error loading schema data:", error);
        setLoading(false);
      }
    };

    // Run immediately - no setTimeout
    // The dependency array will cause re-runs when schemaStates updates
    loadSchemaData();
  }, [
    currentSchemaId,
    pkgUpload,
    schemaLanguageOverride,
    i18next.language,
    getSchema,
    filteredLanguages,
    schemaStates, // Ensure updates when schema state changes
    getSchema()?.attributeFormats, // Explicitly watch attributeFormats changes
    getSchema()?.attributeRanges // Explicitly watch attributeRanges changes
  ]);

  const viewSchemaRightContent = (
    <>
          {isZip && isExport && !isZipEdited && (
            <>
              <Button
                color="button"
                variant="contained"
                onClick={() => {
                  setCurrentPage("Metadata");
                  setIsZipEdited(true);
                }}
                sx={{
                  alignSelf: "flex-end",
                  display: "flex",
                  justifyContent: "space-around",
                  padding: "0.5rem 1rem"
                }}
              >
                {t("Edit Schema")}
              </Button>
              <Button
                color="button"
                variant="contained"
                onClick={downloadReadMe}
                sx={{
                  alignSelf: "flex-end",
                  display: "flex",
                  justifyContent: "space-around",
                  padding: "0.5rem 1rem"
                }}
                disabled={exportDisabled}
              >
                {t("Download ReadMe")}
              </Button>
            </>
          )}

          {/* Validation Alerts */}

          


          {/* Package-level validation: warn if ANY schema in the package has missing attribute types or missing entry codes */}
          {(hasInvalidAttributesInPackage || hasMissingEntryCodesInPackage) && isPageForward && isExport && (!isZip || (isZip && isZipEdited)) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {hasInvalidAttributesInPackage && (
                <div>
                  {packageLevelMissingTypes.length === 1 ? (
                    <span>
                      {t('Schema')}{' '}
                      <Button color="inherit" variant="text" onClick={() => handleSchemaSwitch(packageLevelMissingTypes[0].schemaId)}>
                        {packageLevelMissingTypes[0].name}
                      </Button>{' '}
                      {t('has attributes missing types. Complete the schema before exporting.')}
                    </span>
                  ) : (
                    <span>
                      {t('{{count}} schemas have attributes missing types. Open each schema to complete them before exporting.', { count: packageLevelMissingTypes.length })}
                    </span>
                  )}
                </div>
              )}

              {hasMissingEntryCodesInPackage && (
                <div style={{ marginTop: hasInvalidAttributesInPackage ? '0.5rem' : 0 }}>
                  {packageLevelMissingEntryCodes.length === 1 ? (
                    <span>
                      {t('Schema')}{' '}
                      <Button color="inherit" variant="text" onClick={() => handleSchemaSwitch(packageLevelMissingEntryCodes[0].schemaId)}>
                        {packageLevelMissingEntryCodes[0].name}
                      </Button>{' '}
                      {t('has List attributes with no entry codes. Add entry codes before exporting.')}
                    </span>
                  ) : (
                    <span>
                      {t('{{count}} schemas have List attributes with no entry codes. Open each schema to add entry codes before exporting.', { count: packageLevelMissingEntryCodes.length })}
                    </span>
                  )}
                </div>
              )}
            </Alert>
          )}

          {/* Clear All Data button - moved to top */}
          {addClearButton && isPageForward && isExport && (!isZip || (isZip && isZipEdited)) && (
            <Button
              color="warning"
              variant="outlined"
              onClick={() => setShowConfirmReset(true)}
              sx={{
                width: "16rem",
                display: "flex",
                justifyContent: "space-around",
                p: 1
              }}
            >
              {t("Clear All Data and Restart", {
                defaultValue: "Clear All Data and Restart"
              })}
            </Button>
          )}

          {isPageForward && isExport && (!isZip || (isZip && isZipEdited)) && (
            <Button
              color="button"
              variant="contained"
              onClick={handleClickDownload}
              sx={{
                width: "18rem",
                display: "flex",
                justifyContent: "space-around",
                p: 1
              }}
              disabled={exportDisabled}
              title={(hasInvalidAttributesInPackage || hasMissingEntryCodesInPackage)
                ? t("Complete all required fields across the package to enable download", { defaultValue: "Complete all required fields across the package to enable download" })
                : ""}
            >
              {t("Download Schema and Readme", { defaultValue: "Download Schema and Readme" })}{" "}
            </Button>
          )}

    </>
  );

  return (
    <BackNextSkeleton
      isBack={isBack || (isPageForward && !pageForward)}
      pageBack={isBack ? pageBack : moveBackward}
      isForward={isPageForward && !!pageForward}
      pageForward={pageForward}
      rightContent={viewSchemaRightContent}
    >
      {loading ? (
        <Box sx={{ py: 8, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 2, mb: BETWEEN_SECTION_SPACING, width: "100%" }}>
      <Box sx={{ position: "relative", alignSelf: "flex-end" }}>
          {isPageForward && isExport && (
            <Box
              sx={{
                padding: 2,
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
                width: "300px",
                textAlign: "left",
                position: "absolute",
                right: 0,
                top: 0
              }}
            >
              <Typography sx={{ fontSize: 14, color: "#333" }}>
                {t("For future editing, download your schema as-is and later upload it to the Semantic Engine.")}
              </Typography>
            </Box>
          )}
        </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "left",
            margin: `1rem 0 ${HEADER_TO_CONTENT_GAP_PX}px 0`,
            color: primaryColor
        }}
        >
          {t("Schema Language")}
        </Typography>
      </Box>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "flex-start",
          mb: `${HEADER_TO_CONTENT_GAP_PX}px`,
          width: "70rem"
        }}
      >
        {languageButtonDisplay}
        <Box
          sx={{
            position: "absolute",
            right: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            marginRight: 1,
            color: CustomPalette.GREY_600
          }}
        >
          <Tooltip
            title={t(
              "Toggles between the one or more languages used in the schema"
            )}
            placement="left"
            arrow
            PopperProps={{
              sx: { "& .MuiTooltip-tooltip": { width: 100 } }
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
      </Box>
      {showLink && <LinkCard setShowLink={setShowLink} />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}
      >
        {/* <Typography
          sx={{
            fontSize: 28,
            fontWeight: "bold",
            color: CustomPalette.PRIMARY,
            mb: 2,
            wordWrap: "break-word",
            textAlign: "left",
            maxWidth: "35rem",
          }}
        >
          {currentLanguage.replace(/\b\w/g, (match) => match.toUpperCase())}
        </Typography> */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: BETWEEN_SECTION_SPACING,
            marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "left",
              margin: 0,
              lineHeight: 1.5,
              color: primaryColor
            }}
          >
            {t("Schema Metadata")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600, display: "flex", alignItems: "center" }}>
            <Tooltip
              title={t(
                "Language specific information describing general schema information"
              )}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
        </Box>
        <SchemaDescription currentLanguage={getCurrentLanguage()} />

        {/* Multi-Schema Visualization */}
        {hasHierarchy && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginTop: BETWEEN_SECTION_SPACING,
                marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
              }}
            >
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "left",
                  margin: 0,
                  lineHeight: 1.5,
                  color: primaryColor
                }}
              >
                {t("Multi-Schema Visualization", {
                  defaultValue: "Multi-Schema Visualization"
                })}
              </Typography>
              <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600, display: "flex", alignItems: "center" }}>
                <Tooltip
                  title={t("Visual representation of references between schemas", {
                    defaultValue: "Visual representation of references between schemas"
                  })}
                  placement="right"
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 15 }} />
                </Tooltip>
              </Box>
            </Box>

            {/* Mode toggle switch */}
            <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ToggleButtonGroup
                  exclusive
                  value={visualizationMode}
                  onChange={(_e, val) => {
                    if (val) setVisualizationMode(val);
                  }}
                  size="small"
                  color="primary"
                  sx={{
                    "& .MuiToggleButton-root": {
                      border: `1px solid ${primaryColor}`,
                      color: primaryColor,
                      backgroundColor: CustomPalette.WHITE,
                      boxShadow: "none",
                      minWidth: languages.length < 5 ? "12rem" : "10rem",
                      "&:hover": {
                        boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"
                      },
                      "&.Mui-selected": {
                        backgroundColor: primaryColor,
                        color: "white",
                        "&:hover": {
                          backgroundColor: primaryColor,
                          boxShadow: "none"
                        }
                      },
                      "&:first-of-type": {
                        borderTopLeftRadius: "8px",
                        borderBottomLeftRadius: "8px"
                      },
                      "&:last-of-type": {
                        borderTopRightRadius: "8px",
                        borderBottomRightRadius: "8px"
                      }
                    }
                  }}
                >
                  <ToggleButton value="detailed">
                    {t("Left-Right", { defaultValue: "Left-Right" })}
                  </ToggleButton>
                  <ToggleButton value="tree">
                    {t("Top-Down", { defaultValue: "Top-Down" })}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            {/* Visualization embed */}
            <Box sx={{ marginBottom: 0, width: "100%", minHeight: "400px" }}>
              <Suspense fallback={<Loading />}>
                <SchemaVisualizationEmbed
                  key={`viz-${vizVersion}-${getPackageBundleId(pkgFromState)}-${currentSchemaId}-${schemaLanguageOverride || i18next.language}`}
                  schemaLanguageOverride={getCurrentLanguage()}
                  pkg={pkgFromState}
                  viewMode={visualizationMode}
                  currentSchemaId={currentSchemaId}
                  setCurrentSchemaId={handleSchemaSwitch}
                />
              </Suspense>
            </Box>
          </>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: BETWEEN_SECTION_SPACING,
            marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "left",
              margin: 0,
              lineHeight: 1.5,
              color: primaryColor
            }}
          >
            {t("Schema Details")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600, display: "flex", alignItems: "center" }}>
            <Tooltip
              title={t(
                "The details of the schema including attribute names and their features as well as language specific information"
              )}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
        </Box>
        <ViewGrid
          displayArray={displayArray}
          currentLanguage={getCurrentLanguage()}
          setLoading={setLoading}
          packageWithEdits={pkgFromState}
        />
      </Box>

      {/* Confirm Reset Dialog */}
      {showConfirmReset && (
        <ConfirmResetCard
          onConfirm={() => {
            setShowConfirmReset(false);
            resetToDefaults();
          }}
          onCancel={() => setShowConfirmReset(false)}
        />
      )}

      {/* Error Popup */}
      {exportError && (
        <ErrorPopup
          onClose={() => {
            clearError();
          }}
        >
          <Typography variant="h5" sx={{ p: 1 }}>
            <Trans
              i18nKey="SchemaExportError"
              components={[
                <CustomRouterLink
                  to="mailto:adc@uoguelph.ca"
                  text="adc@uoguelph.ca"
                  overrideStyle={{ fontWeight: "500", color: primaryColor }}
                />
              ]}
            />
          </Typography>
        </ErrorPopup>
      )}
        </Box>
      )}
    </BackNextSkeleton>
  );
}
