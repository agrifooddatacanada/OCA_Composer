import React from "react";
import { Box, Link, Typography } from "@mui/material";

export default function StartIntro() {
  return (
    <Box width="80%" margin="auto">
      <Typography variant="h5">
        <Box sx={{ m: 2, pb: 3 }}>
          Welcome to{" "}
          <Link href="https://agrifooddatacanada.ca/" target="_blank">
            Agri-food Data Canada
          </Link>
          's web-based schema writer for creating <br />
          <Link href="https://oca.colossi.network/" target="_blank">
            Overlays Capture Architecture
          </Link>{" "}
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
          <Link href="https://humancolossus.foundation/" target="_blank">
            Human Colossus Foundation
          </Link>{" "}
          and adopted by Agri-food Data Canada (ADC).
        </Box>
        <Box sx={{ m: 2 }}>
          At the end of this process, you will be able to download a
          machine-actionable OCA version of your schema as well as the Excel
          Template which is a more human readable format. You can store both of
          these semantic artifacts together with your datasets which will help
          make your data more Findable, Accessible, Interoperable, and Reusable
          (
          <Link href="https://www.go-fair.org/fair-principles/" target="_blank">
            FAIR
          </Link>
          ).
        </Box>
      </Typography>
    </Box>
  );
}
