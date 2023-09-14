import { Box, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const Introduction = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', maxWidth: '1500px', paddingRight: 5, paddingLeft: 5, gap: 10 }}>
      <Box>
        <Typography sx={{ fontWeight: '500', fontSize: '1.3rem', textAlign: "left", marginTop: '35px' }}>
          Your data is valuable.
        </Typography>
        <Typography sx={{ textAlign: 'left', marginTop: '35px' }}>
          Make that value accessible with a data schema.
        </Typography>
        <Box sx={{ textAlign: 'left', marginTop: '20px' }}>
          New to Schemas? Watch our video and then <Typography onClick={() => console.log('Learn more')} sx={{ color: CustomPalette.PRIMARY, fontWeight: '700', cursor: 'pointer' }}>Learn more-{'>'}</Typography>
        </Box>
        <Typography sx={{ textAlign: 'left', marginTop: '20px' }}>
          Follow our quick-start to begin writing your own data schemas.
        </Typography>
      </Box>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/r8VIIBWmL_k" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Box >
  );
};

export default Introduction;