import { Box, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

const InvalidOCAPackageMessage = ({ textStyles = {} }) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography sx={textStyles}>
        {t(
          "Not all tools are available for invalid schemas. Schemas must first be converted via editing before other tools are available."
        )}
      </Typography>
    </Box>
  );
};

export default InvalidOCAPackageMessage;
