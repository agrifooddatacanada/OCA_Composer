import React, { useContext } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import logoAgri from "../assets/agri-logo.png";
import { Context } from "../App";

export default function Footer() {
  const { currentTheme } = useContext(Context);
  const logos = currentTheme?.logos;
  return (
    <Stack
      component="footer"
      sx={{ flexShrink: 0 }}
    >
      <Divider orientation="horizontal" flexItem />
      {/* Grid keeps the two labels on one row and the two logo groups on
          the row below, so "Powered by"/"Supported by" and their logos
          line up with each other instead of just stacking independently. */}
      <Box
        sx={{
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: "3rem",
          rowGap: "0.5rem",
          alignItems: "end"
        }}
      >
        <Typography sx={{ textAlign: "left", gridColumn: "1", gridRow: "1" }}>
          Powered by
        </Typography>
        <Typography sx={{ textAlign: "left", gridColumn: "2", gridRow: "1" }}>
          Supported by
        </Typography>

        <a
          href="https://agrifooddatacanada.ca/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ gridColumn: "1", gridRow: "2" }}
        >
          <img
            src={logoAgri}
            width={200}
            height={60}
            style={{ width: "200px", height: "auto", cursor: "pointer", display: "inline-block" }}
            alt="Agri Logo"
          />
        </a>

        {/* Dynamically render all supportedByLogos */}
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="flex-end"
          sx={{ gap: "1rem", gridColumn: "2", gridRow: "2" }}
        >
          {Object.keys(logos || {})
            .filter((key) => key.startsWith("supportedByLogo"))
            .map((logoKey) => {
              const logo = logos[logoKey];
              if (!logo) return null;
              return (
                <a
                  key={logoKey}
                  href={logo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={logo.url} style={logo.style} alt={logo.alt} />
                </a>
              );
            })}
        </Stack>
      </Box>
    </Stack>
  );
}
