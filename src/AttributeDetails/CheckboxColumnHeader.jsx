import React from "react";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const CheckboxColumnHeader = ({ label, helpText, onCheckboxChange, inputRef }) => (
  <div className="ag-cell-label-container">
    <div
      className="ag-header-cell-label"
      style={{ display: "flex", alignItems: "center", width: "100%" }}
    >
      <span style={{ flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <input type="checkbox" ref={inputRef} onChange={onCheckboxChange} style={{ marginTop: "1px" }} />
      </span>
      <Tooltip title={helpText} placement="top" arrow>
        <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </span>
      </Tooltip>
    </div>
  </div>
);

export default CheckboxColumnHeader;
