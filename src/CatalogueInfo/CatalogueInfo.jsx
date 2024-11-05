import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import CatalogueInfoForm from "./CatalogueInfoForm";
import useLocalStorage from "../hooks/useLocalStorage";
import { CATALOGUE_INFO_KEY } from "../constants/catalogueInfo";
import { CustomPalette } from "../constants/customPalette";

function CatalogueInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { storedValue, saveToLocalStorage } = useLocalStorage(CATALOGUE_INFO_KEY);
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {storedValue ? (
          <>
            <CheckBox sx={{ color: CustomPalette.PRIMARY }} />
            <Typography>{storedValue.scenario} scenario</Typography>
          </>
        ) : (
          <CheckBoxOutlineBlank sx={{ color: CustomPalette.PRIMARY }} />
        )}
        <Button
          size="small"
          variant="contained"
          color="navButton"
          onClick={() => setIsOpen(true)}
          sx={{ flexGrow: 1 }}
        >
          {storedValue ? "Update" : "Add catalogue information"}
        </Button>
      </Box>
      <CatalogueInfoForm
        catalogueData={storedValue}
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        saveToLocalStorage={saveToLocalStorage}
      />
    </>
  );
}

export default CatalogueInfo;
