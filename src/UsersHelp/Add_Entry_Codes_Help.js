import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';


const AddEntryCodesHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Add Entry Codes" />
      <br />
      <TypographyTag>
        For each attribute that you wanted to add entry codes for you will need to specify the code and any language-specific labels.
      </TypographyTag>
      <br />
      <TypographyTag>
        For example, in financial data entry systems there may be complex numerical codes that are recorded in the dataset. However, most people cannot remember the specific code numbers but they can remember the account name that is associated with the code. In this example the Entry Code is the numerical code that is expected in the dataset, but then you can give that numerical code an English (and other language) label to help users enter data.
      </TypographyTag>
      <br />
      <TypographyTag >
        Another example would be a species name where the specific Entry Code may be the latin genus/species name while the English label may be the common name.
      </TypographyTag>
      <br />
      <TypographyTag >
        If you don't need to have specific labels created for the Entry Codes (e.g. you create an Entry Code list of GO terms) you can copy the Entry Code into the language specific language columns.
      </TypographyTag>
      <br />
      <iframe width="560" height="315" src="https://www.youtube.com/embed/T-Uzr3p41SM" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </HelpPageContainer>
  );
};

export default AddEntryCodesHelp;