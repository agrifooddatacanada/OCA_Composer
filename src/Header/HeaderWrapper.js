import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import { Box, Stack } from '@mui/material';

const HeaderWrapper = ({ isMobile, headerColor, leftItem, rightItem, centerItem, centerItemInteractive = false }) => {
  return (
    <Stack
      direction='row'
      justifyContent='space-between'
      sx={{
        pl: isMobile ? 2 : 4,
        pr: isMobile ? 2 : 4,
        borderBottom: headerColor ? 0 : 0.5,
        borderColor: headerColor || CustomPalette.GREY_300,
        backgroundColor: headerColor,
        position: 'relative',
        zIndex: 1210
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>{leftItem}</Box>
      {centerItem && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: centerItemInteractive ? 'auto' : 'none',
          }}
        >
          {centerItem}
        </Box>
      )}
      <Stack
        direction='row'
        sx={{
          width: isMobile ? 'fit-content' : 300,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {rightItem}
      </Stack>
    </Stack>
  );
};

export default HeaderWrapper;
