import React, { useContext, useEffect, useMemo } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Box, Tooltip, Typography } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import { classification } from '../constants/constants';
import { Context } from '../App';
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const Classification = () => {
  const {
    divisionGroup,
    setDivisionGroup
  } = useContext(Context);

  const divisionsDropdown = useMemo(() => {
    return Object.keys(classification).map((division) => {
      return (
        <MenuItem sx={{ height: '38px' }} key={division} value={division}>{division}</MenuItem>
      );
    });
  }, []);

  const groupsDropdown = useMemo(() => {
    return classification[divisionGroup.division].map((group) => {
      return (
        <MenuItem sx={{ height: '38px' }} key={group} value={group}>{group}</MenuItem>
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
    <Box sx={{ textAlign: 'left', marginBottom: '1rem', height: '5rem' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: "bold",
            textAlign: "left",
            width: "10rem",
            color: CustomPalette.BLACK,
          }}
        >Schema Classification</Typography>
        <Tooltip
          title="The list of attributes that were read from the column headers of the data file you selected at the beginning of schema creation."
          placement="right"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>

      </Box>
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