import React, { useContext, useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import i18next from "i18next";
import {
  Box,
  Button,
  Typography,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { CustomPalette } from "../constants/customPalette";
import SchemaDescription from "./SchemaDescription";
import ViewGrid from "./ViewGrid";
import { LanguageUtils } from "../utils/languageUtils";

import Loading from "../components/Loading";
import useOCAExport from "../hooks/useOCAExport";
import useGenerateReadMe from "./useGenerateReadMe";
import useGenerateReadMeV2 from "./useGenerateReadMeV2";
import { getDescriptiveFileName } from "../constants/utils";

import { codesToLanguages } from "../constants/isoCodes";

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
    currentTheme,
    languages,
    schemaDescription,
    attributeRowData,
    lanAttributeRowData,
    isZip, 
    isZipEdited,
    setIsZipEdited,
    setCurrentPage, 
    history,
    setHistory,
    zipToReadme,
    jsonToReadme,
    OCAPackage,
    rangeRowData,
    attributeFramingRowData,
    formBuilderPages
  } = useContext(Context);

  // Multi-schema context
  const {
    currentSchemaId,
    switchToSchema,
    exportSchemaChanges,
    getSchemaState,
    schemaStates
  } = useMultiSchema();

  const filteredLanguages = React.useMemo(() => {
    return LanguageUtils.getPrioritizedSchemaLanguages(languages);
  }, [languages]);

  // Schema language state - defaults to null (use i18n), can be overridden by schema buttons
  const [schemaLanguageOverride, setSchemaLanguageOverride] = useState(null);
  
  // Helper to get current effective language (standardized approach)
  const getCurrentLanguage = () => {
    return LanguageUtils.getEffectiveSchemaLanguage(schemaLanguageOverride, filteredLanguages);
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
      let curveLeftTop = "0";
      let curveRightTop = "0";
      let curveRightBottom = "0";
      let curveLeftBottom = "0";

      if (languages.length > 7) {
        if (rowIndex === 0 && index === 0) {
          curveLeftBottom = "8px";
        }
        if (rowIndex === displayLanguageArray.length - 1 && index === 0) {
          curveLeftTop = "8px";
        }
        if (rowIndex === 0 && index === 6) {
          curveRightBottom = "8px";
        }
        if (
          rowIndex === displayLanguageArray.length - 1 &&
          index === languageArray.length - 1
        ) {
          curveRightTop = "8px";
        }
        if (
          rowIndex === displayLanguageArray.length - 2 &&
          displayLanguageArray[displayLanguageArray.length - 1].length < 7 &&
          index === 6
        ) {
          curveRightTop = "8px";
        }
      } else {
        if (index === 0) {
          curveLeftBottom = "8px";
          curveLeftTop = "8px";
        }
        if (index === languages.length - 1) {
          curveRightBottom = "8px";
          curveRightTop = "8px";
        }
      }

      const borderRadius = `${curveLeftTop} ${curveRightTop} ${curveRightBottom} ${curveLeftBottom}`;
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
                ? CustomPalette.PRIMARY
                : CustomPalette.WHITE,
            color:
              getCurrentLanguage() === language
                ? "white"
                : CustomPalette.PRIMARY,
            borderRadius,
            minWidth: languages.length < 5 ? "12rem" : "10rem",
            boxShadow: "none",
            border: `1px solid ${CustomPalette.PRIMARY}`,
            "&:hover": {
              backgroundColor:
                getCurrentLanguage() === language
                  ? CustomPalette.PRIMARY
                  : CustomPalette.WHITE,
              boxShadow:
                getCurrentLanguage() === language
                  ? "none"
                  : undefined
            }
          }}
        >
          <Typography variant="button">{minimizedLanguage}</Typography>
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
    hasNestedSchemas,
    isImportedPackage
  } = useOCAExport();
  
  // Export is never disabled in view mode
  const exportDisabled = false;
  // Reset functionality not needed in ViewSchema
  const resetToDefaults = () => {};
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateReadMeV2();
  const [loading, setLoading] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState("detailed"); // "detailed" for left-right, "tree" for top-down
  const [updatedOCAPackage, setUpdatedOCAPackage] = useState(OCAPackage);
  const [vizVersion, setVizVersion] = useState(0);

  // Helper for form information - check which attributes are used in forms
  const usedAttributesInForm = React.useMemo(() => {
    const used = new Set();
    (formBuilderPages || []).forEach((page) => {
      (page.questions || []).forEach((q) => q?.attribute && used.add(q.attribute));
      (page.sections || []).forEach((s) =>
        (s.questions || []).forEach((q) => q?.attribute && used.add(q.attribute))
      );
    });
    return used;
  }, [formBuilderPages]);

  // Enhanced schema switching with proper navigation
  const handleSchemaSwitch = useCallback(
    (schemaId) => {
      if (!schemaId) return;
      // Switch only if different, but always navigate to the editor
      // Use updatedOCAPackage which includes the latest changes and placeholder dependencies
      if (schemaId !== currentSchemaId) {
        switchToSchema(schemaId, updatedOCAPackage || OCAPackage);
      }
      setCurrentPage("Details");
      navigate("/start");
    },
    [currentSchemaId, switchToSchema, updatedOCAPackage, OCAPackage, setCurrentPage, navigate]
  );

  const downloadReadMe = () => {
    if (Object.keys(jsonToReadme).length > 0) {
      jsonToTextFile(jsonToReadme, OCAPackage);
    } else if (zipToReadme.length > 0) {
      toTextFile(zipToReadme);
    }
  };

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
  // 1. Current schema has Child Schema types (hasNestedSchemas)
  // 2. Package has actual dependencies (not just placeholder/empty dependencies)
  const hasHierarchy = useMemo(() => {
    if (hasNestedSchemas) return true;
    
    // Check if package has dependencies with actual attributes
    // Only show visualization if dependencies exist AND have actual content
    const dependencies = updatedOCAPackage?.dependencies || updatedOCAPackage?.oca_bundle?.dependencies || [];
    const hasActualDependencies = dependencies.length > 0 && dependencies.some(dep => {
      const attributes = dep?.capture_base?.attributes || {};
      return Object.keys(attributes).length > 0;
    });
    if (hasActualDependencies) return true;
    
    return false;
  }, [hasNestedSchemas, updatedOCAPackage]);

  // Update the package data when schemas are modified
  useEffect(() => {
    if (!OCAPackage) return;
    // Always regenerate a derived package from current multi-schema state
    const modifiedPackage = exportSchemaChanges(OCAPackage);

    setUpdatedOCAPackage(modifiedPackage);
    setVizVersion((v) => v + 1);
  }, [OCAPackage, schemaStates, exportSchemaChanges, currentSchemaId, getSchemaState]);

  // Removed in favor of global language toggle (EN/FR)

  const handleClickDownload = async () => {
    try {
      setLoading(true);
      
      // Unified export hook handles all scenarios:
      // - Imported packages (flat or nested) via exportSchemaChanges()
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
        if (OCAPackage && !currentSchemaId) {
          setLoading(true);
          return;
        }

        // CRITICAL FIX: Wait for schemaStates to contain the currentSchemaId
        // When OCA package is uploaded, schemaStates updates asynchronously
        // Use direct lookup to avoid stale getSchemaState closure
        const currentSchema = schemaStates[currentSchemaId];
        
        if (OCAPackage && currentSchemaId && !currentSchema) {
          setLoading(true);
          return;
        }

        setLoading(true);

        // Use direct lookup instead of getSchemaState to avoid stale closures
        const schemaState = currentSchema || getSchemaState(currentSchemaId);
        
        if ((OCAPackage && currentSchemaId) || (!OCAPackage && schemaState && schemaState.attributes)) {

          // Convert schema state back to the format expected by ViewGrid
          const schemaAttributes = schemaState.attributes || [];
          const formatRuleData = schemaState.formatRuleData || [];

          const formatRuleIndex = new Map(
            formatRuleData.map((r) => [
              r.Attribute,
              // Handle both legacy FormatText field and new "Format Rule" field
              r["Format Rule"] || r.FormatText || ""
            ])
          );

          // Create the display array in the format expected by ViewGrid
          const newDisplayArray = schemaAttributes.map((attr) => {
            // Get language-specific data from schema state
            const lanAttributeData = schemaState.lanAttributeRowData || {};

            // Initialize language-specific fields for all available languages
            const descriptionObj = {};
            const labelObj = {};
            const listObj = {};

            // Quick helper to derive overlay language code from UI language name
            const toLangKey = (l) =>
              l === "English"
                ? "eng"
                : l === "French"
                  ? "fra"
                  : (l || "").toLowerCase();

            // Build a map of attribute -> entryCodes array once
            const entryCodesMap = schemaState.entryCodes || {};
            const codesForAttr = Array.isArray(entryCodesMap[attr.Attribute])
              ? entryCodesMap[attr.Attribute]
              : [];

            // Initialize for all languages with proper data (accept either display name or 3-letter code)
            filteredLanguages.forEach((lang) => {
              const langKey = toLangKey(lang);
              // Try to find language data using both full name and 3-letter code
              const rowsByName = lanAttributeData[lang] || [];
              const rowsByCode = lanAttributeData[langKey] || [];
              const langDataRows = rowsByName.length > 0 ? rowsByName : rowsByCode;
              const langData = langDataRows.find(
                (item) => item.Attribute === attr.Attribute
              );

              descriptionObj[lang] = langData?.Description || attr.Description || "";
              labelObj[lang] = langData?.Label || attr.Label || "";

              // Build list text from entry codes for this language, or Not a List
              if (codesForAttr.length > 0) {
                const labelForLang = (row) =>
                  row[lang] || row[langKey] || row.English || row.eng || row.Code;
                const items = codesForAttr
                  .map((row) => labelForLang(row))
                  .filter(Boolean);
                listObj[lang] = items.length > 0 ? items.join(" | ") : t("Not a List");
              } else {
                listObj[lang] = t("Not a List");
              }
            });

            // Handle schema references (refs/refn) - these should be "Child Schema" not a type
            let displayType = attr.Type || "";
            if (displayType.startsWith("refs:") || displayType.startsWith("refn:")) {
              displayType = "Child Schema";
            }

            const charEncoding = (schemaState.characterEncodingData || {})[attr.Attribute] || "";
            
            // Find range data for this attribute
            const rangeData = (schemaState.rangeData || []).find(
              (r) => r.Attribute === attr.Attribute
            );
            
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
              "Format Rule": formatRuleIndex.get(attr.Attribute) || "",
              "Character Encoding": charEncoding,
              List: listObj,
              Unit: attr.Unit || "",
              Flagged: attr.Sensitive || false,
              // Add range overlay fields
              LowerBound: rangeData?.LowerBound || "",
              UpperBound: rangeData?.UpperBound || "",
              LowerInclusive: rangeData?.LowerInclusive !== undefined ? rangeData.LowerInclusive : true,
              UpperInclusive: rangeData?.UpperInclusive !== undefined ? rangeData.UpperInclusive : true,
              // Add unit framing field (UCUM code)
              "Unit Framing": unitFramingData?.["UCUM Code"] || ""
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
    OCAPackage,
    schemaLanguageOverride,
    i18next.language,
    getSchemaState,
    filteredLanguages,
    schemaStates, // Ensure updates when schema state changes
    getSchemaState(currentSchemaId)?.formatRuleData // Explicitly watch formatRuleData changes
  ]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Box sx={{ padding: "2rem" }}>
      {/* Header: Navigation and Action buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: isBack || !pageForward ? "space-between" : "flex-end",
          alignItems: "flex-start",
          mb: 2
        }}
      >
        {/* Back button logic */}
        {isBack && (
          <Button
            color="navButton"
            sx={{
              textAlign: "left",
              alignSelf: "flex-start",
              color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
              fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
            }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> {t("Back")}
          </Button>
        )}
        {isPageForward && !pageForward && (
          <Button
            color="navButton"
            onClick={moveBackward}
            sx={{
              textAlign: "left",
              alignSelf: "flex-start",
              color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
              fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
            }}
          >
            <ArrowBackIosIcon /> {t("Back")}
          </Button>
        )}

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Next button for page forward */}
          {isPageForward && pageForward && (
            <Button
              color="navButton"
              onClick={pageForward}
              sx={{
                color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
                fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
              }}
            >
              {t("Next")} <ArrowForwardIosIcon />
            </Button>
          )}
          
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

          {/* Finish and Download button - moved to top */}
          {isPageForward && isExport && (!isZip || (isZip && isZipEdited)) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                color="button"
                variant="contained"
                onClick={handleClickDownload}
                sx={{
                  width: "13rem",
                  display: "flex",
                  justifyContent: "space-around",
                  p: 1
                }}
                disabled={exportDisabled}
              >
                {t("Finish and Download", { defaultValue: "Finish and Download" })}{" "}
                <CheckCircleIcon />
              </Button>
              <Tooltip
                title={t(
                  "Export your schema in a .json machine-readable version and..."
                )}
                placement="right"
                arrow
              >
                <HelpOutlineIcon sx={{ fontSize: 18, color: CustomPalette.GREY_600 }} />
              </Tooltip>
            </Box>
          )}

          {/* Clear All Data button - moved to top */}
          {addClearButton && isPageForward && isExport && (!isZip || (isZip && isZipEdited)) && (
            <Button
              color="warning"
              variant="outlined"
              onClick={resetToDefaults}
              sx={{
                width: "20rem",
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
        </Box>
      </Box>
      
      {showLink && <LinkCard setShowLink={setShowLink} />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          margin: "2rem 2rem 4rem 2rem"
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%"
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%"
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center"
              }}
            >
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
                  fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
                }}
              >
                {t("Schema Language")}
              </Typography>
              <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
                <Tooltip
                  title={t(
                    "Toggles between the one or more languages used in the schema"
                  )}
                  placement="right"
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 15 }} />
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ mb: 4, width: "70rem" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column-reverse",
                  alignItems: "flex-start"
                }}
              >
                {languageButtonDisplay}
              </Box>
            </Box>
          </Box>
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
                marginRight: "4rem"
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  color: "#333"
                }}
              >
                {t("Note: Downloading two files")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  marginTop: 1
                }}
              >
                {t("1) Schema in .txt format, readable and archivable.")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  marginTop: 1
                }}
              >
                {t(
                  "2) Schema in .json format. Can be used by computers including tools on the Semantic Engine."
                )}
              </Typography>
            </Box>
          )}
        </Box>
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
            marginTop: 2
          }}
        >
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: "bold",
              color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
              fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
            }}
          >
            {t("Schema Metadata")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
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
                marginTop: 4,
                marginBottom: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
                  fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
                }}
              >
                {t("Multi-Schema Visualization", {
                  defaultValue: "Multi-Schema Visualization"
                })}
              </Typography>
              <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
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
                      border: `1px solid ${CustomPalette.PRIMARY}`,
                      color: CustomPalette.PRIMARY,
                      backgroundColor: CustomPalette.WHITE,
                      boxShadow: "none",
                      minWidth: languages.length < 5 ? "12rem" : "10rem",
                      "&:hover": {
                        boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"
                      },
                      "&.Mui-selected": {
                        backgroundColor: CustomPalette.PRIMARY,
                        color: "white",
                        "&:hover": {
                          backgroundColor: CustomPalette.PRIMARY,
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
            <Box sx={{ marginBottom: "2rem", width: "100%", minHeight: "400px" }}>
              <Suspense fallback={<Loading />}>
                <SchemaVisualizationEmbed
                  key={`viz-${vizVersion}-${updatedOCAPackage?.bundle?.d}-${currentSchemaId}-${schemaLanguageOverride || i18next.language}`}
                  schemaDescription={schemaDescription}
                  schemaLanguageOverride={getCurrentLanguage()}
                  OCAPackage={updatedOCAPackage}
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
            marginTop: 4,
            marginBottom: 2
          }}
        >
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: "bold",
              color: currentTheme?.primaryColor ?? CustomPalette.PRIMARY,
              fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
            }}
          >
            {t("Schema Details")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
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
                  overrideStyle={{ fontWeight: "500", color: CustomPalette.PRIMARY }}
                />
              ]}
            />
          </Typography>
        </ErrorPopup>
      )}
    </Box>
  );
}
