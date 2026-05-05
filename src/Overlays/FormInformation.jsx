import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { Context } from "../App";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { AgGridReact } from "ag-grid-react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { codesToLanguages } from "../constants/isoCodes";
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

import "ag-grid-community/styles/ag-theme-balham.css";

const findDescription = (formatText, attributeType) => {
  if (!formatText) return "";
  if (attributeType.includes("Date")) return formatCodeDateDescription[formatText] || "";
  if (attributeType.includes("Numeric"))
    return formatCodeNumericDescription[formatText] || "";
  if (attributeType.includes("Binary"))
    return formatCodeBinaryDescription[formatText] || "";
  if (attributeType.includes("Text")) return formatCodeTextDescription[formatText] || "";
  return formatText;
};

const PLACEHOLDER_EDITABLE_TYPES = ["Text", "Array[Text]", "DateTime", "Array[DateTime]", "Numeric", "Array[Numeric]"];


const FormInformation = () => {
  const { t } = useTranslation();
  const {
    FormInformationRowData,
    setFormInformationRowData,
    setFormBuilderPages,
    languages,
    setCurrentPage,
    attributeRowData,
    lanAttributeRowData,
    setLanAttributeRowData,
    formPlaceholdersByLanguage,
    setFormPlaceholdersByLanguage,
    attributesList,
    setAttributesList,
    formatRuleRowData,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);

  const gridRef = useRef();
  const refContainer = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  const languageIndex = languages.findIndex(
    (item) => codesToLanguages?.[i18next.language] === item
  );
  const filteredLanguages = [...languages];
  if (languageIndex !== -1 && languageIndex !== 0) {
    const removedLanguage = filteredLanguages.splice(languageIndex, 1);
    filteredLanguages.unshift(removedLanguage[0]);
  }
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  const primaryLanguage = languages?.[0];

  // Update currentLanguage when global UI language changes
  useEffect(() => {
    const userLanguage = codesToLanguages?.[i18next.language];
    if (userLanguage && languages.includes(userLanguage)) {
      setCurrentLanguage(userLanguage);
    }
  }, [i18next.language, languages]);

  useEffect(() => {
    setLanAttributeRowData((prevLanData) => {
      const newLan = JSON.parse(JSON.stringify(prevLanData || {}));
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
            
            // For DateTime types, get default placeholder from format rule
            let dateTimeDefaultPlaceholder = "";
            const isDateTimeType = attrType === "DateTime" || attrType === "Array[DateTime]";
            if (isDateTimeType) {
              const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attr);
              if (formatRule?.FormatText) {
                const formatDescription =
                  formatCodeDateDescription[formatRule.FormatText] || "";
                if (formatDescription) {
                  const config = getDateTimePickerConfig(formatDescription);
                  dateTimeDefaultPlaceholder = config.displayFormat;
                }
              }
            }
            
            // For Numeric types, get default placeholder from format rule
            let numericDefaultPlaceholder = "";
            const isNumericType = attrType === "Numeric" || attrType === "Array[Numeric]";
            if (isNumericType) {
              const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attr);
              if (formatRule?.FormatText) {
                const formatDescription =
                  formatCodeNumericDescription[formatRule.FormatText] || "";
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
              if (
                typeof basePlaceholderValue === "object" &&
                basePlaceholderValue !== null
              ) {
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
                : CustomPalette.SECONDARY,
            borderRadius,
            width: languages.length < 5 ? "12rem" : "8.335rem",
            boxShadow: "none",
            border: `0.5px solid ${CustomPalette.PRIMARY}`
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
      
      const newAttributesList = [...attributesList];
      newAttributesList.splice(newIndex, 0, newAttributesList.splice(oldIndex, 1)[0]);
      setAttributesList(newAttributesList);
      
      // Reorder FormInformationRowData based on new attributesList order
      const newFormData = [];
      newAttributesList.forEach((attrName) => {
        const existingData = FormInformationRowData.find(item => item.Attribute === attrName);
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
          newAttributesList.forEach((attrName) => {
            const existingLangData = newLanData[language].find(item => item.Attribute === attrName);
            if (existingLangData) {
              reorderedLangData.push(existingLangData);
            }
          });
          newLanData[language] = reorderedLangData;
        }
      });
      setLanAttributeRowData(newLanData);
    },
    [
      attributesList,
      setAttributesList,
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
    setOverlay((prev) => ({
      ...prev,
      [FIELD_FORM_INFORMATION_OVERLAY]: {
        ...prev[FIELD_FORM_INFORMATION_OVERLAY],
        selected: false
      }
    }));
    setSelectedOverlay("");
    setFormBuilderPages(null);
    setCurrentPage("Overlays");
  }, [setOverlay, setSelectedOverlay, setCurrentPage, setFormBuilderPages]);

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
              rowData={lanAttributeRowData[currentLanguage]}
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
