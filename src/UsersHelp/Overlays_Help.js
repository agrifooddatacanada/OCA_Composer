import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';
import HelpPageH3Title from '../components/HelpPageH3Title';

const OverlaysHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Overlays - Adding Additional Optional Information" />
      <br />
      <TypographyTag>
        In Overlays Capture Architecture (OCA) you can add additional, optional features to your schema. This menu is where you can select what additional information you want to write for your schema. You can add, edit, and delete schema features.
        The following list includes the additional overlays that may be added manually to the schema.
        <br></br>
        <br></br>
        <HelpPageH3Title text='Overlays:' />
        <u1>
          <li><strong>Character Encoding: </strong> Document the character encoding of the data for each attribute.</li>
          <li><strong>Required Entries: </strong> Specify if the dataset has attributes where data is required.</li>
          <li><strong>Format Rules: </strong> Specify the formatting rule that applies to data for each attribute.</li>
          <li><strong>Cardinality: </strong> Specify the exact, minimum or maximum (or both minimum and maximum) number of entries allowed in a data record for each attribute.</li>

        </u1>
        <br></br>
        <br></br>
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default OverlaysHelp;