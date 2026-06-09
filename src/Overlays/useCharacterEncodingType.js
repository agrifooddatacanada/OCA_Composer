import React, { useCallback, useEffect, useState } from "react";
import { MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { displayValues } from "../constants/constants";
import { getAllGridRowData } from "./gridUtils";

export const CharacterEncodingTypeRenderer = ({ value, node }) => {
  const [type, setType] = useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setType(value);
  }, [value]);

  const handleChange = (e) => {
    setType(e.target.value);
    node.updateData({
      ...node.data,
      "Character Encoding": e.target.value
    });
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleKeyDown = (e) => {
    const keyPressed = e.key;
    if (keyPressed === "Delete" || keyPressed === "Backspace") {
      // setType("");
      // typesObjectRef.current[attributeName] = "";
    }
  };

  const typesDisplay = displayValues.map((value) => (
    <MenuItem
      key={value}
      value={value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {value}
    </MenuItem>
  ));

  return (
    <DropdownMenuList
      handleKeyDown={handleKeyDown}
      type={type}
      handleChange={handleChange}
      handleClick={handleClick}
      isDropdownOpen={isDropdownOpen}
      setIsDropdownOpen={setIsDropdownOpen}
      typesDisplay={typesDisplay}
    />
  );
};

const useCharacterEncodingType = (gridRef, _characterEncodingRowData, setCharacterEncodingRowData) => {
  const handleSave = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.stopEditing();
    setCharacterEncodingRowData(getAllGridRowData(api));
  }, [gridRef, setCharacterEncodingRowData]);

  const applyAllFunc = useCallback(() => {
    const api = gridRef.current?.api;
    const first = api?.getDisplayedRowAtIndex(0)?.data?.["Character Encoding"];
    if (api == null || first === undefined) return;
    api.forEachNode((node) => {
      node.updateData({
        ...node.data,
        "Character Encoding": first
      });
    });
  }, [gridRef]);

  return { handleSave, applyAllFunc };
};

export default useCharacterEncodingType;
