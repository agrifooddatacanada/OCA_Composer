import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, Menu, MenuItem, MenuList, ClickAwayListener } from "@mui/material";
import usePrimaryColor from "../hooks/usePrimaryColor";
import useFontFamily from "../hooks/useFontFamily";

const exportOptions = ["excel", "csv"];

const ExportButton = ({ handleSave, validatedData, currentSchemaName }) => {
  const primaryColor = usePrimaryColor();
  const fontFamily = useFontFamily();
  const [selectedOption, setSelectedOption] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [additionalOptionsAnchorEl, setAdditionalOptionsAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const additionalOptionsOpen = Boolean(additionalOptionsAnchorEl);

  const { t } = useTranslation();

  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    setIsEmbedded(window !== window.parent);
  }, []);

  const handleMenuItemClick = (option) => {
    setSelectedOption(option);

    if (option === "excel") {
      handleSave("excel", true);

      if (isEmbedded) {
        window.parent.postMessage(
          {
            type: "validatedData",
            format: "excel",
            data: validatedData,
            metadata: {
              timestamp: new Date().toISOString(),
              schemaName: currentSchemaName,
              validationStatus: true
            }
          },
          "*"
        );
      }
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

  const handleCsvExport = (keepOriginalHeaders) => {
    handleAdditionalOptionsClose();
    handleSave("csv", keepOriginalHeaders);

    if (isEmbedded) {
      window.parent.postMessage(
        {
          type: "validatedData",
          format: "csv",
          keepOriginalHeaders,
          data: validatedData,
          metadata: {
            timestamp: new Date().toISOString(),
            schemaName: currentSchemaName,
            validationStatus: true
          }
        },
        "*"
      );
    }
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
          display: "flex",
          justifyContent: "space-around",
          padding: "0.5rem 1rem",
          fontFamily,
          flexShrink: 0
        }}
      >
        {t("Download Data")}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
      >
        {exportOptions.map((option) => (
          <MenuItem
            sx={{
              color: primaryColor,
              fontFamily
            }}
            key={option}
            selected={option === selectedOption}
            onClick={() => handleMenuItemClick(option)}
          >
            {option === "excel" ? "EXCEL" : "CSV"}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        id="basic-menu2"
        anchorEl={additionalOptionsAnchorEl}
        open={additionalOptionsOpen}
        onClose={handleAdditionalOptionsClose}
        MenuListProps={{
          "aria-labelledby": "basic-button"
        }}
      >
        <ClickAwayListener onClickAway={handleAdditionalOptionsClose}>
          <MenuList>
            <MenuItem
              sx={{
                color: primaryColor,
                fontFamily
              }}
              // onClick={() => {
              //   handleAdditionalOptionsClose();
              //   handleSave("csv", true);
              // }}
              onClick={() => handleCsvExport(true)}
            >
              Keep original data column headers
            </MenuItem>
            <MenuItem
              sx={{
                color: primaryColor,
                fontFamily
              }}
              // onClick={() => {
              //   handleAdditionalOptionsClose();
              //   handleSave("csv", false);
              // }}
              onClick={() => handleCsvExport(false)}
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
