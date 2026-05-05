import React, { useEffect, useRef } from "react";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const CheckboxHeader = ({ gridRef, field, columnName, helpText }) => {
  const inputRef = useRef();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue(field, checked);
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
        {columnName}
        <input type="checkbox" ref={inputRef} onChange={handleCheckboxChange} />
        <Tooltip title={helpText} placement="top" arrow>
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
      </div>
    </div>
  );
};

export default CheckboxHeader;
