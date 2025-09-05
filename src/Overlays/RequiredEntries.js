import React, { useContext, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { flexCenter, gridStyles, preWrapWordBreak } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import DeleteConfirmation from "./DeleteConfirmation";

const RequiredEntryHeader = ({ gridRef, t }) => {
  const inputRef = useRef();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue("Make selected entries required", checked);
    });
  };

  useEffect(() => {
    inputRef.current.checked = false;
  }, []);

  return (
    <CellHeader
      headerText={
        <Box sx={{ display: "flex", direction: "row", alignItems: "center" }}>
          {t("Required entries")} {" "}
          <input
            type="checkbox"
            ref={inputRef}
            onChange={handleCheckboxChange}
          />
        </Box>
      }
      helpText={t("Check for each attribute where the data entry cannot be left empty in a dataset")} />
  );
};

const CheckboxRenderer = ({ value, rowIndex, colDef, api }) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  const handleChange = (event) => {
    const { checked } = event.target;
    api.forEachNode((node, index) => {
      if (rowIndex === index) {
        node.setDataValue("Make selected entries required", checked);
      } else if (!node.data[colDef.field]) {
        node.setDataValue("Make selected entries required", false);
      }
    });
  };

  return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
};

const RequiredEntries = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);
  
  // Use simplified schema data hook
  // Use MultiSchema context with standard pattern
  const { activeSchemaId, editingSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId || editingSchemaId;
  const schemaState = getSchemaState(currentSchemaId);
  
  const updateCurrentSchema = useCallback((updates) => {
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, updates);
    }
  }, [currentSchemaId, updateSchemaState]);
  
  // Get attributes data with Required status from schema state
  const requiredEntriesRowData = useMemo(() => {
    if (!schemaState?.attributes) return [];
    
    // Create row data with Attribute name and Required status
    return schemaState.attributes.map((attr) => ({
      Attribute: attr.Attribute,
      "Make selected entries required": !!attr.Required
    }));
  }, [schemaState?.attributes]);
  
  const setRequiredEntriesRowData = useCallback((newData) => {
    // Update the attributes in schema state with new Required status
    const updatedAttributes = schemaState.attributes.map((attr) => {
      const rowData = newData.find((row) => row.Attribute === attr.Attribute);
      return {
        ...attr,
        Required: rowData ? rowData["Make selected entries required"] : false
      };
    });
    
    updateCurrentSchema({
      attributes: updatedAttributes
    });
  }, [schemaState?.attributes, updateCurrentSchema]);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();

  // Add callback to handle data changes in the grid
  const handleCellValueChanged = useCallback((event) => {
    // Get all current row data
    const allRowData = [];
    event.api.forEachNode((node) => allRowData.push(node.data));
    // Update schema state with new data
    setRequiredEntriesRowData(allRowData);
  }, [setRequiredEntriesRowData]);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attributes"),
          helpText: t("This is the name for the attribute and, for example...")
        },
      },
      {
        field: "Make selected entries required",
        width: 180,
        headerComponent: RequiredEntryHeader,
        headerComponentParams: {
          gridRef,
          t
        },
        cellRenderer: CheckboxRenderer,
        checkboxSelection: false,
        cellStyle: () => flexCenter,
      },
    ]);
  }, [t]);

  const handleForward = () => {
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Make selected entries required": {
        ...prev["Make selected entries required"],
        selected: false,
      },
    }));

    // Delete attribute from requiredEntriesRowData - uncheck all required flags
    const newRequiredEntriesRowData = requiredEntriesRowData.map((row) => ({
      ...row,
      "Make selected entries required": false
    }));
    setRequiredEntriesRowData(newRequiredEntriesRowData);
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={() => setShowDeleteConfirmation(true)} backText="Remove overlay">
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
          flexDirection: "column",
        }}
      >
        <div className="ag-theme-balham" style={{ width: 360 }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={requiredEntriesRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            onCellValueChanged={handleCellValueChanged}
          />
        </div>
      </Box>
    </BackNextSkeleton>
  );
};

export default RequiredEntries;
