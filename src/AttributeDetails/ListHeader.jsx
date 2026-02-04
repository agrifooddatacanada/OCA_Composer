import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useMultiSchema } from "../schema/schemaContext";

const ListHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const { getSchemaState, updateSchemaState } = useMultiSchema();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue("List", checked);
    });
    
    // Update schema state when Select All is toggled
    const schemaState = getSchemaState() || {};
    const prevAttributes = Array.isArray(schemaState.attributes) ? schemaState.attributes : [];
    const prevEntryCodes = schemaState.entryCodes || {};
    
    // Update all attributes and build new lists array
    const nextAttributes = prevAttributes.map(attr => ({ ...attr, List: checked }));
    const nextLists = checked ? prevAttributes.map(attr => attr.Attribute).filter(Boolean) : [];
    const nextEntryCodes = checked ? { ...prevEntryCodes } : {};
    
    // Initialize empty entry codes for newly checked attributes
    if (checked) {
      nextLists.forEach(attrName => {
        if (!Array.isArray(nextEntryCodes[attrName])) {
          nextEntryCodes[attrName] = [];
        }
      });
    }
    
    updateSchemaState({
      attributes: nextAttributes,
      attributesWithLists: nextLists,
      entryCodes: nextEntryCodes
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
