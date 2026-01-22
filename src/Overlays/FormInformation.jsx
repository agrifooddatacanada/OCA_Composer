import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { AgGridReact } from "ag-grid-react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { getLangNameFromUICode, getLangNameFromOCACode, getOCACodeFromLangName, getUICode } from "../utils/languageUtils";
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

import "ag-grid-community/styles/ag-theme-balham.css";

const findDescription = (formatText, attributeType) => {
  if (!formatText) return "";
  // Normalize escaped quotes (OCA often escapes "). This mirrors behavior in FormatRuleCellRender
  const normalized = String(formatText).replace(/\\"/g, '"');
  if (attributeType.includes("Date")) return formatCodeDateDescription[normalized] || "";
  if (attributeType.includes("Numeric"))
    return formatCodeNumericDescription[normalized] || "";
  if (attributeType.includes("Binary"))
    return formatCodeBinaryDescription[normalized] || "";
  if (attributeType.includes("Text")) return formatCodeTextDescription[normalized] || "";
  return normalized;
};

const PLACEHOLDER_EDITABLE_TYPES = ["Text", "Array[Text]", "DateTime", "Array[DateTime]", "Numeric", "Array[Numeric]"];


const FormInformation = () => {
  const { t } = useTranslation();
  const {
    setFormBuilderPages,
    languages,
    setCurrentPage,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);

  // Get data from MultiSchemaContext (single source of truth)
  const { 
    getCurrentSchemaId, 
    getAttributesList, 
    getFormatRuleData,
    getSchemaState,
    updateSchemaState 
  } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const schemaState = getSchemaState(currentSchemaId);
  const attributesList = useMemo(
    () => getAttributesList(),
    [getAttributesList, currentSchemaId]
  );
  const formatRuleRowData = useMemo(
    () => getFormatRuleData(),
    [getFormatRuleData, currentSchemaId]
  );
  const attributeRowData = schemaState?.attributes || [];
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const FormInformationRowData = schemaState?.FormInformationRowData || [];
  const formPlaceholdersByLanguage = schemaState?.formPlaceholdersByLanguage || {};
  
  // Setter wrappers to update MultiSchemaContext
  const setLanAttributeRowData = useCallback((updater) => {
    const newData = typeof updater === 'function' 
      ? updater(lanAttributeRowData) 
      : updater;
    updateSchemaState(currentSchemaId, { lanAttributeRowData: newData });
  }, [lanAttributeRowData, updateSchemaState, currentSchemaId]);

  const setFormInformationRowData = useCallback((updater) => {
    const newData = typeof updater === 'function'
      ? updater(FormInformationRowData)
      : updater;
    updateSchemaState(currentSchemaId, { FormInformationRowData: newData });
  }, [FormInformationRowData, updateSchemaState, currentSchemaId]);

  const setFormPlaceholdersByLanguage = useCallback((updater) => {
    const newData = typeof updater === 'function'
      ? updater(formPlaceholdersByLanguage)
      : updater;
    updateSchemaState(currentSchemaId, { formPlaceholdersByLanguage: newData });
  }, [formPlaceholdersByLanguage, updateSchemaState, currentSchemaId]);

  const gridRef = useRef();
  const refContainer = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const initializationRef = useRef(false);
  
  // Use standard deletion handler
  const deleteHandler = useDeleteOverlayHandler(FIELD_FORM_INFORMATION_OVERLAY);

  const languageIndex = languages.findIndex(
    (item) => getLangNameFromUICode(i18next.language) === item
  );
  const filteredLanguages = [...languages];
  if (languageIndex !== -1 && languageIndex !== 0) {
    const removedLanguage = filteredLanguages.splice(languageIndex, 1);
    filteredLanguages.unshift(removedLanguage[0]);
  }
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  // Resolve current rows robustly: accept either language names (English) or OCA codes (eng)
  const resolveRowsForLanguage = (lanData, langName) => {
    if (!lanData || !langName) return [];
    // direct lookup by language name
    if (Array.isArray(lanData[langName])) return lanData[langName];
    // try OCA alpha3 code for the language name (eng, fra)
    const ocaCode = (getOCACodeFromLangName && getOCACodeFromLangName(langName)) || null;
    if (ocaCode && Array.isArray(lanData[ocaCode])) return lanData[ocaCode];
    // try UI code (en, fr)
    const uiCode = getUICode();
    const uiLangName = getLangNameFromUICode(uiCode);
    if (uiLangName && Array.isArray(lanData[uiLangName])) return lanData[uiLangName];
    return [];
  };

  const currentRows = resolveRowsForLanguage(lanAttributeRowData, currentLanguage);
  const primaryLanguage = languages?.[0];

  // Normalize any lan/form placeholder keys that use OCA 3-letter codes (e.g., 'eng') into UI language names (e.g., 'English')
  useEffect(() => {
    const hasOcaKeys = Object.keys(lanAttributeRowData || {}).some(k => /^[a-z]{3}$/.test(k));
    const hasOcaPlaceholders = Object.keys(formPlaceholdersByLanguage || {}).some(k => /^[a-z]{3}$/.test(k));
    if (!hasOcaKeys && !hasOcaPlaceholders) return;

    const normalizedLan = {};
    Object.entries(lanAttributeRowData || {}).forEach(([k, v]) => {
      const name = getLangNameFromOCACode(k) || getLangNameFromUICode(k) || k;
      normalizedLan[name] = v;
    });

    const normalizedPlaceholders = {};
    Object.entries(formPlaceholdersByLanguage || {}).forEach(([k, v]) => {
      const name = getLangNameFromOCACode(k) || getLangNameFromUICode(k) || k;
      normalizedPlaceholders[name] = v;
    });

    console.log('[FormInformation] Normalizing OCA language keys to names:', { normalizedLanKeys: Object.keys(normalizedLan), normalizedPlaceholderKeys: Object.keys(normalizedPlaceholders) });
    updateSchemaState(currentSchemaId, { lanAttributeRowData: normalizedLan, formPlaceholdersByLanguage: normalizedPlaceholders });
    // also update grid immediately (resolve robustly) and refresh cells so Format column updates
    try {
      if (gridRef.current?.api) {
        gridRef.current.api.setRowData(resolveRowsForLanguage(normalizedLan, currentLanguage));
        gridRef.current.api.refreshCells({ force: true });
      }
    } catch (e) {
      // ignore
    }
  }, [lanAttributeRowData, formPlaceholdersByLanguage, currentLanguage, currentSchemaId, updateSchemaState]);

  // Ensure lanAttributeRowData has rows for all languages (import or fresh init)
  useEffect(() => {
    // Prevent repeated initialization runs
    if (initializationRef.current) return;

    // If we already have rows for every language, do nothing
    const hasAllLanguages = languages && languages.length > 0 &&
      languages.every((lang) => Array.isArray(lanAttributeRowData?.[lang]) && lanAttributeRowData[lang].length > 0);
    if (hasAllLanguages) return;
    if (!attributesList || attributesList.length === 0) return;

    console.log('[FormInformation] Initializing rows:', {
      attributesList: attributesList.length,
      formPlaceholdersByLanguage,
      currentLanguage,
      languages
    });

    console.log('[FormInformation] currentSchemaId at init:', currentSchemaId);

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

    // Debug: show existing vs new lan data sizes for troubleshooting
    try {
      console.log('[FormInformation] lanAttributeRowData sizes before update:', languages.map(l => ({ lang: l, existing: (lanAttributeRowData?.[l]?.length||0), built: (newLan[l]?.length||0) })));
    } catch (e) {
      // ignore
    }

    // Only perform the update once per component mount to avoid loops
    if (didAdd && !initializationRef.current) {
      initializationRef.current = true;
      console.log('[FormInformation] performing initial lanAttributeRowData update for schema', currentSchemaId);
      updateSchemaState(currentSchemaId, { lanAttributeRowData: newLan });
      // Immediately update grid so UI shows rows even if context update hasn't propagated
      try {
        if (gridRef.current?.api) {
          gridRef.current.api.setRowData(resolveRowsForLanguage(newLan, currentLanguage));
        }
      } catch (e) {
        // ignore grid errors during initialization
      }

      // Check shortly after to confirm the update persisted in context
      setTimeout(() => {
        try {
          const stateAfter = getSchemaState(currentSchemaId);
          console.log('[FormInformation] lanAttributeRowData after update (context):', stateAfter?.lanAttributeRowData || {});
          console.log('[FormInformation] attributeFormats after update (context):', stateAfter?.attributeFormats || {});
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
  }, [attributesList, attributeRowData, currentLanguage, languages, FormInformationRowData, formPlaceholdersByLanguage, lanAttributeRowData, updateSchemaState, currentSchemaId]);

  // Update currentLanguage when global UI language changes
  useEffect(() => {
    const userLanguage = getLangNameFromUICode(i18next.language);
    if (userLanguage && languages.includes(userLanguage)) {
      setCurrentLanguage(userLanguage);
    }
  }, [i18next.language, languages]);

  useEffect(() => {
    setLanAttributeRowData((prevLanData) => {
      const prev = prevLanData || {};
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

      // Only return a new object if something actually changed to avoid rerender loops
      try {
        if (JSON.stringify(prev) === JSON.stringify(newLan)) {
          return prevLanData; // unchanged
        }
      } catch (e) {
        // fallback: return newLan if compare fails
      }

      // After we update lanAttributeRowData, schedule a refresh of grid cell renderers
      setTimeout(() => {
        try {
          if (gridRef.current?.api) gridRef.current.api.refreshCells({ force: true });
        } catch (e) {
          // ignore
        }
      }, 40);

      return newLan;
    });
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
          <Typography noWrap={true} variant="button">
            {language}
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

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const onRowDragEnd = useCallback(
    (event) => {
      const oldIndex = attributesList.findIndex(
        (item) => item === event.node.data.Attribute
      );
      const newIndex = event.node.rowIndex;
      gridRef.current.api.stopEditing();
      
      // Reorder attributes in MultiSchemaContext (source of truth)
      updateSchemaState(currentSchemaId, (prevState) => {
        const currentAttrs = prevState.attributes || [];
        const newAttrs = [...currentAttrs];
        newAttrs.splice(newIndex, 0, newAttrs.splice(oldIndex, 1)[0]);
        
        // Reorder FormInformationRowData to match
        const newFormData = [];
        newAttrs.forEach((attr) => {
          const existingData = FormInformationRowData.find(item => item.Attribute === attr.Attribute);
          if (existingData) {
            newFormData.push(existingData);
          }
        });
        setFormInformationRowData(newFormData);

        // Reorder lanAttributeRowData for all languages
        const newLanData = JSON.parse(JSON.stringify(lanAttributeRowData || {}));
        Object.keys(newLanData).forEach((language) => {
          if (newLanData[language] && Array.isArray(newLanData[language])) {
            const reorderedLangData = [];
            newAttrs.forEach((attr) => {
              const existingLangData = newLanData[language].find(item => item.Attribute === attr.Attribute);
              if (existingLangData) {
                reorderedLangData.push(existingLangData);
              }
            });
            newLanData[language] = reorderedLangData;
          }
        });
        
        return {
          attributes: newAttrs,
          lanAttributeRowData: newLanData
        };
      });
    },
    [
      attributesList,
      currentSchemaId,
      updateSchemaState,
      FormInformationRowData,
      setFormInformationRowData,
      lanAttributeRowData,
      setLanAttributeRowData
    ]
  );

  const onRowDragLeave = useCallback(() => {
    // Reset to current state when drag is cancelled
    const newFormData = JSON.parse(JSON.stringify(FormInformationRowData));
    setFormInformationRowData(newFormData);
    const newLanData = JSON.parse(JSON.stringify(lanAttributeRowData || {}));
    setLanAttributeRowData(newLanData);
    document.dispatchEvent(new MouseEvent("mouseup"));
  }, [
    FormInformationRowData,
    setFormInformationRowData,
    lanAttributeRowData,
    setLanAttributeRowData
  ]);

  const columnDefs = useMemo(() => {
    return [
      {
        field: "Drag",
        headerName: "",
        width: 40,
        cellStyle: () => ({ display: "flex" }),
        rowDrag: () => true
      },
      {
        field: "Attribute",
        editable: false,
        width: 180,
        cellStyle: () => preWrapWordBreak,
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
        autoHeight: true,
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
          const description = findDescription(formatText, attributeType);
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
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Label"),
          constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
          helpText: t("This is the language specific label for an attribute")
        },
        cellEditorParams: { maxLength: MAX_ATTR_LABEL_CHARS }
      },
      {
        field: "Placeholder",
        headerName: `${t("Placeholder")} (${currentLanguage || ""})`,
        editable: (params) => {
          const attr = params.data.Attribute;
          const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";
          return PLACEHOLDER_EDITABLE_TYPES.includes(attrType);
        },
        width: 240,
        autoHeight: true,
        cellStyle: (params) => {
          const attr = params.data.Attribute;
          const attrType = attributeRowData.find((r) => r.Attribute === attr)?.Type || "";
          const isEditable = PLACEHOLDER_EDITABLE_TYPES.includes(attrType);
          return isEditable ? preWrapWordBreak : greyCellStyle;
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
          const newValue = params.newValue || "";
          params.data.Placeholder = newValue;

          setFormPlaceholdersByLanguage((prev) => {
            const next = { ...(prev || {}) };
            const langMap = { ...(next[currentLanguage] || {}) };
            langMap[attr] = newValue;
            next[currentLanguage] = langMap;
            return next;
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
  }, [attributeRowData, formatRuleRowData, currentLanguage, t]);
  

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
    for (let i = 0; i < attributesList.length; i += 1) {
      const label = lanAttributeRowData?.[primaryLanguage]?.[i]?.Label;
      if (!label || `${label}`.trim() === "") {
        const attr = attributesList[i];
        return {
          ok: false,
          msg: `${t("Label")} - ${t("Please fill out all fields")} (${attr})`
        };
      }
    }
    return { ok: true, rows };
  }, [attributesList, lanAttributeRowData, primaryLanguage, t]);

  const handleForward = useCallback(() => {
    handleSave();
    const result = validateRows();
    if (!result.ok) {
      setErrorMessage(result.msg || t("Error"));
      setTimeout(() => setErrorMessage(""), 2500);
      return;
    }
    if (result.rows) setFormInformationRowData(result.rows);
    setCurrentPage("FormBuilder");
  }, [handleSave, setFormInformationRowData, t, validateRows, setCurrentPage]);

  const handleBack = useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  const handleDeleteCurrentOverlay = useCallback(() => {
    // Clean up FormBuilder data before deletion
    setFormBuilderPages(null);
    // Use standard deletion handler
    deleteHandler();
  }, [deleteHandler, setFormBuilderPages]);

  // Ensure grid row data updates when lanAttributeRowData changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setRowData(resolveRowsForLanguage(lanAttributeRowData, currentLanguage));
    }
  }, [lanAttributeRowData, currentLanguage]);

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={handleBack}
      backText="Remove overlay"
      errorMessage={errorMessage}
    >
      {loading && (FormInformationRowData?.length || 0) > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box sx={{ margin: "2rem" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: languages.length < 6 ? "flex-start" : "flex-end"
          }}
        >
          {languageButtonDisplay}
        </Box>
        <Box
          sx={{
            textAlign: "left",
            transform: "translate(-25px, -25px)",
            color: CustomPalette.GREY_600,
            height: "0rem"
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
        <div ref={refContainer}>
          <Box className="ag-theme-balham" sx={{ width: 1003 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={currentRows}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressHorizontalScroll
              onCellKeyDown={onCellKeyDown}
              onRowDragEnd={onRowDragEnd}
              onRowDragLeave={onRowDragLeave}
              rowDragManaged={true}
              animateRows={true}
              onGridReady={onGridReady}
            />
          </Box>
        </div>
      </Box>
    </BackNextSkeleton>
  );
};

export default FormInformation;
