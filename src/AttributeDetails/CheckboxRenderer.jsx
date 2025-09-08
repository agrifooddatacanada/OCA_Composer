import React, { useEffect, useRef } from "react";
import { useMultiSchema } from "../context/MultiSchemaContext";

// Use AG Grid's provided node to update the cell value, rather than looking up by rowIndex
const CheckboxRenderer = ({ value, colDef, data, node, onToggleList, onLocalToggle }) => {
  const inputRef = useRef();
  const { activeSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  const handleChange = (event) => {
    const { checked } = event.target;
    const colId = colDef.field;
    // eslint-disable-next-line no-console
    console.log("CheckboxRenderer: toggle", { attr: data?.Attribute, colId, checked });
    
    if (node && typeof node.setDataValue === "function") {
      node.setDataValue(colId, checked);
    }
    if (colId === "List" && typeof onToggleList === "function" && data?.Attribute) {
      onToggleList(data.Attribute, checked);
    }
    if (colId === "List" && typeof onLocalToggle === "function" && data?.Attribute) {
      onLocalToggle(data.Attribute, checked);
    }

    // Immediately reflect list toggles in MultiSchemaContext so Home can add/remove the Entry Codes step
    if (colId === "List" && activeSchemaId && data && data.Attribute) {
      const schemaState = getSchemaState(activeSchemaId) || {};
      const prevLists = Array.isArray(schemaState.attributesWithLists)
        ? schemaState.attributesWithLists
        : [];
      const prevEntryCodes = schemaState.entryCodes || {};
      const prevAttributes = Array.isArray(schemaState.attributes)
        ? schemaState.attributes
        : [];

      let nextLists = prevLists;
      const nextEntryCodes = { ...prevEntryCodes };
      
      // Update the attributes array to reflect the List toggle
      const nextAttributes = prevAttributes.map((attr) => 
        attr.Attribute === data.Attribute 
          ? { ...attr, List: checked }
          : attr
      );

      if (checked) {
        if (!prevLists.includes(data.Attribute)) {
          nextLists = [...prevLists, data.Attribute];
        }
        if (!Array.isArray(nextEntryCodes[data.Attribute])) {
          nextEntryCodes[data.Attribute] = [];
        }
      } else {
        nextLists = prevLists.filter((a) => a !== data.Attribute);
        if (nextEntryCodes[data.Attribute]) {
          delete nextEntryCodes[data.Attribute];
        }
      }

      // eslint-disable-next-line no-console
      console.log("CheckboxRenderer: updateSchemaState", {
        schema: activeSchemaId,
        nextLists,
        nextEntryCodesKeys: Object.keys(nextEntryCodes)
      });
      updateSchemaState(activeSchemaId, {
        attributes: nextAttributes,
        attributesWithLists: nextLists,
        entryCodes: nextEntryCodes
      });
    }
  };

  return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
};

export default CheckboxRenderer;
