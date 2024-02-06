import React from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box } from '@mui/material';


const OCADataValidatorCheck = () => {

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => { }} isForward pageForward={() => { }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        hi
      </Box>
    </>
  );
};

export default OCADataValidatorCheck;