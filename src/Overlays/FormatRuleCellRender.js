import React, { forwardRef, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
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

export const FormatRuleTypeRenderer = memo(
  // eslint-disable-next-line no-unused-vars
  forwardRef((props, ref) => {
    const { t } = useTranslation();
    const attributeType = props.data?.Type || "Text";
    let selectedOption = [];

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
      const hasCustomFormatRule = Boolean(props.data[CUSTOM_FORMAT_RULE]);
      if (hasCustomFormatRule) {
        e.preventDefault();
        e.stopPropagation();
      }
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
        [CUSTOM_FORMAT_RULE]: ""
      });
      setIsDropdownOpen(false);
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: [CUSTOM_FORMAT_RULE]
        });
      }
      props.onRefresh();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (!props.data[CUSTOM_FORMAT_RULE]) {
          handleChange({ target: { value: "" } });
          setIsDropdownOpen(false);
        }
      }
    };

    const findDescription = (value) => {
      const formattedValue = normalizeEscapedQuotes(value);
      const description = baseType.includes("Date")
        ? formatCodeDateDescription[formattedValue]
        : baseType.includes("Numeric")
          ? formatCodeNumericDescription[formattedValue]
          : baseType.includes("Binary")
            ? formatCodeBinaryDescription[formattedValue]
            : baseType.includes("Text") || baseType === "Text"
              ? formatCodeTextDescription[formattedValue]
              : "";
      
      return description ? t(description, { defaultValue: description }) : "";
    };

    const typesDisplay = selectedOption.map((value) => (
      <MenuItem
        key={value}
        value={value}
        sx={{ border: "none", height: "2rem", fontSize: "small" }}
      >
        {value && <span>{t(value, { defaultValue: value })}</span>}
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
