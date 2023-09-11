import { Box, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const Landing = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
      <Box>
        <Typography sx={{ color: CustomPalette.PRIMARY, fontWeight: '500', fontSize: '1.3rem', textAlign: "left" }}>
          Your data is valuable.
        </Typography>
        <Typography sx={{ textAlign: 'left' }}>
          Make that value accessible with a data schema.
        </Typography>
        <Typography sx={{ textAlign: 'left' }}>
          New to Schemas? Watch our video and then <em>Learn more-></em>
        </Typography>
        <Typography sx={{ textAlign: 'left' }}>
          Follow our quick-start to begin writing your own data schemas.
        </Typography>
      </Box>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/r8VIIBWmL_k" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Box>
  );
};

export default Landing;