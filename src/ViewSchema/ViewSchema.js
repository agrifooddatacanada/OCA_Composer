import React, { useContext, useState, useEffect, useCallback } from "react";
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
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import CustomPalette from "../constants/customPalette";
import SchemaDescription from "./SchemaDescription";
import ViewGrid from "./ViewGrid";

import useExportLogic from "./useExportLogic";
import Loading from "../components/Loading";
import useExportLogicV2 from "./useExportLogicV2";
import useMultiSchemaExport from "../hooks/useMultiSchemaExport";

import { codesToLanguages } from "../constants/isoCodes";

import ErrorPopup from "./ErrorPopup";
import CustomRouterLink from "../components/CustomRouterLink";
import SchemaVisualizationEmbed from "../SchemaVisualization/SchemaVisualizationEmbed";

export default function ViewSchema({
  isExport = true,
  addClearButton,

  isPageForward = true
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    languages,
    schemaDescription,
    isZip,
    isZipEdited,
    setCurrentPage,
    OCAPackage
  } = useContext(Context);

  // Multi-schema context
  const {
    activeSchemaId,
    switchToSchema,
    exportSchemaChanges,
    getModifiedSchemas,

    getSchemaState,
    schemaStates
  } = useMultiSchema();

  const languageIndex = languages.findIndex(
    (item) => codesToLanguages?.[i18next.language] === item
  );
  const filteredLanguages = React.useMemo(() => {
    const arr = [...languages];
    if (languageIndex !== -1 && languageIndex !== 0) {
      const removedLanguage = arr.splice(languageIndex, 1);
      arr.unshift(removedLanguage[0]);
    }
    return arr;
  }, [languages, languageIndex]);
  
  // Make currentLanguage responsive to UI language changes
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  
  // Update currentLanguage when UI language changes
  useEffect(() => {
    const uiLanguageName = codesToLanguages?.[i18next.language];
    if (uiLanguageName && languages.includes(uiLanguageName)) {
      setCurrentLanguage(uiLanguageName);
    } else {
      setCurrentLanguage(filteredLanguages[0]);
    }
  }, [t, languages, filteredLanguages]); // Use 't' to track language changes
  const [displayArray, setDisplayArray] = useState([]);
  const { resetToDefaults, exportDisabled } = useExportLogic();
  const {
    exportData: originalExportData,
    error: exportError,
    clearError
  } = useExportLogicV2();
  const {
    exportData: multiSchemaExportData,
    error: multiSchemaExportError,
    clearError: clearMultiSchemaError
  } = useMultiSchemaExport();
  const [loading, setLoading] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState("detailed");
  const [updatedOCAPackage, setUpdatedOCAPackage] = useState(OCAPackage);
  const [vizVersion, setVizVersion] = useState(0);

  // (unused helper removed)

  // Enhanced schema switching with proper navigation
  const handleSchemaSwitch = useCallback(
    (schemaId) => {
      if (!schemaId) return;
      // Switch only if different, but always navigate to the editor
      if (schemaId !== activeSchemaId) {
        switchToSchema(schemaId, OCAPackage);
      }
      setCurrentPage("Details");
      navigate("/start");
    },
    [
      activeSchemaId,
      switchToSchema,
      OCAPackage,
      setCurrentPage,
      navigate
    ]
  );

  // readme hooks not used on this page
  // Always show multi-schema visualization if we have an OCA package
  const hasHierarchy = !!OCAPackage;

  // Update the package data when schemas are modified
  useEffect(() => {
    if (!OCAPackage) return;
    // Always regenerate a derived package from current multi-schema state
    const modifiedPackage = exportSchemaChanges(OCAPackage);
    setUpdatedOCAPackage(modifiedPackage);
    setVizVersion((v) => v + 1);
  }, [OCAPackage, schemaStates, exportSchemaChanges]);

  // Removed in favor of global language toggle (EN/FR)

  const handleClickDownload = async () => {
    try {
      setLoading(true);
      // Use multi-schema export if we have modified schemas
      const modifiedSchemas = getModifiedSchemas();
      if (modifiedSchemas.length > 0) {
        // Export with schema changes already reflected in updatedOCAPackage
        const pkg = updatedOCAPackage || exportSchemaChanges(OCAPackage);
        try {
          await multiSchemaExportData(pkg);
        } catch (exportError) {
          // If the main export fails, we'll use our fallback
        }
        // Fallback: trigger a JSON download if the exporter didn't prompt a file save
        const blob = new Blob([JSON.stringify(pkg, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "oca_bundle.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        // Clear any export errors since we successfully downloaded
        clearError();
        clearMultiSchemaError();
      } else {
        // Use original export logic
        await originalExportData();
      }
    } catch (error) {
      // console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load schema data when component mounts or when active schema changes
  useEffect(() => {
    const loadSchemaData = async () => {
      try {
        setLoading(true);

        if (OCAPackage) {
          // Use activeSchemaId for current schema
          let currentSchemaId = activeSchemaId;

          // Validate that the selected schema actually exists in the package
          if (currentSchemaId) {
            const schemaExists = getSchemaState(currentSchemaId);
            if (!schemaExists || !schemaExists.initialized) {
              // console.warn("ViewSchema: Selected schema", currentSchemaId, "not found or not initialized, falling back to root schema");
              currentSchemaId = null;
            }
          }

          // If no schema is set or it doesn't exist, use the root schema
          if (!currentSchemaId) {
            currentSchemaId = OCAPackage.bundle?.d || OCAPackage.bundle?.capture_base?.d;
          }

          if (currentSchemaId) {
            const schemaState = getSchemaState(currentSchemaId);
            
            if (schemaState && schemaState.initialized) {
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
                  const rowsByCode = lanAttributeData[langKey] || [];
                  const rowsByName = lanAttributeData[lang] || [];
                  const langData = (rowsByCode.length ? rowsByCode : rowsByName).find(
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
                    listObj[lang] = items.length > 0 ? items.join(" | ") : "Not a List";
                  } else {
                    listObj[lang] = "Not a List";
                  }
                });

                // Handle schema references (refs/refn) - these should be "Child Schema" not a type
                let displayType = attr.Type || "";
                if (displayType.startsWith("refs:") || displayType.startsWith("refn:")) {
                  displayType = "Child Schema";
                }

                return {
                  Attribute: attr.Attribute,
                  Type: displayType,
                  Description: descriptionObj,
                  Label: labelObj,
                  Required: !!attr.Required,
                  "Format Rule": formatRuleIndex.get(attr.Attribute) || "",
                  "Character Encoding":
                    (schemaState.characterEncodingData || []).find(
                      (r) => r.Attribute === attr.Attribute
                    )?.["Character Encoding"] || "",
                  List: listObj,
                  Unit: attr.Unit || "",
                  Flagged: attr.Flagged || false
                };
              });

              setDisplayArray(newDisplayArray);
            } else {
              // Fallback: create basic display array from schema attributes
              const fallbackDisplayArray = (schemaState.attributes || []).map((attr) => ({
                Attribute: attr.Attribute,
                Type: attr.Type || "",
                Description: { [currentLanguage]: attr.Description || "" },
                Label: { [currentLanguage]: attr.Label || "" },
                Required: !!attr.Required,
                "Format Rule": "",
                "Character Encoding": "",
                List: { [currentLanguage]: "Not a List" },
                Unit: attr.Unit || "",
                Flagged: attr.Flagged || false
              }));
              setDisplayArray(fallbackDisplayArray);
            }
          } else {
            // Create display array from schema attributes if available
            const currentSchemaState = getSchemaState(currentSchemaId);
            const fallbackDisplayArray = (currentSchemaState?.attributes || []).map((attr) => ({
              Attribute: attr.Attribute,
              Type: attr.Type || "",
              Description: { [currentLanguage]: attr.Description || "" },
              Label: { [currentLanguage]: attr.Label || "" },
              Required: !!attr.Required,
              "Format Rule": "",
              "Character Encoding": "",
              List: { [currentLanguage]: "Not a List" },
              Unit: attr.Unit || "",
              Flagged: attr.Flagged || false
            }));
            setDisplayArray(fallbackDisplayArray);
          }
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

    const timer = setTimeout(() => {
      loadSchemaData();
    }, 100);

    return () => clearTimeout(timer);
  }, [
    activeSchemaId,
    OCAPackage,
    currentLanguage,
    getSchemaState,
    filteredLanguages,
    schemaStates // Add this to ensure updates when schema state changes
  ]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Box sx={{ padding: "2rem" }}>
      {/* Header: Schema description + actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2
        }}
      >
        <SchemaDescription currentLanguage={currentLanguage} />
        <Box sx={{ display: "flex", gap: 2 }}>
          {isPageForward && isExport && (!isZip || (isZip && isZipEdited)) && (
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
          )}
          {addClearButton && (
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

      {/* Multi-Schema Visualization (moved above details) */}
      {hasHierarchy && (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginTop: 2,
              marginBottom: 1
            }}
          >
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: "bold",
                color: CustomPalette.PRIMARY
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
                    backgroundColor: CustomPalette.PINK_100,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: CustomPalette.PINK_200
                    }
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    color: CustomPalette.WHITE,
                    backgroundColor: CustomPalette.PRIMARY,
                    "&:hover": {
                      backgroundColor: CustomPalette.SECONDARY
                    }
                  }
                }}
              >
                <ToggleButton value="detailed">Attribute-to-Schema</ToggleButton>
                <ToggleButton value="tree">Schema-to-Schema</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Box sx={{ mb: 4, width: "100%" }}>
            <SchemaVisualizationEmbed
              key={`viz-${vizVersion}-${updatedOCAPackage?.bundle?.d}-${getModifiedSchemas().length}`}
              attributeRowData={(() => {
                // Get attribute data from MultiSchema context for visualization
                const currentSchemaId = activeSchemaId || (OCAPackage?.bundle?.d || OCAPackage?.bundle?.capture_base?.d);
                const schemaState = getSchemaState(currentSchemaId);
                return schemaState?.attributes || [];
              })()}
              schemaDescription={schemaDescription}
              languages={filteredLanguages}
              OCAPackage={updatedOCAPackage}
              viewMode={visualizationMode}
              height="70vh"
              currentSchemaId={activeSchemaId}
              setCurrentSchemaId={handleSchemaSwitch}
            />
          </Box>
        </>
      )}

      {/* Attribute Details header and grid */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography
          sx={{ fontSize: 22, fontWeight: "bold", color: CustomPalette.PRIMARY }}
        >
          {(() => {
            const name = (() => {
              try {
                const st = getSchemaState(activeSchemaId);
                return st?.metadata?.name || "";
              } catch (_) {
                return "";
              }
            })();
            const label = t(
              name ? `Attribute Details for "${name}"` : "Attribute Details"
            );
            return label;
          })()}
        </Typography>
        <Box sx={{ marginLeft: "0.5rem", color: CustomPalette.GREY_600 }}>
          <Tooltip
            title="This table shows each attribute with its labels, descriptions, required status, format rules, and units"
            placement="right"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ marginBottom: "2rem" }}>
        <ViewGrid
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
          displayArray={displayArray}
          setDisplayArray={setDisplayArray}
        />
      </Box>

      {/* Moved action buttons to header above */}

      {/* Error Popup */}
      {(exportError || multiSchemaExportError) && (
        <ErrorPopup
          onClose={() => {
            clearError();
            clearMultiSchemaError();
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
