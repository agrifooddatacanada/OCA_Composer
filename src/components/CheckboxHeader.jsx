import React, { useEffect, useRef } from "react";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useMultiSchema } from "../context/MultiSchemaContext";

const CheckboxHeader = ({ gridRef, field, columnName, helpText }) => {
  const inputRef = useRef();
  const { currentSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue(field, checked);
    });
    
    // Update schema state when List column Select All is toggled
    if (field === "List" && currentSchemaId !== undefined) {
      const targetSchemaId = currentSchemaId || "manual-creation-schema";
      const schemaState = getSchemaState(targetSchemaId) || {};
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
      
      updateSchemaState(targetSchemaId, {
        attributes: nextAttributes,
        attributesWithLists: nextLists,
        entryCodes: nextEntryCodes
      });
    }
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
