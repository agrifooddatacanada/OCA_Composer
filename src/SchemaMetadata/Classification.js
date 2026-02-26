import React, { useContext, useEffect, useMemo } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Box, Tooltip, Typography } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import { classification, parseClassificationCode, groupCodes, divisionCodes } from '../constants/constants';
import { Context } from '../App';
import { useMultiSchema } from '../schema/schemaContext';
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from 'react-i18next';

const Classification = () => {
  const { t } = useTranslation();
  const { divisionGroup, setDivisionGroup } = useContext(Context);
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();

  // Initialize divisionGroup from schema metadata on mount
  useEffect(() => {
    const classificationCode = schemaState?.metadata?.classification;
    if (classificationCode) {
      const parsed = parseClassificationCode(classificationCode);
      if (parsed && (divisionGroup.division !== parsed.division || divisionGroup.group !== parsed.group)) {
        setDivisionGroup(parsed);
      }
    }
  }, [schemaState?.metadata?.classification]);

  // Update schema metadata when divisionGroup changes
  useEffect(() => {
    if (divisionGroup.division) {
      // Prefer group code if group is selected, otherwise use division code
      const code = (divisionGroup.group && groupCodes[divisionGroup.group]) || 
                   divisionCodes[divisionGroup.division];
      
      const st = getSchema() || {};
      const prevMeta = st.metadata || {};
      
      if (code && prevMeta.classification !== code) {
        updateSchema({
          metadata: {
            ...prevMeta,
            classification: code
          }
        });
      }
    }
  }, [divisionGroup.division, divisionGroup.group]);

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

  return (
    <Box sx={{ textAlign: 'left', marginBottom: '1rem', height: '5rem' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: "bold",
            textAlign: "left",
            width: "12rem",
            color: CustomPalette.BLACK,
          }}
        >{t('Schema Classification')}</Typography>
        <Tooltip
          title={t("Select the division and group that best reflects how you would classify your schema")}
          placement="right"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <FormControl variant="standard" sx={{ minWidth: 120, width: '45%' }}>
          <Typography variant="body2">{t('Divisions')}</Typography>
          <Select
            value={divisionGroup.division}
            onChange={(e) => setDivisionGroup(prev => ({ ...prev, division: e.target.value }))}
            displayEmpty
          >
            {divisionsDropdown}
          </Select>
        </FormControl>
        <FormControl variant="standard" sx={{ minWidth: 120, width: '45%', marginBottom: '0.5rem' }}>
          <Typography variant="body2">{t('Groups')}</Typography>
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