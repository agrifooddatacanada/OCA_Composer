import React, { forwardRef, memo, useCallback, useState } from "react";
import { IconButton, MenuItem } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { CustomPalette } from "../constants/customPalette";
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
    const onClick = useCallback(() => {
      props.node.updateData({
        ...props.node.data,
        FormatText: ""
      });
      props?.onRefresh();
    }, []);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          display: props.node.data?.FormatText === "" ? "none" : "block"
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
    const attributeType = props.data.Type;
    let selectedOption = [];
    if (attributeType.includes("Date")) {
      selectedOption = formatCodeDate;
    } else if (attributeType.includes("Numeric")) {
      selectedOption = formatCodeNumeric;
    } else if (attributeType.includes("Binary")) {
      selectedOption = formatCodeBinary;
    } else if (attributeType.includes("Text")) {
      selectedOption = formatCodeText;
    }

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const hasCustomFormatRule = Boolean(props.node.data[CUSTOM_FORMAT_RULE]);

    const findCode = (value) =>
      attributeType.includes("Date")
        ? descriptionToFormatCodeDate[value]
        : attributeType.includes("Numeric")
          ? descriptionToFormatCodeNumeric[value]
          : attributeType.includes("Binary")
            ? descriptionToFormatCodeBinary[value]
            : attributeType.includes("Text")
              ? descriptionToFormatCodeText[value]
              : "";

    const handleChange = (e) => {
      props.node.updateData({
        ...props.node.data,
        FormatText: findCode(e.target.value)
      });
      setIsDropdownOpen(false);
      props.onRefresh();
    };

    const handleClick = () => {
      if (hasCustomFormatRule) return;
      setIsDropdownOpen(!isDropdownOpen);
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
      return attributeType.includes("Date")
        ? formatCodeDateDescription[formattedValue]
        : attributeType.includes("Numeric")
          ? formatCodeNumericDescription[formattedValue]
          : attributeType.includes("Binary")
            ? formatCodeBinaryDescription[formattedValue]
            : attributeType.includes("Text")
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
        type={findDescription(props.node.data.FormatText)}
        handleChange={handleChange}
        handleClick={handleClick}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        typesDisplay={typesDisplay}
        isDisabled={hasCustomFormatRule}
      />
    ) : (
      <></>
    );
  })
);
