import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';

const StartSchemaHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Start Schema - Add attributes" />
      <br />
      <TypographyTag>
        Add your unique list of attribute names, also known as variable names or your data column labels within your dataset. Because this field may be used by many different computer systems we recommend to not include spaces and use under_scores or CamelCase instead. Other recommendations for good attribute names include:
      </TypographyTag>
      <br />
      <TypographyTag type="li">
        Set Maximum length to 32 characters
      </TypographyTag>
      <TypographyTag type="li">
        Always start variable names with a letter
      </TypographyTag>
      <TypographyTag type="li">
        Numbers can be used anywhere in the variable name AFTER the first character
      </TypographyTag>
      <TypographyTag type="li">
        Do not use blanks or spaces
      </TypographyTag>
      <br />
      <TypographyTag>
        Attribute names are recognized by different programs (machine readable) and so a good attribute name is one that won't cause problems downstream.
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default StartSchemaHelp;