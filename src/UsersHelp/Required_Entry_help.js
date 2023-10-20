import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import HelpPageH3Title from '../components/HelpPageH3Title';
import TypographyTag from '../components/TypographyTag';


const RequiredEntryHelp = () => {
    return (
      <HelpPageContainer>
        <HelpPageH2Title text="Overlays - Required Entry" />
        <br />
        <HelpPageH3Title text = "Required Entry" />
        <TypographyTag>
        Required entries is an optional overlay for your schema where you can specify if the dataset the schema refers to must have an entry for the specific attribute.
        <br></br>
        <br></br>
        For example, if you insist that all records of the dataset require a value for attribute ‘name’ you would make ‘name’ required here. When the data is validated against your schema, any empty ‘name’ data records in the dataset could be flagged as invalid records and treated accordingly in the analysis..
        </TypographyTag>
      </HelpPageContainer>
    );
  };
  
  export default RequiredEntryHelp;