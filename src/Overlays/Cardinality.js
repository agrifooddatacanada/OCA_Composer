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
import { useMultiSchema } from "../context/MultiSchemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import CustomPalette from "../constants/customPalette";
import Loading from "../components/Loading";
import DeleteConfirmation from "./DeleteConfirmation";
import CellHeader from "../components/CellHeader";
import "../App.css";

const gridOptions = {
  domLayout: "autoHeight"
};

const TrashCanButton = memo(
  forwardRef((props) => (
    <div>
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
  const { t } = useTranslation();
  const {
    setCurrentPage
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    activeSchemaId, 
    editingSchemaId, 
    getSchemaState, 
    updateSchemaState,
    updateOverlaySelection,
    setSelectedOverlay
  } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId || editingSchemaId;
  const schemaState = getSchemaState(currentSchemaId);
  
  const updateCurrentSchema = useCallback((updates) => {
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, updates);
    }
  }, [currentSchemaId, updateSchemaState]);
  
  // Always get data from schema state - no fallback needed
  const cardinalityData = useMemo(() => {
    const rawData = schemaState?.cardinalityData || [];
    // console.log("Raw cardinality data from schema state:", rawData);
    
    // If we have data but it's in the old format (Cardinality field), convert it
    if (rawData.length > 0 && schemaState?.attributes) {
      const currentLanguage = i18next.language.startsWith("fr") ? "fra" : "eng";
      const labelData = schemaState?.lanAttributeRowData?.[currentLanguage] || [];
      
      const normalizedData = rawData.map((item) => {
        const attr = schemaState.attributes.find((a) => a.Attribute === item.Attribute);
        const labelInfo = labelData.find((l) => l.Attribute === item.Attribute);
        
        return {
          Attribute: item.Attribute,
          Type: attr?.Type || item.Type || "Text",
          EntryLimit: item.EntryLimit || item.Cardinality || "", // Convert Cardinality to EntryLimit
          Label: item.Label || labelInfo?.Label || ""
        };
      });
      
      // console.log("Normalized cardinality data:", normalizedData);
      return normalizedData;
    }
    
    return rawData;
  }, [schemaState?.cardinalityData, schemaState?.attributes, schemaState?.lanAttributeRowData]);
    
  const setCardinalityData = useCallback((newData) => {
    console.log("setCardinalityData called with:", newData);
    updateCurrentSchema({
      cardinalityData: newData
    });
    console.log("Updated schema with cardinalityData");
  }, [updateCurrentSchema]);
  
  const cardinalityRef = useRef();
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [exactValue, setExactValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  // Initialize cardinality data from schema attributes if not exists
  useEffect(() => {
    // Only initialize if cardinalityData doesn't exist yet
    if (schemaState?.attributes && typeof schemaState?.cardinalityData === 'undefined') {
      // Get current language for labels - use ISO codes that match the data structure
      const currentLanguage = i18next.language.startsWith("fr") ? "fra" : "eng";
      const labelData = schemaState?.lanAttributeRowData?.[currentLanguage] || [];
      
      const newCardinalityData = schemaState.attributes.map((attr) => {
        const labelInfo = labelData.find((l) => l.Attribute === attr.Attribute);
        const cardinalityItem = {
          Attribute: attr.Attribute,
          Type: attr.Type || "Text",
          EntryLimit: "",
          Label: labelInfo?.Label || ""
        };
        console.log("Creating cardinality item:", cardinalityItem);
        console.log("Label data for", attr.Attribute, ":", labelInfo);
        return cardinalityItem;
      });
      console.log("Full labelData:", labelData);
      console.log("Full newCardinalityData:", newCardinalityData);
      updateCurrentSchema({ cardinalityData: newCardinalityData });
    }
  }, [schemaState?.attributes, schemaState?.lanAttributeRowData, schemaState?.cardinalityData, updateCurrentSchema]);

  // Set loading state
  useEffect(() => {
    if (schemaState?.cardinalityData || schemaState?.attributes) {
      setLoading(false);
    }
  }, [schemaState?.cardinalityData, schemaState?.attributes]);
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
    setSelectedOverlay(currentSchemaId, "");
    setCurrentPage("Overlays");
  }, [handleSave, setCurrentPage, setSelectedOverlay, currentSchemaId]);

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
    // Update the grid data immediately
    params.node.updateData({
      ...params.node.data,
      EntryLimit: ""
    });
    
    // Save the changes to context
    const updatedData = cardinalityRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data);
    setCardinalityData(updatedData);
    
    // Clear the form if this row was selected
    if (selectedCellData && selectedCellData.Attribute === params.node.data.Attribute) {
      setSelectedCellData(null);
      setExactValue("");
      setMinValue("");
      setMaxValue("");
    }
  }, [setCardinalityData, selectedCellData]);

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
      
      // Save the updated data to schema state
      if (cardinalityRef.current) {
        const newData = [];
        cardinalityRef.current.api.forEachNode((node) => {
          if (node.data) {
            newData.push(node.data);
          }
        });
        console.log("Cardinality handleApplyValues - saving data:", newData);
        setCardinalityData(newData);
      }
      
      if (minValue !== "" && maxValue !== "") {
        setExactValue("");
      } else if (minValue === "" && maxValue === "" && exactValue === "") {
        setExactValue("0");
      } else if (minValue === "" && maxValue === "" && exactValue !== "") {
        setMinValue("");
        setMaxValue("");
      }
    }
  }, [exactValue, isNotInteger, maxValue, minValue, selectedCellData, t, setCardinalityData]);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 160,
        autoHeight: true,
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
        autoHeight: true,
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
        autoHeight: true,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Entry Limit"),
          helpText: t(
            "Applies only to array DatatTypes. Describes the number of occurrences of an element"
          )
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

  const handleDeleteCurrentOverlay = useCallback(() => {
    // Remove the overlay selection
    updateOverlaySelection(currentSchemaId, "Cardinality", { selected: false });
    // Clear the cardinality data from schema state
    updateCurrentSchema({ cardinalityData: undefined });
    setCurrentPage("Overlays");
  }, [updateOverlaySelection, currentSchemaId, setCurrentPage, updateCurrentSchema]);

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
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
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
            {t("Entry limits can only be created for attributes with an array DataType")}
          </Typography>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={cardinalityRef}
            rowClassRules={rowClassRules}
            onCellClicked={handleCellClick}
            rowData={cardinalityData}
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            onGridReady={onGridReady}
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
              <Typography style={{ marginTop: "20px", color: "red" }}>
                {t("NOTE: Please leave blank to not specify a min or max value")}
              </Typography>
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
