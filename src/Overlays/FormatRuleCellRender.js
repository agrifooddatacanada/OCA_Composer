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
import { normalizeEscapedQuotes } from "../utils/helpers";

export const TrashCanButton = memo(
  // eslint-disable-next-line no-unused-vars
  forwardRef((props, ref) => {
    const { node, data, onRefresh, api } = props;
    const onClick = useCallback(() => {
      node.updateData({
        ...data,
        "Format Rule": "",
        [CUSTOM_FORMAT_RULE]: ""
      });
      if (api) {
        api.refreshCells({
          force: true,
          rowNodes: [node],
          columns: ["Format Rule"]
        });
      }
      onRefresh?.();
    }, [node, data, onRefresh, api]);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          display: data?.["Format Rule"] === "" && data?.[CUSTOM_FORMAT_RULE] === "" ? "none" : "block"
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

    const handleClick = (e) => {
      // Check current state dynamically
      const hasCustomFormatRule = Boolean(props.data[CUSTOM_FORMAT_RULE]);
      // If custom format rule exists, prevent the dropdown from opening
      if (hasCustomFormatRule) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Otherwise, do nothing - let Material UI's onOpen/onClose handle the state
    };

    const findCode = (value) =>
      baseType.includes("Date")
        ? descriptionToFormatCodeDate[value]
        : baseType.includes("Numeric")
          ? descriptionToFormatCodeNumeric[value]
          : baseType.includes("Binary")
            ? descriptionToFormatCodeBinary[value]
            : baseType.includes("Text") || baseType === "Text"
              ? descriptionToFormatCodeText[value]
              : "";

    const handleChange = (e) => {
      const newFormatRule = findCode(e.target.value);
      props.node.updateData({
        ...props.data,
        "Format Rule": newFormatRule,
        [CUSTOM_FORMAT_RULE]: "" // Clear custom format rule when selecting a built-in rule
      });
      // Close dropdown immediately
      setIsDropdownOpen(false);
      // Refresh Custom Format Rule column to update editable state
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: [CUSTOM_FORMAT_RULE]
        });
      }
      // Save to context
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
      // Normalize escaped quotes in stored regexes
      const formattedValue = normalizeEscapedQuotes(value);
      return baseType.includes("Date")
        ? formatCodeDateDescription[formattedValue]
        : baseType.includes("Numeric")
          ? formatCodeNumericDescription[formattedValue]
          : baseType.includes("Binary")
            ? formatCodeBinaryDescription[formattedValue]
            : baseType.includes("Text") || baseType === "Text"
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
        type={findDescription(props.data["Format Rule"])}
        handleChange={handleChange}
        handleClick={handleClick}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        typesDisplay={typesDisplay}
        isDisabled={Boolean(props.data[CUSTOM_FORMAT_RULE])}
      />
    ) : null;
  })
);
