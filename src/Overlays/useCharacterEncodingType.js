import { createRef, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { Box, FormControl, MenuItem, Select } from "@mui/material";

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

    const index = characterEncodingRowData.findIndex(
      (item) => item.Attribute === attributeName
    );

    const [type, setType] = useState(displayValues[0]);

    const typesDisplay = displayValues.map((value, index) => (
      <MenuItem
        key={index + "_" + value}
        value={value}
        sx={{ border: "none", height: "2rem", fontSize: "small" }}
      >
        {value}
      </MenuItem>
    ));

    const handleChange = (e) => {
      setType(e.target.value);
      typesObjectRef.current = { ...typesObjectRef.current, [attributeName]: e.target.value };
      setIsDropdownOpen(false);
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      <Box
        sx={{
          height: "105%",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <FormControl
          fullWidth
          variant="standard"
          sx={{
            height: "100%",
          }}
          onKeyDown={handleKeyDown}
        >
          <Select
            id="select-drop"
            value={type || ""}
            label="Character Encoding"
            onChange={handleChange}
            sx={{
              height: "100%",
              fontSize: "small",
            }}
            ref={dropRefs.current[index]}
            onClick={handleClick}
            open={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpen={() => setIsDropdownOpen(true)}
          >
            {typesDisplay}
          </Select>
        </FormControl>
      </Box>
    );
  };

  return { handleSave, CharacterEncodingTypeRenderer };
};

export default useCharacterEncodingType;