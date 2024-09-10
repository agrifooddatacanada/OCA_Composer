import React from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import CustomAnchorLink from "../components/CustomAnchorLink";
import { Trans, useTranslation } from "react-i18next";
import CustomRouterLink from "../components/CustomRouterLink";

export default function StartIntro() {
  const isMobile = useMediaQuery('(max-width: 736px)');
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
          {t("To learn more about schemas and the OCA schema specification")} <CustomAnchorLink link="https://agrifooddatacanada.ca/semantic-engine/" text={t("read our introduction on the ADC webpage")} />
        </Box>
        <Box sx={{ m: 2, textAlign: 'center' }}>
          <Trans
           i18nKey={'Watch our tutorial video on creating a schema. Or read the tutorial instead.'}
           components={{CustomLink: <CustomRouterLink to='/tutorial' text='read the tutorial' />}}>
            Watch our tutorial video on creating a schema. Or <CustomRouterLink to='/tutorial' text='read the tutorial' /> instead.
          </Trans>
        </Box>
      </Typography>
      <br />
      <iframe width={isMobile ? '100%' : '560'} height={isMobile ? '200' : '315'} src="https://www.youtube.com/embed/ekMmpx_w45M" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Box>
  );
}