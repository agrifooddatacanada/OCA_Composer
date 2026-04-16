import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import { AgGridReact } from "ag-grid-react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import TextareaCellEditor from "../components/TextareaCellEditor";
import CellHeader from "../components/CellHeader";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { langNameFromTwoLetters, langNameFromCodeOCA, langCodeOCAFromName, LanguageConstants, resolveLanguageData } from "../utils/languageUtils";
import i18next from "i18next";
import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription,
  MAX_ATTR_LABEL_CHARS,
  FIELD_FORM_INFORMATION_OVERLAY
} from "../constants/constants";
import { getDateTimePickerConfig } from "./FormBuilder/utils/getDateTimePickerConfig";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { useOverlayGridOnGridReady } from "./gridUtils";

import "ag-grid-community/styles/ag-theme-balham.css";

const findDescription = (formatText, attributeType, t = null) => {
  if (!formatText) return "";
  const normalized = String(formatText).replace(/\\"/g, '"');
  let description = "";
  if (attributeType.includes("Date")) description = formatCodeDateDescription[normalized] || "";
  else if (attributeType.includes("Numeric")) description = formatCodeNumericDescription[normalized] || "";
  else if (attributeType.includes("Binary")) description = formatCodeBinaryDescription[normalized] || "";
  else if (attributeType.includes("Text")) description = formatCodeTextDescription[normalized] || "";
  else description = normalized;
  
  if (description && t) {
    if (i18next.exists(description)) {
      return t(description, { defaultValue: description });
    }
    return description;
  }
  return description;
};

const PLACEHOLDER_EDITABLE_TYPES = ["Text", "Array[Text]", "DateTime", "Array[DateTime]", "Numeric", "Array[Numeric]"];


const FormInformation = () => {
  const { t, i18n } = useTranslation();
  const { setCurrentPage } = useContext(Context);

  const {
    getCurrentSchemaId,
    getAttributesList,
    getFormatRuleData,
    getSchema,
    updateSchema
  } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const schemaState = getSchema();
  
  // Get schema-specific languages (not global)
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];
  
  const attributesList = getAttributesList();
  const formatRuleRowData = getFormatRuleData();
  const attributeRowData = schemaState?.attributes || [];
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const FormInformationRowData = schemaState?.FormInformationRowData || [];
  const formPlaceholdersByLanguage = schemaState?.formPlaceholdersByLanguage || {};
  
  const gridRef = useRef();
  const refContainer = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const initializationRef = useRef(false);
  
  // Use standard deletion handler
  const deleteHandler = useDeleteOverlayHandler(FIELD_FORM_INFORMATION_OVERLAY);
  
  // Reset initialization flag when schema changes
  useEffect(() => {
    initializationRef.current = false;
  }, [currentSchemaId]);

  const languageIndex = languages.findIndex(
    (item) => langNameFromTwoLetters(i18next.language) === item
  );
  const filteredLanguages = [...languages];
  if (languageIndex !== -1 && languageIndex !== 0) {
    const removedLanguage = filteredLanguages.splice(languageIndex, 1);
    filteredLanguages.unshift(removedLanguage[0]);
  }
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME);
  
  // Update currentLanguage when languages array changes
  useEffect(() => {
    // If current language is no longer in the list, switch to first available
    if (!languages.includes(currentLanguage)) {
      setCurrentLanguage(filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME);
    }
  }, [languages, currentLanguage, filteredLanguages]);
  
  const rawRows = resolveLanguageData(lanAttributeRowData, currentLanguage) || [];
  const currentRows = useMemo(() => {
    if (!attributesList?.length) return rawRows;
    const rowByAttr = Object.fromEntries((rawRows || []).map((r) => [r.Attribute, r]));
    return attributesList.map((attr) => rowByAttr[attr] || { Attribute: attr, Label: "", Placeholder: "", Description: "", List: "" });
  }, [rawRows, attributesList]);
  const primaryLanguage = languages?.[0] || LanguageConstants.DEFAULT_LANG_NAME;

  // Normalize any lan/form placeholder keys that use OCA 3-letter codes (e.g., 'eng') into UI language names (e.g., 'English')
  useEffect(() => {
    const hasOcaKeys = Object.keys(lanAttributeRowData || {}).some(k => /^[a-z]{3}$/.test(k));
    const hasOcaPlaceholders = Object.keys(formPlaceholdersByLanguage || {}).some(k => /^[a-z]{3}$/.test(k));
    if (!hasOcaKeys && !hasOcaPlaceholders) return;

    const normalizedLan = {};
    Object.entries(lanAttributeRowData || {}).forEach(([k, v]) => {
      const name = langNameFromCodeOCA(k) || langNameFromTwoLetters(k) || k;
      normalizedLan[name] = v;
    });

    const normalizedPlaceholders = {};
    Object.entries(formPlaceholdersByLanguage || {}).forEach(([k, v]) => {
      const name = langNameFromCodeOCA(k) || langNameFromTwoLetters(k) || k;
      normalizedPlaceholders[name] = v;
    });

    updateSchema({ lanAttributeRowData: normalizedLan, formPlaceholdersByLanguage: normalizedPlaceholders });
    // also update grid immediately (resolve robustly) and refresh cells so Format column updates
    try {
      if (gridRef.current?.api) {
        const normalizedRows = resolveLanguageData(normalizedLan, currentLanguage) || [];
        gridRef.current.api.setRowData(normalizedRows);
        gridRef.current.api.refreshCells({ force: true });
      }
    } catch (e) {
      // ignore
    }
  }, [lanAttributeRowData, formPlaceholdersByLanguage, currentLanguage, updateSchema]);

  // Ensure lanAttributeRowData has rows for all languages (import or fresh init)
  useEffect(() => {
    // Prevent repeated initialization runs
    if (initializationRef.current) return;

    // If we already have rows for every language, do nothing
    const hasAllLanguages = languages && languages.length > 0 &&
      languages.every((lang) => Array.isArray(lanAttributeRowData?.[lang]) && lanAttributeRowData[lang].length > 0);
    if (hasAllLanguages) return;
    if (!attributesList || attributesList.length === 0) return;

    // Build base rows per language from attributes + FormInformationRowData + placeholders
    const newLan = { ...(lanAttributeRowData || {}) };
    languages.forEach((lang) => {
      const existing = newLan[lang];
      if (existing && existing.length > 0) return; // don't overwrite existing data

      const langPlaceholders = formPlaceholdersByLanguage?.[lang] || {};
      const rows = attributesList.map((attrName, idx) => {
        const attrType = attributeRowData.find((r) => r.Attribute === attrName)?.Type || "";
        const baseRow = FormInformationRowData[idx] || {};

        // Pick label: prefer per-language FormInformationRowData label if object, else string, else attr name
        let label = attrName;
        const baseLabel = baseRow?.Label;
        if (baseLabel && typeof baseLabel === "object" && baseLabel !== null) {
          label = baseLabel[lang] || label;
        } else if (typeof baseLabel === "string" && baseLabel.trim()) {
          label = baseLabel;
        }

        // Pick placeholder: prefer formPlaceholdersByLanguage, else FormInformationRowData placeholder (object or string)
        let placeholder = langPlaceholders[attrName] || "";
        if (!placeholder) {
          const basePlaceholder = baseRow?.Placeholder;
          if (basePlaceholder && typeof basePlaceholder === "object" && basePlaceholder !== null) {
            placeholder = basePlaceholder[lang] || "";
          } else if (typeof basePlaceholder === "string") {
            placeholder = basePlaceholder;
          }
        }

        // Clear placeholder for Binary/Boolean types
        if (attrType.includes("Binary") || attrType.includes("Boolean")) {
          placeholder = "";
        }

        return {
          Attribute: attrName,
          Label: label,
          Placeholder: placeholder,
          Description: baseRow?.Description || "",
          List: baseRow?.List || ""
        };
      });

      newLan[lang] = rows;
    });

    // Only update if we actually added data
    // If any language is missing and we built rows for it, update the schema state
    const didAdd = languages.some(
      (lang) => Array.isArray(newLan[lang]) && newLan[lang].length > 0 && !(Array.isArray(lanAttributeRowData?.[lang]) && lanAttributeRowData[lang].length > 0)
    );

    // Only perform the update once per component mount to avoid loops
    if (didAdd && !initializationRef.current) {
      initializationRef.current = true;
      updateSchema({ lanAttributeRowData: newLan });
      // Immediately update grid so UI shows rows even if context update hasn't propagated
      try {
        if (gridRef.current?.api) {
          const newRows = resolveLanguageData(newLan, currentLanguage) || [];
          gridRef.current.api.setRowData(newRows);
        }
      } catch (e) {
        // ignore grid errors during initialization
      }

      // Check shortly after to confirm the update persisted in context
      setTimeout(() => {
        try {
          const stateAfter = getSchema();
          // If attributeFormats exist, force a refresh of cells so Format column renders descriptions
          try {
            if (gridRef.current?.api && stateAfter?.attributeFormats && Object.keys(stateAfter.attributeFormats).length > 0) {
              gridRef.current.api.refreshCells({ force: true });
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.error('[FormInformation] error reading schema state after update', e);
        }
      }, 50);
    }
  }, [attributesList,
     attributeRowData, 
     currentLanguage, 
     languages, 
     FormInformationRowData, 
     formPlaceholdersByLanguage, 
     lanAttributeRowData, 
     updateSchema, 
     currentSchemaId]);

  // Update currentLanguage when global UI language changes
  useEffect(() => {
    const userLanguage = langNameFromTwoLetters(i18next.language);
    if (userLanguage && languages.includes(userLanguage)) {
      setCurrentLanguage(userLanguage);
    }
  }, [i18next.language, languages]);

  useEffect(() => {
    const newLanData = (() => {
      const prevLanData = lanAttributeRowData || {};
      const prev = prevLanData;
      const newLan = JSON.parse(JSON.stringify(prev));
      languages.forEach((language) => {
        if (newLan[language]) {
          const langPlaceholders = formPlaceholdersByLanguage?.[language] || {};
          newLan[language] = newLan[language].map((item, idx) => {
            const attr = item.Attribute;
            const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";

            if (attrType.includes("Binary") || attrType.includes("Boolean")) {
              return {
                ...item,
                Placeholder: ""
              };
            }

            const hasExplicitFormPlaceholder =
              Object.prototype.hasOwnProperty.call(langPlaceholders, attr);

            if (hasExplicitFormPlaceholder) {
              return {
                ...item,
                Placeholder: langPlaceholders[attr] ?? ""
              };
            }

            let dateTimeDefaultPlaceholder = "";
            const isDateTimeType = attrType === "DateTime" || attrType === "Array[DateTime]";
            if (isDateTimeType) {
              const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attr);
              if (formatRule?.FormatText) {
                const formatDescription = formatCodeDateDescription[formatRule.FormatText] || "";
                if (formatDescription) {
                  const config = getDateTimePickerConfig(formatDescription);
                  dateTimeDefaultPlaceholder = config.displayFormat;
                }
              }
            }

            let numericDefaultPlaceholder = "";
            const isNumericType = attrType === "Numeric" || attrType === "Array[Numeric]";
            if (isNumericType) {
              const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attr);
              if (formatRule?.FormatText) {
                const formatDescription = formatCodeNumericDescription[formatRule.FormatText] || "";
                if (formatDescription) {
                  switch (formatDescription) {
                    case "any integer or decimal number, may begin with + or -":
                      numericDefaultPlaceholder = "Enter any integer or decimal number";
                      break;
                    case "any integer":
                      numericDefaultPlaceholder = "Enter any integer";
                      break;
                    default:
                      numericDefaultPlaceholder = formatDescription;
                      break;
                  }
                }
              }
            }

            let basePlaceholder = langPlaceholders[attr] || "";
            if (!basePlaceholder) {
              const basePlaceholderValue = FormInformationRowData?.[idx]?.Placeholder;
              if (typeof basePlaceholderValue === "object" && basePlaceholderValue !== null) {
                basePlaceholder = basePlaceholderValue[language] || "";
              } else {
                basePlaceholder = basePlaceholderValue || "";
              }
            }

            let finalPlaceholder = item.Placeholder;
            if (!finalPlaceholder) {
              if (basePlaceholder) {
                finalPlaceholder = basePlaceholder;
              } else if (isDateTimeType) {
                finalPlaceholder = dateTimeDefaultPlaceholder;
              } else if (isNumericType) {
                finalPlaceholder = numericDefaultPlaceholder;
              } else {
                finalPlaceholder = "";
              }
            }

            return {
              ...item,
              Placeholder: finalPlaceholder
            };
          });
        }
      });

      try {
        if (JSON.stringify(prev) === JSON.stringify(newLan)) {
          return prevLanData;
        }
      } catch (e) {
      }

      setTimeout(() => {
        try {
          if (gridRef.current?.api) gridRef.current.api.refreshCells({ force: true });
        } catch (e) {
        }
      }, 40);

      return newLan;
    })();
    updateSchema({ lanAttributeRowData: newLanData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    languages,
    attributesList,
    FormInformationRowData,
    attributeRowData,
    formatRuleRowData,
    formPlaceholdersByLanguage
  ]);

  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      if (
        gridRef.current?.api &&
        refContainer.current &&
        !refContainer.current.contains(event.target)
      ) {
        gridRef.current.api.stopEditing();
      }
    };
    document.addEventListener("click", handleClickOutsideGrid);
    return () => document.removeEventListener("click", handleClickOutsideGrid);
  }, [gridRef, refContainer]);

  const displayLanguageArray = [];
  for (let i = 0; i < filteredLanguages.length; i += 6) {
    const languageRow = filteredLanguages.slice(i, i + 6).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const createLanguageRow = (languageArray, rowIndex) => {
    const languageRowDisplay = languageArray.map((language, index) => {
      let isFirstButton;
      if (languages.length > 6) {
        if (
          displayLanguageArray[rowIndex + 1] &&
          displayLanguageArray[rowIndex + 1].length === 6
        ) {
          isFirstButton =
            language === displayLanguageArray[displayLanguageArray.length - 1][0];
        } else {
          isFirstButton = index === 0;
        }
      } else {
        isFirstButton = index === 0;
      }
      const isLastButton = language === filteredLanguages[languages.length - 1];
      let borderRadius = "";
      if (isFirstButton && isLastButton) borderRadius = "8px 8px 0 0";
      else if (isFirstButton) borderRadius = "8px 0 0 0";
      else if (isLastButton) borderRadius = "0 8px 0 0";
      else borderRadius = "0";
      return (
        <Button
          key={language}
          onClick={() => {
            handleSave();
            setCurrentLanguage(language);
          }}
          color="button"
          variant="contained"
          sx={{
            backgroundColor:
              currentLanguage === language
                ? CustomPalette.PRIMARY
                : CustomPalette.WHITE,
            color:
              currentLanguage === language
                ? "white"
                : CustomPalette.PRIMARY,
            borderRadius,
            width: languages.length < 5 ? "12rem" : "8.335rem",
            boxShadow: "none",
            border: `1px solid ${CustomPalette.PRIMARY}`,
            "&:hover": {
              backgroundColor:
                currentLanguage === language
                  ? CustomPalette.PRIMARY
                  : CustomPalette.WHITE,
              boxShadow:
                currentLanguage === language
                  ? "none"
                  : undefined
            }
          }}
        >
          <Typography noWrap variant="button">
            {t(language, { defaultValue: language })}
          </Typography>
        </Button>
      );
    });
    return languageRowDisplay;
  };

  const languageButtonDisplay = displayLanguageArray.map((languageSegment, index) => (
    <Box key={index}>{createLanguageRow(languageSegment, index)}</Box>
  ));

  const handleSave = useCallback(() => {
    if (gridRef.current?.api) gridRef.current.api.stopEditing();
  }, []);

  const onGridReady = useOverlayGridOnGridReady(setLoading);

  const getRowHeight = useCallback((params) => {
    const attrH = measureTextHeight(params.data?.Attribute || "", 164);
    const labelH = measureTextHeight(params.data?.Label || "", 224);
    const placeholderH = measureTextHeight(params.data?.Placeholder || "", 224);
    const attrName = params.data?.Attribute;
    const attrType = attributeRowData.find((r) => r.Attribute === attrName)?.Type || "";
    const formatRule = formatRuleRowData.find((r) => r.Attribute === attrName);
    const formatDesc = findDescription(formatRule?.FormatText, attrType, t);
    const formatH = measureTextHeight(formatDesc || "", 284);
    const maxH = Math.max(attrH, labelH, placeholderH, formatH);
    return Math.max(32, maxH + 4);
  }, [attributeRowData, formatRuleRowData, t]);

  const columnDefs = useMemo(() => {
    return [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "FormatRule",
        editable: false,
        width: 300,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Format Rule"),
          helpText: t(
            "Select the formatting rule that applies to data for each attribute"
          )
        },
        cellRenderer: (props) => {
          const attributeName = props.data.Attribute;
          const attributeType =
            attributeRowData.find((r) => r.Attribute === attributeName)?.Type || "";
          const formatRule = formatRuleRowData.find(
            (rule) => rule.Attribute === attributeName
          );
          const formatText = formatRule?.FormatText || "";
          const description = findDescription(formatText, attributeType, t);
          if (!formatText || !description)
            return (
              <span style={{ color: "#999", fontStyle: "italic" }}>
                {t("No format rule")}
              </span>
            );
          return (
            <span
              style={{
                display: "inline-block",
                width: "100%",
                fontSize: "12px",
                color: "#333",
                wordWrap: "break-word",
                whiteSpace: "normal",
                lineHeight: "2.5"
              }}
            >
              {description}
            </span>
          );
        }
      },
      {
        field: "Label",
        headerName: `${t("Label")} (${currentLanguage || ""})`,
        editable: true,
        width: 240,
        wrapText: true,
        cellEditor: TextareaCellEditor,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Label"),
          constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
          helpText: t("This is the language specific label for an attribute")
        },
        cellEditorParams: { maxLength: MAX_ATTR_LABEL_CHARS },
        valueSetter: (params) => {
          const attr = params.data.Attribute;
          const newValue = params.newValue ?? "";
          params.data.Label = newValue;
          const prev = lanAttributeRowData || {};
          const langRows = prev[currentLanguage] || [];
          const rowByAttr = Object.fromEntries(langRows.map((r) => [r.Attribute, r]));
          const updated = attributesList.map((a) => {
            const r = rowByAttr[a] || { Attribute: a, Label: "", Placeholder: "", Description: "", List: "" };
            return a === attr ? { ...r, Label: newValue } : r;
          });
          updateSchema({ lanAttributeRowData: { ...prev, [currentLanguage]: updated } });
        }
      },
      {
        field: "Placeholder",
        headerName: `${t("Placeholder")} (${currentLanguage || ""})`,
        editable: (params) => {
          const attr = params.data.Attribute;
          const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";
          return PLACEHOLDER_EDITABLE_TYPES.includes(attrType);
        },
        width: 283,
        wrapText: true,
        cellEditor: TextareaCellEditor,
        cellStyle: (params) => {
          const attr = params.data.Attribute;
          const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";
          const isEditable = PLACEHOLDER_EDITABLE_TYPES.includes(attrType);
          const base = isEditable ? preWrapWordBreak : greyCellStyle;
          return base;
        },
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Placeholder"),
          constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
          helpText: t(
            "Shown to users in forms. Available for Text, Array[Text], DateTime, Array[DateTime], Numeric, and Array[Numeric] types."
          )
        },
        cellEditorParams: { maxLength: MAX_ATTR_LABEL_CHARS },
        valueSetter: (params) => {
          const attr = params.data.Attribute;
          const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";
          const isEditable = PLACEHOLDER_EDITABLE_TYPES.includes(attrType);
          if (!isEditable) return true;
          const newValue = params.newValue ?? "";
          params.data.Placeholder = newValue;

          const prevLan = lanAttributeRowData || {};
          const langRows = prevLan[currentLanguage] || [];
          const rowByAttr = Object.fromEntries(langRows.map((r) => [r.Attribute, r]));
          const updatedLanRows = attributesList.map((a) => {
            const r = rowByAttr[a] || { Attribute: a, Label: "", Placeholder: "", Description: "", List: "" };
            return a === attr ? { ...r, Placeholder: newValue } : r;
          });

          const prevFp = formPlaceholdersByLanguage || {};
          const nextFp = { ...prevFp };
          const langMap = { ...(nextFp[currentLanguage] || {}) };
          langMap[attr] = newValue;
          nextFp[currentLanguage] = langMap;

          updateSchema({
            formPlaceholdersByLanguage: nextFp,
            lanAttributeRowData: { ...prevLan, [currentLanguage]: updatedLanRows }
          });
          return true;
        },
        valueGetter: (params) => {
          const attr = params.data.Attribute;
          const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";
          // Clear placeholder for Binary and Boolean types
          if (attrType.includes("Binary") || attrType.includes("Boolean")) {
            return "";
          }
          return params.data.Placeholder || "";
        }
      }
    ];
  }, [attributeRowData, formatRuleRowData, currentLanguage, t, updateSchema, formPlaceholdersByLanguage, lanAttributeRowData, attributesList]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const raf = requestAnimationFrame(() => {
      api.resetRowHeights();
    });
    return () => cancelAnimationFrame(raf);
  }, [currentLanguage]);
  

  const onCellKeyDown = useCallback((e) => {
    const keyPressed = e.event.code;
    const isLabelRow = e.column.colId === "Label";
    if (keyPressed === "Enter" && isLabelRow) {
      const { api } = e;
      const editingRowIndex = e.rowIndex;
      api.setFocusedCell(editingRowIndex + 1, "Label");
    }
  }, []);
  

  const validateRows = useCallback(() => {
    if (!gridRef.current?.api) return { ok: true };
    gridRef.current.api.stopEditing();
    const rows = [];
    gridRef.current.api.forEachNode((node) => rows.push(node.data));
    const gridByAttr = Object.fromEntries(rows.map((r) => [r.Attribute, r]));
    const primaryRows =
      resolveLanguageData(lanAttributeRowData, primaryLanguage) ||
      lanAttributeRowData?.[primaryLanguage] ||
      [];
    const useGridForPrimaryLabels = currentLanguage === primaryLanguage;
    for (const attr of attributesList) {
      const row = useGridForPrimaryLabels
        ? gridByAttr[attr]
        : primaryRows.find((r) => r.Attribute === attr);
      if (!row?.Label || `${row.Label}`.trim() === "") {
        return {
          ok: false,
          msg: `${t("Label")} - ${t("Please fill out all fields")} (${attr})`
        };
      }
    }
    return { ok: true, rows };
  }, [attributesList, lanAttributeRowData, primaryLanguage, currentLanguage, t]);

  const handleForward = useCallback(() => {
    handleSave();
    const result = validateRows();
    if (!result.ok) {
      setErrorMessage(result.msg || t("Error"));
      setTimeout(() => setErrorMessage(""), 2500);
      return;
    }
    if (result.rows) updateSchema({ FormInformationRowData: result.rows });
    setCurrentPage("FormBuilder");
  }, [handleSave, t, validateRows, setCurrentPage, updateSchema]);

  const handleBack = useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  const handleDeleteCurrentOverlay = useCallback(() => {
    // Clean up FormBuilder data before deletion
    updateSchema({ formBuilderPages: [] });
    // Use standard deletion handler
    deleteHandler();
  }, [deleteHandler, updateSchema]);

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setCurrentPage("Overlays")}
      errorMessage={errorMessage}
    >
      {loading && (FormInformationRowData?.length || 0) > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box sx={{ margin: "2rem", marginTop: "0.5rem", marginBottom: BETWEEN_SECTION_SPACING }}>
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: CustomPalette.GREY_800, textAlign: "center", mb: 4 }}>
            {t("Placeholder Editor")}
          </Typography>
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: languages.length < 6 ? "flex-start" : "flex-end",
            mb: 2,
            gap: 1
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
              title={t("Toggles between the one or more languages used in the schema")}
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
        <div ref={refContainer}>
          <Box
            className="ag-theme-balham form-information-grid overlay-grid-suppress-hscroll"
            sx={{ width: 1003 }}
          >
            <style>{gridStyles}</style>
            <AgGridReact
              key={i18n.language}
              ref={gridRef}
              rowData={currentRows}
              getRowId={(params) => params.data.Attribute}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressHorizontalScroll
              onCellKeyDown={onCellKeyDown}
              animateRows={true}
              onGridReady={onGridReady}
              getRowHeight={getRowHeight}
              overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            />
          </Box>
        </div>
      </Box>
    </BackNextSkeleton>
  );
};

export default FormInformation;
