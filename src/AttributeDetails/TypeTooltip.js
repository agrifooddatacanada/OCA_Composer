import React from "react";
import { Typography } from "@mui/material";

export default function TypeTooltip() {
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
    { name: "Text", content: "text" },
    { name: "Numeric", content: "numbers" },
    {
      name: "Boolean",
      content:
        "a data type where the data only has two possible variables: true or false",
    },
    {
      name: "Binary",
      content: "a data type that defines a binary code signal",
    },
    {
      name: "DateTime",
      content:
        "a data type that defines dates. Common formats include dates (e.g., YYYY-MM-DD), times (e.g., hh:mm:ss), dates and times concatenated (e.g., YYYY-MM-DDThh:mm:ss.sss+zz:zz), and durations (e.g., PnYnMnD)",
    },
    {
      name: "Array [attribute type]",
      content:
        "a data type that defines a structure that holds several data items or elements of the same data type",
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
