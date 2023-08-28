import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';

const OverlaysHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Overlays" />
      <br />
      <TypographyTag>
        Help Page for Overlays.
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default OverlaysHelp;