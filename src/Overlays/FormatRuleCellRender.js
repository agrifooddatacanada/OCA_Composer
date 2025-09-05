import React, { forwardRef, memo, useCallback, useState } from "react";
import { IconButton, MenuItem } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import CustomPalette from "../constants/customPalette";
import {
  CUSTOM_FORMAT_RULE,
  descriptionToFormatCodeBinary,
  descriptionToFormatCodeDate,
  descriptionToFormatCodeNumeric,
  descriptionToFormatCodeText,
  formatCodeBinary,
  formatCodeBinaryDescription,
  formatCodeDate,
  formatCodeDateDescription,
  formatCodeNumeric,
  formatCodeNumericDescription,
  formatCodeText,
  formatCodeTextDescription
} from "../constants/constants";

export const TrashCanButton = memo(
  // eslint-disable-next-line no-unused-vars
  forwardRef((props, ref) => {
    const { node, onRefresh } = props;
    const onClick = useCallback(() => {
      node.updateData({
        ...node.data,
        "Format Rule": ""
      });
      onRefresh?.();
    }, [node, onRefresh]);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          display: node.data?.["Format Rule"] === "" ? "none" : "block"
        }}
        onClick={onClick}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );
  })
);

export const FormatRuleTypeRenderer = memo(
  // eslint-disable-next-line no-unused-vars
  forwardRef((props, ref) => {
    const attributeType = props.data?.Type || "Text"; // Default to "Text" if Type is undefined
    let selectedOption = [];
    
    // Handle Array types by extracting the base type
    const baseType = attributeType.includes("Array") 
      ? attributeType.replace(/Array\[|\]/g, "") 
      : attributeType;
    
    if (baseType.includes("Date")) {
      selectedOption = formatCodeDate;
    } else if (baseType.includes("Numeric")) {
      selectedOption = formatCodeNumeric;
    } else if (baseType.includes("Binary")) {
      selectedOption = formatCodeBinary;
    } else if (baseType.includes("Text") || baseType === "Text") {
      selectedOption = formatCodeText;
    }

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const hasCustomFormatRule = Boolean(props.node.data[CUSTOM_FORMAT_RULE]);

    const handleClick = () => {
      if (hasCustomFormatRule) return;
      setIsDropdownOpen(!isDropdownOpen);
    };

    const findCode = (value) =>
      baseType.includes("Date")
        ? descriptionToFormatCodeDate[value]
        : baseType.includes("Numeric")
          ? descriptionToFormatCodeNumeric[value]
          : baseType.includes("Binary")
            ? descriptionToFormatCodeBinary[value]
            : (baseType.includes("Text") || baseType === "Text")
              ? descriptionToFormatCodeText[value]
              : "";

    const handleChange = (e) => {
      props.node.updateData({
        ...props.node.data,
        "Format Rule": findCode(e.target.value)
      });
      setIsDropdownOpen(false);
      props.onRefresh();
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        // typesObjectRef.current[attributeName] = "";
      }
    };

    const findDescription = (value) => {
      // Remove the escape character for " in regex patterns
      // OCA file requires " to be escaped, that's why the escape character needs to be added when creating OCA file
      // However, in other situtations, the escape character is not needed
      // eslint-disable-next-line quotes
      const formattedValue = value?.replace(/\\"/g, '"');
      return baseType.includes("Date")
        ? formatCodeDateDescription[formattedValue]
        : baseType.includes("Numeric")
          ? formatCodeNumericDescription[formattedValue]
          : baseType.includes("Binary")
            ? formatCodeBinaryDescription[formattedValue]
            : (baseType.includes("Text") || baseType === "Text")
              ? formatCodeTextDescription[formattedValue]
              : "";
    };

    const typesDisplay = selectedOption.map((value) => (
      <MenuItem
        key={value}
        value={value}
        sx={{ border: "none", height: "2rem", fontSize: "small" }}
      >
        {value && <span>{value}</span>}
      </MenuItem>
    ));

    return selectedOption.length > 0 ? (
      <DropdownMenuList
        handleKeyDown={handleKeyDown}
        type={findDescription(props.node.data["Format Rule"])}
        handleChange={handleChange}
        handleClick={handleClick}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        typesDisplay={typesDisplay}
        isDisabled={hasCustomFormatRule}
      />
    ) : null;
  })
);
