import { forwardRef, memo, useCallback, useState } from "react";
import { IconButton, MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CustomPalette } from "../constants/customPalette";
import { formatCodeBinary, formatCodeBinaryDescription, formatCodeDate, formatCodeDateDescription, formatCodeNumeric, formatCodeNumericDescription, formatCodeText, formatCodeTextDescription } from "../constants/constants";

export const TrashCanButton = memo(
  forwardRef((props, ref) => {
    const onClick = useCallback(() => {
      props.node.updateData({
        ...props.node.data,
        FormatText: "",
      });
      props?.onRefresh();
    }, []);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
        }}
        onClick={onClick}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );
  })
);

export const FormatRuleTypeRenderer = memo(
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

    const handleChange = (e) => {
      props.node.updateData({
        ...props.node.data,
        FormatText: e.target.value,
      });
      setIsDropdownOpen(false);
    };

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        // typesObjectRef.current[attributeName] = "";
      }
    };

    const typesDisplay = selectedOption.map((value, index) => {
      const description = attributeType.includes("Date") ? formatCodeDateDescription[value] : attributeType.includes("Numeric") ? formatCodeNumericDescription[value] : attributeType.includes("Binary") ? formatCodeBinaryDescription[value] : attributeType.includes("Text") ? formatCodeTextDescription[value] : "";

      return (
        <MenuItem
          key={index + "_" + value}
          value={value}
          sx={{ border: "none", height: "2rem", fontSize: "small" }}
        >
          <strong>{value}</strong> {description && <span> : {description}</span>}
        </MenuItem>
      );
    });

    return (
      <>
        {
          selectedOption.length > 0 ?
            <DropdownMenuList
              handleKeyDown={handleKeyDown}
              type={props.node.data.FormatText}
              handleChange={handleChange}
              handleClick={handleClick}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              typesDisplay={typesDisplay}
            /> :
            <></>
        }
      </>
    );
  })
);
