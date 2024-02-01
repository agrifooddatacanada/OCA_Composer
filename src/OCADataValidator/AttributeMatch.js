import { forwardRef, memo, useContext, useEffect, useRef, useState } from "react";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { Box, MenuItem } from "@mui/material";
import Languages from "./Languages";
import { gridStyles } from "../constants/styles";
import { AgGridReact } from "ag-grid-react";
import { DropdownMenuList } from "../components/DropdownMenuCell";

export const DataHeaderRenderer = memo(
  forwardRef((props, ref) => {

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleChange = (e) => {
      console.log('props?.api?.rowModel', props?.api?.rowModel?.rowsToDisplay);
      console.log('props?.api?.rowRenderer', props?.api?.rowRenderer);
      props.node.updateData({
        ...props.node.data,
        Dataset: e.target.value,
      });
      setIsDropdownOpen(false);
      props.onRefresh();
    };

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        // typesObjectRef.current[attributeName] = "";
      }
    };

    const typesDisplay = props?.dataHeaders.map((value, index) => {

      return (
        <MenuItem
          key={index + "_" + value}
          value={value}
          sx={{ border: "none", height: "2rem", fontSize: "small" }}
        >
          {value}
        </MenuItem>
      );
    });

    return (
      <>
        {
          props?.dataHeaders.length > 0 ?
            <DropdownMenuList
              handleKeyDown={handleKeyDown}
              type={props.node.data.Dataset}
              handleChange={handleChange}
              handleClick={handleClick}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              typesDisplay={typesDisplay}
            /> :
            <></>
        }
      </>
    );
  })
);

const AttributeMatch = () => {
  const { setCurrentDataValidatorPage, languages, matchingRowData, datasetHeaders } = useContext(Context);
  const [type, setType] = useState(languages[0] || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();

  const handleChange = (e) => {
    setType(e.target.value);
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const checkData = () => {
    console.log('gridRef.current?.api', gridRef.current?.api.rowData);
  };

  useEffect(() => {
    const columnDefs = [
      {
        headerName: "Attribute",
        field: "Attribute",
        sortable: true,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Label",
        field: type,
        resizable: true,
        flex: 1,
      },
      {
        headerName: "Dataset",
        field: "Dataset",
        cellRendererFramework: DataHeaderRenderer,
        cellRendererParams: (params) => ({
          dataHeaders: datasetHeaders,
          onRefresh: () => {
            gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
          }
        }),
        resizable: true,
        flex: 1,
      },
    ];
    setColumnDefs(columnDefs);
  }, [type]);

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => setCurrentDataValidatorPage('StartDataValidator')} isForward />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '1% 5%',
      }}>
        <Languages type={type} handleChange={handleChange} handleClick={handleClick} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} languages={languages} />
        <Box sx={{ marginTop: '20px' }}>
          <div className="ag-theme-balham" style={{ width: '100%' }}>
            <style>{gridStyles}</style>
            <AgGridReact
              rowData={matchingRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
            />
          </div>
        </Box>
      </Box>
    </>
  );
};

export default AttributeMatch;