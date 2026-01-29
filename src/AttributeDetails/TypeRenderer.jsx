import React, { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { TYPE_CHILD_SCHEMA, TYPE_ARRAY_CHILD_SCHEMA } from "../constants/constants";

const TypeRenderer = ({ data, attributeRowData, typesObjectRef, dropRefs, setAttributeRowData }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useTranslation();
  const { currentSchemaId, updateSchemaState, getSchemaState, createChildSchemaPlaceholder } = useMultiSchema();
  
  // Type dropdown options
  // Note: TYPE_CHILD_SCHEMA ("Child Schema") is converted to refs:/refn: at export time
  const displayValues = [
    { value: "", label: "" },
    { value: "Text", label: "Text" },
    { value: "Binary", label: "Binaryfile" },
    { value: "Boolean", label: "Boolean" },
    { value: "DateTime", label: "DateTime" },
    { value: "Numeric", label: "Numeric" },
    { value: TYPE_CHILD_SCHEMA, label: TYPE_CHILD_SCHEMA },
    { value: "Array[Binary]", label: "Array[Binaryfile]" },
    { value: "Array[Boolean]", label: "Array[Boolean]" },
    { value: "Array[DateTime]", label: "Array[DateTime]" },
    { value: "Array[Numeric]", label: "Array[Numeric]" },
    { value: "Array[Text]", label: "Array[Text]" },
    { value: TYPE_ARRAY_CHILD_SCHEMA, label: TYPE_ARRAY_CHILD_SCHEMA }
  ];

  const attributeName = data.Attribute;
  const currentAttribute = attributeRowData.find(
    (item) => item.Attribute === attributeName
  );

  const index = attributeRowData.findIndex((item) => item.Attribute === attributeName);
  const [type, setType] = useState(
    (currentAttribute && currentAttribute.Type) || ""
  );

  const typesDisplay = displayValues.map((value) => (
    <MenuItem
      key={value.value}
      value={value.value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {value.label !== "" ? t(value.label) : value.label}
    </MenuItem>
  ));

  const handleChange = (e) => {
    const newType = e.target.value;
    setType(newType);

    // Update typesObjectRef
    const newTypesObject = { ...typesObjectRef.current };
    newTypesObject[attributeName] = newType;
    typesObjectRef.current = newTypesObject;
    
    // Also update the global context's attributeRowData
    const updatedAttributeRowData = attributeRowData.map((item) => {
      if (item.Attribute === attributeName) {
        return { ...item, Type: newType };
      }
      return item;
    });
    setAttributeRowData(updatedAttributeRowData);
    
    // Update MultiSchemaContext to persist the change
    // MultiSchemaContext handles null schemaId internally
    updateSchemaState(currentSchemaId, {
      attributes: updatedAttributeRowData
    });
    
    // If setting type to Child Schema, create a placeholder child schema
    // so user can immediately navigate to edit it
    if (newType === TYPE_CHILD_SCHEMA || newType === TYPE_ARRAY_CHILD_SCHEMA) {
      createChildSchemaPlaceholder(attributeName, currentSchemaId);
    }
    
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    // Keep local type in sync when data or refs change
    const fromRow = (attributeRowData.find((i) => i.Attribute === attributeName) || {}).Type;
    const fromRef = typesObjectRef.current[attributeName];
    const next = fromRow !== undefined && fromRow !== null && fromRow !== "" ? fromRow : fromRef;
    setType(next || "");
  }, [attributeName, attributeRowData, typesObjectRef]);

  const handleKeyDown = (e) => {
    const keyPressed = e.key;
    if (keyPressed === "Delete" || keyPressed === "Backspace") {
      setType("");
      typesObjectRef.current[attributeName] = "";
      
      // Also update the global context
      const updatedAttributeRowData = attributeRowData.map((item) => {
        if (item.Attribute === attributeName) {
          return { ...item, Type: "" };
        }
        return item;
      });
      setAttributeRowData(updatedAttributeRowData);
      
      // Update MultiSchemaContext to persist the change
      // MultiSchemaContext handles null schemaId internally
      updateSchemaState(currentSchemaId, {
        attributes: updatedAttributeRowData
      });
    }
  };

  return (
    <DropdownMenuList
      handleKeyDown={handleKeyDown}
      type={type}
      handleChange={handleChange}
      dropRefs={dropRefs.current[index]}
      handleClick={handleClick}
      isDropdownOpen={isDropdownOpen}
      setIsDropdownOpen={setIsDropdownOpen}
      typesDisplay={typesDisplay}
    />
  );
};

export default TypeRenderer;
