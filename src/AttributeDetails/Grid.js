import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";

import { Context } from "../App";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

import TypeTooltip from "./TypeTooltip";
import CellHeader from "../components/CellHeader";
import { flexCenter, preWrapWordBreak } from "../constants/styles";
import CheckboxRenderer from "./CheckboxRenderer";
import FlaggedHeader from "./FlaggedHeader";
import ListHeader from "./ListHeader";
import DeleteRenderer from "./DeleteRenderer";
import TypeRenderer from "./TypeRenderer";

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
  setLoading
}) {
  const { t } = useTranslation();
  const {
    attributesList,
    setAttributesList,
    attributeRowData,
    setAttributeRowData,
    lanAttributeRowData,
    setLanAttributeRowData,
    setCharacterEncodingRowData,
    setFormatRuleRowData,
    setCardinalityData,
    setAttributesWithLists,
    setSavedEntryCodes
  } = useContext(Context);
  const [columnDefs, setColumnDefs] = useState([]);
  const canDrag = useRef(true);

  // AG grid's built-in drop-down menu had functionality issues (single click cannot open the menu)
  // Using AG grid's custom cell editor component had similar issues.
  // Result: Used a regular cell renderer. The Type cell's content isn't saved in the same way as the other cells - it needs additional handling on Adding/Deleting Attributes and Navigation
  // typesObjectRef saves all the types for the grid, and type is the 'local' current type of the cell

  const dropRefs = useRef(attributeRowData.map(() => React.createRef()));

  useEffect(() => {
    dropRefs.current = attributeRowData.map(() => React.createRef());
  }, [attributesList, attributeRowData]);

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
        autoHeight: true,
        cellStyle: () => ({
          ...preWrapWordBreak,
          ...flexCenter
        }),
        width: 150
      },
      {
        field: "Flagged",
        headerComponent: FlaggedHeader,
        headerComponentParams: {
          gridRef
        },
        cellRenderer: CheckboxRenderer,
        cellRendererParams: {
          gridRef
        },
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
        autoHeight: true,
        cellStyle: () => ({
          ...preWrapWordBreak,
          ...flexCenter
        })
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
          dropRefs
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
          gridRef
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
          setAttributesList,
          setAttributeRowData,
          canDelete,
          setCanDelete
        }),
        cellStyle: () => flexCenter,
        width: 60
      }
    ]);
  }, [attributesList]);

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
            setErrorMessage(t("Please enter a unique attribute name"));
            setTimeout(() => {
              setErrorMessage("");
            }, [2000]);
            return;
          }
          if (currentAttributeName === "") {
            setErrorMessage(t("Please enter a unique attribute name"));
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
              setErrorMessage("Something went wrong when adding cell by tab. Try again.");
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
              setErrorMessage(t("Please enter a unique attribute name"));
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
      item.Type = typesObjectRef.current[item.Attribute] || item.Type;
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

  // Update attribute in language-specific row data
  const updateLanAttributeRowData = (oldAttributeValue, newAttributeValue) => {
    const updatedLanAttributeRowData = {};
    for (const lang in lanAttributeRowData) {
      if (Object.prototype.hasOwnProperty.call(lanAttributeRowData, lang)) {
        const attributes = lanAttributeRowData[lang];
        const attributeIndex = attributes.findIndex(
          (row) => row.Attribute === oldAttributeValue
        );
        const attribute = attributes[attributeIndex];
        const updatedAttributes = attributes.map((row, i) => {
          if (i === attributeIndex) {
            return { ...attribute, Attribute: newAttributeValue };
          }
          return row;
        });
        updatedLanAttributeRowData[lang] = updatedAttributes;
      }
    }
    setLanAttributeRowData(updatedLanAttributeRowData);
  };

  const updateCharacterEncodingRowData = (oldAttributeValue, newAttributeValue) => {
    setCharacterEncodingRowData((prevData) =>
      prevData.map((row) => {
        if (row.Attribute === oldAttributeValue) {
          return { ...row, Attribute: newAttributeValue };
        }
        return row;
      })
    );
  };

  const updateFormatRuleRowData = (oldAttributeValue, newAttributeValue) => {
    setFormatRuleRowData((prevData) =>
      prevData.map((row) => {
        if (row.Attribute === oldAttributeValue) {
          return { ...row, Attribute: newAttributeValue };
        }
        return row;
      })
    );
  };

  const updateCardinalityData = (oldAttributeValue, newAttributeValue) => {
    setCardinalityData((prevData) =>
      prevData.map((row) => {
        if (row.Attribute === oldAttributeValue) {
          return { ...row, Attribute: newAttributeValue };
        }
        return row;
      })
    );
  };

  const updateAttributesWithLists = (oldAttributeValue, newAttributeValue) => {
    setAttributesWithLists((prevData) =>
      prevData.map((attributeName) => {
        if (attributeName === oldAttributeValue) {
          return newAttributeValue;
        }
        return attributeName;
      })
    );
  };

  const updateSavedEntryCodes = (oldAttributeValue, newAttributeValue) => {
    setSavedEntryCodes((prevData) => {
      const updatedSavedEntryCodes = { ...prevData };
      if (updatedSavedEntryCodes[oldAttributeValue]) {
        updatedSavedEntryCodes[newAttributeValue] =
          updatedSavedEntryCodes[oldAttributeValue];
        delete updatedSavedEntryCodes[oldAttributeValue];
      }
      return updatedSavedEntryCodes;
    });
  };

  const handleCellValueChanged = (e) => {
    // Only handle event if the user changed the attribute name; do not handle programmatic update
    if (e.source !== "edit") return;
    const isAttributeNameChange = e.colDef.field === "Attribute";
    const currentIndex = e.rowIndex;
    if (isAttributeNameChange) {
      const allAttributeNames = gridRef.current.props.rowData.map(
        (item) => item.Attribute
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
          let i = 2;
          let tempValue = `${valueToAdd}_(${i})`;

          while (allAttributeNames.includes(tempValue)) {
            i += 1;
            tempValue = `${valueToAdd}_(${i})`;
          }

          valueToAdd = tempValue;
          const rowNode = gridRef.current.api.getRowNode(currentIndex);
          rowNode.setDataValue("Attribute", valueToAdd);

          // Update typesObjectRef using updated new value
          const newAttributeName = valueToAdd;
          const oldAttributeName = e.oldValue;

          updateTypesObjRef(oldAttributeName, newAttributeName);
          updateLanAttributeRowData(oldAttributeName, newAttributeName);
          updateCharacterEncodingRowData(oldAttributeName, newAttributeName);
          updateFormatRuleRowData(oldAttributeName, newAttributeName);
          updateCardinalityData(oldAttributeName, newAttributeName);
          updateAttributesWithLists(oldAttributeName, newAttributeName);
          updateSavedEntryCodes(oldAttributeName, newAttributeName);
        } else {
          // Finds correct key to re-save the new typesObjectRef value
          if (e.oldValue) {
            savedAttributeName.current = e.oldValue;
          } else if (e.oldValue !== "") {
            savedAttributeName.current = e.newValue;
          }

          // Update typesObjectRef when values are updated
          const newAttributeName = e.newValue;
          const oldAttributeName = savedAttributeName.current;
          if (oldAttributeName !== newAttributeName) {
            updateTypesObjRef(oldAttributeName, newAttributeName);
            updateLanAttributeRowData(oldAttributeName, newAttributeName);
            updateCharacterEncodingRowData(oldAttributeName, newAttributeName);
            updateFormatRuleRowData(oldAttributeName, newAttributeName);
            updateCardinalityData(oldAttributeName, newAttributeName);
            updateAttributesWithLists(oldAttributeName, newAttributeName);
            updateSavedEntryCodes(oldAttributeName, newAttributeName);
          }
        }
      } else {
        // Re-save blank attribute as previous attribute
        const rowNode = gridRef.current.api.getRowNode(currentIndex);
        rowNode.setDataValue("Attribute", e.oldValue);

        e.api.startEditingCell({
          rowIndex: e.rowIndex,
          colKey: "Attribute"
        });
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
  };

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div style={{ margin: "2rem" }}>
      <div className="ag-theme-balham" style={{ width: 752 }}>
        <style>{gridStyle}</style>
        <AgGridReact
          ref={gridRef}
          rowData={attributeRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection
          suppressCellSelection={false}
          domLayout="autoHeight"
          onCellKeyDown={onCellKeyDown}
          animateRows
          onRowDragEnd={(e) => onRowDragEnd(e)}
          onCellValueChanged={(e) => handleCellValueChanged(e)}
          onRowDragLeave={(e) => onRowDragLeave(e)}
          rowDragManaged={rowDragManaged}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
}
