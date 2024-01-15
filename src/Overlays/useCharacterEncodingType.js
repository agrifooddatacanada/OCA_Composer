import { useCallback, useContext, useState } from "react";
import { Context } from "../App";
import { MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { displayValues } from "../constants/constants";

export const CharacterEncodingTypeRenderer = (props) => {
  const [type, setType] = useState(props?.value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChange = (e) => {
    setType(e.target.value);
    props.node.updateData({
      ...props.node.data,
      "Character Encoding": e.target.value,
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

  const typesDisplay = displayValues.map((value, index) => (
    <MenuItem
      key={index + "_" + value}
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

const useCharacterEncodingType = (gridRef) => {
  const { characterEncodingRowData, setCharacterEncodingRowData } = useContext(Context);

  const handleSave = useCallback(() => {
    gridRef.current.api.stopEditing();
    const attributeWithCharacterEncoding = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
    setCharacterEncodingRowData(attributeWithCharacterEncoding);
  }, [gridRef, setCharacterEncodingRowData]);

  const applyAllFunc = useCallback(() => {
    const getFirstNode = gridRef.current?.api.getRenderedNodes()[0];
    const firstAttribute = getFirstNode?.data?.["Character Encoding"];
    const newCharacterEncodingRowData = [];
    characterEncodingRowData.forEach((item) => {
      newCharacterEncodingRowData.push({
        ...item,
        "Character Encoding": firstAttribute || '',
      });
    });

    setCharacterEncodingRowData(newCharacterEncodingRowData);
  }, [characterEncodingRowData, gridRef, setCharacterEncodingRowData]);

  return { handleSave, applyAllFunc };
};

export default useCharacterEncodingType;