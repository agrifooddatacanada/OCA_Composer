import { Button } from '@mui/material';
import React from 'react';
import { generateDataEntry } from './generateDataEntry';
import { generateDataEntryV2 } from './generateDataEntryV2';
import { CustomPalette } from '../constants/customPalette';

const GenerateDataEntryExcel = ({ rawFile, setLoading, disableButtonCheck }) => {
  return (
    <Button
      variant='contained'
      color='navButton'
      onClick={() => {
        if (rawFile?.[0]?.type?.includes('zip')) {
          generateDataEntry(rawFile, setLoading);
        } else if (rawFile?.[0]?.type?.includes('json')) {
          generateDataEntryV2(rawFile, setLoading);
        }
      }}
      sx={{
        backgroundColor: CustomPalette.PRIMARY,
        ':hover': { backgroundColor: CustomPalette.SECONDARY },
        width: '100%',
        maxWidth: '300px',
        marginTop: '30px',
        marginBottom: '20px',
      }}
      disabled={disableButtonCheck}
    >
      Generate Data Entry Excel
    </Button>
  );
};

export default GenerateDataEntryExcel;