import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import CatalogueInfoForm from "./CatalogueInfoForm";
import useLocalStorage from "../hooks/useLocalStorage";
import { CATALOGUE_INFO_KEY } from "../constants/catalogueInfo";
import { CustomPalette } from "../constants/customPalette";

function CatalogueInfo({ isDisabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { storedValue, saveToLocalStorage } = useLocalStorage(CATALOGUE_INFO_KEY);
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {storedValue ? (
          <>
            <CheckBox sx={{ color: CustomPalette.PRIMARY }} />
            <Typography>
              {storedValue.scenario} {t("scenario")}
            </Typography>
          </>
        ) : (
          <CheckBoxOutlineBlank sx={{ color: CustomPalette.PRIMARY }} />
        )}
        <Button
          size="small"
          variant="contained"
          color="navButton"
          disabled={isDisabled}
          onClick={() => setIsOpen(true)}
          sx={{ flexGrow: 1 }}
        >
          {storedValue ? t("Update") : t("Add catalogue information")}
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
