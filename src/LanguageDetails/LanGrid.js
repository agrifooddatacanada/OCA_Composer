import React, { useState, useEffect, useContext, useImperativeHandle, forwardRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";


const TextareaCellEditor = forwardRef((props, ref) => {
  const [value, setValue] = useState(props.value);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  useImperativeHandle(ref, () => {
    return {
      getValue() {
        return value;
      },

      isCancelBeforeStart() {
        return false;
      },

      isCancelAfterEnd() {
        return false;
      }
    };
  });

  const textareaStyle = {
    width: '98%',
    height: '100%',
    resize: 'none',
    outline: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    fontSize: '12px',
  };

  return (
    <textarea
      autoFocus
      maxLength={200}
      style={textareaStyle}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
});


const gridStyles = `
  .ag-cell {
    line-height: 1.5;
  }
  
  .ag-theme-balham .ag-cell {
    border-right: 1px solid ${CustomPalette.GREY_300};
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .ag-header-cell-label {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%;
  }
`;

export default function LanGrid({ gridRef, currentLanguage }) {
  const {
    attributesList,
    lanAttributeRowData,
    setLanAttributeRowData,
    attributeRowData,
    savedEntryCodes,
    attributesWithLists,
    languages,
  } = useContext(Context);

  //Sets Language Dependent Attribute row data

  useEffect(() => {
    let newLanAttributeRowData = JSON.parse(
      JSON.stringify(lanAttributeRowData)
    );
    languages.forEach((language) => {
      if (!newLanAttributeRowData[language]) {
        const newLanguageList = [];
        attributesList.forEach((item) => {
          let listDisplay = attributeRowData.find(
            (obj) => obj.Attribute === item
          ).List;
          if (!listDisplay) {
            listDisplay = "Not a List";
          } else {
            let listDisplayArray = [];
            savedEntryCodes[item].forEach((i) => {
              listDisplayArray.push(i[language]);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString;
          }
          newLanguageList.push({
            Attribute: item,
            Label: "",
            Description: "",
            List: listDisplay,
          });
        });
        newLanAttributeRowData[language] = newLanguageList;
      } else {
        const newLanguageList = [];
        attributeRowData.forEach((item) => {
          let newLabel = "";
          let newDescription = "";
          if (
            newLanAttributeRowData[language].find(
              (i) => i.Attribute === item.Attribute
            )
          ) {
            newLabel = newLanAttributeRowData[language].find(
              (i) => i.Attribute === item.Attribute
            ).Label;
          }
          if (
            newLanAttributeRowData[language].find(
              (i) => i.Attribute === item.Attribute
            )
          ) {
            newDescription = newLanAttributeRowData[language].find(
              (i) => i.Attribute === item.Attribute
            ).Description;
          }
          let listDisplay = item.List;
          if (!listDisplay) {
            listDisplay = "Not a List";
          } else {
            let listDisplayArray = [];
            savedEntryCodes[item.Attribute].forEach((i) => {
              listDisplayArray.push(i[language]);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString;
          }

          const newObj = {
            Attribute: item.Attribute,
            Label: newLabel,
            Description: newDescription,
            List: listDisplay,
          };
          newLanguageList.push(newObj);
        });
        newLanAttributeRowData[language] = newLanguageList;
      }
    });
    setLanAttributeRowData(newLanAttributeRowData);
  }, [languages, savedEntryCodes, attributeRowData]);

  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 120,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
        headerComponent: () => {
          return (
            <>
              <span style={{ margin: "auto" }}>Attribute</span>
              <Tooltip
                title="This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language."
                placement="top"
                PopperProps={{
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: CustomPalette.GREY_200,
                      color: CustomPalette.GREY_800,
                      boxShadow: 3,
                    },
                  },
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </>
          );
        },
      },
      {
        field: "Label",
        editable: true,
        width: 180,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
        headerComponent: () => {
          return (
            <>
              <span style={{ margin: "auto" }}>
                Label <span style={{ fontSize: "10px" }}>(max 50 chars)</span>
              </span>
              <Tooltip
                title="This is the language specific label for an attribute."
                placement="top"
                PopperProps={{
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: CustomPalette.GREY_200,
                      color: CustomPalette.GREY_800,
                      boxShadow: 3,
                    },
                  },
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </>
          );
        },
        cellEditorParams: {
          maxLength: 50,
        },
      },
      {
        field: "Description",
        editable: true,
        width: 240,
        cellEditor: TextareaCellEditor,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
        headerComponent: () => {
          return (
            <>
              <span style={{ margin: "auto" }}>
                Description{" "}
                <span style={{ fontSize: "10px" }}>(max 200 chars)</span>
              </span>
              <Tooltip
                title="This is a language specific description of the attribute and should contain information that will help dataset users understand necessary details about each attribute."
                placement="top"
                PopperProps={{
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: CustomPalette.GREY_200,
                      color: CustomPalette.GREY_800,
                      boxShadow: 3,
                    },
                  },
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </>
          );
        },
      },
      {
        field: "List",
        editable: false,
        width: 258,
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
    ]);
  }, [attributesList]);

  console.log('lanAttributeRowData', lanAttributeRowData);
  return (
    <div className="ag-theme-balham" style={{ width: 800 }}>
      <style>{gridStyles}</style>
      <AgGridReact
        ref={gridRef}
        rowData={lanAttributeRowData[currentLanguage]}
        columnDefs={columnDefs}
        domLayout="autoHeight"
      />
    </div>
  );
}
