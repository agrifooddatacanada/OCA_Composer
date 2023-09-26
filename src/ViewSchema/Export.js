import React from "react";
import { Button, Tooltip, Box } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import useExportLogic from "./useExportLogic";

export default function Export({ setShowLink }) {
  const { handleExport, exportDisabled, resetToDefaults } = useExportLogic(setShowLink);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          color: CustomPalette.GREY_600,
          mb: 5,
        }}
      >
        <Box sx={{ marginRight: "1rem" }}>
          <Tooltip
            title="Export your schema in an Excel format. This format includes all the information you’ve provided here. After you have created and downloaded the Excel schema template you can upload it into the SemanticEngine.org to create the machine-actionable OCA Schema Bundle."
            placement="left"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
        <Button
          color="button"
          variant="contained"
          onClick={handleExport}
          sx={{
            alignSelf: "flex-end",
            width: "12rem",
            display: "flex",
            justifyContent: "space-around",
            p: 1,
          }}
          disabled={exportDisabled}
        >
          Finish and Export <CheckCircleIcon />
        </Button>
      </Box>
      <Button
        color="warning"
        variant="outlined"
        onClick={resetToDefaults}
        sx={{
          alignSelf: "flex-end",
          width: "20rem",
          display: "flex",
          justifyContent: "space-around",
          p: 1,
          mb: 5,
        }}
      >
        Clear All Data and Restart
      </Button>
    </Box>
  );
}
