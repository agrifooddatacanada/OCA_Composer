import { Box, Link, Typography } from "@mui/material";
import React from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

const OCAPackageAnnouncementBanner = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        backgroundColor: "#ffe880",
        padding: 2
      }}
    >
      <Typography>
        {t(
          "Early March, OCA package is coming to the Semantic Engine. All tools still work the same way, but you will download your OCA schema as a .json instead of .zip."
        )}{" "}
        <Link
          href={`https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language}/ChangeLog/`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            cursor: "pointer"
          }}
        >
          {t("Learn more")}
        </Link>
      </Typography>
    </Box>
  );
};

export default OCAPackageAnnouncementBanner;
