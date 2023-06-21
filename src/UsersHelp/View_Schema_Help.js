import { Box, Typography } from '@mui/material';
import React from 'react';
import CustomAnchorLink from '../components/CustomAnchorLink';

const ViewSchemaHelp = () => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
      <Typography variant="h2" component="h2" sx={{ fontWeight: 'normal' }}>
        View Schema
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        This is a summary of the schema you have been creating. You can tab through mutliple languages (if you have more than one) to see all the schema information for each language.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        To back and edit any of the entries use the back button to go through the schema writer and make your necessary changes.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        When you Finish and Export your schema you will be able to download the "Excel Template" version of the OCA Schema.
      </Typography>
      <br />
      <Typography variant="h2" component="h2" sx={{ fontWeight: 'normal' }}>
        Parsing the Generated Excel Template
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        The Excel template with the schema information can be parsed into a machine actionable, standard representation of the schema called <CustomAnchorLink link='https://oca.colossi.network/' text="Overlays Capture Architecture (OCA)" />.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        The <CustomAnchorLink link='https://www.semanticengine.org/#/' text="SemanticEngine.org" /> website is where you will find the <CustomAnchorLink link='https://www.semanticengine.org/#/develop' text="XLS to OCA Converter" /> which converts the Excel Template to the OCA Bundle.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        The OCA Bundle contains the Capture Base and associated Overlays as files bundled into an archival (.zip) format.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        You can open the archive and view the JSON code of the schema. The "meta.json" file lists is the most human readable and lists all Overlays and Capture Base including their SAID identifiers.
      </Typography>
      <br />
      <Typography variant="h2" component="h2" sx={{ fontWeight: 'normal' }}>
        More information about OCA
      </Typography>
      <br />
      <Typography variant="h3" component="h3">
        OCA is expressed in JSON
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        Overlays Capture Architecture is a machine-readable way to encode a schema expressed in the JSON scripting language. You can view the JSON file contents using a text editor such as Notepad in Windows but since JSON files do not usually contain line breaks it is easier to read using a <CustomAnchorLink link='https://jsonformatter.curiousconcept.com/' text="JSON viewer" /> or in the JSON viewer when you <CustomAnchorLink link='https://www.semanticengine.org/#/validate' text="validate your schema bundle" />.
      </Typography>
      <br />
      <Typography variant="h3" component="h3">
        Advantages of OCA
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        The advantage of OCA schemas is that they are modular. You can start with a very simple design, and because of the OCA layered architecture you can add more functionality to the schema later. The simplest OCA schema has a Capture Base (CB) which defines the basic structure of the data, and some additional overlays (OL) that help the user understand the data. OCA schemas are also shareable and machine-readable. You can publish your OCA schema with an identifier and others can reference and extend your work.
      </Typography>
    </Box>
  );
};

export default ViewSchemaHelp;