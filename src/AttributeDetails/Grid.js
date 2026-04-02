import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

import TypeTooltip from "./TypeTooltip";
import CellHeader from "../components/CellHeader";
import TextareaCellEditor from "../components/TextareaCellEditor";
import { measureTextHeight } from "../utils/measureTextLines";
import { flexCenter, preWrapWordBreak } from "../constants/styles";
import CheckboxRenderer from "./CheckboxRenderer";
import FlaggedHeader from "./FlaggedHeader";
import ListHeader from "./ListHeader";
import DeleteRenderer from "./DeleteRenderer";
import TypeRenderer from "./TypeRenderer";
import { useMultiSchema } from "../schema/schemaContext";
import {
  AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX,
  AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX,
  AG_GRID_VIRTUALIZE_MIN_ROWS
} from "../constants/constants";

const ATTRIBUTE_GRID_COLUMN_SUM_PX = 40 + 150 + 125 + 128 + 150 + 100 + 44;

// styles override the default cell style that limits height of input field. It looks ugly when word wrapping happens
const gridStyle = `
  .ag-cell {
    line-height: 1.5
  }
  .ag-select-list {
    height: 90px;
    overflow-y: auto;
  }
  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%;
  }
  .ag-row .delete-icon-solid {
    display: none;
  }
  .delete-icon-wrapper:hover .delete-icon-outline {
    display: none;
  }
  .delete-icon-wrapper:hover .delete-icon-solid {
    display: inline-flex;
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
  .ag-center-cols-viewport .ag-cell:last-child {
    border-right: none !important;
  }
  .ag-header-row .ag-header-cell:last-child::after {
    display: none !important;
  }
  .ag-header-viewport {
    overflow-x: hidden;
  }
  .attribute-details-grid .ag-body-horizontal-scroll {
    display: none !important;
  }
  .attribute-details-grid .ag-header-cell[col-id="Sensitive"] input[type="checkbox"],
  .attribute-details-grid .ag-header-cell[col-id="List"] input[type="checkbox"],
  .attribute-details-grid .ag-cell[col-id="Sensitive"] input[type="checkbox"],
  .attribute-details-grid .ag-cell[col-id="List"] input[type="checkbox"] {
    width: 13px;
    height: 13px;
    margin: 0;
  }
  `;

// Renderers define input cells, Headers define grid header cells
// .stopEditing() needs to run whenever the grid refreshes, or the current table state won't be saved. Adding/Deleting/Navigation

export default function Grid({
  gridRef,
  addButton1,
  addButton2,
  setErrorMessage,
  canDelete,
  setCanDelete,
  setAddByTab,
  typesObjectRef,
  loading,
  setLoading,
  attributeRowData,
  setAttributeRowData,
  triggerInvalidCharModal
}) {
  const { t, i18n } = useTranslation();
  const attrGridFixedViewport =
    attributeRowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;
  const noAttributes = attributeRowData.length === 0;
  const attributeGridViewportStyle = useMemo(
    () => `
  .attribute-details-grid.ag-theme-balham {
    ${attrGridFixedViewport ? "height: min(70vh, 560px);" : ""}
    min-height: ${noAttributes ? AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX : 120}px;
  }
  .attribute-details-grid .ag-root-wrapper {
    height: ${attrGridFixedViewport ? "100%" : "auto"};
  }
  ${
    noAttributes && !attrGridFixedViewport
      ? `
  .attribute-details-grid .ag-body-viewport {
    min-height: ${AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX}px !important;
  }
  `
      : ""
  }
`,
    [attrGridFixedViewport, noAttributes]
  );

  const { renameAttribute } = useMultiSchema();

  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const endLoadCancelledRef = useRef(false);
  const loadDebounceRafRef = useRef(null);

  useLayoutEffect(() => {
    if (loading) {
      endLoadCancelledRef.current = true;
      if (loadDebounceRafRef.current != null) {
        cancelAnimationFrame(loadDebounceRafRef.current);
        loadDebounceRafRef.current = null;
      }
    }
  }, [loading]);

  const scheduleEndBlockingLoad = useCallback(() => {
    if (!loadingRef.current) return;
    endLoadCancelledRef.current = false;
    if (loadDebounceRafRef.current != null) {
      cancelAnimationFrame(loadDebounceRafRef.current);
    }
    loadDebounceRafRef.current = requestAnimationFrame(() => {
      loadDebounceRafRef.current = null;
      if (endLoadCancelledRef.current) return;
      requestAnimationFrame(() => {
        if (endLoadCancelledRef.current) return;
        const api = gridRef.current?.api;
        if (attributeRowData.length > 0 && !api) return;
        if (api && attributeRowData.length > 0) api.resetRowHeights();
        requestAnimationFrame(() => {
          if (endLoadCancelledRef.current) return;
          requestAnimationFrame(() => {
            if (endLoadCancelledRef.current) return;
            setLoading(false);
          });
        });
      });
    });
  }, [attributeRowData, setLoading]);
  
  // Derive attributesList from attributeRowData (single source of truth)
  const attributesList = useMemo(
    () => attributeRowData.map((item) => item.Attribute),
    [attributeRowData]
  );
  
  // Note: attributesList is now computed - no need to update it separately
  
  const [columnDefs, setColumnDefs] = useState([]);
  const canDrag = useRef(true);

  // AG grid's built-in drop-down menu had functionality issues (single click cannot open the menu)
  // Using AG grid's custom cell editor component had similar issues.
  // Result: Used a regular cell renderer. The Type cell's content isn't saved in the same way as the other cells - it needs additional handling on Adding/Deleting Attributes and Navigation
  // typesObjectRef saves all the types for the grid, and type is the 'local' current type of the cell

  const dropRefs = useRef(attributeRowData.map(() => React.createRef()));

  // Ensure stable row ids so rows don't disappear when toggling List or editing
  useEffect(() => {
    const missingId = attributeRowData.some((r) => !r._rid);
    if (!missingId) return;
    const stamped = Date.now();
    const next = attributeRowData.map((r, i) =>
      r._rid ? r : { ...r, _rid: `${stamped}_${i}` }
    );
    setAttributeRowData(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeRowData]);

  useEffect(() => {
    dropRefs.current = attributeRowData.map(() => React.createRef());
  }, [attributesList, attributeRowData]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api || attributeRowData.length === 0) return;
    const raf = requestAnimationFrame(() => api.resetRowHeights());
    return () => cancelAnimationFrame(raf);
  }, [attributeRowData]);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Drag",
        headerName: "",
        width: 40,
        cellStyle: () => ({
          display: "flex"
        }),
        rowDrag: () => canDrag.current
      },
      {
        field: "Attribute",
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t("This is the name for the attribute and, for example...")
        },
        editable: true,
        wrapText: true,
        cellEditor: TextareaCellEditor,
        cellEditorParams: {
          context: { setErrorMessage, triggerInvalidCharModal }
        },
        cellStyle: () => ({
          ...preWrapWordBreak,
          ...flexCenter
        }),
        width: 150
      },
      {
        field: "Sensitive",
        headerComponent: FlaggedHeader,
        headerComponentParams: {
          gridRef
        },
        cellRenderer: CheckboxRenderer,
        checkboxSelection: false,
        cellStyle: () => flexCenter
      },
      {
        field: "Unit",
        editable: true,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Unit"),
          helpText: t(
            "The units of each attribute (or leave blank if the attribute is..."
          )
        },
        wrapText: true,
        cellEditor: TextareaCellEditor,
        cellStyle: () => ({
          ...preWrapWordBreak,
          ...flexCenter
        }),
        width: 128
      },
      {
        field: "Type",
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Type"),
          helpText: <TypeTooltip />
        },
        cellRenderer: TypeRenderer,
        cellRendererParams: (params) => ({
          data: params.data,
          attributeRowData,
          typesObjectRef,
          dropRefs,
          setAttributeRowData
        }),
        width: 150
      },
      {
        field: "List",
        headerComponent: ListHeader,
        headerComponentParams: {
          gridRef
        },
        cellRenderer: CheckboxRenderer,
        cellRendererParams: {
          onLocalToggle: (attributeName, checked) => {
            setAttributeRowData((prev) =>
              prev.map((row) =>
                row.Attribute === attributeName ? { ...row, List: checked } : row
              )
            );
          }
        },
        checkboxSelection: false,
        cellStyle: () => flexCenter,
        width: 100
      },
      {
        field: "Delete",
        headerName: "",
        cellRenderer: DeleteRenderer,
        cellRendererParams: (params) => ({
          data: params.data,
          gridRef,
          typesObjectRef,
          currentRows: attributeRowData,
          setAttributeRowData,
          canDelete,
          setCanDelete
        }),
        cellStyle: () => flexCenter,
        width: 44
      }
    ]);
  }, [attributesList, attributeRowData, canDelete, typesObjectRef]);

  const defaultColDef = {
    width: 125
  };

  const onCellKeyDown = useCallback(
    (e) => {
      const keyPressed = e.event.code;
      const isUnitRow = e.column.colId === "Unit";
      const isTypeColumn = e.column.colId === "Type";
      if (keyPressed === "Enter" && isUnitRow) {
        // Copies current cell value to cell below if it's empty
        const { api } = e;
        const editingRowIndex = e.rowIndex;
        api.setFocusedCell(editingRowIndex + 1, "Unit");
        const nextRowNode = api.getRowNode(editingRowIndex + 1);

        if (nextRowNode && !nextRowNode.data.Unit) {
          nextRowNode.setDataValue("Unit", e.value);
        }
      }
      if (keyPressed === "ArrowDown" && isTypeColumn) {
        // Properly focuses Type cell for editing to allow <enter> to toggle element
        if (e.eventPath[0].id === "select-drop") {
          const selectRef = dropRefs.current[e.rowIndex];
          if (selectRef && selectRef.current) {
            selectRef.current.focus();
            selectRef.current.click();
          }
        }
      }
      if (keyPressed === "ArrowUp" && isTypeColumn) {
        // Properly focuses Type cell for editing to allow <enter> to toggle element
        if (e.eventPath[0].id === "select-drop") {
          const selectRef = dropRefs.current[e.rowIndex];
          if (selectRef && selectRef.current) {
            selectRef.current.focus();
            selectRef.current.click();
          }
        }
      }
      if (keyPressed === "Enter" && isTypeColumn) {
        // Toggles Type drop-down
        if (e.eventPath[0].id !== "select-drop") {
          const selectRef = dropRefs.current[e.rowIndex];
          if (selectRef && selectRef.current) {
            selectRef.current.focus();
            selectRef.current.click();
            e.api.stopEditing();
            e.api.setFocusedCell(e.rowIndex, "Type");
          }
        }
      }

      const tabbingColumns = ["Attribute", "Unit", "Type"];
      const isShiftTab = e.event.shiftKey && keyPressed === "Tab";
      if (isShiftTab) {
        // Traverses grid backwards
        const currentIndex = tabbingColumns.findIndex((item) => item === e.column.colId);
        if (e.rowIndex > 0) {
          if (e.column.colId === "Attribute") {
            e.api.setFocusedCell(e.rowIndex - 1, "Type");
          } else {
            e.api.startEditingCell({
              rowIndex: e.rowIndex,
              colKey: tabbingColumns[currentIndex - 1]
            });
          }
        }
      } else if (keyPressed === "Tab") {
        // Creates "Add by tab" functionality if on last editable cell
        const isLastRow = e.node.lastChild;
        const isLastColumn = e.column.colId === "Type";

        if (isLastRow && isLastColumn) {
          const currentGridData = gridRef.current.props.rowData;
          const currentAttributeName =
            currentGridData[currentGridData.length - 1].Attribute;

          const attributesArrayWithoutLast = currentGridData.slice(0, -1);
          if (
            attributesArrayWithoutLast.findIndex(
              (attribute) => attribute.Attribute === currentAttributeName
            ) !== -1
          ) {
            setErrorMessage(t("Please enter a unique name."));
            setTimeout(() => {
              setErrorMessage("");
            }, [2000]);
            return;
          }
          if (currentAttributeName === "") {
            setErrorMessage(t("Please enter a name."));
            setTimeout(() => {
              setErrorMessage("");
            }, [2000]);
            return;
          }

          setAddByTab(true);
          let waitTime = 0;

          // Handles click when manual 'Add Attribute' field isn't open
          if (!addButton2.current) {
            addButton1.current.click();
            waitTime = 5;
          }

          setTimeout(() => {
            try {
              addButton2.current.click();
              setTimeout(() => {
                const { api } = e;
                const editingRowIndex = e.rowIndex;
                api.startEditingCell({
                  rowIndex: editingRowIndex + 1,
                  colKey: "Attribute"
                });
                setAddByTab(false);
              }, 2);
            } catch (error) {
              setErrorMessage(t("Something went wrong when adding cell by tab. Try again."));
              setTimeout(() => {
                setErrorMessage("");
              }, [2000]);
            }
          }, waitTime);
          // Focuses correct next cell when tabbing
        } else if (e.column.colId === "Unit") {
          const typeColumn = e.columnApi.getColumn("Type");
          if (typeColumn) {
            e.api.setFocusedCell(e.rowIndex, "Type");
            const selectRef = dropRefs.current[e.rowIndex];
            if (selectRef && selectRef.current) {
              selectRef.current.focus();
            }
          }
        } else if (e.column.colId === "Type") {
          e.api.startEditingCell({
            rowIndex: e.rowIndex + 1,
            colKey: "Attribute"
          });
        } else {
          // Checks for duplicate attribute names before navigating forward - duplicates affect data handling
          const currentIndex = tabbingColumns.indexOf(e.column.colId);
          if (e.column.colId === "Attribute") {
            const allOtherRows = JSON.parse(
              JSON.stringify(gridRef.current.props.rowData)
            );
            allOtherRows.splice(e.node.rowIndex, 1);
            const allOtherAttributes = allOtherRows.map((item) => item.Attribute);
            if (!allOtherAttributes.includes(e.data.Attribute) && e.data.Attribute) {
              e.api.startEditingCell({
                rowIndex: e.rowIndex,
                colKey: tabbingColumns[currentIndex + 1]
              });
            } else {
              setErrorMessage(t("Please enter a unique name."));
              setTimeout(() => {
                setErrorMessage("");
              }, [2000]);
              e.api.setFocusedCell(e.rowIndex, "Attribute");
              e.api.startEditingCell({
                rowIndex: e.rowIndex,
                colKey: tabbingColumns[currentIndex]
              });
            }
          }
        }
      } else if (keyPressed === "Delete" || keyPressed === "Backspace") {
        // Opens Type drop-down for editing when key is pressed
        if (e.column.colId === "Type") {
          const { api } = e;
          const editingRowIndex = e.rowIndex;
          const rowNode = api.getRowNode(editingRowIndex);
          const attributeName = rowNode.data.Attribute;
          const currentIndex = attributeRowData.findIndex(
            (item) => item.Attribute === attributeName
          );

          const selectRef = dropRefs.current[currentIndex];

          if (selectRef && selectRef.current) {
            selectRef.current.click();
          }
        }
      }
    },
    [attributeRowData, attributesList, t]
  );

  // Saves elements in proper order after dragging
  const onRowDragEnd = (event) => {
    const oldIndex = attributeRowData.findIndex(
      (item) => item.Attribute === event.node.data.Attribute
    );
    const newIndex = event.node.rowIndex;
    gridRef.current.api.stopEditing();
    const newRowData = JSON.parse(JSON.stringify(attributeRowData));
    newRowData.forEach((item) => {
      item.Type = typesObjectRef.current[item.Attribute] || item.Type;
    });
    newRowData.splice(newIndex, 0, newRowData.splice(oldIndex, 1)[0]);
    setAttributeRowData(newRowData);
  };

  // Drops element when item is taken off grid
  // Prevents error where when element comes back onto grid, the index isn't saved correctly onRowDragEnd
  const onRowDragLeave = () => {
    const newRowData = JSON.parse(JSON.stringify(attributeRowData));
    newRowData.forEach((item) => {
      // Preserve empty string as valid Type value (don't use || which treats "" as falsy)
      const typeFromRef = typesObjectRef.current[item.Attribute];
      item.Type = typeFromRef !== undefined ? typeFromRef : item.Type;
    });
    setAttributeRowData(newRowData);
    const onMouseUpEvent = new MouseEvent("mouseup");
    document.dispatchEvent(onMouseUpEvent);
  };

  const [rowDragManaged, setRowDragManaged] = useState(true);
  const savedAttributeName = useRef("");

  // Handles 'attribute' column updates
  // To prevent row dragging bugs, attribute names can't be blank or duplicates
  // When the value is updated to handle duplicates, this function runs again

  const updateTypesObjRef = (oldAttributeValue, newAttributeValue) => {
    const updatedTypesObjRefValue = { ...typesObjectRef.current };
    updatedTypesObjRefValue[newAttributeValue] =
      typesObjectRef.current[oldAttributeValue];
    delete updatedTypesObjRefValue[oldAttributeValue];
    typesObjectRef.current = updatedTypesObjRefValue;
  };

  const handleCellValueChanged = (e) => {
    // Only handle event if the user changed the attribute name; do not handle programmatic update
    if (e.source !== "edit") return;
    const isAttributeNameChange = e.colDef.field === "Attribute";
    if (isAttributeNameChange) {
      const allAttributeNames = attributeRowData.map((item, i) =>
        i === e.rowIndex ? e.newValue : item.Attribute
      );
      if (e.newValue) {
        // Renames duplicate values to <value>_(number)
        const findMultipleOccurrences = (array, value) => {
          const occurrences = array.filter((item) => item === value);
          return occurrences.length > 1;
        };
        let valueToAdd = e.newValue;
        if (findMultipleOccurrences(allAttributeNames, valueToAdd)) {
          savedAttributeName.current = e.oldValue;
          let i = 1;
          let tempValue = `${valueToAdd}_${i}`;

          while (allAttributeNames.includes(tempValue)) {
            i += 1;
            tempValue = `${valueToAdd}_${i}`;
          }

          valueToAdd = tempValue;
          const rowId = e.data?._rid;
          setAttributeRowData((prev) =>
            prev.map((row) =>
              row._rid === rowId ? { ...row, Attribute: valueToAdd } : row
            )
          );

          // Update typesObjectRef using updated new value
          const newAttributeName = valueToAdd;
          const oldAttributeName = e.oldValue;

          updateTypesObjRef(oldAttributeName, newAttributeName);
          renameAttribute(oldAttributeName, newAttributeName);
        } else {
          setAttributeRowData((prev) =>
            prev.map((row, i) =>
              i === e.rowIndex ? { ...row, Attribute: e.newValue } : row
            )
          );
          if (e.oldValue) {
            savedAttributeName.current = e.oldValue;
          } else if (e.oldValue !== "") {
            savedAttributeName.current = e.newValue;
          }

          const newAttributeName = e.newValue;
          const oldAttributeName = savedAttributeName.current;
          if (oldAttributeName !== newAttributeName) {
            updateTypesObjRef(oldAttributeName, newAttributeName);
            renameAttribute(oldAttributeName, newAttributeName);
          }
        }
      } else {
        const rowId = e.data?._rid;
        setAttributeRowData((prev) =>
          prev.map((row) =>
            row._rid === rowId ? { ...row, Attribute: e.oldValue } : row
          )
        );
        setTimeout(() => {
          e.api.startEditingCell({
            rowIndex: e.rowIndex,
            colKey: "Attribute"
          });
        }, 0);
      }

      // Prevents Row Dragging when attribute names are blank
      // Current functionality doesn't allow this to run, but it's handled in case user finds a way to bypass checks
      // Sometimes doesn't run if only one attribute name is blank, but that doesn't cause row-dragging errors
      if (allAttributeNames.includes(null) || allAttributeNames.includes("")) {
        canDrag.current = false;
        setRowDragManaged(false);
      } else {
        canDrag.current = true;
        setRowDragManaged(true);
      }
    }
    if (e.colDef.field === "Attribute" || e.colDef.field === "Unit") {
      if (e.colDef.field === "Unit") {
        setAttributeRowData((prev) =>
          prev.map((row, i) =>
            i === e.rowIndex ? { ...row, Unit: e.newValue } : row
          )
        );
      }
      e.api.refreshCells({ rowNodes: [e.node], force: true });
      requestAnimationFrame(() => e.api.resetRowHeights());
    }
  };

  const getRowHeight = useCallback((params) => {
    const opts = { compact: true };
    const attrH = measureTextHeight(params.data?.Attribute || "", 150, {});
    const unitH = measureTextHeight(params.data?.Unit || "", 128, {});
    const typeH = measureTextHeight(params.data?.Type || "", 150, opts);
    const maxH = Math.max(attrH, unitH, typeH);
    return Math.max(32, maxH + 16);
  }, []);

  const onFirstDataRendered = useCallback(() => {
    scheduleEndBlockingLoad();
  }, [scheduleEndBlockingLoad]);

  const onModelUpdated = useCallback(() => {
    scheduleEndBlockingLoad();
  }, [scheduleEndBlockingLoad]);

  return (
    <div style={{ margin: "2rem 2rem 0 2rem" }}>
      <div
        className={`attribute-details-grid ag-theme-balham${attrGridFixedViewport ? "" : " ag-grid-compact"}`}
        style={{
          width: ATTRIBUTE_GRID_COLUMN_SUM_PX,
          overflowX: "hidden"
        }}
      >
        <style>{gridStyle}</style>
        <style>{attributeGridViewportStyle}</style>
        <AgGridReact
          key={`${i18n.language}-${attrGridFixedViewport ? "fx" : "ah"}`}
          ref={gridRef}
          domLayout={attrGridFixedViewport ? undefined : "autoHeight"}
          style={{
            width: "100%",
            height: attrGridFixedViewport ? "100%" : "auto"
          }}
          getRowId={(params) => (params.data && (params.data._rid || params.data.Attribute))}
          rowData={attributeRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection
          suppressCellSelection={false}
          getRowHeight={getRowHeight}
          suppressHorizontalScroll
          suppressRowHoverHighlight
          onCellKeyDown={onCellKeyDown}
          animateRows
          onRowDragEnd={(e) => onRowDragEnd(e)}
          onCellValueChanged={(e) => handleCellValueChanged(e)}
          onRowDragLeave={(e) => onRowDragLeave(e)}
          rowDragManaged={rowDragManaged}
          onFirstDataRendered={onFirstDataRendered}
          onModelUpdated={onModelUpdated}
          overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
        />
      </div>
    </div>
  );
}
