import React, { useState } from "react";
import { Button } from "@mui/material";
import CatalogueInfoForm from "./CatalogueInfoForm";
import useLocalStorage from "../hooks/useLocalStorage";
import { CATALOGUE_INFO_KEY } from "../constants/catalogueInfo";

function CatalogueInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { storedValue, saveToLocalStorage } = useLocalStorage(CATALOGUE_INFO_KEY, null);
  return (
    <>
      <Button variant="contained" color="navButton" onClick={() => setIsOpen(true)}>
        Add catalogue information
      </Button>
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
