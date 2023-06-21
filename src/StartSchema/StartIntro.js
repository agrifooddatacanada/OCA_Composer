import React from "react";
import { Box, Typography } from "@mui/material";
import CustomAnchorLink from "../components/CustomAnchorLink";

export default function StartIntro() {
  return (
    <Box width="80%" margin="auto">
      <Typography variant="h5">
        <Box sx={{ m: 2, pb: 3 }}>
          Welcome to{" "}
          <CustomAnchorLink link="https://agrifooddatacanada.ca/" text="Agri-food Data Canada" />
          's web-based schema writer for creating <br />
          <CustomAnchorLink link="https://oca.colossi.network/" text="Overlays Capture Architecture" />
          {" "}
          (OCA) schemas.
        </Box>
      </Typography>
      <Typography
        variant="subtitle1"
        width="67%"
        margin="auto"
        textAlign={"left"}
      >
        <Box sx={{ m: 2 }}>
          Overlays Capture Architecture is an international, open standard for
          writing machine-actionable data schemas stewarded by the Swiss
          non-profit{" "}
          <CustomAnchorLink link="https://humancolossus.foundation/" text="Human Colossus Foundation" />
          {" "}
          and adopted by Agri-food Data Canada (ADC).
        </Box>
        <Box sx={{ m: 2 }}>
          At the end of this process, you will be able to download a
          machine-actionable OCA version of your schema as well as the Excel
          Template which is a more human readable format. You can store both of
          these semantic artifacts together with your datasets which will help
          make your data more Findable, Accessible, Interoperable, and Reusable
          (
          <CustomAnchorLink link="https://www.go-fair.org/fair-principles/" text="FAIR" />
          ).
        </Box>
      </Typography>
    </Box>
  );
}
