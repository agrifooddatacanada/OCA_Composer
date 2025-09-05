import { AccordionDetails, AccordionSummary, Link, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CustomPalette from "../constants/customPalette";
import AccordionItemWrapper from "./AccordionItemWrapper";
import CustomAnchorLink from "../components/CustomAnchorLink";

const SchemaAccordionItem = () => {
  const { t } = useTranslation();

  const downloadExampleSchema = () => {
    const zipFilePath = "Package_example.json";

    const link = document.createElement("a");
    link.href = zipFilePath;
    link.download = "Package_example.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />
        }
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: "20px", fontWeight: "500" }}>
          {t("What is a Schema")}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: "start" }}>
        <Typography>
          {t("Schemas are an important piece of data documentation. Schemas work...")}
        </Typography>
        <Typography sx={{ marginTop: "20px" }}>
          {t(
            "Using the tools of the Semantic Engine you can write human- and machine-readable schemas"
          )}
        </Typography>
        <Link
          href={`https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language}/WhatSchema/`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: CustomPalette.PRIMARY,
            fontWeight: "700",
            cursor: "pointer",
            textDecoration: "none"
          }}
        >
          {t("Learn more")}-{">"}
        </Link>
        <Typography sx={{ marginTop: "20px", fontSize: "20px", fontWeight: "700" }}>
          {t("Example schema")}
        </Typography>
        <Typography>
          {t("Download an")}{" "}
          <CustomAnchorLink
            link=""
            text={t("Example schema")}
            onClick={downloadExampleSchema}
          />{" "}
          {t(
            "and use it to test schema tools such as viewing, editing, and creating a Data Entry Excel"
          )}
        </Typography>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default SchemaAccordionItem;
