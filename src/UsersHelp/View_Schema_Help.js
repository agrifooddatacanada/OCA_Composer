import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';
import HelpPageH3Title from '../components/HelpPageH3Title';

const ViewSchemaHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="View Schema" />
      <br />
      <TypographyTag>
        This is a summary of the schema you have been creating. You can tab through multiple languages (if you have more than one) to see all the schema information for each language.
      </TypographyTag>
      <br />
      <TypographyTag>
      To back and edit any of the entries use the back button to go through the schema writer and make your necessary changes.
      </TypographyTag>
      <br />
      <TypographyTag>
        When you Finish and Export your schema you will create two files. The first will be the machine-readable .zip version of your schema. The second will be the human-readable .txt version of your schema. We suggest you keep these two files together so that both machines and humans can understand your schema.
      </TypographyTag>
      <br />
      <HelpPageH2Title text="More information about OCA" />
      <br />
      <HelpPageH3Title text="OCA is expressed in JSON" />
      <br />
      <TypographyTag>
        Overlays Capture Architecture is a machine-readable way to encode a schema expressed in the JSON scripting language. You can view the JSON file contents (within the .zip file) using a text editor such as Notepad in Windows but since JSON files do not usually contain line breaks it is easier to read using a dedicated JSON viewer.      </TypographyTag>
      <br />
      <HelpPageH3Title text="Advantages of OCA" />
      <br />
      <TypographyTag>
        The advantage of OCA schemas is that they are modular. You can start with a very simple design, and because of the OCA layered architecture you can add more functionality to the schema later. The simplest OCA schema has a Capture Base (CB) which defines the basic structure of the data, and some additional overlays (OL) that help the user understand the data. OCA schemas are also shareable and machine-readable. You can publish your OCA schema with an identifier and others can reference and extend your work.      </TypographyTag>
    </HelpPageContainer>
  );
};

export default ViewSchemaHelp;