import { Box, Typography } from '@mui/material';
import React from 'react';

const AttributeDetailsHelp = () => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1rem' }}>
      <Typography variant="h2" component="h2">
        Attribute Details
      </Typography>
      <br />
      <Typography variant="body1">
        On the attribute details page you can edit properties of each attribute present in your schema.
      </Typography>
      <br />
      <Typography variant="h2" component="h2">
        Attribute Name
      </Typography>
      <br />
      <Typography variant="body1">
        You can edit each attribute name, and reorder the attributes.
      </Typography>
      <br />
      <Typography variant="h2" component="h2">
        Flagged
      </Typography>
      <br />
      <Typography variant="body1">
        Flagged attributes are where you can specify Flagged Attribute for sensitive data (e.g. names of people, government identification, birth date etc.). Marking an entry with a check will allow you to flag any attributes where identifying information about entities may be captured.
      </Typography>
      <br />
      <Typography variant="body1">
        Flagging an attribute acts as an alert to data users to treat the data as high-risk throughout the data lifecycle and encrypted or removed at any stage.
      </Typography>
      <br />
      <Typography variant="h2" component="h2">
        Unit
      </Typography>
      <br />
      <Typography variant="body1">
        Units are where you can describe the units for each attribute if needed.
      </Typography>
      <br />
      <Typography variant="h2" component="h2">
        Type
      </Typography>
      <br />
      <Typography variant="body1" component="li">
        Text: text, from single letter entries to fields of unstructured text.
      </Typography>
      <Typography variant="body1" component="li">
        Numeric: numbers
      </Typography>
      <Typography variant="body1" component="li">
        Reference: A SAID identifier
      </Typography>
      <Typography variant="body1" component="li">
        Boolean: a data type where the data only has two possible variables: true or false.
      </Typography>
      <Typography variant="body1" component="li">
        Binary: a data type that defines a binary code signal
      </Typography>
      <Typography variant="body1" component="li">
        DateTime: a data type that defines dates. Common formats include dates (e.g., YYYY-MM-DD), times (e.g., hh:mm:ss), dates and times concatenated (e.g., YYYY-MM-DDThh:mm:ss.sss+zz:zz), and durations (e.g., PnYnMnD).
      </Typography>
      <Typography variant="body1" component="li">
        Array [attribute type]: a data type that defines a structure that holds several data items or elements of the same data type.
      </Typography>
      <br />
      <Typography variant="h2" component="h2">
        List
      </Typography>
      <br />
      <Typography variant="body1">
        A list is a very useful feature that allows the schema author to limit the data that can be entered for a specific attribute. Select this option if you would like to create a list of acceptable entries that the user will be able to select from.
      </Typography>
      <br />
      <Typography variant="body1">
        It the user is able to select only one valid entry from the list (e.g. a list where the user will select the sample location), your data Type will be something suitable like "Text" or "Numeric". If you will allow multi-selection from the list (e.g. a list where the user can select all that apply) then your data Type is an Array.
      </Typography>
      <br />
    </Box>
  );
};

export default AttributeDetailsHelp;