import React from 'react';
//import ResearchExcellentFund from '../assets/research-excellent-fund.png';
//import logoAgri from '../assets/agri-logo.png';
//import logoSE from '../assets/se-logo.png';
import { themes } from '../constants/themeConstants';
import { Stack, Divider, Box, Typography } from '@mui/material';

//export default function Footer({ currentPage }) {
export default function Footer({ theme = 'default' }) {
  const { logos } = themes[theme];
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
            {/* <img src={logoAgri} style={{ width: '200px', cursor: "pointer" }} alt="Agri Logo" onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')} /> */}
            <img 
              src={logos.agriFoodCanada_logo.url} 
              style={logos.agriFoodCanada_logo.style} 
              alt={logos.agriFoodCanada_logo.alt} 
              onClick={() => (window.location.href = logos.agriFoodCanada_logo.website)} 
            />
          </div>

          <div>
            <Typography sx={{ textAlign: 'left' }}>Supported by</Typography>
            {/* <img src={ResearchExcellentFund} style={{ height: '120px' }} alt="University of Guelph Logo" onClick={() => (window.location.href = 'https://www.uoguelph.ca/')} /> */}
            <img 
              src={logos.canadaFirst_logo.url} 
              style={logos.canadaFirst_logo.style} 
              alt={logos.canadaFirst_logo.alt} 
            />
          </div>
        </Stack>

      </Stack>
    </>
  );
}