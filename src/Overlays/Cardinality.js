import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import {
  Box,
  Divider,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from "@mui/material"; // Import necessary components for the dialog/pop-up
import { AgGridReact } from "ag-grid-react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { gridStyles, greyCellStyle } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import CustomPalette from "../constants/customPalette";
import Loading from "../components/Loading";
import DeleteConfirmation from "./DeleteConfirmation";
import CellHeader from "../components/CellHeader";
import { FIELD_CARDINALITY_OVERLAY } from "../constants/constants";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { overlayGridOnFirstDataRendered, useOverlayGridOnGridReady } from "./gridUtils";
import "../App.css";

const gridOptions = {
  domLayout: "autoHeight",
  singleClickEdit: true,
  stopEditingWhenCellsLoseFocus: true
};

const Cardinality = () => {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const {
    getSchema,
    updateSchema,
    setSelectedOverlay,
    getCardinalityData,
    setCardinalityData
  } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_CARDINALITY_OVERLAY);
  
  // Get cardinality data - computed from attributes + attributeCardinality
  const cardinalityData = useMemo(() => {
    const computed = getCardinalityData();
    
    // Use first available language (like agreeable-mushroom does)
    // This ensures we always have labels even if UI language doesn't match schema languages
    const firstLanguage = Object.keys(schemaState?.lanAttributeRowData || {})?.[0];
    const labelData = firstLanguage ? (schemaState?.lanAttributeRowData[firstLanguage] || []) : [];
    
    // Add Label and convert Cardinality field name to EntryLimit for UI compatibility
    return computed
      .filter((item) => item?.Type?.includes("Array"))
      .map((item) => {
        const labelInfo = labelData.find((l) => l.Attribute === item.Attribute);
        return {
          ...item,
          EntryLimit: item.Cardinality || "", // UI uses EntryLimit field name
          Label: labelInfo?.Label || ""
        };
      });
  }, [getCardinalityData, schemaState?.attributes, schemaState?.attributeCardinality, schemaState?.lanAttributeRowData]);
  
  const cardinalityRef = useRef();
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [exactValue, setExactValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  // Initialize attributeCardinality if not exists (empty object is fine)
  useEffect(() => {
    // Only initialize if attributeCardinality doesn't exist yet
    if (schemaState?.attributes && typeof schemaState?.attributeCardinality === 'undefined') {
      updateSchema({ attributeCardinality: {} });
    }
  }, [schemaState?.attributes, schemaState?.attributeCardinality, updateSchema]);

  // Set loading state
  useEffect(() => {
    if (schemaState?.attributeCardinality !== undefined || schemaState?.attributes) {
      setLoading(false);
    }
  }, [schemaState?.attributeCardinality, schemaState?.attributes]);
  const [dialogMessage, setDialogMessage] = useState("");

  const handleSave = useCallback(() => {
    cardinalityRef.current.api.stopEditing();
    const newCardinalityData = cardinalityRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data);
    setCardinalityData(newCardinalityData);
  }, [setCardinalityData]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [handleSave, setCurrentPage, setSelectedOverlay]);

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (cardinalityRef.current?.api) {
        cardinalityRef.current.api.stopEditing();
        const newCardinalityData = cardinalityRef.current.api
          .getRenderedNodes()
          ?.map((node) => node?.data);
        if (newCardinalityData && newCardinalityData.length > 0) {
          setCardinalityData(newCardinalityData);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const handleCellClick = useCallback((params) => {
    if (params.data?.Type?.includes("Array")) {
      const entryLimit = params?.data.EntryLimit;
      const selectedDataToSave = { ...params?.data, rowIndex: params?.rowIndex };

      if (
        entryLimit !== null &&
        entryLimit !== undefined
      ) {
        if (entryLimit?.includes("-")) {
          const [MIN, MAX] = entryLimit.split("-").map((value) => value.trim());
          setSelectedCellData(selectedDataToSave);
          setExactValue("");
          setMinValue(MIN === "" && MAX ? "0" : MIN);
          setMaxValue(MAX);
        } else {
          setSelectedCellData(selectedDataToSave);
          setExactValue(entryLimit);
          setMinValue("");
          setMaxValue("");
        }
      } else {
        setSelectedCellData(selectedDataToSave);
        setExactValue("");
        setMinValue("");
        setMaxValue("");
      }
    } else {
      setSelectedCellData(null);
    }
  }, []);

  const backendToUiInterval = useCallback((rawValue) => {
    const value = String(rawValue ?? "").trim();
    if (!value) return "";
    if (value.includes("-")) {
      const [min, max] = value.split("-").map((v) => v.trim());
      if (min && max) return `[${min}, ${max}]`;
      if (min) return `[${min}, ∞)`;
      if (max) return `[0, ${max}]`;
    }
    return value;
  }, []);

  const parseEntryLimitInput = useCallback((rawInput) => {
    const input = String(rawInput ?? "").trim();
    if (!input) {
      return { mode: "empty", exact: "", min: "", max: "", normalized: "" };
    }

    const openIntervalMatch = input.match(/^\[\s*([^,\]]+)\s*,\s*(∞|inf|infinity)\s*\)$/i);
    if (openIntervalMatch) {
      const min = openIntervalMatch[1].trim();
      return {
        mode: "range",
        exact: "",
        min,
        max: "",
        normalized: `${min}-`
      };
    }

    const bracketMatch = input.match(/^\[\s*([^,\]]+)\s*,\s*([^,\]]+)\s*\]$/);
    if (bracketMatch) {
      const min = bracketMatch[1].trim();
      const maxRaw = bracketMatch[2].trim();
      const isInfinity = maxRaw === "∞" || /^(inf|infinity)$/i.test(maxRaw);
      const max = isInfinity ? "" : maxRaw;
      if (min === "0" && max !== "") {
        return {
          mode: "range",
          exact: "",
          min: "",
          max,
          normalized: `-${max}`
        };
      }
      return {
        mode: "range",
        exact: "",
        min,
        max,
        normalized: `${min}-${max}`
      };
    }

    if (input.includes("-")) {
      const [min, max] = input.split("-").map((v) => v.trim());
      return {
        mode: "range",
        exact: "",
        min: min || "",
        max: max || "",
        normalized: `${min || ""}-${max || ""}`
      };
    }

    return { mode: "exact", exact: input, min: "", max: "", normalized: input };
  }, []);

  const handleCellValueChanged = useCallback(
    (params) => {
      if (params?.colDef?.field !== "EntryLimit") return;
      if (!params?.data?.Type?.includes("Array")) return;

      const rowIndex = params?.rowIndex;
      const parsed = parseEntryLimitInput(params?.data?.EntryLimit ?? "");

      setSelectedCellData({ ...params?.data, rowIndex });

      if (parsed.mode === "exact") {
        setExactValue(parsed.exact);
        setMinValue("");
        setMaxValue("");
      } else if (parsed.mode === "range") {
        setExactValue("");
        setMinValue(parsed.min === "" && parsed.max !== "" ? "0" : parsed.min);
        setMaxValue(parsed.max);
      } else {
        setExactValue("");
        setMinValue("");
        setMaxValue("");
      }
    },
    [parseEntryLimitInput]
  );

  const handleDeleteRow = useCallback((params) => {
    cardinalityRef.current?.api?.stopEditing?.();
    setSelectedCellData({ ...params?.data, rowIndex: params?.rowIndex });
    params.node.updateData({
      ...params.node.data,
      EntryLimit: ""
    });
    cardinalityRef.current.api.redrawRows({ rowNodes: [params.node] });
    setExactValue("");
    setMinValue("");
    setMaxValue("");
  }, []);

  useEffect(() => {
    const onKeyDown = (ev) => {
      const key = ev?.key;
      const code = ev?.code;
      const isDeleteKey = key === "Delete" || code === "Delete" || key === "Backspace" || code === "Backspace";
      if (!isDeleteKey) return;

      const api = cardinalityRef.current?.api;
      const focusedCell = api?.getFocusedCell?.();
      if (!api || !focusedCell) return;

      const activeEl = ev?.target;
      const withinGrid = activeEl?.closest?.(".ag-theme-balham");
      if (!withinGrid) return;

      const focusedCol = focusedCell?.column;
      const colId =
        focusedCol?.getColId?.() ??
        focusedCol?.colId ??
        focusedCol?.colDef?.field ??
        focusedCol?.field ??
        "";
      if (String(colId).trim() !== "EntryLimit") return;

      const rowIndex = focusedCell?.rowIndex;
      const node = api.getRowNode?.(rowIndex);
      if (!node?.data?.Type?.includes("Array")) return;

      ev.preventDefault?.();
      handleDeleteRow({
        node,
        data: node.data,
        rowIndex
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDeleteRow]);

  const handleCellKeyDown = useCallback(
    (e) => {
      const colField = e?.colDef?.field ?? e?.column?.colId ?? e?.column?.getColId?.();
      const domEvent = e?.event;
      const key = domEvent?.key;
      const code = domEvent?.code;
      const isDeleteKey = key === "Delete" || code === "Delete" || key === "Backspace" || code === "Backspace";
      const normalizedColId = String(colField || "").trim();
      const isEntryLimitCol =
        normalizedColId === "EntryLimit" ||
        String(e?.colDef?.colId || "").trim() === "EntryLimit" ||
        String(e?.column?.getColId?.() || "").trim() === "EntryLimit";

      if (isDeleteKey && isEntryLimitCol && e?.node?.data?.Type?.includes("Array")) {
        domEvent?.preventDefault?.();
        handleDeleteRow({
          node: e.node,
          data: e.data,
          rowIndex: e.rowIndex
        });
      }
    },
    [handleDeleteRow]
  );

  const handleValueChange = useCallback((value, type) => {
    switch (type) {
      case "exact":
        setExactValue(value || "");
        break;
      case "min":
        setMinValue(value);
        break;
      case "max":
        setMaxValue(value);
        break;
      default:
        break;
    }
  }, []);

  const isNotInteger = useCallback((value) => {
    const stringValue = value;
    const num = +stringValue;
    return Number.isInteger(num);
  }, []);

  const handleApplyValues = useCallback(() => {
    if (selectedCellData) {
      try {
        if (
          minValue !== "" &&
          maxValue !== "" &&
          parseFloat(minValue) >= parseFloat(maxValue)
        ) {
          setDialogMessage(t("The minimum value must be less than the maximum value"));
          setOpenDialog(true);
          return;
        }

        if (exactValue < 0 || minValue < 0 || maxValue < 0) {
          setDialogMessage(t("All entries must be positive integers"));
          setOpenDialog(true);
          return;
        }

        if (
          isNotInteger(exactValue) === false ||
          isNotInteger(minValue) === false ||
          isNotInteger(maxValue) === false
        ) {
          setDialogMessage(t("All entries must be positive integers"));
          setOpenDialog(true);
          return;
        }
      } catch (error) {
        setDialogMessage(t("All entries must be valid integers"));
        setOpenDialog(true);
        return;
      }

      const getRowToUpdate = cardinalityRef.current.api.getRowNode(
        selectedCellData.rowIndex
      );
      const entryLimitValue = exactValue
        ? exactValue
        : minValue !== "" && maxValue !== ""
          ? `${minValue}-${maxValue}`
          : minValue !== "" && maxValue === ""
            ? `${minValue}-`
            : maxValue !== ""
              ? `-${maxValue}`
              : "";
      getRowToUpdate.setData({
        ...selectedCellData,
        EntryLimit: entryLimitValue
      });
      
      if (minValue !== "" && maxValue !== "") {
        setExactValue("");
      } else if (minValue === "" && maxValue === "" && exactValue === "") {
        setExactValue("0");
      } else if (minValue === "" && maxValue === "" && exactValue !== "") {
        setMinValue("");
        setMaxValue("");
      }
    }
  }, [exactValue, isNotInteger, maxValue, minValue, selectedCellData, t]);

  const onGridReady = useOverlayGridOnGridReady(setLoading);

  const getRowHeight = useCallback((params) => {
    const attrH = measureTextHeight(params.data?.Attribute || "", 144);
    const labelH = measureTextHeight(params.data?.Label || "", 184);
    const entryH = measureTextHeight(params.data?.EntryLimit || "", 124);
    const maxH = Math.max(attrH, labelH, entryH);
    return Math.max(32, maxH + 4);
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 160,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        editable: false,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "Label",
        width: 200,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        editable: false,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Label"),
          helpText: t("This is the language specific label for an attribute")
        }
      },
      {
        headerName: t("Entry Limit"),
        field: "EntryLimit",
        width: 140,
        wrapText: true,
        editable: true,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Entry Limit"),
          helpText: t(
            "Describes the number of occurrences of an element."
          )
        },
        valueGetter: (params) => backendToUiInterval(params.data?.EntryLimit ?? ""),
        valueSetter: (params) => {
          const parsed = parseEntryLimitInput(params.newValue);
          params.data.EntryLimit = parsed.normalized ?? "";
          return true;
        }
      }
    ],
    [backendToUiInterval, parseEntryLimitInput, t]
  );

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setCurrentPage("Overlays")}
    >
      {loading && cardinalityData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          marginBottom: BETWEEN_SECTION_SPACING,
          gap: "3rem",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <Box
          className="ag-theme-balham"
          sx={{ width: "50%", height: "100%", maxWidth: "600px" }}
        >
          <style>{gridStyles}</style>
          <AgGridReact
            key={i18n.language}
            ref={cardinalityRef}
            onCellClicked={handleCellClick}
            onCellKeyDown={handleCellKeyDown}
            onCellValueChanged={handleCellValueChanged}
            rowData={cardinalityData}
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            suppressHorizontalScroll
            onGridReady={onGridReady}
            onFirstDataRendered={overlayGridOnFirstDataRendered}
            getRowHeight={getRowHeight}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
          />
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box
          sx={{
            width: "50%",
            maxWidth: "660px",
            height: "300px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
            position: "sticky",
            top: "2rem",
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {selectedCellData && (
            <>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
              >
                <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <TextField
                      label={t("Exact")}
                      variant="outlined"
                      value={exactValue}
                      onChange={(e) => handleValueChange(e.target.value, "exact")}
                      style={{
                        backgroundColor: minValue || maxValue ? "#f2f2f2" : "white"
                      }}
                      disabled={minValue || maxValue}
                    />
                    <Tooltip
                      title={t(
                        "For each attribute you can specify the exact, minimum or maximum ..."
                      )}
                      placement="top"
                      arrow
                    >
                      <HelpOutlineIcon
                        sx={{
                          position: "absolute",
                          left: "100%",
                          marginLeft: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: 18,
                          color: "#ccc"
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="h6" align="center" style={{ marginBottom: "0px" }}>
                or
                </Typography>
                <Box sx={{ display: "flex", gap: "10px", width: "100%", justifyContent: "center" }}>
                  <TextField
                    label={t("Minimum")}
                    variant="outlined"
                    value={minValue}
                    onChange={(e) => handleValueChange(e.target.value, "min")}
                    style={{
                      backgroundColor: exactValue ? "#f2f2f2" : "white"
                    }}
                    disabled={exactValue}
                  />
                  <TextField
                    label={t("Maximum")}
                    variant="outlined"
                    value={maxValue}
                    onChange={(e) => handleValueChange(e.target.value, "max")}
                    style={{
                      backgroundColor: exactValue ? "#f2f2f2" : "white"
                    }}
                    disabled={exactValue}
                  />
                </Box>
                <Button
                  variant="contained"
                  color="navButton"
                  onClick={handleApplyValues}
                  sx={{
                    backgroundColor: CustomPalette.PRIMARY,
                    ":hover": { backgroundColor: CustomPalette.SECONDARY },
                    width: "100%",
                    maxWidth: "100px",
                    marginTop: "10px"
                  }}
                >
                  {t("Apply")}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{t("Error")}</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </BackNextSkeleton>
  );
};

export default Cardinality;
