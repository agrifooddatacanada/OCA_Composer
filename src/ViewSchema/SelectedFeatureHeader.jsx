import React from "react";
import { useTranslation } from "react-i18next";

function SelectedFeatureHeader({ feature }) {
  const { t } = useTranslation();
  return (
    <span style={{ margin: "auto" }}>
      {feature === "Required Entry"
        ? t("Required Entry")
        : feature === "Format"
          ? t("Format Rule")
          : t(feature)}
    </span>
  );
}

export default SelectedFeatureHeader;
