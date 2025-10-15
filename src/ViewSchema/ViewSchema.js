import React, { useContext, useState, useEffect, useCallback, Suspense } from "react";
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

import useExportLogic from "./useExportLogic";
import Loading from "../components/Loading";
import useExportLogicV2 from "./useExportLogicV2";
import useMultiSchemaExport from "../hooks/useMultiSchemaExport";
import useGenerateReadMe from "./useGenerateReadMe";
import useGenerateReadMeV2 from "./useGenerateReadMeV2";

import { codesToLanguages } from "../constants/isoCodes";

import ErrorPopup from "./ErrorPopup";
import CustomRouterLink from "../components/CustomRouterLink";

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
    languages, 
    schemaDescription, 
    isZip, 
    isZipEdited, 
    setIsZipEdited,
    setCurrentPage, 
    history,
    setHistory,
    zipToReadme,
    jsonToReadme,
    OCAPackage 
  } = useContext(Context);

  // Multi-schema context
  const {
    activeSchemaId,
    switchToSchema,
    exportSchemaChanges,
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
            setCurrentLanguage(language);
          }}
          key={language}
          color="button"
          variant="contained"
          sx={{
            backgroundColor:
              currentLanguage === language
                ? CustomPalette.PRIMARY
                : CustomPalette.SECONDARY,
            borderRadius,
            minWidth: languages.length < 5 ? "12rem" : "10rem",
            boxShadow: "none",
            border: `0.5px solid ${CustomPalette.PRIMARY}`
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
  const [displayArray, setDisplayArray] = useState([]);
  const { resetToDefaults, exportDisabled } = useExportLogic();
  const {
    error: exportError,
    clearError
  } = useExportLogicV2();
  const {
    exportData: multiSchemaExportData,
    error: multiSchemaExportError,
    clearError: clearMultiSchemaError
  } = useMultiSchemaExport();
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateReadMeV2();
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
    [activeSchemaId, switchToSchema, OCAPackage, setCurrentPage, navigate]
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
  // Only show multi-schema visualization if we have child schemas (refs: or refn: types)
  const hasHierarchy = React.useMemo(() => {
    if (!OCAPackage) return false;
    
    // Simple check: if the OCA package has dependencies, it's a multi-schema structure
    return OCAPackage.dependencies && OCAPackage.dependencies.length > 0;
  }, [OCAPackage]);

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
      // Always export the complete package with all schema changes
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
            const fallbackDisplayArray = (currentSchemaState?.attributes || []).map(
              (attr) => ({
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
              })
            );
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
              color: CustomPalette.PRIMARY
            }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> {t("Back")}
          </Button>
        )}
        {isPageForward && !pageForward && (
          <Button
            color="navButton"
            sx={{
              textAlign: "left",
              alignSelf: "flex-start",
              color: CustomPalette.PRIMARY
            }}
            onClick={moveBackward}
          >
            <ArrowBackIosIcon /> {t("Back")}
          </Button>
        )}

        {/* Next button for page forward */}
        {isPageForward && pageForward && (
          <Button
            color="navButton"
            onClick={pageForward}
            sx={{ color: CustomPalette.PRIMARY }}
          >
            {t("Next")} <ArrowForwardIosIcon />
          </Button>
        )}
        
        <Box sx={{ display: "flex", gap: 2 }}>
          {isZip && (
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

      {/* Note about downloading files */}
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

      {/* Language selector */}
      <Box sx={{ marginTop: 4 }}>
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
              color: CustomPalette.PRIMARY
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

      {/* Schema Metadata section */}
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
            color: CustomPalette.PRIMARY
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
      <SchemaDescription key={currentLanguage} currentLanguage={currentLanguage} />

      {/* Multi-Schema Visualization */}
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
            <Suspense
              fallback={
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "70vh"
                  }}
                >
                  <Loading />
                </Box>
              }
            >
              <SchemaVisualizationEmbed
                key={`viz-${vizVersion}-${updatedOCAPackage?.bundle?.d}-${activeSchemaId}`}
                attributeRowData={(() => {
                  // Get attribute data from MultiSchema context for visualization
                  const currentSchemaId =
                    activeSchemaId ||
                    OCAPackage?.bundle?.d ||
                    OCAPackage?.bundle?.capture_base?.d;
                  const schemaState = getSchemaState(currentSchemaId);
                  return schemaState?.attributes || [];
                })()}
                schemaDescription={schemaDescription}
                languages={filteredLanguages}
                OCAPackage={updatedOCAPackage}
                lanAttributeRowData={(() => {
                  // Get language attribute data from MultiSchema context for visualization
                  const currentSchemaId =
                    activeSchemaId ||
                    OCAPackage?.bundle?.d ||
                    OCAPackage?.bundle?.capture_base?.d;
                  const schemaState = getSchemaState(currentSchemaId);
                  
                  // Extract updated labels from schema state same way as Schema Details table
                  const lanAttributeData = schemaState.lanAttributeRowData || {};
                  const updatedLabels = {};
                  
                  // Process each language
                  Object.keys(lanAttributeData).forEach(langKey => {
                    const langDataRows = lanAttributeData[langKey] || [];
                    if (Array.isArray(langDataRows)) {
                      langDataRows.forEach((item, index) => {
                        if (item.Attribute && item.Label) {
                          if (!updatedLabels[item.Attribute]) {
                            updatedLabels[item.Attribute] = {};
                          }
                          updatedLabels[item.Attribute][langKey] = item.Label;
                        }
                      });
                    }
                  });
                  return updatedLabels;
                })()}
                viewMode={visualizationMode}
                height="70vh"
                currentSchemaId={activeSchemaId}
                setCurrentSchemaId={handleSchemaSwitch}
              />
            </Suspense>
          </Box>
        </>
      )}

      {/* Schema Details header and grid */}
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
            color: CustomPalette.PRIMARY
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
