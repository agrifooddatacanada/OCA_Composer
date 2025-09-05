import { AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CustomPalette from "../constants/customPalette";
import AccordionItemWrapper from "./AccordionItemWrapper";
import CustomAnchorLink from "../components/CustomAnchorLink";

const WriteASchemaAccordionItem = ({ navigateToStartPage }) => {
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
          {t("Write a Schema")}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: "start" }}>
        <Typography>
          {t("Using our")}{" "}
          <CustomAnchorLink text={t("schema writer")} onClick={navigateToStartPage} />{" "}
          {t("you can easily create human- and machine-readable versions of your schema")}
        </Typography>
        <Typography sx={{ marginTop: "20px", marginBottom: "20px" }}>
          {t(
            "You will either be documenting an existing dataset or you will start with..."
          )}{" "}
          <CustomAnchorLink
            link={`https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language}/DesignDataset/`}
            text={t("Learn more about how to design a dataset")}
          />
        </Typography>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center"
          }}
        >
          <CustomAnchorLink
            text={t("Write a Schema")}
            overrideStyle={{
              fontSize: "20px",
              fontWeight: "500",
              color: CustomPalette.PRIMARY
            }}
            onClick={navigateToStartPage}
          />
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default WriteASchemaAccordionItem;
