import { Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const CustomRouterLink = ({ to, text, onClick, overrideStyle }) => {
  return (
    <Link component={RouterLink} to={to} target='_blank' sx={{ color: CustomPalette.SECONDARY, textDecorationColor: CustomPalette.SECONDARY, cursor: 'pointer', ...overrideStyle }} onClick={onClick}>
      {text}
    </Link>
  );
};

export default CustomRouterLink;