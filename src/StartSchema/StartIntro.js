import React from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import CustomAnchorLink from "../components/CustomAnchorLink";

export default function StartIntro() {
  const { isMobile } = useMediaQuery('(max-width:736px)');

  return (
    <Box width="80%" margin="auto">
      <Typography
        variant="subtitle1"
        width="67%"
        margin="auto"
        textAlign={"left"}
      >
        <Box sx={{ m: 2 }}>
          Briefly, schemas describe the attributes (variable names/column headers) of your dataset and help make your data more useful (more FAIR). Using the Agri-food Data Canada schema editor, you can write a schema for your data sets. Using the language of Overlays Capture Architecture (OCA) you can easily write human- and machine-actionable descriptions of your data which you can store with your data, share with your data or deposit with your data. If your schema is of general interest you can also deposit it to be cited as an independent research object, contributing to data standardization and interoperability.
        </Box>
        <Box sx={{ m: 2 }}>
          To learn more about schemas and the OCA schema specification <CustomAnchorLink link="https://agrifooddatacanada.ca/semantic-engine/" text="read our introduction on the ADC webpage" />.
        </Box>
      </Typography>
      <br />
      <iframe width={isMobile ? '100%' : '560'} height={isMobile ? '200' : '315'} src="https://www.youtube.com/embed/ekMmpx_w45M" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Box>
  );
}