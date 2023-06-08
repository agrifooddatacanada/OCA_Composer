import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Context } from "../App";
import { AgGridReact } from "ag-grid-react";

import { Box } from "@mui/system";
import { Button, Tooltip, Typography } from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { CustomPalette } from "../constants/customPalette";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function CodeGrid({ index, codeRefs }) {
  const { languages, setEntryCodeRowData } = useContext(Context);
  const { entryCodeRowData } = useContext(Context);

  const [buttonArray, setButtonArray] = useState([]);
  const [gridWidth, setGridWidth] = useState(500);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);

  //Overrides the default grid styles in a way that allows input fields to not look awkward when word wrapping happens

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

  .ag-cell {
    line-height: 1.6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ag-cell, .ag-full-width-row .ag-cell-wrapper.ag-row-group {
    line-height: 1.6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%
  }
  `;

  //Sets grid width based on number of Languages
  useEffect(() => {
    if (languages.length > 3) {
      setGridWidth(850);
    } else {
      switch (languages.length) {
        case 1:
          setGridWidth(401);
          break;
        case 2:
          setGridWidth(601);
          break;
        case 3:
          setGridWidth(801);
          break;
        default:
          setGridWidth(500);
          break;
      }
    }
  }, [languages]);

  const handleDeleteRow = (elementIndex) => {
    codeRefs.current.forEach((grid) => {
      grid.current.api.stopEditing();
    });

    const newEntryCodeRowData = JSON.parse(
      JSON.stringify(entryCodeRowData[index])
    );
    newEntryCodeRowData.splice(elementIndex, 1);
    setEntryCodeRowData((prevState) => {
      const newState = [...prevState];
      newState[index] = newEntryCodeRowData;
      return newState;
    });
  };

  const handleAddRow = () => {
    codeRefs.current.forEach((grid) => {
      grid.current.api.stopEditing();
    });
    const newEntryCodeRow = { Code: "" };
    languages.forEach((lang) => {
      newEntryCodeRow[lang] = "";
    });

    const newRowData = [...entryCodeRowData[index], { ...newEntryCodeRow }];
    setEntryCodeRowData((prevState) => {
      const newState = [...prevState];
      newState[index] = newRowData;
      return newState;
    });
  };

  const CodeHeader = () => {
    return (
      <div className="ag-cell-label-container">
        <Tooltip
          title="The entry choices for the schema. These will be what is recorded in the dataset and so can be simple entry codes."
          placement="top"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
        <div className="ag-header-cell-label">Entry Code</div>
      </div>
    );
  };

  const LanguageHeader = (language) => {
    return (
      <div className="ag-cell-label-container">
        {language === languages[0] && (
          <Tooltip
            title="A longer and more user-friendly language specific label for each entry code. This label will not be recorded in the dataset but can be used at the time of data entry to help users enter codes."
            placement="top"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        )}
        <div className="ag-header-cell-label">
          <Typography
            noWrap={true}
            variant="subtitle2"
            sx={{ textTransform: "capitalize" }}
          >
            {language}
          </Typography>
        </div>
      </div>
    );
  };

  const columnDefs = useMemo(() => {
    const languageHeaders = languages.map((language) => {
      return {
        field: language,
        editable: true,
        headerComponent: () => LanguageHeader(language),
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
      };
    });
    return [
      {
        field: "Code",
        editable: true,
        headerComponent: CodeHeader,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
      },
      ...languageHeaders,
    ];
  }, [languages, entryCodeRowData, index]);

  const defaultColDef = {
    width: 200,
    tabToNextCell: true,
    cellStyle: (params) => {
      if (params.node.rowIndex === hoveredRowIndex) {
        return { backgroundColor: CustomPalette.PINK_200 };
      } else {
        return { backgroundColor: "white" };
      }
    },
  };

  //Because grid width varies dependent on number of languages, delete icons float outside of the grid component, and are linked by index
  //There is an empty box at the top to make the icons line up correctly
  //Hover effect helps with clarity since the delete icons are floating beside

  const boxRefs = useRef([]);

  useEffect(() => {
    if (entryCodeRowData[index].length > 0) {
      const newButtonArray = [];
      boxRefs.current = [];
      newButtonArray.push(<Box sx={{ height: "2.2rem" }} key={0}></Box>);
      entryCodeRowData[index].forEach((item, index) => {
        const ref = React.createRef();
        boxRefs.current.push(ref);
        newButtonArray.push(
          <Box
            key={index + 1}
            ref={ref}
            sx={{
              ml: 1,
            }}
          >
            {hoveredRowIndex === index ? (
              <DeleteForeverIcon
                onClick={() => handleDeleteRow(index)}
                sx={{
                  color: CustomPalette.BLUE_300,
                }}
              />
            ) : (
              <DeleteOutlineIcon
                sx={{
                  color: CustomPalette.GREY_600,
                }}
              />
            )}
          </Box>
        );
      });
      if (newButtonArray.length > 2) {
        setButtonArray(newButtonArray);
      } else {
        setButtonArray(null);
      }
    }
  }, [entryCodeRowData, hoveredRowIndex, index]);

  useEffect(() => {
    const handleMousemove = (event) => {
      const hoveredIndex = boxRefs.current.findIndex((ref) =>
        ref.current?.contains(event.target)
      );
      if (hoveredIndex !== -1) {
        setHoveredRowIndex(hoveredIndex);
      } else {
        setHoveredRowIndex(-1);
      }
    };
    document.addEventListener("mousemove", handleMousemove);
    return () => {
      document.removeEventListener("mousemove", handleMousemove);
    };
  }, []);

  //Creates "add-by-tab" behaviour
  const buttonRef = useRef();
  const onCellKeyDown = useCallback(
    (e) => {
      const keyPressed = e.event.code;

      const isLastRow = e.node.lastChild;
      const isLastColumn = e.column.colId === languages[languages.length - 1];
      if (keyPressed === "Tab") {
        if (isLastRow && isLastColumn) {
          buttonRef.current.click();
          setTimeout(() => {
            const api = e.api;
            const editingRowIndex = e.rowIndex;
            api.setFocusedCell(editingRowIndex + 1, "Code");
          }, 0);
        }
      }
    },
    [languages]
  );

  //Stops grid editing on all other grid components - not just current grid
  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      const clickedGrid = event.target.closest(".ag-root-wrapper");
      if (clickedGrid) {
        const clickedGridPath = clickedGrid.getAttribute("data-ag-path");

        codeRefs.current.forEach((grid) => {
          const gridElement =
            grid.current?.gridOptions?.api?.gridPanel?.eGridDiv;
          const gridPath = gridElement?.getAttribute("data-ag-path");

          if (gridPath !== clickedGridPath && grid.current?.api) {
            grid.current.api.stopEditing();
          }
        });
      } else {
        codeRefs.current.forEach((grid) => {
          grid.current?.api?.stopEditing();
        });
      }
    };

    document.addEventListener("click", handleClickOutsideGrid);

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [codeRefs]);

  return (
    <Box style={{ margin: "3rem", display: "flex", flexDirection: "column" }}>
      <Box style={{ display: "flex" }}>
        <Box className="ag-theme-alpine" style={{ width: gridWidth }}>
          <style>{gridStyle}</style>
          <AgGridReact
            ref={codeRefs.current[index]}
            rowData={entryCodeRowData[index]}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            onCellKeyDown={onCellKeyDown}
          />
        </Box>
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            {buttonArray}
          </Box>
        </Box>
      </Box>

      <Button
        onClick={handleAddRow}
        color="button"
        variant="contained"
        sx={{
          alignSelf: "flex-end",
          width: "9rem",
          margin: "1rem 3.3rem 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
        ref={buttonRef}
      >
        Add row <AddCircleIcon />
      </Button>
    </Box>
  );
}
