import { Box, Link, Typography, useMediaQuery } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

const Introduction = () => {
  const isMobile = useMediaQuery('(max-width: 736px)');
  const { t } = useTranslation();

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
            marginTop: isMobile ? 'unset' : '35px',
          }}
        >
          {t('Schemas add value to data')}
        </Typography>
        <Typography
          sx={{ textAlign: isMobile ? 'center' : 'left', color: '#e6e6e6' }}
        >
          {t('Make your data more valuable with a data schema')}
        </Typography>
        <Box
          sx={{
            textAlign: isMobile ? 'center' : 'left',
            marginTop: isMobile ? '20px' : '40px',
            fontSize: '1.1rem',
          }}
        >
          <Typography>{t('New to Schemas? Watch our video and then')}</Typography>
          <Link
            href='https://agrifooddatacanada.ca/semantic-engine/'
            sx={{
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            {t('Learn more')}-{'>'}
          </Link>
        </Box>
        <Typography
          sx={{
            textAlign: isMobile ? 'center' : 'left',
            marginTop: isMobile ? '20px' : '40px',
            fontSize: '1.1rem',
          }}
        >
          {t('Follow our quick-start to begin writing your own data schemas')}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <iframe
          width={isMobile ? '98%' : '560'}
          height={isMobile ? '260' : '315'}
          src='https://www.youtube.com/embed/r8VIIBWmL_k'
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          allowFullScreen
        ></iframe>
      </Box>
    </Box>
  );
};

export default Introduction;
