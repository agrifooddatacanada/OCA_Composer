import { createRef, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";

const displayValues = [
  "",
  "UTF-8",
  "ASCII",
  "ISO-8859-1"
];

const useCharacterEncodingType = (gridRef) => {
  const { attributesList, characterEncodingRowData, setCharacterEncodingRowData, selectedOverlay } = useContext(Context);
  const typesObjectRef = useRef({});
  const dropRefs = useRef(characterEncodingRowData.map(() => createRef()));

  // Load up the typesObjectRef from the characterEncodingRowData
  useEffect(() => {
    const newTypesObjetRef = {};
    characterEncodingRowData.forEach((item) => {
      if (item[selectedOverlay]) {
        newTypesObjetRef[item.Attribute] = item[selectedOverlay];
      }
    });
    typesObjectRef.current = newTypesObjetRef;
  }, [characterEncodingRowData, selectedOverlay]);

  useEffect(() => {
    dropRefs.current = characterEncodingRowData.map(() => createRef());
  }, [attributesList, characterEncodingRowData]);

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const attributeWithCharacterEncoding = typesObjectRef.current;
    const newCharacterEncodingRowData = [];
    characterEncodingRowData.forEach((item) => {
      newCharacterEncodingRowData.push({
        ...item,
        [selectedOverlay]: attributeWithCharacterEncoding[item.Attribute] || '',
      });
    });
    setCharacterEncodingRowData(newCharacterEncodingRowData);
  };

  const CharacterEncodingTypeRenderer = (props) => {
    const attributeName = props.attr;
    const [type, setType] = useState(displayValues[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const index = characterEncodingRowData.findIndex(
      (item) => item.Attribute === attributeName
    );

    useEffect(() => {
      setType(typesObjectRef.current[attributeName]);
    }, [attributeName]);

    const handleChange = (e) => {
      setType(e.target.value);
      typesObjectRef.current = { ...typesObjectRef.current, [attributeName]: e.target.value };
      setIsDropdownOpen(false);
    };

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        setType("");
        typesObjectRef.current[attributeName] = "";
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
        dropRefs={dropRefs.current[index]}
        handleClick={handleClick}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        typesDisplay={typesDisplay}
      />
    );
  };

  return { handleSave, CharacterEncodingTypeRenderer };
};

export default useCharacterEncodingType;