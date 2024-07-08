import React, { useState, useEffect } from "react";
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  ClickAwayListener,
} from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import { useTranslation } from "react-i18next";

const exportOptions = ["excel", "csv"];

const ExportButton = ({ handleSave }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [additionalOptionsAnchorEl, setAdditionalOptionsAnchorEl] =
    useState(null);
  const open = Boolean(anchorEl);
  const additionalOptionsOpen = Boolean(additionalOptionsAnchorEl);

  const { t } = useTranslation();

  const handleMenuItemClick = (option) => {
    setSelectedOption(option);

    if (option === "excel") {
      handleSave(true, "excel");
    } else if (option === "csv") {
      setAdditionalOptionsAnchorEl(anchorEl);
    }
    setAnchorEl(null);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAdditionalOptionsClose = () => {
    setAdditionalOptionsAnchorEl(null);
    setAnchorEl(null);
  };

  useEffect(() => {
    if (additionalOptionsAnchorEl) {
      setSelectedOption("");
      setAnchorEl(null);
    }
  }, [additionalOptionsAnchorEl]);

  return (
    <>
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        color="button"
        variant="contained"
        sx={{
          alignSelf: "flex-end",
          display: "flex",
          justifyContent: "space-around",
          padding: "0.5rem 1rem",
        }}
      >
        Export Data
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        {exportOptions.map((option) => (
          <MenuItem
            sx={{ color: CustomPalette.PRIMARY }}
            key={option}
            selected={option === selectedOption}
            onClick={() => handleMenuItemClick(option)}
          >
            {option === "excel" ? t("EXCEL") : t("CSV")}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        id="basic-menu2"
        anchorEl={additionalOptionsAnchorEl}
        open={additionalOptionsOpen}
        onClose={handleAdditionalOptionsClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <ClickAwayListener onClickAway={handleAdditionalOptionsClose}>
          <MenuList>
            <MenuItem
              sx={{ color: CustomPalette.PRIMARY }}
              onClick={() => {
                handleAdditionalOptionsClose();
                handleSave(true, "csv");
              }}
            >
              Keep original data column headers
            </MenuItem>
            <MenuItem
              sx={{ color: CustomPalette.PRIMARY }}
              onClick={() => {
                handleAdditionalOptionsClose();
                handleSave(false, "csv");
              }}
            >
              Change to Schema column headers
            </MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Menu>
    </>
  );
};

export default ExportButton;
