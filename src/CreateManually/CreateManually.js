import React, { useContext, useState, useRef, useCallback, useEffect } from "react";
import { AgGridReact } from "../components/AgGridReact";
import { useTranslation } from "react-i18next";
import { Box, Button, Alert, Typography, ButtonBase, Stepper, Step, StepLabel } from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";

import { CustomPalette } from "../constants/customPalette";
import { removeSpacesFromString } from "../utils/stringUtils";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { hasDisallowedChars } from "../utils/helpers";
import TextareaCellEditor from "../components/TextareaCellEditor";
import { measureTextHeight } from "../utils/measureTextLines";
import { flexCenter, preWrapWordBreak, agGridEditableCellHoverCss } from "../constants/styles";
import { TABLE_TO_BUTTON_GAP, BETWEEN_SECTION_SPACING } from "../constants/constants";
import ErrorPopup from "../ViewSchema/ErrorPopup";

// !important overrides default grid style that sets the minimum height of the grid container
// Without the min-height, it looks awkward when the component is empty or has only a couple attributes
const gridStyle = `
  .create-schema-grid .ag-cell {
    border-right: 1px solid ${CustomPalette.GREY_300};
  }
  .create-schema-grid .ag-header-cell-label {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell {
    line-height: 1.5;
  }
  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%;
  }
  .ag-header-cell:last-child,
  .ag-header-cell[col-id="Delete"] {
    border-right: none !important;
    --ag-header-column-separator-display: none !important;
  }
  .ag-header-cell:last-child *,
  .ag-header-cell[col-id="Delete"] * {
    border-right: none !important;
    box-shadow: none !important;
  }
  .ag-header-viewport .ag-header-cell:last-child {
    border-right: none !important;
  }
  .ag-header-container {
    border-right: none !important;
  }
  .create-schema-grid .ag-cell:last-child {
    border-right: none !important;
  }
  .ag-header-row .ag-header-cell:last-child::after {
    display: none !important;
  }
  .ag-header-viewport {
    overflow-x: hidden;
  }
  .create-schema-grid .ag-body-horizontal-scroll {
    display: none !important;
  }
  .create-schema-grid .ag-center-cols-clipper {
    min-height: unset !important;
  }
  .create-schema-grid .ag-root-wrapper-body.ag-layout-auto-height {
    min-height: unset !important;
  }
  .create-schema-grid .ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) .ag-root-wrapper-body {
    min-height: 88px !important;
  }
  .ag-row .delete-icon-solid {
    display: none;
  }
  .ag-row:hover .delete-icon-outline {
    display: none;
  }
  .ag-row:hover .delete-icon-solid {
    display: inline-flex;
  }
  .ag-row:hover .ag-cell {
    background-color: ${CustomPalette.PINK_200} !important;
  }
  .ag-cell-value {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell, .ag-full-width-row .ag-cell-wrapper.ag-row-group {
    line-height: 1.5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ag-cell .ag-drag-handle {
    margin-right: 0;
  }
  .ag-overlay-no-rows-center {
    font-size: 14px;
  }
`;

const DeleteRenderer = ({ node, onDelete }) => (
  <Box className="delete-icon-wrapper" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
    <DeleteOutlineIcon sx={{ color: CustomPalette.GREY_600 }} className="delete-icon-outline" />
    <DeleteForeverIcon
      onClick={() => onDelete(node.rowIndex)}
      sx={{ color: CustomPalette.PRIMARY, cursor: "pointer" }}
      className="delete-icon-solid"
      title="Delete attribute"
    />
  </Box>
);

export default function CreateManually() {
  const addRef = useRef();
  const gridRef = useRef();
  const refContainer = useRef();
  const { t } = useTranslation();

  // Keep minimal legacy Context usage for navigation
  const { setCurrentPage } = useContext(Context);

  // Use MultiSchemaContext for all attribute management
  const { updateSchema, getSchema, getAttributesList } = useMultiSchema();

  const [rowData, setRowData] = useState([{ Name: "" }]);
  const [addErrorMessage, setAddErrorMessage] = useState("");
  const [forwardErrorMessage, setForwardErrorMessage] = useState("");
  const [backErrorMessage, setBackErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [showInvalidCharModal, setShowInvalidCharModal] = useState(false);
  // Get current attributes from MultiSchemaContext (computed from attributes array)
  const attributesList = getAttributesList();

  const handleDeleteRow = (rowIndex) => {
    gridRef.current.api.stopEditing();
    const newRowData = rowData.filter((item, index) => index !== rowIndex);
    setRowData(newRowData);
  };

  // Only sync from context when navigating BACK to this page with existing data
  // Don't interfere with fresh manual creation (when attributesList is empty)
  useEffect(() => {
    if (attributesList.length > 0) {
      // User navigated back to this page with saved attributes
      const allRowData = attributesList.map((item) => ({ Name: item }));
      setRowData(allRowData);
    }
    // Don't watch rowData - let it be managed by user actions only
  }, [attributesList.length]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api || rowData.length === 0) return;
    const raf = requestAnimationFrame(() => api.resetRowHeights());
    return () => cancelAnimationFrame(raf);
  }, [rowData]);

  const columnDefs = [
    { field: "Drag", headerName: "", width: 50, rowDrag: true },
    {
      field: "Name",
      headerName: t("Attribute Name"),
      width: 470,
      editable: true,
      wrapText: true,
      cellEditor: TextareaCellEditor,
      cellEditorParams: {
        context: { triggerInvalidCharModal: () => setShowInvalidCharModal(true) },
        enforceAttributeNamingRules: true
      },
      cellStyle: () => ({
        ...preWrapWordBreak,
        ...flexCenter
      })
    },
    {
      field: "Delete",
      headerName: "",
      cellRenderer: DeleteRenderer,
      cellRendererParams: (params) => ({
        node: params.node,
        onDelete: handleDeleteRow
      }),
      cellStyle: () => flexCenter,
      width: 44
    }
  ];

  const getRowHeight = useCallback((params) => {
    if (!params.data) return 40;
    const nameH = measureTextHeight(params.data.Name || "", 515, {});
    return Math.max(nameH, 40) + 16;
  }, []);

  const defaultColDef = {
    tabToNextCell: true
  };

  const onRowDragEnd = (event) => {
    const oldIndex = rowData.findIndex((item) => item.Name === event.node.data.Name);
    const newIndex = event.node.rowIndex;

    gridRef.current.api.stopEditing();
    const newRowData = [...rowData];
    newRowData.splice(newIndex, 0, newRowData.splice(oldIndex, 1)[0]);

    setRowData(newRowData);
  };

  // creates "Add by tab" behaviour
  const onCellKeyDown = useCallback((e) => {
    const keyPressed = e.event.code;

    const isLastRow = e.node.lastChild;
    if (keyPressed === "Tab") {
      if (isLastRow) {
        addRef.current.click();
        setTimeout(() => {
          const { api } = e;
          const editingRowIndex = e.rowIndex;
          api.setFocusedCell(editingRowIndex + 1, "Name");
        }, 0);
      } else {
        const { api } = e;
        const editingRowIndex = e.rowIndex;
        api.setFocusedCell(editingRowIndex + 1, "Name");
      }
    }
  }, []);

  const validateRowData = (
    errorSettingFunction,
    successFunction,
    resetFunction = null
  ) => {
    gridRef.current.api.stopEditing();

    const allAttributes = [];
    const duplicates = [];
    let spacesCounter = 0;
    let errorIndex = 0;
    let codeInjection = false;
    let hasDisallowedCharacters = false;
    gridRef.current.props.rowData.forEach((row, index) => {
      const attributeName = removeSpacesFromString(row.Name);

      if (hasDisallowedChars(attributeName)) {
        hasDisallowedCharacters = true;
        errorIndex = index;
      }

      if (
        attributeName.includes("/>") ||
        attributeName.includes("</") ||
        attributeName.includes("<svg") ||
        attributeName.includes("<script")
      ) {
        codeInjection = true;
      }

      if (allAttributes.includes(attributeName)) {
        duplicates.push(attributeName);
        errorIndex = index;
      } else if (attributeName === "" || attributeName === null) {
        spacesCounter++;
        errorIndex = index;
      } else {
        allAttributes.push(attributeName);
      }
    });

    if (hasDisallowedCharacters) {
      setShowInvalidCharModal(true);
      gridRef.current.api.setFocusedCell(errorIndex, "Name");
      return;
    }

    if (codeInjection) {
      errorSettingFunction("Attribute name cannot include HTML");
      setTimeout(() => {
        errorSettingFunction("");
      }, [1000]);
      return;
    }
    if (duplicates.length === 0) {
      if (spacesCounter > 0) {
        if (resetFunction) {
          if (spacesCounter === 1 && errorIndex === 0 && allAttributes.length === 0) {
            resetFunction();
          } else {
            errorSettingFunction(t("Attribute Names cannot be empty."));
            setTimeout(() => {
              errorSettingFunction("");
            }, [2500]);
          }
        } else {
          errorSettingFunction(t("Attribute Names cannot be empty."));
          gridRef.current.api.setFocusedCell(errorIndex, "Name");
          setTimeout(() => {
            errorSettingFunction("");
          }, [2500]);
        }
      } else {
        successFunction(allAttributes);
      }
    } else {
      errorSettingFunction("Attribute Names must be unique");
      gridRef.current.api.setFocusedCell(errorIndex, "Name");
      setTimeout(() => {
        errorSettingFunction("");
      }, [2500]);
    }
  };

  const addRowSuccess = () => {
    const newRow = { Name: "" };
    setRowData((prevState) => [...prevState, newRow]);
  };

  const handleAddRow = () => {
    gridRef.current.api.stopEditing();
    const newRow = { Name: "" };
    setRowData((prevState) => [...prevState, newRow]);
  };

  const pageForwardSuccess = (attributes) => {
    // Save to MultiSchemaContext only
    const attributeRowData = attributes.map(attr => ({
      Attribute: attr,
      Type: "", // Will be filled in AttributeDetails
      Description: "",
      Required: false,
      EntryCodes: [],
      List: false
    }));
    
    // attributesList is computed automatically from attributes
    updateSchema({
      attributes: attributeRowData
    });
    
    setCurrentPage("Metadata");
  };

  const handleForward = () => {
    validateRowData(setForwardErrorMessage, pageForwardSuccess);
  };

  const pageBackSuccess = (attributes) => {
    // Save to MultiSchemaContext only
    const attributeRowData = attributes.map(attr => ({
      Attribute: attr,
      Type: "",
      Description: "",
      Required: false,
      EntryCodes: [],
      List: false
    }));
    
    // attributesList is computed automatically from attributes
    updateSchema({
      attributes: attributeRowData
    });
    setCurrentPage("Start");
  };

  const pageBackReset = () => {
    // Clear MultiSchemaContext data (attributesList is computed automatically)
    updateSchema({
      attributes: []
    });
    setCurrentPage("Start");
  };

  const handleBack = () => {
    validateRowData(setBackErrorMessage, pageBackSuccess, pageBackReset);
  };

  const handleClearAll = () => {
    // Clear MultiSchemaContext data (attributesList is computed automatically)
    updateSchema({
      attributes: []
    });
    setRowData([{ Name: "" }]);
  };  // Stops grid editing when clicking outside grid
  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      if (
        gridRef.current.api &&
        refContainer.current &&
        !refContainer.current.contains(event.target)
      ) {
        gridRef.current.api.stopEditing();
      }
    };

    document.addEventListener("click", handleClickOutsideGrid);

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [gridRef, refContainer]);

  // Drops element when item is taken off grid
  // Prevents error where when element comes back onto grid, the index isn't saved correctly onRowDragEnd
  const onRowDragLeave = () => {
    const newRowData = JSON.parse(JSON.stringify(rowData));
    setRowData(newRowData);
    const onMouseUpEvent = new MouseEvent("mouseup");
    document.dispatchEvent(onMouseUpEvent);
  };

  const savedAttributeName = useRef("");
  const revertingDuplicate = useRef(false);

  // Handles 'attribute' column updates
  // To prevent row dragging bugs, attribute names can't be blank or duplicates
  // When the value is updated to handle duplicates, this function runs again

  const handleCellValueChanged = (e) => {
    if (revertingDuplicate.current) {
      revertingDuplicate.current = false;
      requestAnimationFrame(() => e.api.resetRowHeights());
      return;
    }
    const currentIndex = e.rowIndex;
    const allAttributeNames = gridRef.current.props.rowData.map((item) => item.Name);
    if (e.newValue) {
      const isDuplicate = allAttributeNames.filter((item) => item === e.newValue).length > 1;
      if (isDuplicate) {
        setDuplicateWarning(t("Please enter a unique name."));
        revertingDuplicate.current = true;
        const rowNode = gridRef.current.api.getRowNode(currentIndex);
        rowNode.setDataValue("Name", e.oldValue || "");
        setTimeout(() => setDuplicateWarning(""), 2500);
        return;
      }
    }
    setDuplicateWarning("");
    requestAnimationFrame(() => e.api.resetRowHeights());
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Pseudo-stepper for consistent layout */}
      <Box sx={{ px: 10, py: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Stepper activeStep={0} alternativeLabel sx={{ width: "100%" }}>
          <Step
            sx={{
              "& .MuiStepLabel-root": { alignItems: "center" },
              "& .MuiStepLabel-labelContainer": { display: "flex", justifyContent: "center" }
            }}
          >
            <StepLabel icon={<Box sx={{ width: 24, height: 24 }} />}>
              <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ButtonBase
                  component="span"
                  sx={{
                    cursor: "default",
                    alignSelf: "center",
                    px: 2,
                    py: 0.5,
                    border: `1px solid ${CustomPalette.PRIMARY}`,
                    borderRadius: 1,
                    backgroundColor: CustomPalette.PRIMARY,
                    color: "white",
                    boxShadow: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    lineHeight: 1.2,
                    maxWidth: "140px",
                    minHeight: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    visibility: "hidden",
                    pointerEvents: "none"
                  }}
                >
                  {t("Write Names")}
                </ButtonBase>
              </Box>
            </StepLabel>
          </Step>
        </Stepper>
      </Box>

      <BackNextSkeleton
        isBack
        pageBack={() => handleBack()}
        isForward
        pageForward={() => handleForward()}
      >
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "80%",
            margin: "auto",
            position: "relative"
          }}
        >
          {showInvalidCharModal && (
            <ErrorPopup onClose={() => setShowInvalidCharModal(false)}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="semibold" sx={{ mb: 2 }}>
                  {t("Attribute names are limited to the following characters:")}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 1, columnGap: 3, textAlign: "left" }}>
                    {[
                      { label: "Numbers", value: "0-9" },
                      { label: "Letters", value: "a-z, A-Z" },
                      { label: "Underline", value: "_" },
                      { label: "Hyphen", value: "-" },
                      { label: "Period", value: "." }
                    ].map((item, i) => (
                      <React.Fragment key={i}>
                        <Typography variant="body1">{t(item.label)}:</Typography>
                        <Typography variant="body1">{item.value}</Typography>
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
              </Box>
            </ErrorPopup>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", minHeight: "60px" }}>
            {duplicateWarning && (
              <Alert
                severity="error"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0,
                  mb: 1
                }}
              >
                {duplicateWarning}
              </Alert>
            )}
            {backErrorMessage && (
              <Alert
                severity="error"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0
                }}
              >
                <Box sx={{ pl: 2, pr: 2 }}>
                  {backErrorMessage}
                </Box>
              </Alert>
            )}
            {forwardErrorMessage.length > 0 && (
              <Alert
                severity="error"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0
                }}
              >
                {forwardErrorMessage}
              </Alert>
            )}
          </Box>
          <Box sx={{ width: 565 }}>
            <Box style={{ display: "flex" }}>
              <Box className="create-schema-grid ag-theme-balham" style={{ width: 565, overflowX: "hidden" }} ref={refContainer}>
            <style>{`${gridStyle}${agGridEditableCellHoverCss}`}</style>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout="autoHeight"
              getRowHeight={getRowHeight}
              suppressHorizontalScroll
              rowDragManaged
              animateRows
              onRowDragEnd={(e) => onRowDragEnd(e)}
              onCellKeyDown={onCellKeyDown}
              onRowDragLeave={(e) => onRowDragLeave(e)}
              onCellValueChanged={(e) => handleCellValueChanged(e)}
              overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            />
          </Box>
        </Box>
        <Box sx={{ mt: TABLE_TO_BUTTON_GAP, mb: BETWEEN_SECTION_SPACING, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <Button
            onClick={handleAddRow}
            color="button"
            variant="contained"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignSelf: "flex-end",
              m: 0,
              mb: 2
            }}
            ref={addRef}
          >
            {t("Add row")} &nbsp;
            <AddCircleIcon />
          </Button>

          {addErrorMessage.length > 0 && (
            <Alert severity="error" sx={{ maxWidth: "42ch" }}>
              {addErrorMessage}
            </Alert>
          )}
        </Box>
      </Box>
      </Box>
      </BackNextSkeleton>
    </Box>
  );
}
