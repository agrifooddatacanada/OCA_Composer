import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { TYPE_CHILD_SCHEMA, TYPE_PLACEHOLDER_CHILD_SCHEMA, TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA } from "../constants/constants";

const TypeRenderer = ({ data, attributeRowData, typesObjectRef, dropRefs, setAttributeRowData }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const skipSyncRef = useRef(false);
  const { t } = useTranslation();
  const { updateSchema, createChildSchemaPlaceholder } = useMultiSchema();
  
  // Type dropdown options
  // Note: "Child Schema" covers both refs: (with SAID) and refn: (placeholder) - distinction is automatic
  const displayValues = [
    { value: "", label: "" },
    { value: "Text", label: "Text" },
    { value: "Binary", label: "Binaryfile" },
    { value: "Boolean", label: "Boolean" },
    { value: "DateTime", label: "DateTime" },
    { value: "Numeric", label: "Numeric" },
    { value: TYPE_CHILD_SCHEMA, label: TYPE_CHILD_SCHEMA },
    { value: TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA, label: TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA },
    { value: "Array[Binary]", label: "Array[Binaryfile]" },
    { value: "Array[Boolean]", label: "Array[Boolean]" },
    { value: "Array[DateTime]", label: "Array[DateTime]" },
    { value: "Array[Numeric]", label: "Array[Numeric]" },
    { value: "Array[Text]", label: "Array[Text]" }
  ];

  const attributeName = data.Attribute;
  const currentAttribute = attributeRowData.find(
    (item) => item.Attribute === attributeName
  );

  const index = attributeRowData.findIndex((item) => item.Attribute === attributeName);
  
  // Get initial type from attributeRowData (source of truth)
  const getInitialType = () => {
    if (!currentAttribute) return "";
    const rawType = currentAttribute.Type;
    // Normalize placeholder types for display, but preserve empty string
    if (rawType === TYPE_PLACEHOLDER_CHILD_SCHEMA) return TYPE_CHILD_SCHEMA;
    if (rawType === TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA) return TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA;
    return rawType !== undefined && rawType !== null ? rawType : "";
  };
  
  const [type, setType] = useState(getInitialType());

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
    skipSyncRef.current = true;
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
    updateSchema({
      attributes: updatedAttributeRowData
    });
    
    // If setting type to Child Schema, create a placeholder child schema
    // so user can immediately navigate to edit it
    if (newType === TYPE_CHILD_SCHEMA || newType === TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA) {
      createChildSchemaPlaceholder(attributeName);
    }
    
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const currentAttr = attributeRowData.find((i) => i.Attribute === attributeName);
    
    if (currentAttr) {
      let displayType = currentAttr.Type;
      if (displayType === undefined || displayType === null) {
        displayType = "";
      }
      if (displayType === TYPE_PLACEHOLDER_CHILD_SCHEMA) {
        displayType = TYPE_CHILD_SCHEMA;
      }
      setType(displayType);
      return;
    }
    
    const fromRef = typesObjectRef.current[attributeName];
    setType(fromRef !== undefined && fromRef !== null ? fromRef : "");
  }, [attributeName, attributeRowData]);

  const handleKeyDown = (e) => {
    const keyPressed = e.key;
    if (keyPressed === "Delete" || keyPressed === "Backspace") {
      skipSyncRef.current = true;
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
      updateSchema({
        attributes: updatedAttributeRowData
      });
    }
  };

  return (
    <DropdownMenuList
      handleKeyDown={handleKeyDown}
      type={t(type, { defaultValue: type })}
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
