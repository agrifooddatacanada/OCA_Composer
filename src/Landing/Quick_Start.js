import React from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Box, Typography } from "@mui/material";
import CustomAnchorLink from "../components/CustomAnchorLink";
import CustomPalette from "../constants/customPalette";
import CustomRouterLink from "../components/CustomRouterLink";

const QuickStart = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: "1500px", padding: 10, textAlign: "left" }}>
      <Typography sx={{ fontWeight: "800", fontSize: "1.2rem" }}>
        {t("Quick-start")}
      </Typography>
      <Typography sx={{ fontWeight: "600" }}>
        1.{" "}
        <CustomAnchorLink
          link="https://www.youtube.com/watch?v=393n05TTyNM"
          text={t("Watch our tutorial video on creating a schema")}
          overrideStyle={{
            fontWeight: "500",
            color: CustomPalette.PRIMARY
          }}
        />{" "}
        {t("Or")}{" "}
        <CustomRouterLink
          to={`https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language}/TutorialAll/`}
          text={t("read the tutorial")}
          overrideStyle={{ fontWeight: "500", color: CustomPalette.PRIMARY }}
        />{" "}
        {t("instead")}.
      </Typography>
      <Typography sx={{ fontWeight: "600" }}>
        2.{" "}
        {t("Write your schema and generate the schema bundle and a simple .txt Readme")}
      </Typography>
      <Typography sx={{ fontWeight: "600" }}>
        3.{" "}
        {t(
          "Use your schema bundle here to view, and generate an Excel sheet for data input aligned with your schema"
        )}
      </Typography>
      <Typography sx={{ fontWeight: "600" }}>
        4.{" "}
        {t(
          "Store your schema files with your data, put them in a repository, or collaborate by sharing them with others"
        )}
      </Typography>
    </Box>
  );
};

export default QuickStart;
