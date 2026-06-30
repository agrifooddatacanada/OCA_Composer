import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import {
  BETWEEN_SECTION_SPACING,
  AG_GRID_VIRTUALIZE_MIN_ROWS,
  FIELD_CONFORMANCE_OVERLAY
} from "../constants/constants";
import { flexCenter, gridStyles, greyCellStyle } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import CheckboxColumnHeader from "../AttributeDetails/CheckboxColumnHeader";
import DeleteConfirmation from "./DeleteConfirmation";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { measureTextHeight } from "../utils/measureTextLines";

const REQUIRED_GRID_WIDTH_PX = 330;
const REQUIRED_ATTR_COL_WIDTH_PX = Math.round((REQUIRED_GRID_WIDTH_PX * 100) / 170);
const REQUIRED_CHECK_COL_WIDTH_PX = REQUIRED_GRID_WIDTH_PX - REQUIRED_ATTR_COL_WIDTH_PX;
const REQUIRED_COLUMN_SUM_PX = REQUIRED_ATTR_COL_WIDTH_PX + REQUIRED_CHECK_COL_WIDTH_PX;

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
      helpText={t(
        "Check for each attribute where the data entry cannot be left empty in a dataset"
      )}
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

const RequiredEntries = forwardRef((_props, ref) => {
  const { t, i18n } = useTranslation();
  const { setCurrentPage, setSelectedOverlay } = useContext(Context);

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

  const setRequiredEntriesRowData = useCallback(
    (newData) => {
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
    },
    [schemaState?.attributes, updateSchema]
  );

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const gridRef = useRef();
  const requiredGridFixedViewport =
    requiredEntriesRowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;
  const requiredOuterWidthPx = REQUIRED_COLUMN_SUM_PX;

  // Add callback to handle data changes in the grid
  const handleCellValueChanged = useCallback(
    (event) => {
      // Get all current row data
      const allRowData = [];
      event.api.forEachNode((node) => allRowData.push(node.data));
      // Update schema state with new data
      setRequiredEntriesRowData(allRowData);
    },
    [setRequiredEntriesRowData]
  );

  const getRowHeight = useCallback((params) => {
    const attrH = measureTextHeight(
      params.data?.Attribute || "",
      REQUIRED_ATTR_COL_WIDTH_PX,
      {}
    );
    return Math.max(32, attrH + 16);
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: REQUIRED_ATTR_COL_WIDTH_PX,
        minWidth: REQUIRED_ATTR_COL_WIDTH_PX,
        maxWidth: REQUIRED_ATTR_COL_WIDTH_PX,
        suppressSizeToFit: true,
        cellStyle: () => ({
          ...greyCellStyle,
          textAlign: "center"
        }),
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t(
            "Name for the attribute and, for example, the column header in every tabular data set no matter what language"
          )
        }
      },
      {
        field: FIELD_CONFORMANCE_OVERLAY,
        width: REQUIRED_CHECK_COL_WIDTH_PX,
        minWidth: REQUIRED_CHECK_COL_WIDTH_PX,
        maxWidth: REQUIRED_CHECK_COL_WIDTH_PX,
        suppressSizeToFit: true,
        headerComponent: RequiredEntryHeader,
        headerComponentParams: {
          gridRef,
          t
        },
        cellRenderer: CheckboxRenderer,
        checkboxSelection: false,
        cellStyle: () => flexCenter
      }
    ],
    [t]
  );

  const flushGridToSchema = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.stopEditing();
    const rows = [];
    api.forEachNode((node) => {
      if (node.data) rows.push(node.data);
    });
    if (rows.length > 0) {
      setRequiredEntriesRowData(rows);
    }
  }, [setRequiredEntriesRowData]);

  useImperativeHandle(
    ref,
    () => ({
      save: flushGridToSchema
    }),
    [flushGridToSchema]
  );

  const handleLeaveToOverlays = useCallback(() => {
    flushGridToSchema();
    setCurrentPage("Overlays");
  }, [flushGridToSchema, setCurrentPage]);

  const handleForward = () => {
    flushGridToSchema();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={handleLeaveToOverlays}
    >
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
          width: requiredOuterWidthPx,
          minWidth: requiredOuterWidthPx,
          maxWidth: requiredOuterWidthPx,
          boxSizing: "border-box",
          textAlign: "left"
        }}
      >
        <div
          className={`required-entries-grid overlay-grid-suppress-hscroll${requiredGridFixedViewport ? " overlay-grid-fixed-viewport" : ""} ag-theme-balham${requiredGridFixedViewport ? "" : " ag-grid-compact"}`}
          style={{ width: "100%", minWidth: requiredOuterWidthPx, overflow: "hidden" }}
        >
          <style>{gridStyles}</style>
          <AgGridReact
            key={`${i18n.language}-${requiredGridFixedViewport ? "fx" : "ah"}`}
            ref={gridRef}
            domLayout={requiredGridFixedViewport ? undefined : "autoHeight"}
            style={{
              width: "100%",
              height: requiredGridFixedViewport ? "100%" : "auto"
            }}
            rowData={requiredEntriesRowData}
            columnDefs={columnDefs}
            getRowId={(params) => params.data?.Attribute ?? ""}
            suppressRowHoverHighlight
            suppressScrollOnNewData
            getRowHeight={getRowHeight}
            suppressHorizontalScroll
            suppressColumnVirtualisation
            animateRows={false}
            onCellValueChanged={handleCellValueChanged}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            defaultColDef={{ resizable: false }}
          />
        </div>
      </Box>
    </BackNextSkeleton>
  );
});

export default RequiredEntries;
