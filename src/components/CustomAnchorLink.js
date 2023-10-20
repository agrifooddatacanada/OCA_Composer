import { Link } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const CustomAnchorLink = ({ link, text, onClick, overrideStyle }) => {
  return (
    <Link href={link} target="_blank" sx={{ color: CustomPalette.SECONDARY, textDecorationColor: CustomPalette.SECONDARY, cursor: 'pointer', ...overrideStyle }} onClick={onClick}>
      {text}
    </Link>
  );
};

export default CustomAnchorLink;