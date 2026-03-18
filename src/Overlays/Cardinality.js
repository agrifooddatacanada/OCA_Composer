import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
  forwardRef
} from "react";
import {
  Box,
  Divider,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from "@mui/material"; // Import necessary components for the dialog/pop-up
import { AgGridReact } from "ag-grid-react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
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
  domLayout: "autoHeight"
};

const TrashCanButton = memo(
  forwardRef((props, ref) => (
    <div ref={ref}>
      {props.node.data?.Type?.includes("Array") && (
        <IconButton
          sx={{
            pr: 1,
            color: CustomPalette.GREY_600,
            transition: "all 0.2s ease-in-out"
          }}
          disabled={props.node.data?.EntryLimit === ""}
          onClick={() => props.handleDeleteRow(props)}
        >
          <DeleteOutlineIcon />
        </IconButton>
      )}
    </div>
  ))
);

const Cardinality = () => {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const {
    getSchema,
    updateSchema,
    updateOverlaySelection,
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
    return computed.map(item => {
      const labelInfo = labelData.find((l) => l.Attribute === item.Attribute);
      return {
        ...item,
        EntryLimit: item.Cardinality || "",  // UI uses EntryLimit field name
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
        entryLimit !== undefined &&
        params.colDef.field !== "Delete"
      ) {
        if (entryLimit?.includes("-")) {
          const [MIN, MAX] = entryLimit.split("-").map((value) => value.trim());
          setSelectedCellData(selectedDataToSave);
          setExactValue("");
          setMinValue(MIN);
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

  const handleDeleteRow = useCallback((params) => {
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
      getRowToUpdate.setData({
        ...selectedCellData,
        EntryLimit: exactValue || `${minValue}-${maxValue}`
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
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attributes"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "Label",
        width: 200,
        wrapText: true,
        cellStyle: () => preWrapWordBreak,
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
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Entry Limit"),
          helpText: t(
            "Applies only to array DatatTypes. Describes the number of occurrences of an element"
          )
        },
        valueFormatter: (params) => {
          const value = params.value;
          if (!value) return "";
          if (value.includes("-")) {
            const [min, max] = value.split("-").map((v) => v.trim());
            if (min && max) return `[${min}, ${max}]`;
            if (min) return `[${min}, ∞)`;
            if (max) return `[0, ${max}]`;
          }
          return value;
        }
      },
      {
        headerName: "Garbage",
        field: "Delete",
        cellRenderer: TrashCanButton,
        cellRendererParams: {
          handleDeleteRow
        },
        width: 100,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Garbage"),
          helpText: t("Remove the Entry Limit rule")
        }
      }
    ],
    [handleDeleteRow, t]
  );

  const rowClassRules = useMemo(
    () => ({
      "rag-grey-outer": function ragGreyOuter(params) {
        return !params.data?.Type?.includes("Array");
      }
    }),
    []
  );

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
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
          <Typography
            sx={{
              textAlign: "start",
              marginBottom: "14px"
            }}
          >
            {t("Entry limits can only be created for attributes with an array data type")}
          </Typography>
          <style>{gridStyles}</style>
          <AgGridReact
            key={i18n.language}
            ref={cardinalityRef}
            rowClassRules={rowClassRules}
            onCellClicked={handleCellClick}
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
            alignSelf: "flex-start"
          }}
        >
          {selectedCellData && (
            <>
              <Box>
                <TextField
                  label={t("Exact")}
                  variant="outlined"
                  value={exactValue}
                  onChange={(e) => handleValueChange(e.target.value, "exact")}
                  style={{
                    marginBottom: "10px",
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
                      fontSize: 18,
                      color: "#ccc",
                      marginLeft: "10px",
                      marginTop: "5px"
                    }}
                  />
                </Tooltip>
              </Box>
              <Typography variant="h6" align="center" style={{ marginBottom: "10px" }}>
                or
              </Typography>
              <Box sx={{ display: "flex", gap: "10px" }}>
                <TextField
                  label={t("Minimum")}
                  variant="outlined"
                  fullWidth
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
                  fullWidth
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
                  marginTop: "35px"
                }}
              >
                {t("Apply")}
              </Button>
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
