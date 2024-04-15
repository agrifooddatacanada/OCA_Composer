import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { Box } from '@mui/material';
import HelpPageH3Title from '../components/HelpPageH3Title';
import TypographyTag from '../components/TypographyTag';
import SchemaDataset3 from '../assets/SchemaDatasetv3.png';

const LearnAboutSchemaRule = () => {
  return (
    <>
      <Header currentPage="Landing" />
      <Box sx={{ fontFamily: 'roboto', fontWeight: ' 400', fontSize: '1rem', textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
        <HelpPageH3Title text="Schemas and schema rules" />
        <br />
        <TypographyTag>
          The Semantic Engine is a set of tools helping researchers write more useful documentation about their data.
        </TypographyTag>
        <br />
        <TypographyTag>
          The Semantic Engine helps researchers write data schemas in both machine-readable and human-readable documents. A well-documented data schema helps you understand and use a dataset. A good schema will tell you what the column labels are and what they mean. It will tell you the units and it will tell you what type of data is in each column.
        </TypographyTag>
        <br />
        <img src={SchemaDataset3} alt="Schema Dataset" style={{ width: '100%' }} />
        <br />
        <TypographyTag>
          Schemas help ensure high quality because a schema can document the expected rules for a dataset.
        </TypographyTag>
        <br />
        <TypographyTag>
          With the Semantic Engine any schema can be extended to include as many rules for data as needed. Here is a list of some of the rules you can add to your dataset using the Semantic Engine with Overlay Capture Architecture (OCA).
        </TypographyTag>
        <br />
        <TypographyTag>
          <strong>DataType –</strong> one of the few requirements for an OCA schema, DataType specifies which DataType each attribute in a dataset contains: Text, Numeric, Boolean, Binary, DateTime or their corresponding arrays. An array value allows a data entry to contain multiple entries in a single field.
        </TypographyTag>
        <br />
        <TypographyTag>
          <strong>List (Entry Code) –</strong> the entry code rule lets the researcher define the list of acceptable entries for a specific attribute. When the dataset is verified against the entry code overlay it checks that the user hasn’t typed in unacceptable entries. If multiple entries are permitted, then the DataType for that attribute should be an array.
        </TypographyTag>
        <br />
        <TypographyTag>
          <strong>Mandatory (Conformance) –</strong> if an attribute is specified to be mandatory it means that for every data record the data field for that specific attribute cannot be left empty.
        </TypographyTag>
        <br />
        <TypographyTag>
          <strong>Cardinality –</strong> for array DataTypes, cardinality lets the user optionally specify the minimum and/or maximum number of elements in the array, or an exact number of elements. For example, you may want to write a rule that up to 5 elements are required for a specific attribute.
        </TypographyTag>
        <br />
        <TypographyTag>
          <strong>Character encoding –</strong> Verification of character encoding is currently not supported by the Data Entry Web tool. Character encoding is a system used in computing to represent characters, symbols, and text in a digital format. It assigns numerical codes (binary values) to each character, allowing computers to store, transmit, and process text data.
        </TypographyTag>
        <br />
        <TypographyTag>
          <strong>Format –</strong> the rules for the acceptable way the data should be formatted is described by the format overlay. Formats can require that dates are expressed in a YYYY-MM-DD format, or that numbers must be integers.
        </TypographyTag>
        <br />
        <TypographyTag>
          For data entry and verification, these rules are incorporated into the error checking process of a dataset. When you verify the dataset, you can see which data fields fail for one or more of the rules documented by the schema and you can correct them before proceeding with analysis.
        </TypographyTag>
      </Box>
      <Footer currentPage="Landing" />
    </>
  );
};

export default LearnAboutSchemaRule;