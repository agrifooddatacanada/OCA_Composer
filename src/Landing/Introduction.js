import { Box, Link, Typography } from '@mui/material';
import React from 'react';


const Introduction = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', maxWidth: '1500px', paddingRight: 5, paddingLeft: 5, gap: 10, color: 'white' }}>
      <Box>
        <Typography sx={{ fontWeight: '500', fontSize: '2.2rem', textAlign: "left", marginTop: '35px' }}>
          Schemas add value to data
        </Typography>
        <Typography sx={{ textAlign: 'left', color: '#e6e6e6' }}>
          Make your data more valuable with a data schema
        </Typography>
        <Box sx={{ textAlign: 'left', marginTop: '40px', fontSize: '1.1rem' }}>
          <Typography>New to Schemas? Watch our video and then</Typography>
          <Link href="https://agrifooddatacanada.ca/semantic-engine/" sx={{ fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', color: 'white', textDecoration: 'none' }}>Learn more-{'>'}</Link>
        </Box>
        <Typography sx={{ textAlign: 'left', marginTop: '40px', fontSize: '1.1rem' }}>
          Follow our quick-start to begin writing your own data schemas.
        </Typography>
      </Box>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/r8VIIBWmL_k" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </Box >
  );
};

export default Introduction;