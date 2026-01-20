import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import { useMultiSchema } from "../context/MultiSchemaContext";

export default function Attributes() {
  const { getCurrentSchemaId, getAttributesList } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const attributesList = useMemo(
    () => getAttributesList(),
    [getAttributesList, currentSchemaId]
  );
  return (
    <Box sx={{ width: "100%", overflow: "auto", display: "flex" }}>
      {attributesList.map((value, index) => (
        <Box
          bgcolor={CustomPalette.RED_100}
          color={CustomPalette.PRIMARY}
          sx={{
            padding: "0.4rem 5rem 0.4rem 5rem",
            marginBottom: "1rem",
            marginRight: "0.2rem",
            boxShadow: `0px 0px 2px ${CustomPalette.SECONDARY} inset`,
            borderRadius: "0.1rem",
          }}
          key={index}
        >
          <Typography sx={{ fontWeight: "bold" }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
