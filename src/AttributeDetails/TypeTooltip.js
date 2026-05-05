import React from "react";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const BulletDot = () => (
  <div
    style={{
      width: "4px",
      height: "4px",
      borderRadius: "50%",
      backgroundColor: "white",
      display: "inline-block",
      verticalAlign: "middle",
      marginRight: "5px",
      marginBottom: "2px"
    }}
  />
);

export default function TypeTooltip() {
  const { t } = useTranslation();

  const listArray = [
    { name: t("Text"), content: t("a combination of characters") },
    { name: t("Numeric"), content: t("a number") },
    {
      name: t("Boolean"),
      content: t("a binary value (e.g., true/false)")
    },
    {
      name: t("Binaryfile"),
      content: t("a binary code signal")
    },
    {
      name: t("DateTime/Duration"),
      content: t("a date and/or time, or a duration (e.g., YYYY-MM-DD, hh:mm:ss, PnYnMnD)")
    },
    {
      name: t("Array [attribute type]"),
      content: t("a structure holding several elements of the same data type")
    },
    {
      name: t("Child Schema"),
      content: t("a separate table containing any combination of the above")
    }
  ];

  const tooltipDisplay = listArray.map((item) => (
    <div key={item.name}>
      <BulletDot />
      <Typography variant="caption" sx={{ display: "inline", fontWeight: "bold" }}>
        {item.name}:
      </Typography>
      <Typography variant="caption">
        &nbsp;
        {item.content}
      </Typography>
    </div>
  ));

  return <div>{tooltipDisplay}</div>;
}
