import { Stack, Divider } from '@mui/material';
import React from 'react';
import logoUoG from '../assets/uog-logo.png';
import logoAgri from '../assets/agri-logo.png';
import logoSE from '../assets/se-logo.png';

export default function Footer() {
  return (
    <>
    <Divider orientation="horizontal" flexItem />
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
          gap: "2rem",
          justifyContent: "space-between",
          padding: "2rem",
          cursor: 'pointer'
        }}
      >
        <img src={logoUoG} style={{ height: '60px' }} alt="University of Guelph Logo" onClick={() => window.open('https://www.uoguelph.ca/', '_blank')} />
        <img src={logoAgri} style={{ height: '60px' }} alt="Agri Logo" onClick={() => window.open('https://agrifooddatacanada.ca/', '_blank')} />
        <img src={logoSE} style={{ height: '60px' }} alt="Semantic Engine Logo" onClick={() => window.open('https://www.semanticengine.org/#/', '_blank')} />
      </Stack>
    </Stack >
    </>
  );
};

