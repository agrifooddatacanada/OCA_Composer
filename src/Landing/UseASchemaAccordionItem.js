import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import Drop from '../StartSchema/Drop';
import { Context } from '../App';
import { useNavigate } from 'react-router-dom';
import useGenerateReadMe from '../ViewSchema/useGenerateReadMe';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';

//Edit: import libraries
import { Validator, OCABox } from 'oca.js'; // Import oca.js modules
import unzip from 'unzipper'; // Import unzipper for extracting ZIP files


const UseASchemaAccordionItem = () => {
  const navigate = useNavigate();
  const { zipToReadme } = useContext(Context);
  const { toTextFile } = useGenerateReadMe();
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage,
  } = useHandleAllDrop();

  const navigateToMetadataPage = () => {
    setCurrentPage('Metadata');
    navigate('/start');
  };

  const navigateToViewPage = () => {
    setCurrentPage('View');
    navigate('/start');
  };

  const disableButtonCheck = rawFile.length === 0 || loading === true;

  // Function to handle schema validation
  const handleValidateSchema = () => {
    if (rawFile.length === 0 || loading) {
      return;
    }

    // Extract the contents of the ZIP file
    unzip.Open.file(rawFile).then((directory) => {
      // Convert the extracted directory to an OCA-compliant format
      const ocaData = { data: directory };

      // Create an OCA schema
      const oca = new OCABox(ocaData).generateBundle();

      // Create a validator
      const validator = new Validator();

      // Validate the OCA schema
      const validationResult = validator.validate(oca);

      if (validationResult.success) {
        alert('OCA schema is valid');
      } else {
        alert('OCA schema is invalid');
        console.error('Errors:', validationResult.errors);
      }
    });
  };


  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Use a Schema</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          When you have a .zip schema bundle you can upload and then:
        </Typography>
        <Typography>
          <strong>Validate</strong> the schema to ensure it is well-formed.
        </Typography>
        <Typography>
          <strong>View</strong> the schema and <strong>Edit</strong> the schema if needed.
        </Typography>
        <Typography>
          The .zip schema bundle is machine-readable; <strong>generate</strong> the Readme to create a human-readable simple text version.
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

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="navButton"
            onClick={handleValidateSchema}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            Validate Schema
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={navigateToViewPage}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            View Schema
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={navigateToMetadataPage}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            Edit Schema
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => toTextFile(zipToReadme)}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            Generate Readme
          </Button>
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaAccordionItem;