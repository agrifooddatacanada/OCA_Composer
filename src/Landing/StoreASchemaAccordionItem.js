import React from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CustomPalette from "../constants/customPalette";
import AccordionItemWrapper from "./AccordionItemWrapper";
import CustomAnchorLink from "../components/CustomAnchorLink";

const StoreASchemaAccordionItem = () => {
  const { t } = useTranslation();

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
          {t("Store a Schema")}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: "start" }}>
        <Typography>{t("Store your schema multiple ways")}</Typography>
        <Typography>
          1. {t("Store a schema with your dataset and share it when you share your data")}
        </Typography>
        <Typography>
          2.{" "}
          {t(
            "Share a schema with your lab or collaborators by storing it in a shared lab drive"
          )}
        </Typography>
        <Typography>
          3.{" "}
          {t(
            "Store your schema as an independent object in a repository such as Borealis or Zenodo"
          )}
        </Typography>
        <Typography sx={{ marginTop: "20px", marginBottom: "20px" }}>
          {t(
            "Store the machine-readable schema bundle version and the .txt human-readable version together for best usability"
          )}
        </Typography>
        <CustomAnchorLink
          link={`https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language}/HelpStorage/`}
          text={t("Read more about storage")}
          overrideStyle={{
            fontSize: "20px",
            fontWeight: "500",
            color: CustomPalette.PRIMARY
          }}
        />
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default StoreASchemaAccordionItem;
