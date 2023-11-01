
import { Box, Link, Typography, useMediaQuery } from '@mui/material';
import React from 'react';

const Introduction = () => {

  const isMobile = useMediaQuery('(max-width: 736px)'); // Adjust the screen width as needed
  const width = isMobile ? "500" : "800";

  const isMobile = useMediaQuery('(max-width: 767px)'); // Adjust the screen width as needed
import { Box, Link, Typography, useMediaQuery } from '@mui/material';
import React from 'react';

const Introduction = () => {
  const isMobile = useMediaQuery('(max-width: 736px)'); // Adjust the screen width as needed
  const width = isMobile ? "500" : "800";


  return (
    <Box
      sx={{
        display: 'flex',

        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-around',
        maxWidth: '1500px',
        paddingRight: 2,
        paddingLeft: 2,
        gap: 10,
        color: 'white',
      }}
    >
      <Box sx={{ width: isMobile ? '100%' : '50%' }}>
        <Typography
          sx={{
            fontWeight: '500',
            fontSize: isMobile ? '2rem' : '2.2rem',
            textAlign: isMobile ? 'center' : 'left',
            marginTop: isMobile ? '20px' : '35px',
          }}
        >
          Schemas add value to data
        </Typography>
        <Typography sx={{ textAlign: isMobile ? 'center' : 'left', color: '#e6e6e6' }}>
          Make your data more valuable with a data schema
        </Typography>
        <Box sx={{ textAlign: isMobile ? 'center' : 'left', marginTop: isMobile ? '20px' : '40px', fontSize: '1.1rem' }}>
          <Typography>New to Schemas? Watch our video and then</Typography>
          <Link
            href="https://agrifooddatacanada.ca/semantic-engine/"
            sx={{ fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', color: 'white', textDecoration: 'none' }}
          >
            Learn more-{'>'}
          </Link>
        </Box>
        <Typography
          sx={{
            textAlign: isMobile ? 'center' : 'left',
            marginTop: isMobile ? '20px' : '40px',
            fontSize: '1.1rem',
          }}
        >
          Follow our quick-start to begin writing your own data schemas.
        </Typography>
      </Box>
      <iframe
        width = {width}
        height="315"
        src="https://www.youtube.com/embed/r8VIIBWmL_k"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>

        flexDirection: isMobile ? 'column' : 'row', // Column on mobile, row on desktop
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '100%',
        padding: '20px',
        color: 'white',
      }}
    >
      <Box sx={{ width: '50%' }}>
        <Typography sx={{ fontWeight: '500', fontSize: '1.8rem', textAlign: 'center', marginTop: '20px' }}>
          Schemas add value to data
        </Typography>
        <Typography sx={{ textAlign: 'center', color: '#e6e6e6' }}>
          Make your data more valuable with a data schema
        </Typography>
        <Box sx={{ textAlign: 'center', marginTop: '20px', fontSize: '1rem' }}>
          <Typography>New to Schemas? Watch our video and then</Typography>
          <Link
            href="https://agrifooddatacanada.ca/semantic-engine/"
            sx={{ fontSize: '1rem', fontWeight: '700', cursor: 'pointer', color: 'white', textDecoration: 'none' }}
          >
            Learn more →
          </Link>
        </Box>
        <Typography sx={{ textAlign: 'center', marginTop: '20px', fontSize: '1rem' }}>
          Follow our quick-start to begin writing your own data schemas.
        </Typography>
      </Box>
      <Box sx={{ width: '50%', margin: isMobile ? '20px 0' : '0 20px' }}>
        <iframe
          width="100%"
          height="315"
          src="https://www.youtube.com/embed/r8VIIBWmL_k"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </Box>

    </Box>
  );
};

export default Introduction;









