import React, { useContext, useEffect, useMemo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Box, Typography } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import { classification } from '../constants/constants';
import { Context } from '../App';

const Classification = () => {
  const {
    divisionGroup,
    setDivisionGroup
  } = useContext(Context);

  const divisionsDropdown = useMemo(() => {
    return Object.keys(classification).map((division) => {
      return (
        <MenuItem key={division} value={division}>{division}</MenuItem>
      );
    });
  }, []);

  const groupsDropdown = useMemo(() => {
    return classification[divisionGroup.division].map((group) => {
      return (
        <MenuItem key={group} value={group}>{group}</MenuItem>
      );
    });
  }, [divisionGroup.division]);

  useEffect(() => {
    // Only change when the groups is not within the division
    if (!(classification[divisionGroup.division].includes(divisionGroup.group))) {
      setDivisionGroup(prev => ({
        ...prev,
        group: classification[prev.division][0],
      }));
    }
  }, [divisionGroup.division, setDivisionGroup]);

  return (
    <Box sx={{ textAlign: 'left', marginTop: '1rem', }}>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          margin: "0.5rem 0 0 0",
          width: "8rem",
          color: CustomPalette.BLACK,
        }}
      >Classification</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <FormControl variant="standard" sx={{ minWidth: 120, width: '45%' }}>
          <Typography variant="body2">Divisions</Typography>
          <Select
            value={divisionGroup.division}
            onChange={(e) => setDivisionGroup(prev => ({ ...prev, division: e.target.value }))}
            displayEmpty
          >
            {divisionsDropdown}
          </Select>
        </FormControl>
        <FormControl variant="standard" sx={{ minWidth: 120, width: '45%', marginBottom: '0.5rem' }}>
          <Typography variant="body2">Groups</Typography>
          <Select
            value={divisionGroup.group}
            onChange={(e) => setDivisionGroup(prev => ({ ...prev, group: e.target.value }))}
            displayEmpty
          >
            {groupsDropdown}
          </Select>
        </FormControl>
      </Box>
    </Box >
  );
};

export default Classification;