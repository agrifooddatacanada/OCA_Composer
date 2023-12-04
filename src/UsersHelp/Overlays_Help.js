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
        <HelpPageH3Title text = 'Overlays:' />
        <u1>
          <li>Character Encoding</li>
          <li>Make Required Entries</li>
          <li>Cardinality</li>
          
        </u1>
        <br></br>
        <br></br>
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default OverlaysHelp;