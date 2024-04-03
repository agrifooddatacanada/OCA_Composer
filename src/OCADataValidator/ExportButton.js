import { Button, Menu, MenuItem } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const ExportButton = ({ handleSave }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        color="button"
        variant='contained'
        sx={{
          alignSelf: "flex-end",
          display: "flex",
          justifyContent: "space-around",
          padding: "0.5rem 1rem",
        }}
      // disabled={exportDisabled}
      >
        Export Validate Data
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem
          sx={{ color: CustomPalette.PRIMARY }}
          onClick={() => {
            handleClose();
            handleSave(true);
          }}
        >
          Keep original data column headers
        </MenuItem>
        <MenuItem
          sx={{ color: CustomPalette.PRIMARY }}
          onClick={() => {
            handleClose();
            handleSave(false);
          }}>
          Change to Schema column headers
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;