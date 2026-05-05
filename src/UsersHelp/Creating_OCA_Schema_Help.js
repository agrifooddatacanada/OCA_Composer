import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';


const CreatingOCASchemaHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Creating schema help with this page" />
      <br />
      <TypographyTag>
        If you already have a dataset in an Excel or .csv file, you can drag and drop this file onto the main page box. You will not be uploading any data. Instead, the local version of this website will read the file and extract headers (assuming they are the first row). These headers become automatically added as attributes to the schema you are creating.
      </TypographyTag>
      <br />
      <TypographyTag>
        Alternatively, you may create your schema manually, where you will need to write in each attribute name through the user interface.
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default CreatingOCASchemaHelp;