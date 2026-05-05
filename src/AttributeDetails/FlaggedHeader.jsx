import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import CellHeader from "../components/CellHeader";

const FlaggedHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue("Flagged", checked);
    });
  };

  useEffect(() => {
    inputRef.current.checked = false;
  }, []);

  return (
    <CellHeader
      headerText={
        <Box sx={{ display: "flex", direction: "row", alignItems: "center" }}>
          {t("Sensitive")}{" "}
          <input type="checkbox" ref={inputRef} onChange={handleCheckboxChange} />
        </Box>
      }
      helpText={
        <>
          <div>
            {t("If the attribute could be considered Personally Identifiable...")}
          </div>
          <br />
          <div>{t("Examples of PII include names, locations, postal codes...")}</div>
        </>
      }
    />
  );
};

export default FlaggedHeader;
