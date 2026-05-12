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
import { langNameFromTwoLetters, langNameFromCodeOCA, LanguageConstants, resolveLanguageData } from "../utils/languageUtils";
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
import usePrimaryColor from "../hooks/usePrimaryColor";

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

// -----------------------------------------------------------------------------
// Pure helpers for FormInformation row maintenance.
//
// All three return the *same reference* when no work is needed, so the
// orchestrating effect below can use identity comparison (`!== prev`) instead
// of stringifying the whole tree.
// -----------------------------------------------------------------------------

/**
 * Normalize OCA 3-letter language codes (eng, fra, ...) in row maps to UI
 * language names (English, French, ...). Returns the original references if
 * no 3-letter keys are present.
 */
const normalizeLanguageKeys = (lanAttributeRowData, formPlaceholdersByLanguage) => {
  const isOcaKey = (k) => /^[a-z]{3}$/.test(k);
  const hasOcaLan = Object.keys(lanAttributeRowData || {}).some(isOcaKey);
  const hasOcaPh = Object.keys(formPlaceholdersByLanguage || {}).some(isOcaKey);
  if (!hasOcaLan && !hasOcaPh) {
    return { lanAttributeRowData, formPlaceholdersByLanguage, changed: false };
  }

  const remap = (obj) => {
    const out = {};
    Object.entries(obj || {}).forEach(([k, v]) => {
      const name = langNameFromCodeOCA(k) || langNameFromTwoLetters(k) || k;
      out[name] = v;
    });
    return out;
  };

  return {
    lanAttributeRowData: hasOcaLan ? remap(lanAttributeRowData) : lanAttributeRowData,
    formPlaceholdersByLanguage: hasOcaPh ? remap(formPlaceholdersByLanguage) : formPlaceholdersByLanguage,
    changed: true
  };
};

/**
 * Ensure every language has a row array seeded from attributes +
 * FormInformationRowData + placeholders. Existing populated arrays are left
 * untouched.
 */
const initializeLanguageRows = (
  lanAttributeRowData,
  languages,
  attributesList,
  attributeRowData,
  FormInformationRowData,
  formPlaceholdersByLanguage
) => {
  if (!attributesList || attributesList.length === 0) {
    return { lanAttributeRowData, changed: false };
  }

  const hasAll =
    languages.length > 0 &&
    languages.every(
      (lang) => Array.isArray(lanAttributeRowData?.[lang]) && lanAttributeRowData[lang].length > 0
    );
  if (hasAll) return { lanAttributeRowData, changed: false };

  const next = { ...(lanAttributeRowData || {}) };
  let changed = false;

  languages.forEach((lang) => {
    if (Array.isArray(next[lang]) && next[lang].length > 0) return;

    const langPlaceholders = formPlaceholdersByLanguage?.[lang] || {};
    next[lang] = attributesList.map((attrName, idx) => {
      const attrType = attributeRowData.find((r) => r.Attribute === attrName)?.Type || "";
      const baseRow = FormInformationRowData[idx] || {};

      let label = attrName;
      const baseLabel = baseRow?.Label;
      if (baseLabel && typeof baseLabel === "object") {
        label = baseLabel[lang] || label;
      } else if (typeof baseLabel === "string" && baseLabel.trim()) {
        label = baseLabel;
      }

      let placeholder = langPlaceholders[attrName] || "";
      if (!placeholder) {
        const basePlaceholder = baseRow?.Placeholder;
        if (basePlaceholder && typeof basePlaceholder === "object") {
          placeholder = basePlaceholder[lang] || "";
        } else if (typeof basePlaceholder === "string") {
          placeholder = basePlaceholder;
        }
      }
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
    changed = true;
  });

  return { lanAttributeRowData: changed ? next : lanAttributeRowData, changed };
};

/**
 * Per-row placeholder backfill: clear placeholders for Binary/Boolean,
 * prefer explicit per-language placeholders, fall back to format-rule
 * defaults (DateTime / Numeric) and FormInformationRowData. Identity-stable:
 * unchanged rows / languages / maps reuse their original references.
 */
const backfillPlaceholders = (
  lanAttributeRowData,
  languages,
  attributeRowData,
  formatRuleRowData,
  FormInformationRowData,
  formPlaceholdersByLanguage
) => {
  if (!lanAttributeRowData || Object.keys(lanAttributeRowData).length === 0) {
    return { lanAttributeRowData, changed: false };
  }

  const next = { ...lanAttributeRowData };
  let anyLangChanged = false;

  languages.forEach((language) => {
    const prevRows = next[language];
    if (!Array.isArray(prevRows)) return;

    const langPlaceholders = formPlaceholdersByLanguage?.[language] || {};
    let rowsChanged = false;

    const newRows = prevRows.map((item, idx) => {
      const attr = item.Attribute;
      const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";

      if (attrType.includes("Binary") || attrType.includes("Boolean")) {
        if (item.Placeholder === "") return item;
        rowsChanged = true;
        return { ...item, Placeholder: "" };
      }

      if (Object.prototype.hasOwnProperty.call(langPlaceholders, attr)) {
        const explicit = langPlaceholders[attr] ?? "";
        if (item.Placeholder === explicit) return item;
        rowsChanged = true;
        return { ...item, Placeholder: explicit };
      }

      let dateTimeDefault = "";
      const isDateTime = attrType === "DateTime" || attrType === "Array[DateTime]";
      if (isDateTime) {
        const fr = formatRuleRowData.find((r) => r.Attribute === attr);
        const desc = fr?.FormatText && formatCodeDateDescription[fr.FormatText];
        if (desc) dateTimeDefault = getDateTimePickerConfig(desc).displayFormat;
      }

      let numericDefault = "";
      const isNumeric = attrType === "Numeric" || attrType === "Array[Numeric]";
      if (isNumeric) {
        const fr = formatRuleRowData.find((r) => r.Attribute === attr);
        const desc = fr?.FormatText && formatCodeNumericDescription[fr.FormatText];
        if (desc) {
          switch (desc) {
            case "any integer or decimal number, may begin with + or -":
              numericDefault = "Enter any integer or decimal number"; break;
            case "any integer":
              numericDefault = "Enter any integer"; break;
            default:
              numericDefault = desc; break;
          }
        }
      }

      let basePlaceholder = langPlaceholders[attr] || "";
      if (!basePlaceholder) {
        const bpv = FormInformationRowData?.[idx]?.Placeholder;
        if (typeof bpv === "object" && bpv !== null) {
          basePlaceholder = bpv[language] || "";
        } else {
          basePlaceholder = bpv || "";
        }
      }

      let finalPlaceholder = item.Placeholder;
      if (!finalPlaceholder) {
        if (basePlaceholder) finalPlaceholder = basePlaceholder;
        else if (isDateTime) finalPlaceholder = dateTimeDefault;
        else if (isNumeric) finalPlaceholder = numericDefault;
        else finalPlaceholder = "";
      }

      if (item.Placeholder === finalPlaceholder) return item;
      rowsChanged = true;
      return { ...item, Placeholder: finalPlaceholder };
    });

    if (rowsChanged) {
      next[language] = newRows;
      anyLangChanged = true;
    }
  });

  return { lanAttributeRowData: anyLangChanged ? next : lanAttributeRowData, changed: anyLangChanged };
};


const FormInformation = () => {
  const { t, i18n } = useTranslation();
  const primaryColor = usePrimaryColor();
  const { setCurrentPage } = useContext(Context);

  const {
    getAttributesList,
    getFormatRuleData,
    getSchema,
    updateSchema
  } = useMultiSchema();
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

  // Use standard deletion handler
  const deleteHandler = useDeleteOverlayHandler(FIELD_FORM_INFORMATION_OVERLAY);

  const filteredLanguages = useMemo(() => [...languages], [languages]);
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

  // Update currentLanguage when global UI language changes
  useEffect(() => {
    const userLanguage = langNameFromTwoLetters(i18next.language);
    if (userLanguage && languages.includes(userLanguage)) {
      setCurrentLanguage(userLanguage);
    }
  }, [i18next.language, languages]);

  // Single orchestrating effect for all lanAttributeRowData maintenance:
  //   1) normalize OCA 3-letter language keys to UI names
  //   2) seed missing per-language row arrays
  //   3) backfill placeholders (Binary/Boolean clear, explicit overrides,
  //      DateTime/Numeric defaults, FormInformationRowData fallback)
  useEffect(() => {
    const norm = normalizeLanguageKeys(lanAttributeRowData, formPlaceholdersByLanguage);
    const init = initializeLanguageRows(
      norm.lanAttributeRowData,
      languages,
      attributesList,
      attributeRowData,
      FormInformationRowData,
      norm.formPlaceholdersByLanguage
    );
    const fill = backfillPlaceholders(
      init.lanAttributeRowData,
      languages,
      attributeRowData,
      formatRuleRowData,
      FormInformationRowData,
      norm.formPlaceholdersByLanguage
    );

    if (!norm.changed && !init.changed && !fill.changed) return;

    const update = { lanAttributeRowData: fill.lanAttributeRowData };
    if (norm.changed) {
      update.formPlaceholdersByLanguage = norm.formPlaceholdersByLanguage;
    }
    updateSchema(update);
  }, [
    lanAttributeRowData,
    formPlaceholdersByLanguage,
    languages,
    attributesList,
    attributeRowData,
    FormInformationRowData,
    formatRuleRowData,
    updateSchema
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

  const FORM_INFO_GRID_WIDTH = 1003;

  const handleSave = useCallback(() => {
    if (gridRef.current?.api) gridRef.current.api.stopEditing();
  }, []);

  const languageLanguageTabWidth =
    filteredLanguages.length < 5 ? "12rem" : "8.335rem";
  const languageDisplayChunks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < filteredLanguages.length; i += 6) {
      rows.push(filteredLanguages.slice(i, i + 6).filter(Boolean));
    }
    return rows;
  }, [filteredLanguages]);

  const languageStrip = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
        width: FORM_INFO_GRID_WIDTH,
        maxWidth: "100%",
        boxSizing: "border-box"
      }}
    >
      {languageDisplayChunks.map((segment) => (
        <Box
          key={segment.join("-")}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            alignSelf: "flex-start",
            borderBottom: `1px solid ${CustomPalette.GREY_300}`,
            boxSizing: "border-box"
          }}
        >
          {segment.map((language) => {
            const selected = currentLanguage === language;
            return (
              <Button
                key={language}
                onClick={() => {
                  handleSave();
                  setCurrentLanguage(language);
                }}
                variant="text"
                color="inherit"
                sx={{
                  textTransform: "none",
                  fontWeight: 400,
                  borderRadius: 0,
                  px: 2,
                  py: 1.25,
                  width: languageLanguageTabWidth,
                  minWidth: languageLanguageTabWidth,
                  maxWidth: { xs: "100%", sm: "none" },
                  color: selected ? CustomPalette.BLACK : CustomPalette.GREY_600,
                  bgcolor: "transparent",
                  boxShadow: "none",
                  borderBottom: "2px solid",
                  borderBottomColor: selected ? CustomPalette.BLACK : "transparent",
                  mb: "-1px",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    color: CustomPalette.BLACK
                  }
                }}
              >
                <Typography noWrap variant="body2" sx={{ fontWeight: 400 }}>
                  {t(language, { defaultValue: language })}
                </Typography>
              </Button>
            );
          })}
        </Box>
      ))}
    </Box>
  );

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
          helpText: t("Name for the attribute and, for example, the column header in every tabular data set no matter what language")
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
          helpText: t("Language-specific label for an attribute")
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
          <Typography variant="h4" sx={{ fontWeight: "bold", color: primaryColor, textAlign: "center", mb: 4 }}>
            {t("Placeholder Editor")}
          </Typography>
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            mb: 2,
            gap: 1
          }}
        >
          {languageStrip}
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
            sx={{ width: FORM_INFO_GRID_WIDTH, maxWidth: "100%" }}
          >
            <style>{gridStyles}</style>
            <AgGridReact
              key={i18n.language}
              ref={gridRef}
              rowData={currentRows}
              getRowId={(params) => params.data.Attribute}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressRowHoverHighlight
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
