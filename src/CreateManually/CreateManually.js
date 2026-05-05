import React, { useContext, useState, useRef, useCallback, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Box, Button, Alert, Typography } from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { Context } from "../App";

import { CustomPalette } from "../constants/customPalette";
import { removeSpacesFromString } from "../constants/removeSpaces";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { hasDisallowedChars } from "../constants/utils";

// !important overrides default grid style that sets the minimum height of the grid container
// Without the min-height, it looks awkward when the component is empty or has only a couple attributes
const gridStyle = `
  .ag-center-cols-clipper {
    min-height: unset !important;
  }
  
  .ag-theme-alpine .ag-cell {
    border-right: 1px solid ${CustomPalette.GREY_300};
  }
  
  .ag-cell-value {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .ag-header-cell-label {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-header-cell {
    border: 0.5px solid ${CustomPalette.GREY_300};}
  }
  `;

const DeleteRenderer = ({ node, canDelete, onDelete }) =>
  canDelete && (
    <DeleteOutlineIcon
      sx={{
        pr: 1,
        color: CustomPalette.GREY_600,
        transition: "all 0.2s ease-in-out"
      }}
      onClick={() => {
        onDelete(node.rowIndex);
      }}
    />
  );

export default function CreateManually() {
  const addRef = useRef();
  const gridRef = useRef();
  const refContainer = useRef();
  const { t } = useTranslation();

  const { setCurrentPage, setAttributesList, attributesList, setFileData } =
    useContext(Context);

  const [rowData, setRowData] = useState([{ Name: "" }]);
  const [addErrorMessage, setAddErrorMessage] = useState("");
  const [forwardErrorMessage, setForwardErrorMessage] = useState("");
  const [backErrorMessage, setBackErrorMessage] = useState("");
  const [canDelete, setCanDelete] = useState(attributesList.length > 1);

  const handleDeleteRow = (rowIndex) => {
    gridRef.current.api.stopEditing();
    const newRowData = rowData.filter((item, index) => index !== rowIndex);
    setRowData(newRowData);
    if (newRowData.length <= 1) {
      setCanDelete(false);
    }
  };

  useEffect(() => {
    const allRowData = [];
    if (attributesList.length > 0) {
      attributesList.forEach((item) => {
        allRowData.push({ Name: item });
      });
    } else {
      allRowData.push({ Name: "" });
    }

    setRowData(allRowData);
  }, [attributesList]);

  const columnDefs = [
    { field: "Drag", headerName: "", width: 50, rowDrag: true },
    { field: "Name", headerName: t("Attribute Name"), width: 470, editable: true },
    {
      field: "Delete",
      headerName: "",
      cellRenderer: DeleteRenderer,
      cellRendererParams: (params) => ({
        node: params.node,
        canDelete,
        onDelete: handleDeleteRow
      }),
      width: 50
    }
  ];

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
      errorSettingFunction(t("AttributeDisallowedCharErrorMessage"));
      gridRef.current.api.setFocusedCell(errorIndex, "Name");
      setTimeout(() => {
        errorSettingFunction("");
      }, [2500]);
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
            errorSettingFunction(t("Attribute Names cannot be empty"));
            setTimeout(() => {
              errorSettingFunction("");
            }, [2500]);
          }
        } else {
          errorSettingFunction(t("Attribute Names cannot be empty"));
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
    setCanDelete(true);
    setRowData((prevState) => [...prevState, newRow]);
  };

  const handleAddRow = () => {
    validateRowData(setAddErrorMessage, addRowSuccess);
  };

  const pageForwardSuccess = (attributes) => {
    setAttributesList(attributes);
    setCurrentPage("Metadata");
  };

  const handleForward = () => {
    validateRowData(setForwardErrorMessage, pageForwardSuccess);
  };

  const pageBackSuccess = (attributes) => {
    setAttributesList(attributes);
    setCurrentPage("Start");
  };

  const pageBackReset = () => {
    setAttributesList([]);
    setCurrentPage("Start");
  };

  const handleBack = () => {
    validateRowData(setBackErrorMessage, pageBackSuccess, pageBackReset);
  };

  const handleClearAll = () => {
    setRowData([{ Name: "" }]);
    setAttributesList([]);
    setFileData([]);
    setCanDelete(false);
  };

  // Stops grid editing when clicking outside grid
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

  // Handles 'attribute' column updates
  // To prevent row dragging bugs, attribute names can't be blank or duplicates
  // When the value is updated to handle duplicates, this function runs again

  const handleCellValueChanged = (e) => {
    const currentIndex = e.rowIndex;
    const allAttributeNames = gridRef.current.props.rowData.map((item) => item.Name);
    if (e.newValue) {
      // Renames duplicate values to <value>_(number)
      const findMultipleOccurrences = (array, value) => {
        const occurrences = array.filter((item) => item === value);
        return occurrences.length > 1;
      };
      let valueToAdd = e.newValue;
      if (findMultipleOccurrences(allAttributeNames, valueToAdd)) {
        savedAttributeName.current = e.oldValue;
        let i = 2;
        let tempValue = `${valueToAdd}_(${i})`;

        while (allAttributeNames.includes(tempValue)) {
          i += 1;
          tempValue = `${valueToAdd}_(${i})`;
        }

        valueToAdd = tempValue;
        const rowNode = gridRef.current.api.getRowNode(currentIndex);
        rowNode.setDataValue("Name", valueToAdd);
      }
    } else {
      // Re-save blank attribute as previous attribute
      const rowNode = gridRef.current.api.getRowNode(currentIndex);
      rowNode.setDataValue("Name", e.oldValue);

      e.api.startEditingCell({
        rowIndex: e.rowIndex,
        colKey: "Name"
      });
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "80%",
        margin: "auto"
      }}
    >
      <Box
        sx={{
          alignSelf: "flex-start",
          display: "flex",
          justifyContent: "space-between",
          width: "100%"
        }}
      >
        <Button color="button" onClick={() => handleBack()} sx={{ m: 3 }}>
          <ArrowBackIosIcon />
          {t("Back")}
        </Button>
        {backErrorMessage && (
          <Alert
            severity="error"
            sx={{ ml: "2rem", display: "flex", alignItems: "center" }}
          >
            <Box sx={{ pl: 2, pr: 2 }}>
              {backErrorMessage}
              <br />
              <b>Fix errors</b> or <b>clear all fields</b> to continue.
            </Box>
          </Alert>
        )}
        {forwardErrorMessage.length > 0 && (
          <Alert severity="error" sx={{ display: "flex", alignItems: "center" }}>
            {forwardErrorMessage}
          </Alert>
        )}
        <Button color="button" onClick={() => handleForward()} sx={{ m: "0.4rem" }}>
          {t("Next")}
          <ArrowForwardIosIcon />
        </Button>
      </Box>
      <Box sx={{ mb: 5 }}>
        <Typography
          sx={{
            fontSize: 35,
            fontWeight: "bold",
            color: CustomPalette.PRIMARY,
            p: 0
          }}
        >
          {t("Attribute Names")}
        </Typography>
        <Typography
          sx={{
            mt: -0.5,
            fontWeight: "bold",
            fontSize: 20,
            color: CustomPalette.GREY_800
          }}
        >
          {t("Enter the name of each attribute below")}
        </Typography>
        <Typography
          sx={{
            mt: 2,
            mx: "auto",
            fontWeight: "light",
            fontStyle: "italic",
            fontSize: 14,
            maxWidth: "55ch"
          }}
        >
          {t(
            "Attribute names are limited to the following characters: numbers: 0-9, letters: a-z and A-Z, underline: _, hyphen: -, period: ."
          )}
        </Typography>
        <Typography
          sx={{
            mt: 2,
            fontWeight: "light",
            fontStyle: "italic",
            fontSize: 14
          }}
        >
          {t(
            "This will be the column header in every tabular data set no matter what language"
          )}
          <br />
          {t("Every attribute must be unique, and no entries can be left blank")}
        </Typography>
      </Box>
      <Box>
        <Box style={{ display: "flex" }}>
          <Box className="ag-theme-alpine" style={{ width: 565 }} ref={refContainer}>
            <style>{gridStyle}</style>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout="autoHeight"
              rowDragManaged
              animateRows
              onRowDragEnd={(e) => onRowDragEnd(e)}
              onCellKeyDown={onCellKeyDown}
              onRowDragLeave={(e) => onRowDragLeave(e)}
              onCellValueChanged={(e) => handleCellValueChanged(e)}
            />
          </Box>
        </Box>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", mt: "2rem" }}>
            <Button
              onClick={handleAddRow}
              color="button"
              variant="contained"
              sx={{
                width: "10rem",
                m: "1rem 3rem 1rem 0",
                display: "flex",
                alignItems: "center"
              }}
              ref={addRef}
            >
              {t("Add row")} <AddCircleIcon sx={{ marginLeft: "10px" }} />
            </Button>

            {addErrorMessage.length > 0 && (
              <Alert severity="error" sx={{ maxWidth: "42ch" }}>
                {addErrorMessage}
              </Alert>
            )}
          </Box>
          <Button
            color="warning"
            variant="outlined"
            onClick={handleClearAll}
            sx={{
              alignSelf: "flex-end",
              width: "10rem",
              display: "flex",
              justifyContent: "space-around",
              p: 1,
              mb: 5
            }}
          >
            {t("Clear All")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
