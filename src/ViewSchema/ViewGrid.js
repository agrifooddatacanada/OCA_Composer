import React, { useState, useRef, useEffect, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import { Context } from "../App";
import { greyCellStyle } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../constants/getListOfSelectedOverlays";
import CellHeader from "../components/CellHeader";

const gridStyles = `
.ag-cell {
  line-height: 1.5
}

.ag-header-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
}
`;


export default function ViewGrid({ displayArray, currentLanguage }) {
  const { overlay, gridData } = useContext(Context);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  const CheckboxRenderer = ({ value }) => {
    const inputRef = useRef();

    useEffect(() => {
      inputRef.current.checked = value;
    }, [value]);

    return <input type="checkbox" ref={inputRef} disabled />;
  };

  useEffect(() => {
    const getColumns = () => {
      const predefinedColumns = [
        {
          field: "Attribute",
          autoHeight: true,
          cellStyle: () => greyCellStyle,
        },
        {
          field: "Flagged",
          width: 78,
          headerComponent: () => <CellHeader headerText='Sensitive' />,
          cellRenderer: CheckboxRenderer,
          cellStyle: () => greyCellStyle
        },
        {
          field: "Unit",
          width: 90,
          autoHeight: true,
          cellStyle: () => greyCellStyle,
        },
        {
          field: "Type",
          autoHeight: true,
          cellStyle: () => greyCellStyle,
        },
        {
          field: "Label",
          autoHeight: true,
          width: 170,
          cellStyle: () => greyCellStyle,
          headerComponent: () => <CellHeader headerText='Label' constraint='max 50 chars' />

        },
        {
          field: "Description",
          flex: 1,
          minWidth: 350,
          autoHeight: true,
          cellStyle: () => greyCellStyle,
          headerComponent: () => <CellHeader headerText='Description' constraint='max 200 chars' />
        },
        {
          field: "List",
          width: 173,
          autoHeight: true,
          cellStyle: () => greyCellStyle,
        },
      ];

      const { selectedFeatures } = getListOfSelectedOverlays(overlay);
      selectedFeatures.forEach((feature) => {
        predefinedColumns.push({
          field: feature,
          width: 160,
          autoHeight: true,
          cellStyle: () => greyCellStyle,
          headerComponent: () => {
            return (
              <span style={{ margin: "auto" }}>
                {feature === 'Make selected entries required' ? 'Required Entry' : feature === 'Add format rule for data' ? "Format Rules" : feature}
              </span>
            );
          },
          cellRenderer: feature === 'Make selected entries required' ? CheckboxRenderer : null,
        });
      });

      return predefinedColumns;
    };

    setColumnDefs(getColumns());
  }, [overlay]);

  const defaultColDef = {
    width: 120,
    editable: false,
  };

  useEffect(() => {
    const newRowData = JSON.parse(JSON.stringify(displayArray));
    const newGridData = JSON.parse(JSON.stringify(gridData));

    newRowData.forEach((item, index) => {
      item.Description = item.Description[currentLanguage];
      item.Label = item.Label[currentLanguage];
      item.List = item.List[currentLanguage];

      if (newGridData[index] && newGridData[index].EntryLimit) {
        item.Cardinality = newGridData[index].EntryLimit;
      }
    });

    setRowData(newRowData);
  }, [displayArray, gridData, currentLanguage]);

  return (
    <div className="ag-theme-balham" style={{ width: '100%' }}>
      <style>{gridStyles}</style>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="autoHeight"
      />
    </div>
  );
}
