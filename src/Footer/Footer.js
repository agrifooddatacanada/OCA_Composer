import React, { useContext } from "react";
import { Stack, Divider, Typography } from "@mui/material";
import logoAgri from "../assets/agri-logo.png";
import { Context } from "../App";

export default function Footer() {
  const { currentTheme } = useContext(Context);
  const logos = currentTheme?.logos;
  return (
    <>
      <Divider orientation="horizontal" flexItem />
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="stretch"
        sx={{
          padding: "2rem",
          height: "100%"
        }}
      >
        <Stack direction="column" sx={{ gap: "0.5rem" }}>
          <div style={{ textAlign: "left" }}>
            <Typography sx={{ textAlign: "left" }}>Powered by</Typography>
            <a
              href="https://agrifooddatacanada.ca/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={logoAgri}
                style={{ width: "200px", cursor: "pointer", display: "inline-block" }}
                alt="Agri Logo"
              />
            </a>
          </div>

          <div>
            <Typography sx={{ textAlign: "left" }}>Supported by</Typography>
            {/* Dynamically render all supportedByLogos */}
            {Object.keys(logos || {})
              .filter((key) => key.startsWith("supportedByLogo"))
              .map((logoKey) => {
                const logo = logos[logoKey];
                return logo ? (
                  <img key={logoKey} src={logo.url} style={logo.style} alt={logo.alt} />
                ) : null;
              })}
          </div>
        </Stack>
      </Stack>
    </>
  );
}
