import { Stack, Divider } from '@mui/material';
import React from 'react';
import logoUoG from '../assets/uog-logo.png';
import logoAgri from '../assets/agri-logo.png';
import logoSE from '../assets/se-logo.png';

export default function Footer({ currentPage }) {
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
          {(currentPage === 'Landing' || currentPage === "StartDataValidator") ?
            <>
              <img src={logoAgri} style={{ height: '80px' }} alt="Agri Logo" onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')} />
            </>
            : <>
              <img src={logoUoG} style={{ height: '60px' }} alt="University of Guelph Logo" onClick={() => (window.location.href = 'https://www.uoguelph.ca/')} />
              <img src={logoAgri} style={{ height: '60px' }} alt="Agri Logo" onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')} />
              <img src={logoSE} style={{ height: '60px' }} alt="Semantic Engine Logo" onClick={() => (window.location.href = '/')} />
            </>}
        </Stack>
      </Stack >
    </>
  );
};

