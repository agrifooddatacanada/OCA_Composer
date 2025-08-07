import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem } from "@mui/material";
import { Context } from "../App";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { SCHEMA_MODE_MULTI_LEVEL } from "../constants/constants";

const TypeRenderer = ({ data, attributeRowData, typesObjectRef, dropRefs }) => {
  const { schemaMode } = useContext(Context);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useTranslation();
  const displayValues = [
    { value: "", label: "" },
    { value: "Binary", label: "Binaryfile" },
    { value: "Boolean", label: "Boolean" },
    { value: "DateTime", label: "DateTime" },
    { value: "Numeric", label: "Numeric" },
    ...(schemaMode === SCHEMA_MODE_MULTI_LEVEL
      ? [{ value: "Reference", label: "Reference" }]
      : []),
    { value: "Text", label: "Text" },
    { value: "Array[Binary]", label: "Array[Binaryfile]" },
    { value: "Array[Boolean]", label: "Array[Boolean]" },
    { value: "Array[DateTime]", label: "Array[DateTime]" },
    { value: "Array[Numeric]", label: "Array[Numeric]" },
    { value: "Array[Text]", label: "Array[Text]" },
    ...(schemaMode === SCHEMA_MODE_MULTI_LEVEL
      ? [{ value: "Array[Reference]", label: "Array[Reference]" }]
      : [])
  ];

  const attributeName = data.Attribute;
  const currentAttribute = attributeRowData.find(
    (item) => item.Attribute === attributeName
  );

  const index = attributeRowData.findIndex((item) => item.Attribute === attributeName);
  const [type, setType] = useState(
    (currentAttribute && currentAttribute.Type) || displayValues[0].value
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
    setType(e.target.value);

    const newTypesObject = { ...typesObjectRef.current };
    newTypesObject[attributeName] = e.target.value;
    typesObjectRef.current = newTypesObject;
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    setType(typesObjectRef.current[attributeName]);
  }, [attributeName]);

  const handleKeyDown = (e) => {
    const keyPressed = e.key;
    if (keyPressed === "Delete" || keyPressed === "Backspace") {
      setType("");
      typesObjectRef.current[attributeName] = "";
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
