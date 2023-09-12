import { Link } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const CustomAnchorLink = ({ link, text, overrideStyle }) => {
  return (
    <Link href={link} target="_blank" sx={{ color: CustomPalette.SECONDARY, textDecorationColor: CustomPalette.SECONDARY, ...overrideStyle }}>
      {text}
    </Link>
  );
};

export default CustomAnchorLink;