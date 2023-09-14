import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import { Box, Stack } from '@mui/material';

const HeaderWrapper = ({ headerColor, leftItem, rightItem }) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        // TODO: Need to remove this mb in the nav bar
        // mb: 2,
        pl: 4,
        pr: 4,
        borderBottom: headerColor ? 0 : 0.5,
        borderColor: headerColor || CustomPalette.GREY_300,
        backgroundColor: headerColor,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {leftItem}
      </Box>
      <Stack
        direction="row"
        sx={{
          width: 250,
          alignItems: "center",
          justifyContent: 'flex-end',
        }}
      >
        {rightItem}
      </Stack>
    </Stack >
  );
};

export default HeaderWrapper;