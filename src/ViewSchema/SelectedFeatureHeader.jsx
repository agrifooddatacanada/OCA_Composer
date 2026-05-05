import React from "react";
import { useTranslation } from "react-i18next";

function SelectedFeatureHeader({ feature }) {
  const { t } = useTranslation();
  return (
    <span style={{ margin: "auto" }}>
      {feature === "Make selected entries required"
        ? t("Required Entry")
        : feature === "Add format rule for data"
          ? t("Format Rules")
          : t(feature)}
    </span>
  );
}

export default SelectedFeatureHeader;
