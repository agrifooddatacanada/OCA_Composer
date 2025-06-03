import React from "react";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const CellHeader = ({ headerText, constraint, helpText }) => (
  <>
    <span style={{ margin: "auto", textOverflow: "ellipsis", overflow: "hidden" }}>
      {headerText}{" "}
      {constraint && <span style={{ fontSize: "10px" }}>({constraint})</span>}
    </span>
    {helpText && (
      <Tooltip title={helpText} placement="top" arrow>
        <HelpOutlineIcon sx={{ fontSize: 15, marginLeft: "3px" }} />
      </Tooltip>
    )}
  </>
);

export default CellHeader;
