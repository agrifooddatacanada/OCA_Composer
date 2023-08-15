import { createRef, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { Box, FormControl, MenuItem, Select } from "@mui/material";

const displayValues = [
  "",
  "UTF-8",
  "ASCII",
  "ISO-8859-1"
];

const useCharacterEncodingType = () => {
  const { attributesList, attributeRowData } = useContext(Context);

  const typesObjectRef = useRef({});
  const dropRefs = useRef(attributeRowData.map(() => createRef()));

  useEffect(() => {
    dropRefs.current = attributeRowData.map(() => createRef());
  }, [attributesList, attributeRowData]);

  const CharacterEncodingTypeRenderer = (props) => {
    const attributeName = props.attr;

    const currentAttribute = attributeRowData.find(
      (item) => item.Attribute === attributeName
    );

    const index = attributeRowData.findIndex(
      (item) => item.Attribute === attributeName
    );
    const [type, setType] = useState(
      (currentAttribute && currentAttribute.Type) || displayValues[0]
    );

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

      const newTypesObject = { ...typesObjectRef.current };
      newTypesObject[attributeName] = e.target.value;
      typesObjectRef.current = newTypesObject;
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
            label="Type"
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

  return { CharacterEncodingTypeRenderer };
};

export default useCharacterEncodingType;