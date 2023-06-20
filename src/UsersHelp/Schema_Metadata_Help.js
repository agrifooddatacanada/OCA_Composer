import { Box, Link, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const SchemaMetadataHelp = () => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1rem' }}>
      <Typography variant="h2" component="h2">
        Schema Metadata
      </Typography>
      <br />
      <Typography variant="h3" component="h3">
        Attributes
      </Typography>
      <br />
      <Typography variant="body1">
        This list of attributes was generated either manually, or read from an uploaded dataset. If these attribute labels need to be changed you will be able to do this on the next pages.
      </Typography>
      <br />
      <Typography variant="h3" component="h3">
        Schema Description
      </Typography>
      <br />
      <Typography variant="body1" component="p">
        The OCA language for writing schemas lets users easily add multiple language support to their schemas. By default the schema begings with English language where you can add a schema title and description. The title and description should help anyone find and use your schema to help them understand how to interpret an associated dataset.
      </Typography>
      <br />
      <Typography variant="h3" component="h3">
        Adding a language
      </Typography>
      <br />
      <Typography variant="body1" component="p">
        Languages are referenced in the OCA schema by their <Link href='https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes' target="_blank" sx={{ color: CustomPalette.SECONDARY, textDecorationColor: CustomPalette.SECONDARY }}>2 letter ISO language code</Link>. You can add multiple languages to your schema by selecting the languages you want to support here.
      </Typography>
    </Box>
  );
};

export default SchemaMetadataHelp;