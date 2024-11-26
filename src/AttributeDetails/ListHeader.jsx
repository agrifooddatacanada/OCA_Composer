import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const ListHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue("List", checked);
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
        {t("List")}
        <input type="checkbox" ref={inputRef} onChange={handleCheckboxChange} />
        <Tooltip
          title={t("Rather than allow free text entry into a record, you may...")}
          placement="top"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
      </div>
    </div>
  );
};

export default ListHeader;
