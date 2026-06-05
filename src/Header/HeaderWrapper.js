import React from "react";
import { Box, Stack } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";

const HeaderWrapper = ({
  isMobile,
  headerColor,
  leftItem,
  rightItem,
  centerItem,
  centerItemInteractive = false
}) => (
  <Stack
    direction="row"
    alignItems="center"
    sx={{
      pl: isMobile ? 2 : 4,
      pr: isMobile ? 2 : 4,
      borderBottom: headerColor ? 0 : 0.5,
      borderColor: headerColor || CustomPalette.GREY_300,
      backgroundColor: headerColor,
      position: "relative",
      zIndex: 1210,
      minWidth: 0,
      gap: 1
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{leftItem}</Box>
    {centerItem && (
      <Box
        sx={{
          flex: "1 1 0%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 0.5, sm: 1 },
          pointerEvents: centerItemInteractive ? "auto" : "none"
        }}
      >
        {centerItem}
      </Box>
    )}
    <Stack
      direction="row"
      sx={{
        flexShrink: 0,
        width: isMobile ? "fit-content" : 300,
        minWidth: isMobile ? "fit-content" : 300,
        alignItems: "center",
        justifyContent: "flex-end",
        ml: centerItem ? 0 : "auto"
      }}
    >
      {rightItem}
    </Stack>
  </Stack>
);

export default HeaderWrapper;
