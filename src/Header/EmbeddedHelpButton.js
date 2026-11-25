import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Popover, Box, Typography, Button, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { getHeaderMeta } from "./Header";
import { getNormalizedUICode, getUICode } from "../utils/languageUtils";
import { CustomPalette } from "../constants/customPalette";

// Replaces the full Header (logo, per-step instruction banner, Help button, language
// select) when this app is embedded in ContextHub's iframe — Home.js hides that whole
// bar there to leave the limited iframe height to the wizard. This keeps the one thing
// from it that has no equivalent in ContextHub's own composer chrome: the current step's
// instructions and its link to the full help page.
export default function EmbeddedHelpButton({ currentPage }) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const selectedLanguage = getNormalizedUICode(getUICode());
  const { toolTipText, helpLink } = getHeaderMeta(currentPage, t, selectedLanguage);

  if (!toolTipText && !helpLink) return null;

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={t("Help", { defaultValue: "Help" })}>
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          size="small"
          sx={{
            position: "fixed",
            top: 8,
            right: 8,
            zIndex: 1300,
            backgroundColor: CustomPalette.WHITE,
            boxShadow: 1,
            "&:hover": { backgroundColor: CustomPalette.GREY_200 }
          }}
        >
          <HelpOutlineIcon fontSize="small" sx={{ color: CustomPalette.PRIMARY }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          {toolTipText && (
            <Typography sx={{ fontSize: "0.875rem", color: CustomPalette.GREY_600 }}>
              {toolTipText}
            </Typography>
          )}
          {helpLink && (
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => window.open(helpLink, "_blank", "noopener,noreferrer")}
            >
              {t("Learn more", { defaultValue: "Learn more" })}
            </Button>
          )}
        </Box>
      </Popover>
    </>
  );
}
