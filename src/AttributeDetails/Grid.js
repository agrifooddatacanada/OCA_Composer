import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { Tooltip, Box, FormControl, Select, MenuItem } from "@mui/material";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

import TypeTooltip from "./TypeTooltip";

export default function Grid({
  gridRef,
  addButton1,
  addButton2,
  setErrorMessage,
  canDelete,
  setCanDelete,
  setAddByTab,
  typesObjectRef
}) {
  const { attributesList, setAttributesList } = useContext(Context);
  const [selectedCells, setSelectedCells] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const canDrag = useRef(true);

  const { attributeRowData, setAttributeRowData } = useContext(Context);

  //styles override the default cell style that limits height of input field. It looks ugly when word wrapping happens
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

  //Renderers define input cells, Headers define grid header cells
  //.stopEditing() needs to run whenever the grid refreshes, or the current table state won't be saved. Adding/Deleting/Navigation
  const CheckboxRenderer = ({ value, rowIndex, colDef }) => {
    const inputRef = useRef();

    useEffect(() => {
      inputRef.current.checked = value;
    }, [value]);

    const handleChange = (event) => {
      const checked = event.target.checked;
      const node = gridRef.current.api.getRowNode(rowIndex);
      const colId = colDef.field;
      node.setDataValue(colId, checked);
      if (checked) {
        setSelectedCells((prevSelectedCells) => [
          ...prevSelectedCells,
          { attribute: node.data.Attribute, column: colId },
        ]);
      } else {
        setSelectedCells((prevSelectedCells) =>
          prevSelectedCells.filter(
            (cell) =>
              cell.attribute !== node.data.Attribute || cell.column !== colId
          )
        );
      }
    };

    return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
  };

  const FlaggedHeader = () => {
    const inputRef = useRef();

    const handleCheckboxChange = (event) => {
      const checked = event.target.checked;
      gridRef.current.api.forEachNode((node) => {
        node.setDataValue("Flagged", checked);
        if (checked) {
          setSelectedCells((prevSelectedCells) => [
            ...prevSelectedCells,
            { attribute: node.data.Attribute, column: "Flagged" },
          ]);
        } else {
          setSelectedCells((prevSelectedCells) =>
            prevSelectedCells.filter(
              (cell) =>
                cell.attribute !== node.data.Attribute ||
                cell.column !== "Flagged"
            )
          );
        }
      });
    };

    useEffect(() => {
      inputRef.current.checked = false;
    }, []);

    return (
      <div className="ag-cell-label-container">
        <div
          className="ag-header-cell-label"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          Flagged
          <input
            type="checkbox"
            ref={inputRef}
            onChange={handleCheckboxChange}
          />
          <Tooltip
            title={
              <>
                <div>
                  If the attribute could be considered Personally Identifiable
                  Information (PII) you can flag the attribute here. This will
                  be documented in the schema and downstream users of your
                  schema will understand they need to take care of the data that
                  has been flagged.
                </div>
                <br />
                <div>
                  Examples of PII include names, locations, postal codes,
                  telephone numbers, identifying genetic data, race, gender,
                  ethnicity, etc.
                </div>
              </>
            }
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </div>
      </div>
    );
  };

  const ListHeader = () => {
    const inputRef = useRef();

    const handleCheckboxChange = (event) => {
      const checked = event.target.checked;
      gridRef.current.api.forEachNode((node) => {
        node.setDataValue("List", checked);
        if (checked) {
          setSelectedCells((prevSelectedCells) => [
            ...prevSelectedCells,
            { attribute: node.data.Attribute, column: "List" },
          ]);
        } else {
          setSelectedCells((prevSelectedCells) =>
            prevSelectedCells.filter(
              (cell) =>
                cell.attribute !== node.data.Attribute || cell.column !== "List"
            )
          );
        }
      });
    };

    useEffect(() => {
      inputRef.current.checked = false;
    }, []);

    return (
      <div className="ag-cell-label-container">
        <div
          className="ag-header-cell-label"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          List
          <input
            type="checkbox"
            ref={inputRef}
            onChange={handleCheckboxChange}
          />
          <Tooltip
            title="Rather than allow free text entry into a record, you may wish to limit entries to one of a few in a list. For example, you may wish to create a list of choices for gender, or for experimental farm name, or for species. You will then be able to create entries for your list that will be part of the schema."
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </div>
      </div>
    );
  };
  const DeleteRenderer = ({ data }) => {
    const handleDeleteClick = () => {
      gridRef.current.api.stopEditing();
      const newAttributeRowData = JSON.parse(
        JSON.stringify(gridRef.current.props.rowData)
      );
      newAttributeRowData.forEach((item) => {
        item.Type = typesObjectRef.current[item.Attribute] || "";
      });
      const allAttributes = [];
      gridRef.current.props.rowData.forEach((row) =>
        allAttributes.push(row.Attribute)
      );
      const index = allAttributes.indexOf(data.Attribute);
      if (index > -1) {
        allAttributes.splice(index, 1);
        setAttributesList(allAttributes);
        setAttributeRowData([...newAttributeRowData]);
      }
      if (allAttributes.length <= 1) {
        setCanDelete(false);
      }
    };
    return (
      canDelete && (
        <DeleteOutlineIcon
          sx={{
            pr: 1,
            color: CustomPalette.GREY_600,
            transition: "all 0.2s ease-in-out",
          }}
          onClick={handleDeleteClick}
        />
      )
    );
  };

  const AttributeHeader = () => {
    return (
      <div className="ag-cell-label-container">
        <div
          className="ag-header-cell-label"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          Attribute
          <Tooltip
            title="This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language."
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </div>
      </div>
    );
  };

  const UnitHeader = () => {
    return (
      <div className="ag-cell-label-container">
        <div
          className="ag-header-cell-label"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          Unit
          <Tooltip
            title="The units of each attribute (or leave blank if the attribute is not a measurement and has no units)."
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </div>
      </div>
    );
  };

  const TypeHeader = () => {
    return (
      <div className="ag-cell-label-container">
        <div
          className="ag-header-cell-label"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          Type
          <Tooltip title={<TypeTooltip />} placement="right" arrow>
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </div>
      </div>
    );
  };

  //AG grid's built-in drop-down menu had functionality issues (single click cannot open the menu)
  //Using AG grid's custom cell editor component had similar issues.
  //Result: Used a regular cell renderer. The Type cell's content isn't saved in the same way as the other cells - it needs additional handling on Adding/Deleting Attributes and Navigation
  //typesObjectRef saves all the types for the grid, and type is the 'local' current type of the cell

  const dropRefs = useRef(attributeRowData.map(() => React.createRef()));

  useEffect(() => {
    dropRefs.current = attributeRowData.map(() => React.createRef());
  }, [attributesList, attributeRowData]);

  const TypeRenderer = (props) => {
    const displayValues = [
      "",
      "Binary",
      "Boolean",
      "DateTime",
      "Numeric",
      "Reference",
      "Text",
      "Array[Binary]",
      "Array[Boolean]",
      "Array[DateTime]",
      "Array[Numeric]",
      "Array[Reference]",
      "Array[Text]",
    ];

    const attributeName = props.data.Attribute;
    const currentAttribute = attributeRowData.find(
      (item) => item.Attribute === attributeName
    );

    const index = attributeRowData.findIndex(
      (item) => item.Attribute === attributeName
    );
    const [type, setType] = useState(
      (currentAttribute && currentAttribute.Type) || displayValues[0]
    );

    const typesDisplay = displayValues.map((value, index) => (
      <MenuItem
        key={index + "_" + value}
        value={value}
        sx={{ border: "none", height: "2rem", fontSize: "small" }}
      >
        {value}
      </MenuItem>
    ));

    const handleChange = (e) => {
      setType(e.target.value);

      const newTypesObject = { ...typesObjectRef.current };
      newTypesObject[attributeName] = e.target.value;
      typesObjectRef.current = newTypesObject;
      setIsDropdownOpen(false);
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
      setType(typesObjectRef.current[attributeName]);
    }, [attributeName]);

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        setType("");
        typesObjectRef.current[attributeName] = "";
      }
    };

    return (
      <Box
        sx={{
          height: "105%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FormControl
          fullWidth
          variant="standard"
          sx={{
            height: "100%",
          }}
          onKeyDown={handleKeyDown}
        >
          <Select
            id="select-drop"
            value={type || ""}
            label="Type"
            onChange={handleChange}
            sx={{
              height: "100%",
              fontSize: "small",
            }}
            ref={dropRefs.current[index]}
            onClick={handleClick}
            open={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpen={() => setIsDropdownOpen(true)}
          >
            {typesDisplay}
          </Select>
        </FormControl>
      </Box>
    );
  };

  useEffect(() => {
    setColumnDefs([
      {
        field: "Drag",
        headerName: "",
        width: 40,
        cellStyle: (params) => ({
          display: "flex",
        }),
        rowDrag: (params) => canDrag.current,
      },
      {
        field: "Attribute",
        headerComponent: AttributeHeader,
        editable: true,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        width: 150,
      },
      {
        field: "Flagged",
        headerComponent: FlaggedHeader,
        cellRenderer: CheckboxRenderer,
        checkboxSelection: false,
        cellStyle: (params) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
      },
      {
        field: "Unit",
        editable: true,
        headerComponent: UnitHeader,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
      },
      {
        field: "Type",
        headerComponent: TypeHeader,
        cellRenderer: TypeRenderer,
        cellRendererParams: (params) => ({
          data: params.data,
        }),
        width: 150,
      },
      {
        field: "List",
        headerComponent: ListHeader,
        cellRenderer: CheckboxRenderer,
        checkboxSelection: false,
        cellStyle: (params) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        width: 100,
      },
      {
        field: "Delete",
        headerName: "",
        cellRenderer: DeleteRenderer,
        cellRendererParams: (params) => ({ data: params.data }),
        cellStyle: (params) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        width: 60,
      },
    ]);
  }, [attributesList]);

  const defaultColDef = {
    width: 125,
  };

  const onCellKeyDown = useCallback(
    (e) => {
      const keyPressed = e.event.code;
      const isUnitRow = e.column.colId === "Unit";
      const isTypeColumn = e.column.colId === "Type";
      if (keyPressed === "Enter" && isUnitRow) {
        //Copies current cell value to cell below if it's empty
        const api = e.api;
        const editingRowIndex = e.rowIndex;
        api.setFocusedCell(editingRowIndex + 1, "Unit");
        const nextRowNode = api.getRowNode(editingRowIndex + 1);
        nextRowNode &&
          !nextRowNode.data.Unit &&
          nextRowNode.setDataValue("Unit", e.value);
      }
      if (keyPressed === "ArrowDown" && isTypeColumn) {
        //Properly focuses Type cell for editing to allow <enter> to toggle element
        if (e.eventPath[0].id === "select-drop") {
          const selectRef = dropRefs.current[e.rowIndex];
          if (selectRef && selectRef.current) {
            selectRef.current.focus();
            selectRef.current.click();
          }
        }
      }
      if (keyPressed === "ArrowUp" && isTypeColumn) {
        //Properly focuses Type cell for editing to allow <enter> to toggle element
        if (e.eventPath[0].id === "select-drop") {
          const selectRef = dropRefs.current[e.rowIndex];
          if (selectRef && selectRef.current) {
            selectRef.current.focus();
            selectRef.current.click();
          }
        }
      }
      if (keyPressed === "Enter" && isTypeColumn) {
        //Toggles Type drop-down
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
        //Traverses grid backwards
        const currentIndex = tabbingColumns.findIndex(
          (item) => item === e.column.colId
        );
        if (e.rowIndex > 0) {
          if (e.column.colId === "Attribute") {
            e.api.setFocusedCell(e.rowIndex - 1, "Type");
          } else {
            e.api.startEditingCell({
              rowIndex: e.rowIndex,
              colKey: tabbingColumns[currentIndex - 1],
            });
          }
        }
      } else if (keyPressed === "Tab") {
        //Creates "Add by tab" functionality if on last editable cell
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
            setErrorMessage("Please enter a unique attribute name");
            setTimeout(() => {
              setErrorMessage("");
            }, [2000]);
            return;
          }
          if (currentAttributeName === "") {
            setErrorMessage("Please enter a unique attribute name");
            setTimeout(() => {
              setErrorMessage("");
            }, [2000]);
            return;
          }

          setAddByTab(true);
          let waitTime = 0;

          //Handles click when manual 'Add Attribute' field isn't open
          if (!addButton2.current) {
            addButton1.current.click();
            waitTime = 5;
          }

          setTimeout(() => {
            try {
              addButton2.current.click();
              setTimeout(() => {
                const api = e.api;
                const editingRowIndex = e.rowIndex;
                api.startEditingCell({
                  rowIndex: editingRowIndex + 1,
                  colKey: "Attribute",
                });
                setAddByTab(false);
              }, 2);
            } catch (error) {
              setErrorMessage(
                "Something went wrong when adding cell by tab. Try again."
              );
              setTimeout(() => {
                setErrorMessage("");
              }, [2000]);
            }
          }, waitTime);
        } else {
          //Focuses correct next cell when tabbing
          if (e.column.colId === "Unit") {
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
              colKey: "Attribute",
            });
          } else {
            //Checks for duplicate attribute names before navigating forward - duplicates affect data handling
            const currentIndex = tabbingColumns.indexOf(e.column.colId);
            if (e.column.colId === "Attribute") {
              const allOtherRows = JSON.parse(
                JSON.stringify(gridRef.current.props.rowData)
              );
              allOtherRows.splice(e.node.rowIndex, 1);
              const allOtherAttributes = allOtherRows.map((item) => {
                return item.Attribute;
              });
              if (
                !allOtherAttributes.includes(e.data.Attribute) &&
                e.data.Attribute
              ) {
                e.api.startEditingCell({
                  rowIndex: e.rowIndex,
                  colKey: tabbingColumns[currentIndex + 1],
                });
              } else {
                setErrorMessage("Please enter a unique attribute name");
                setTimeout(() => {
                  setErrorMessage("");
                }, [2000]);
                e.api.setFocusedCell(e.rowIndex, "Attribute");
                e.api.startEditingCell({
                  rowIndex: e.rowIndex,
                  colKey: tabbingColumns[currentIndex],
                });
              }
            }
          }
        }
      } else if (keyPressed === "Delete" || keyPressed === "Backspace") {
        //Opens Type drop-down for editing when key is pressed
        if (e.column.colId === "Type") {
          const api = e.api;
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
    [attributeRowData, attributesList]
  );

  //Saves elements in proper order after dragging
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

  //Drops element when item is taken off grid
  //Prevents error where when element comes back onto grid, the index isn't saved correctly onRowDragEnd
  const onRowDragLeave = (event) => {
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

  //Handles 'attribute' column updates
  //To prevent row dragging bugs, attribute names can't be blank or duplicates
  //When the value is updated to handle duplicates, this function runs again

  const handleCellValueChanged = (e) => {
    const isAttributeNameChange = e.colDef.field === "Attribute";
    const currentIndex = e.rowIndex;
    if (isAttributeNameChange) {
      const allAttributeNames = gridRef.current.props.rowData.map(
        (item) => item.Attribute
      );
      if (e.newValue) {
        //Renames duplicate values to <value>_(number)
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

          //Update typesObjectRef using updated new value
          const newAttributeName = valueToAdd;
          const oldAttributeName = e.oldValue;
          setTimeout(() => {
            typesObjectRef.current[newAttributeName] =
              typesObjectRef.current[oldAttributeName];
          }, 5);
        } else {
          //Finds correct key to re-save the new typesObjectRef value
          if (e.oldValue) {
            savedAttributeName.current = e.oldValue;
          } else {
            if (e.oldValue !== "") {
              savedAttributeName.current = e.newValue;
            }
          }

          //Update typesObjectRef when values are updated
          const newAttributeName = e.newValue;
          const oldAttributeName = savedAttributeName.current;
          if (oldAttributeName !== newAttributeName) {
            typesObjectRef.current[newAttributeName] =
              typesObjectRef.current[oldAttributeName];
          }
        }
      } else {
        //Re-save blank attribute as previous attribute
        const rowNode = gridRef.current.api.getRowNode(currentIndex);
        rowNode.setDataValue("Attribute", e.oldValue);

        e.api.startEditingCell({
          rowIndex: e.rowIndex,
          colKey: "Attribute",
        });
      }

      //Prevents Row Dragging when attribute names are blank
      //Current functionality doesn't allow this to run, but it's handled in case user finds a way to bypass checks
      //Sometimes doesn't run if only one attribute name is blank, but that doesn't cause row-dragging errors
      if (allAttributeNames.includes(null) || allAttributeNames.includes("")) {
        canDrag.current = false;
        setRowDragManaged(false);
      } else {
        canDrag.current = true;
        setRowDragManaged(true);
      }
    }
  };

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
          animateRows={true}
          onRowDragEnd={(e) => onRowDragEnd(e)}
          onCellValueChanged={(e) => handleCellValueChanged(e)}
          onRowDragLeave={(e) => onRowDragLeave(e)}
          rowDragManaged={rowDragManaged}
        />
      </div>
    </div>
  );
}
