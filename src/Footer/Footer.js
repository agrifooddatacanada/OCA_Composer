import { Stack } from '@mui/material';
import React from 'react';
import logoUoG from '../assets/uog-logo.png';
import logoAgri from '../assets/agri-logo.png';
import logoSE from '../assets/se-logo.png';

export default function Footer() {
  return (
    <Stack
      direction="row"
      justifyContent="end"
      sx={{
        width: "100%",
      }}
    >
      <Stack
        direction="row"
        sx={{
          flexDirection: "row",
          gap: "1.5rem",
          justifyContent: "space-between",
          padding: "2rem",
          cursor: 'pointer'
        }}

        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
      >
        <img src={logoUoG} style={{ height: '60px' }} alt="University of Guelph Logo" />
        <img src={logoAgri} style={{ height: '60px' }} alt="Agri Logo" />
        <img src={logoSE} style={{ height: '60px' }} alt="Semantic Engine Logo" />
      </Stack>
    </Stack >
  );
};

