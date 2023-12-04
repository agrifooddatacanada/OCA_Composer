import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';
import Drop from '../StartSchema/Drop';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';
import { generateDataEntryV2 } from './generateDataEntryV2';

const UseASchemaWithDataAccordionItem = ({ disableButtonCheck, handleExport }) => {
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
  } = useHandleAllDrop();

  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Use a Schema with Data</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          With your machine-readable .json schema bundle you can begin to use it in your workflows.
        </Typography>
        <Typography sx={{ marginTop: '20px' }}>
          For example, using a schema as a template, generate an Excel sheet prepared for data entry. Or if you have a  python workflow you can incorporate data validation using data rules of the schema.
        </Typography>

        <Drop
          setFile={setRawFile}
          setLoading={setLoading}
          loading={loading}
          dropDisabled={dropDisabled}
          dropMessage={dropMessage}
          setDropMessage={setDropMessage}
          version={1}
        />

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => generateDataEntryV2(rawFile, setLoading)}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '20px', marginBottom: '20px' }}
            disabled={disableButtonCheck}
          >
            Generate Data Entry Excel
          </Button>
          <CustomAnchorLink link='https://github.com/agrifooddatacanada/OCA_data_set_validator' text="Validate data against a schema" overrideStyle={{ marginTop: 2 }} />
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaWithDataAccordionItem;