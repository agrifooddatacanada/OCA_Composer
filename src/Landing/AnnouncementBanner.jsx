
import { Box, Typography } from "@mui/material";
import React from "react";

// eslint-disable-next-line arrow-body-style
const GeneralAnnouncementBanner = ({ message, children }) => {
  return (
    <Box
      sx={{
        backgroundColor: "#ffe880",
        padding: 2
      }}
    >
      <Typography>
        {children ?? message}
      </Typography>
    </Box>
  );
};

export default GeneralAnnouncementBanner;
