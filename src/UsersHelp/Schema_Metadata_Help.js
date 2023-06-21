import React from 'react';
import CustomAnchorLink from '../components/CustomAnchorLink';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import HelpPageH3Title from '../components/HelpPageH3Title';
import TypographyTag from '../components/TypographyTag';

const SchemaMetadataHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Schema Metadata" />
      <br />
      <HelpPageH3Title text="Attributes" />
      <br />
      <TypographyTag>
        This list of attributes was generated either manually, or read from an uploaded dataset. If these attribute labels need to be changed you will be able to do this on the next pages.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Schema Description" />
      <br />
      <TypographyTag>
        The OCA language for writing schemas lets users easily add multiple language support to their schemas. By default the schema begings with English language where you can add a schema title and description. The title and description should help anyone find and use your schema to help them understand how to interpret an associated dataset.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Adding a language" />
      <br />
      <TypographyTag>
        Languages are referenced in the OCA schema by their <CustomAnchorLink link='https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes' text="2 letter ISO language code" />. You can add multiple languages to your schema by selecting the languages you want to support here.
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default SchemaMetadataHelp;