import React from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Box, Typography, useMediaQuery } from "@mui/material";
import CustomAnchorLink from "../components/CustomAnchorLink";
import CustomRouterLink from "../components/CustomRouterLink";

export default function StartIntro() {
  const isMobile = useMediaQuery("(max-width: 736px)");
  const { t } = useTranslation();

  return (
    <Box width="80%" margin="auto">
      <Typography variant="subtitle1" width="67%" margin="auto" textAlign="left">
        <Box sx={{ m: 2 }}>
          {t(
            "Briefly, schemas describe the attributes (variable names/column headers) of..."
          )}
        </Box>
        <Box sx={{ m: 2 }}>
          {t("To learn more about schemas and the OCA schema specification")}{" "}
          <CustomAnchorLink
            link="https://agrifooddatacanada.ca/semantic-engine/"
            text={t("read our introduction on the ADC webpage")}
          />
        </Box>
        <Box sx={{ m: 2, textAlign: "center" }}>
          {t("Watch our tutorial video on creating a schema. Or")}{" "}
          <CustomRouterLink
            to={`https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language}/TutorialAll/`}
            text={t("read the tutorial")}
          />{" "}
          {t("instead")}.
        </Box>
      </Typography>
      <br />
      <iframe
        width={isMobile ? "100%" : "560"}
        height={isMobile ? "200" : "315"}
        src="https://www.youtube.com/embed/393n05TTyNM?si=oWQIxImRJtYbH9T0"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </Box>
  );
}
