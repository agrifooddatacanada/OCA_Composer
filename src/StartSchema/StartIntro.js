import React from "react";
import { Box, Typography } from "@mui/material";
import CustomAnchorLink from "../components/CustomAnchorLink";
import { useTranslation } from "react-i18next";

export default function StartIntro() {
  const { t } = useTranslation();

  return (
    <Box width="80%" margin="auto">
      <Typography
        variant="subtitle1"
        width="67%"
        margin="auto"
        textAlign={"left"}
      >
        <Box sx={{ m: 2 }}>
          {t('Briefly, schemas describe the attributes (variable names/column headers) of...')}
        </Box>
        <Box sx={{ m: 2 }}>
          {t("To learn more about schemas and the OCA schema specification")} <CustomAnchorLink link="https://agrifooddatacanada.ca/semantic-engine/" text={t("read our introduction on the ADC webpage")} />.
        </Box>
      </Typography>
      <br />
      <iframe width="560" height="315" src="https://www.youtube.com/embed/r8VIIBWmL_k" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Box>
  );
}