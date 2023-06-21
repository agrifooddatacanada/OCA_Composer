import React from "react";
import { Card, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { CustomPalette } from "../constants/customPalette";
import CustomAnchorLink from "../components/CustomAnchorLink";

export default function LinkCard({ setShowLink }) {
  return (
    <Box style={{ position: "relative" }}>
      <Card
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, 100%)",
          width: "60%",
          height: "15.8rem",
          zIndex: 100,
          boxShadow: 10,
          backgroundColor: CustomPalette.SECONDARY,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ alignSelf: "flex-end", pr: 1, pt: 1 }}>
          <CloseIcon
            onClick={() => {
              setShowLink(false);
            }}
            sx={{
              color: CustomPalette.DARK,
              "&:hover": {
                color: CustomPalette.PRIMARY,
                transform: "scale(1.1)",
              },
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 8,
            boxShadow: 10,
            borderRadius: "0.5rem",
            mr: 5,
            ml: 5,
            mt: -0.5,
            backgroundColor: CustomPalette.WHITE,
          }}
        >
          Upload your file to the following address:
          <br />
          <br />
          <CustomAnchorLink link='https://www.semanticengine.org/#/develop' text="https://www.semanticengine.org/#/develop" />
        </Box>
      </Card>
    </Box>
  );
}
