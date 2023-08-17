import React, { useState, useRef, useEffect, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../constants/getListOfSelectedOverlays";

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
  const { attributesWithLists, overlay } = useContext(Context);
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
          cellStyle: (params) => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: CustomPalette.GREY_200,
          }),
        },
        {
          field: "Flagged",
          width: 75,
          cellRenderer: CheckboxRenderer,
          cellStyle: (params) => ({
            backgroundColor: CustomPalette.GREY_200,
          })
        },
        {
          field: "Unit",
          width: 90,
          autoHeight: true,
          cellStyle: (params) => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: CustomPalette.GREY_200,
          }),
        },
        {
          field: "Type",
          autoHeight: true,
          cellStyle: (params) => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: CustomPalette.GREY_200,
          }),
        },
        {
          field: "Label",
          autoHeight: true,
          width: 170,
          cellStyle: (params) => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: CustomPalette.GREY_200,
          }),
          headerComponent: () => {
            return (
              <span style={{ margin: "auto" }}>
                Label <span style={{ fontSize: "10px" }}>(max 50 chars)</span>
              </span>
            );
          },
        },
        {
          field: "Description",
          width: 350,
          autoHeight: true,
          cellStyle: (params) => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: CustomPalette.GREY_200,
          }),
          headerComponent: () => {
            return (
              <span style={{ margin: "auto" }}>
                Description{" "}
                <span style={{ fontSize: "10px" }}>(max 200 chars)</span>
              </span>
            );
          },
        },
        {
          field: "List",
          width: 173,
          autoHeight: true,
          cellStyle: (params) => {
            if (attributesWithLists.includes(params.data.Attribute)) {
              return { whiteSpace: "pre-wrap", wordBreak: "break-word" };
            } else {
              return {
                backgroundColor: CustomPalette.GREY_200,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              };
            }
          },
        },
      ];

      const { selectedFeatures } = getListOfSelectedOverlays(overlay);
      selectedFeatures.forEach((feature) => {
        predefinedColumns.push({
          field: feature,
          width: 140,
          autoHeight: true,
          cellStyle: () => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: CustomPalette.GREY_200,
          }),
          headerComponent: () => {
            return (
              <span style={{ margin: "auto" }}>
                {feature}
              </span>
            );
          },
        });
      });

      return predefinedColumns;
    };
    console.log('getColumns', getColumns());
    setColumnDefs(getColumns());
  }, [attributesWithLists]);

  const defaultColDef = {
    width: 120,
    editable: false,
  };

  useEffect(() => {
    const newRowData = JSON.parse(JSON.stringify(displayArray));

    newRowData.forEach((item) => {
      item.Description = item.Description[currentLanguage];
      item.Label = item.Label[currentLanguage];
      item.List = item.List[currentLanguage];
    });
    setRowData(newRowData);
  }, [displayArray, currentLanguage]);

  console.log('rowData', rowData);

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
