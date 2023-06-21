import React from 'react';
import CustomAnchorLink from '../components/CustomAnchorLink';
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
        This is a summary of the schema you have been creating. You can tab through mutliple languages (if you have more than one) to see all the schema information for each language.
      </TypographyTag>
      <br />
      <TypographyTag>
        To back and edit any of the entries use the back button to go through the schema writer and make your necessary changes.
      </TypographyTag>
      <br />
      <TypographyTag>
        When you Finish and Export your schema you will be able to download the "Excel Template" version of the OCA Schema.
      </TypographyTag>
      <br />
      <HelpPageH2Title text="Parsing the Generated Excel Template" />
      <br />
      <TypographyTag>
        The Excel template with the schema information can be parsed into a machine actionable, standard representation of the schema called <CustomAnchorLink link='https://oca.colossi.network/' text="Overlays Capture Architecture (OCA)" />.
      </TypographyTag>
      <br />
      <TypographyTag>
        The <CustomAnchorLink link='https://www.semanticengine.org/#/' text="SemanticEngine.org" /> website is where you will find the <CustomAnchorLink link='https://www.semanticengine.org/#/develop' text="XLS to OCA Converter" /> which converts the Excel Template to the OCA Bundle.
      </TypographyTag>
      <br />
      <TypographyTag>
        The OCA Bundle contains the Capture Base and associated Overlays as files bundled into an archival (.zip) format.
      </TypographyTag>
      <br />
      <TypographyTag>
        You can open the archive and view the JSON code of the schema. The "meta.json" file lists is the most human readable and lists all Overlays and Capture Base including their SAID identifiers.
      </TypographyTag>
      <br />
      <HelpPageH2Title text="More information about OCA" />
      <br />
      <HelpPageH3Title text="OCA is expressed in JSON" />
      <br />
      <TypographyTag>
        Overlays Capture Architecture is a machine-readable way to encode a schema expressed in the JSON scripting language. You can view the JSON file contents using a text editor such as Notepad in Windows but since JSON files do not usually contain line breaks it is easier to read using a <CustomAnchorLink link='https://jsonformatter.curiousconcept.com/' text="JSON viewer" /> or in the JSON viewer when you <CustomAnchorLink link='https://www.semanticengine.org/#/validate' text="validate your schema bundle" />.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Advantages of OCA" />
      <br />
      <TypographyTag>
        The advantage of OCA schemas is that they are modular. You can start with a very simple design, and because of the OCA layered architecture you can add more functionality to the schema later. The simplest OCA schema has a Capture Base (CB) which defines the basic structure of the data, and some additional overlays (OL) that help the user understand the data. OCA schemas are also shareable and machine-readable. You can publish your OCA schema with an identifier and others can reference and extend your work.
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default ViewSchemaHelp;