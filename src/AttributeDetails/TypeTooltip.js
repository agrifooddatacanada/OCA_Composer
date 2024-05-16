import React from "react";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function TypeTooltip() {
  const { t } = useTranslation();

  const BulletDot = () => {
    return (
      <div
        style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          backgroundColor: "white",
          display: "inline-block",
          verticalAlign: "middle",
          marginRight: "5px",
          marginBottom: "2px",
        }}
      />
    );
  };

  const listArray = [
    { name: t("Text"), content: t("text") },
    { name: t("Numeric"), content: t("numbers") },
    {
      name: t("Boolean"),
      content:
        t("a data type where the data only has two possible variables: true or false"),
    },
    {
      name: t("Binary"),
      content: t("a data type that defines a binary code signal"),
    },
    {
      name: t("DateTime"),
      content:
        t("a data type that defines dates. Common formats include dates ..."),
    },
    {
      name: t("Array [attribute type]"),
      content:
        t("a data type that defines a structure that holds several data items or elements of the same data type"),
    },
  ];

  const tooltipDisplay = listArray.map((item) => {
    return (
      <div sx={{ p: 0 }} key={item.name}>
        <BulletDot />
        <Typography
          variant="caption"
          sx={{ display: "inline", fontWeight: "bold" }}
        >
          {item.name}:
        </Typography>
        <Typography variant="caption">
          &nbsp;
          {item.content}
        </Typography>
      </div>
    );
  });

  return <div>{tooltipDisplay}</div>;
}
