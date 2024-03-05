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
        console.log('onClick');
        console.log('rawFile', rawFile);
        console.log('rawFile?.[0]', rawFile?.[0]);
        console.log('rawFile?.[0]?.type', rawFile?.[0]?.type);
        if (rawFile?.[0]?.type === 'application/json') {
          generateDataEntryV2(rawFile, setLoading);
        } else {
          console.log('generateDataEntry zip');
          generateDataEntry(rawFile, setLoading);
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