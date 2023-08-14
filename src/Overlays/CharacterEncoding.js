import { Box, Button, Tooltip } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { CustomPalette } from "../constants/customPalette";
import { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";

const rowData = [
  {
    Attribute: "attr_1",
    Label: "",
  },
  {
    Attribute: "attr_2",
    Label: "",
  },
  {
    Attribute: "attr_3",
    Label: "",
  },

];

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

const CharacterEncoding = ({
  pageBack,
  pageForward
}) => {
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

  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 180,
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
        width: 250,
        autoHeight: true,
        cellStyle: (params) => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
        headerComponent: () => {
          return (
            <>
              <span style={{ margin: "auto" }}>
                Character encoding
              </span>
              <Tooltip
                title="Please choose an appropriate character encoding."
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
    ]);
  }, [attributesList]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "auto",
          pr: 10,
          pl: 10,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            color="navButton"
            sx={{ textAlign: "left", alignSelf: "flex-start" }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> Back
          </Button>
          <Button
            color="navButton"
            onClick={pageForward}
            sx={{ alignSelf: "flex-end", color: CustomPalette.PRIMARY }}
          >
            Next <ArrowForwardIosIcon />
          </Button>
        </Box>
        <Box
          sx={{
            margin: "2rem",
            gap: "3rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="ag-theme-balham" style={{ width: 430 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default CharacterEncoding;