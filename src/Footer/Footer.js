import { Stack, Divider, Box, Typography } from '@mui/material';
import React from 'react';
import ResearchExcellentFund from '../assets/research-excellent-fund.png';
import logoAgri from '../assets/agri-logo.png';
import logoSE from '../assets/se-logo.png';

export default function Footer({ currentPage }) {
  return (
    <>
      <Divider orientation="horizontal" flexItem />
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="stretch"
        sx={{
          padding: "2rem",
          height: '100%'
        }}
      >
        <Stack
          direction="column"
          sx={{ gap: '0.5rem' }}
        >
          <div>
            <Typography sx={{ textAlign: 'left' }}>Powered by</Typography>
            <img src={logoAgri} style={{ height: '60px' }} alt="Agri Logo" onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')} />
          </div>

          <div>
            <Typography sx={{ textAlign: 'left' }}>Supported by</Typography>
            <img src={ResearchExcellentFund} style={{ height: '80px' }} alt="University of Guelph Logo" onClick={() => (window.location.href = 'https://www.uoguelph.ca/')} />
          </div>
        </Stack>
        <Box sx={{ width: '130px' }}>
          <img src={logoSE} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: 'contain' }} alt="Semantic Engine Logo" onClick={() => (window.location.href = '/')} />
        </Box>
      </Stack>
    </>
  );
};

