import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ErrorPopup from "../ViewSchema/ErrorPopup";

const ALLOWED_CHARS = [
  { label: "Numbers", value: "0-9" },
  { label: "Letters", value: "a-z, A-Z" },
  { label: "Underline", value: "_" },
  { label: "Hyphen", value: "-" },
  { label: "Period", value: "." }
];

export default function InvalidAttributeNamesModal({ open, onClose, invalidNames = [] }) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <ErrorPopup onClose={onClose}>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight="semibold" sx={{ mb: 2 }}>
          {t("Attribute names are limited to the following characters:")}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 1, columnGap: 3, textAlign: "left" }}>
            {ALLOWED_CHARS.map((item, i) => (
              <React.Fragment key={i}>
                <Typography variant="body1">{t(item.label)}:</Typography>
                <Typography variant="body1">{item.value}</Typography>
              </React.Fragment>
            ))}
          </Box>
        </Box>
        {invalidNames.length > 0 && (
          <Box sx={{ mt: 3, textAlign: "left", maxHeight: "12rem", overflowY: "auto" }}>
            <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>
              {t("The following attributes have invalid names:")}
            </Typography>
            {invalidNames.map((name, i) => (
              <Typography key={`${name}-${i}`} variant="body1" sx={{ wordBreak: "break-word" }}>
                {name}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </ErrorPopup>
  );
}
