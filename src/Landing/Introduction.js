import { Box, Link, Typography } from '@mui/material';
import React from 'react';


const Introduction = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', maxWidth: '100%', padding: '20px', color: 'white' }}>
  
      <iframe
        width="100%"
        height="315"
        src="https://www.youtube.com/embed/r8VIIBWmL_k"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
            
      <Typography sx={{ fontWeight: '500', fontSize: '1.8rem', textAlign: 'center', marginTop: '20px' }}>
        Schemas add value to data
      </Typography>
      <Typography sx={{ textAlign: 'center', color: '#e6e6e6' }}>
        Make your data more valuable with a data schema
      </Typography>
      <Box sx={{ textAlign: 'center', marginTop: '20px', fontSize: '1rem' }}>
        <Typography>New to Schemas? Watch our video and then</Typography>
        <Link href="https://agrifooddatacanada.ca/semantic-engine/" sx={{ fontSize: '1rem', fontWeight: '700', cursor: 'pointer', color: 'white', textDecoration: 'none' }}>
          Learn more →
        </Link>
      </Box>
      <Typography sx={{ textAlign: 'center', marginTop: '20px', fontSize: '1rem' }}>
        Follow our quick-start to begin writing your own data schemas.
      </Typography>
   
    </Box>
  );
};

export default Introduction;


// Changed the placement of the iframe so that it went in the requested order










