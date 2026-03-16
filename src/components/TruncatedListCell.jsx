import React from "react";
import { Box, Tooltip } from "@mui/material";

const TRUNCATE_THRESHOLD = 40;

const TruncatedListCell = ({ value }) => {
  const text = value || "";
  const showTooltip = text.length > TRUNCATE_THRESHOLD;

  const textContent = (
    <Box
      sx={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%",
        minWidth: 0,
        textAlign: "center",
        paddingLeft: 4,
        paddingRight: 4
      }}
    >
      {text}
    </Box>
  );

  const cellContent = (
    <Box
      component="span"
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0
      }}
    >
      {textContent}
    </Box>
  );

  const tooltipTarget = (
    <Box
      component="span"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {textContent}
    </Box>
  );

  return (
    <Box component="span" sx={{ position: "relative", width: "100%", height: "100%", display: "block" }}>
      {showTooltip ? (
        <Tooltip title={text} placement="top" arrow>
          {tooltipTarget}
        </Tooltip>
      ) : (
        cellContent
      )}
    </Box>
  );
};

export default TruncatedListCell;
