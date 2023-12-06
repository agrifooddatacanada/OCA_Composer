import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import HelpPageH3Title from '../components/HelpPageH3Title';
import TypographyTag from '../components/TypographyTag';
import CustomAnchorLink from '../components/CustomAnchorLink';

const AttributeDetailsHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Attribute Details" />

      <div style={{ textAlign: 'center' }}>
        <TypographyTag>
          On the attribute details page you can edit properties of each attribute present in your schema.
        </TypographyTag>
      </div>

      <br />
      <HelpPageH3Title text="Attribute Name" />
      
      <TypographyTag>
        You can edit each attribute name, and reorder the attributes.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Sensitive" />
    
      <TypographyTag>
        Sensitive attributes are where you can specify Sensitive Attribute for sensitive data (e.g. names of people, government identification, birth date etc.). Marking an entry with a check will allow you to flag any attributes where identifying information about entities may be captured.
      </TypographyTag>
      <br/>
      <TypographyTag type='li'>
        Flagging an attribute acts as an alert to data users to treat the data as high-risk throughout the data lifecycle and encrypted or removed at any stage.
      </TypographyTag>
      <TypographyTag type='li' >
        For help evaluating which attributes can be sensitive you can read advice in the <CustomAnchorLink link='https://docs.kantarainitiative.org/Blinding-Identity-Taxonomy-Report-Version-1.0.html' text="Blinding Identity Taxonomy" /> report by the Kantara Initiative.
      </TypographyTag>


      <br />
      <HelpPageH3Title text="Unit" />
      
      <TypographyTag>
        Units are where you can describe the units for each attribute if needed.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Type" />
      
        
      <TypographyTag type='li'>
        Text: text, from single letter entries to fields of unstructured text
      </TypographyTag>
      <TypographyTag type='li'>
        Numeric: numbers
      </TypographyTag>
      <TypographyTag type='li'>
        Reference: A SAID identifier
      </TypographyTag>
      <TypographyTag type='li'>
        Boolean: a data type where the data only has two possible variables: true or false
      </TypographyTag>
      <TypographyTag type='li'>
        Binary: a data type that defines a binary code signal
      </TypographyTag>
      <TypographyTag type='li'>
        DateTime: a data type that defines dates. Common formats include dates (e.g., YYYY-MM-DD),<br />
        &nbsp;&nbsp;&nbsp;times (e.g., hh:mm:ss), dates and times concatenated (e.g., YYYY-MM-DDThh:mm:ss.sss+zz:zz),<br />
        &nbsp;&nbsp;&nbsp;and durations (e.g., PnYnMnD)
      </TypographyTag>

      <TypographyTag type='li'>
        Array [attribute type]: a data type that defines a structure that holds several data items or elements of the same data type
      </TypographyTag>
      <br />
      <HelpPageH3Title text="List" />
      
      <TypographyTag>
        A list is a very useful feature that allows the schema author to limit the data that can be entered for a specific attribute. Select this option if you would like to create a list of acceptable entries that the user will be able to select from.
      </TypographyTag>
      <br />
      <TypographyTag>
        It the user is able to select only one valid entry from the list (e.g. a list where the user will select the sample location), your data Type will be something suitable like "Text" or "Numeric". If you will allow multi-selection from the list (e.g. a list where the user can select all that apply) then your data Type is an Array.
      </TypographyTag>
      <br />
      <iframe width="560" height="315" src="https://www.youtube.com/embed/T-Uzr3p41SM" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    </HelpPageContainer >
  );
};

export default AttributeDetailsHelp;