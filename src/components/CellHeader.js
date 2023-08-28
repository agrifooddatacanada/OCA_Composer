import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const CellHeader = ({ headerText, constraint, helpText }) => {
  return (
    <>
      <span style={{ margin: "auto" }}>
        {headerText}{" "}
        {constraint && <span style={{ fontSize: "10px" }}>({constraint})</span>}
      </span>
      {helpText && <Tooltip
        title={helpText}
        placement="top"
        arrow
      >
        <HelpOutlineIcon sx={{ fontSize: 15 }} />
      </Tooltip>}
    </>
  );
};

export default CellHeader;