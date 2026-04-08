import React from "react";
import { Box, Typography } from "@mui/material";
import { errorCode } from "../constants/constants";

const CustomTooltip = (props) => {
  const { data, colDef, api, color } = props;
  const error = data?.error?.[colDef.field] || [];
  const dataLength = api.getRenderedNodes().length;
  const onlyWarnings =
    error.length > 0 && error.every((e) => e?.type === errorCode.Warning);
  const issueLabel = onlyWarnings ? "Warning" : "Error";
  const backgroundColor = onlyWarnings ? "#fff9c4" : color || "#999";

  return dataLength > 4 && error.length > 0 ? (
    <Box
      className="custom-tooltip"
      style={{
        backgroundColor,
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        width: "100%",
        minWidth: "200px",
        maxWidth: "600px",
        maxHeight: "200px",
        overflow: "hidden"
      }}
    >
      <Typography
        sx={{
          marginBottom: "5px",
          fontWeight: "bold",
          fontSize: "18px",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
      >
        {issueLabel} ({error.length}):
      </Typography>
      {error.map((err, index) => (
        <Typography
          key={err.detail}
          style={{
            wordWrap: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "left"
          }}
        >
          {index + 1}. {err.detail}
        </Typography>
      ))}
    </Box>
  ) : dataLength > 0 && error.length > 0 ? (
    <Box
      className="custom-tooltip"
      style={{
        backgroundColor,
        borderRadius: "8px",
        padding: "5px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        width: "100%",
        minWidth: "200px",
        maxWidth: "600px",
        maxHeight: "200px",
        overflow: "hidden"
      }}
    >
      <Typography
        sx={{
          marginBottom: "5px",
          fontWeight: "bold",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: "14px"
        }}
      >
        {issueLabel} ({error.length}):{" "}
        <span
          style={{
            wordWrap: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: "normal"
          }}
        >
          {error[0].detail}
        </span>
      </Typography>
    </Box>
  ) : (
    <p />
  );
};

export default CustomTooltip;
