import React from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CustomPalette from "../constants/customPalette";
import { useMultiSchema } from "../context/MultiSchemaContext";

const DeleteRenderer = ({
  data,
  gridRef,
  typesObjectRef,
  setAttributesList,
  setAttributeRowData,
  canDelete,
  setCanDelete,
  currentRows
}) => {
  const { activeSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  const handleDeleteClick = () => {
    gridRef.current.api.stopEditing();
    
    // Use the latest rows passed from the grid state
    const currentRowData = currentRows || [];
    const newAttributeRowData = JSON.parse(JSON.stringify(currentRowData));
    
    // Update types from typesObjectRef
    newAttributeRowData.forEach((item) => {
      item.Type = typesObjectRef.current[item.Attribute] || "";
    });
    
    // Find and remove the attribute
    const allAttributes = newAttributeRowData.map((row) => row.Attribute);
    const index = allAttributes.indexOf(data.Attribute);
    
    if (index > -1) {
      newAttributeRowData.splice(index, 1);
      const updatedAttributesList = newAttributeRowData.map((row) => row.Attribute);
      
      setAttributesList(updatedAttributesList);
      setAttributeRowData(newAttributeRowData);
      
      // Update canDelete based on remaining attributes (allow deletion down to 0)
      setCanDelete(newAttributeRowData.length > 0);

      // Sync MultiSchema state: remove from attributes, attributesList, attributesWithLists, and entryCodes
      if (activeSchemaId) {
        const schemaState = getSchemaState(activeSchemaId) || {};
        const nextEntryCodes = { ...(schemaState.entryCodes || {}) };
        delete nextEntryCodes[data.Attribute];

        const prevLists = schemaState.attributesWithLists || [];
        const nextLists = prevLists.filter((a) => a !== data.Attribute);

        updateSchemaState(activeSchemaId, {
          attributes: newAttributeRowData,
          attributesList: updatedAttributesList,
          entryCodes: nextEntryCodes,
          attributesWithLists: nextLists
        });
      }
    }
  };
  
  return (
    canDelete && (
      <DeleteOutlineIcon
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          cursor: "pointer"
        }}
        onClick={handleDeleteClick}
        title="Delete attribute"
      />
    )
  );
};

export default DeleteRenderer;
