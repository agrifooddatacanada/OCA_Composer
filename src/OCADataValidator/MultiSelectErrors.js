import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Box } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import { useTranslation } from 'react-i18next';

const ITEM_HEIGHT = 30;
const ITEM_PADDING_TOP = 0;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 200,
    },
  },
};

const names = [
  'Format',
  'Entry Codes',
  'Character Encoding',
  'Data Type',
];

function getStyles(name, errorName, theme) {
  return {
    fontWeight:
      errorName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export default function MultipleSelectPlaceholder({ errorName, setErrorNameList, disabled }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setErrorNameList(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row',
    }}>
      <Box sx={{
        color: CustomPalette.PRIMARY,
        fontWeight: 'bold',
        alignSelf: 'center',
        textAlign: 'center',
      }}>{t('View only row with errors:')} &nbsp;&nbsp;</Box>
      <FormControl sx={{ width: 200 }} size="small" disabled={disabled}>
        <Select
          multiple
          displayEmpty
          value={errorName}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <em>{t('Select Errors')}</em>;
            }

            return selected.join(', ');
          }}
          MenuProps={MenuProps}
          inputProps={{ 'aria-label': 'Without label' }}
        >
          {names.map((name) => (
            <MenuItem
              key={name}
              value={name}
              style={getStyles(name, errorName, theme)}
            >
              {t(name)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}