import React from "react";
import { Box } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CustomPalette from "../constants/customPalette";
import { useMultiSchema } from "../schema/schemaContext";

const DeleteRenderer = ({
  data,
  gridRef,
  typesObjectRef,
  setAttributeRowData,
  canDelete,
  setCanDelete,
  currentRows
}) => {
  const { getSchema, updateSchema } = useMultiSchema();
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
      
      // Update local state (attributesList is computed automatically from attributes)
      setAttributeRowData(newAttributeRowData);
      
      // Update canDelete based on remaining attributes (allow deletion down to 0)
      setCanDelete(newAttributeRowData.length > 0);

      // Sync MultiSchema state: remove from attributes, attributesWithLists, entryCodes, and lanAttributeRowData
      // Note: attributesList is computed automatically from attributes array
      const schemaState = getSchema() || {};
      const nextEntryCodes = { ...(schemaState.entryCodes || {}) };
      delete nextEntryCodes[data.Attribute];

      const prevLists = schemaState.attributesWithLists || [];
      const nextLists = prevLists.filter((a) => a !== data.Attribute);

      // Clean up LDAD data - remove the deleted attribute from all languages
      const prevLanData = schemaState.lanAttributeRowData || {};
      const nextLanData = {};
      Object.keys(prevLanData).forEach((language) => {
        nextLanData[language] = prevLanData[language].filter(
          (item) => item.Attribute !== data.Attribute
        );
      });

      // Clean up overlay data - remove the deleted attribute from all overlay arrays/objects
      const nextFormatRuleData = (schemaState.formatRuleData || []).filter(
        (rule) => rule.Attribute !== data.Attribute
      );
      const nextRangeData = (schemaState.rangeData || []).filter(
        (range) => range.Attribute !== data.Attribute
      );
      const nextCardinalityData = (schemaState.cardinalityData || []).filter(
        (card) => card.Attribute !== data.Attribute
      );
      const nextDataStandardsData = (schemaState.dataStandardsData || []).filter(
        (std) => std.Attribute !== data.Attribute
      );
      const nextUnitFramedData = (schemaState.unitFramedData || []).filter(
        (unit) => unit.Attribute !== data.Attribute
      );
      const nextAttributeFramingData = (schemaState.attributeFramingData || []).filter(
        (framing) => framing.Attribute !== data.Attribute
      );
      
      // Clean up characterEncodingData (object format)
      const nextCharacterEncodingData = { ...(schemaState.characterEncodingData || {}) };
      delete nextCharacterEncodingData[data.Attribute];

      // Update schema state (attributesList is computed automatically from attributes)
      updateSchema({
        attributes: newAttributeRowData,
        entryCodes: nextEntryCodes,
        attributesWithLists: nextLists,
        lanAttributeRowData: nextLanData,
        // Clean all overlay data
        formatRuleData: nextFormatRuleData,
        rangeData: nextRangeData,
        cardinalityData: nextCardinalityData,
        dataStandardsData: nextDataStandardsData,
        unitFramedData: nextUnitFramedData,
        attributeFramingData: nextAttributeFramingData,
        characterEncodingData: nextCharacterEncodingData
      });
    }
  };
  
  if (!canDelete) return null;
  return (
    <Box className="delete-icon-wrapper" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <DeleteOutlineIcon sx={{ color: CustomPalette.GREY_600 }} className="delete-icon-outline" />
      <DeleteForeverIcon
        onClick={handleDeleteClick}
        sx={{ color: CustomPalette.PRIMARY, cursor: "pointer" }}
        className="delete-icon-solid"
        title="Delete attribute"
      />
    </Box>
  );
};

export default DeleteRenderer;
