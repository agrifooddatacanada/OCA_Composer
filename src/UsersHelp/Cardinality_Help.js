import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';
import attrType from '../assets/attr_types.png';
import dataset from '../assets/dataset.png';
import entryCodes from '../assets/entry_codes.png';
import labelDescription from '../assets/label_description.png';
import range from '../assets/range.png';

const CardinalityHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Overlays – Cardinality" />
      <br />
      <TypographyTag>
        Cardinality refers to the number of occurrences of an element. For an OCA schema, the cardinality lets you define how many entries may be required for each attribute.
      </TypographyTag>
      <br />
      <TypographyTag>
        For example, if you allowed one and only one entry in a data record for an attribute, you would set an exact cardinality of one.
      </TypographyTag>
      <br />
      <TypographyTag >
        However, if you allow an array of entries for data (for example in a multi-selection of a questionnaire) you may wish to include cardinality.
      </TypographyTag>
      <br />
      <TypographyTag >
        For example, you are collecting survey data and have a question about what people’s favorite animals are. You want them to select between 3 and 5 animals from a list that you provide.
      </TypographyTag>
      <br />
      <TypographyTag >
        First you set the datatype to be an array. It will be numeric because you will use number codes for your animal choices.
      </TypographyTag>
      <br />
      <img src={attrType} alt="Attribute type table" />
      <br />
      <TypographyTag >
        You write your label to be your question and tell the user that they will need to pick between 3 and 5 animals in the description.
      </TypographyTag>
      <br />
      <img src={labelDescription} alt="Attribute Label Description table" />
      <br />
      <TypographyTag >
        You create an entry code table where numbers will be what is recorded in your data table, and you add English labels to each of your animals.
      </TypographyTag>
      <br />
      <img src={entryCodes} alt="Entry codes table" />
      <br />
      <TypographyTag >
        You would then add cardinality rules that a minimum of 3 and a maximum of 5 animals must be selected.
      </TypographyTag>
      <br />
      <img src={range} alt="Cardinality overlay page" />
      <br />
      <TypographyTag >
        For data entry, records will look like this (note that there is only one attribute in this example schema and so the data table will have only one column of data – not the world’s best survey!).
      </TypographyTag>
      <br />
      <img src={dataset} alt="Dataset" />
      <br />
      <TypographyTag >
        If you only wish to specify a maximum of 5 animals selected, you can leave the minimum blank. Alternatively, to have a minimum of 3 animals selected with no maximum you would leave the maximum blank.
      </TypographyTag>
      <br />
    </HelpPageContainer>
  );
};

export default CardinalityHelp;