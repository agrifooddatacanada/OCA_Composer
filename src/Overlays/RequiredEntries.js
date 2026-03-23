import React, { useContext, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import { flexCenter, gridStyles, preWrapWordBreak } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import CheckboxColumnHeader from "../AttributeDetails/CheckboxColumnHeader";
import DeleteConfirmation from "./DeleteConfirmation";
import { FIELD_CONFORMANCE_OVERLAY } from "../constants/constants";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { overlayGridOnFirstDataRendered } from "./gridUtils";
import { measureTextHeight } from "../utils/measureTextLines";

const RequiredEntryHeader = ({ gridRef, t }) => {
  const inputRef = useRef();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue(FIELD_CONFORMANCE_OVERLAY, checked);
    });
  };

  useEffect(() => {
    inputRef.current.checked = false;
  }, []);

  return (
    <CheckboxColumnHeader
      label={t("Required")}
      helpText={t("Check for each attribute where the data entry cannot be left empty in a dataset")}
      onCheckboxChange={handleCheckboxChange}
      inputRef={inputRef}
    />
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
        node.setDataValue(FIELD_CONFORMANCE_OVERLAY, checked);
      } else if (!node.data[colDef.field]) {
        node.setDataValue(FIELD_CONFORMANCE_OVERLAY, false);
      }
    });
  };

  return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
};

const RequiredEntries = () => {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { getSchema, updateSchema } = useMultiSchema();
  
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_CONFORMANCE_OVERLAY);
  
  // Get attributes data with Required status from schema state
  const requiredEntriesRowData = useMemo(() => {
    if (!schemaState?.attributes) return [];
    
    // Create row data with Attribute name and Required status
    return schemaState.attributes.map((attr) => ({
      Attribute: attr.Attribute,
      [FIELD_CONFORMANCE_OVERLAY]: !!attr.Required
    }));
  }, [schemaState?.attributes]);
  
  const setRequiredEntriesRowData = useCallback((newData) => {
    // Update the attributes in schema state with new Required status
    const updatedAttributes = schemaState.attributes.map((attr) => {
      const rowData = newData.find((row) => row.Attribute === attr.Attribute);
      return {
        ...attr,
        Required: rowData ? rowData[FIELD_CONFORMANCE_OVERLAY] : false
      };
    });
    
    updateSchema({
      attributes: updatedAttributes
    });
  }, [schemaState?.attributes, updateSchema]);
  
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

  const getRowHeight = useCallback((params) => {
    const opts = { compact: true };
    const attrH = measureTextHeight(params.data?.Attribute || "", 100, opts);
    return Math.max(32, attrH + 16);
  }, []);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 100,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t("This is the name for the attribute and, for example...")
        },
      },
      {
        field: FIELD_CONFORMANCE_OVERLAY,
        width: 70,
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



  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={() => setCurrentPage("Overlays")}>
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
          flexDirection: "column",
        }}
      >
        <div className="required-entries-grid ag-theme-balham" style={{ width: 330 }}>
          <style>{gridStyles}</style>
          <style>{`
  .required-entries-grid .ag-header-cell[col-id="Required Entry"] input[type="checkbox"],
  .required-entries-grid .ag-cell[col-id="Required Entry"] input[type="checkbox"] {
    width: 13px;
    height: 13px;
    margin: 0;
  }
`}</style>
          <AgGridReact
            key={i18n.language}
            ref={gridRef}
            rowData={requiredEntriesRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            getRowHeight={getRowHeight}
            suppressHorizontalScroll
            onFirstDataRendered={overlayGridOnFirstDataRendered}
            onCellValueChanged={handleCellValueChanged}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
          />
        </div>
      </Box>
    </BackNextSkeleton>
  );
};

export default RequiredEntries;
