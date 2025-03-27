import React from "react";
import { Stack, Divider, Typography } from "@mui/material";
import ResearchExcellentFund from "../assets/research-excellent-fund.png";
import logoAgri from "../assets/agri-logo.png";

export default function Footer() {
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
          <div>
            <Typography sx={{ textAlign: "left" }}>Powered by</Typography>
            <a
              href="https://agrifooddatacanada.ca/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={logoAgri}
                style={{ width: "200px", cursor: "pointer" }}
                alt="Agri-food Data Canada"
              />
            </a>
          </div>

          <div>
            <Typography sx={{ textAlign: "left" }}>Supported by</Typography>
            <img
              src={ResearchExcellentFund}
              style={{ height: "120px" }}
              alt="University of Guelph Logo"
              // onClick={() => (window.location.href = 'https://www.uoguelph.ca/')}
            />
          </div>
        </Stack>
      </Stack>
    </>
  );
}
