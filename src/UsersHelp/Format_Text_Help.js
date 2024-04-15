import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';
import CustomAnchorLink from '../components/CustomAnchorLink';
import HelpPageH3Title from '../components/HelpPageH3Title';
import { Link } from '@mui/material';

const FormatTextHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Format Rules" />
      <br />
      <TypographyTag>
        When you have a dataset, you may have expectations on what kind of data should be entered for each attribute.
      </TypographyTag>
      <TypographyTag>
        The rules for what are acceptable data are called the format rules. In the semantic engine, users can select rules from a list for each of their datatypes.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Boolean" />
      <br />
      <TypographyTag>
        Boolean data is a data type that represents two possible values: true or false.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="DateTime" />
      <br />
      <TypographyTag>
        Select a DateTime format rule from the drop-down menu. It is preferred to use an ISO standard for your DateTime representation.
      </TypographyTag>
      <br />
      <TypographyTag>
        In the background, format rules for DateTime are expressed in the language of RegEx (regular expression), specifically the Rust RegEx flavour. It is not necessary for schema writers to understand RegEx but users can view the RegEx rules at the <CustomAnchorLink text="format_options GitHub repository" link="https://github.com/agrifooddatacanada/format_options" /> and request their own by raising an issue or emailing {' '}
        <Link
          to='#'
          onClick={(e) => {
            window.location.href = `mailto:adc@uoguelph.ca`;
            e.preventDefault();
          }}
        >
          adc@uoguelph.ca
        </Link>.
      </TypographyTag>

      <br />
      <HelpPageH3Title text="Numeric" />
      <br />
      <TypographyTag>
        Similar to DateTime, users can select a format rule from the drop-down menu. In the background the format rules are expressed in RegEx documented in GitHub.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Text" />
      <br />
      <TypographyTag>
        Similar to DateTime and Numeric, the format rules are selected from a drop-down list but expressed as RegEx and documented in the GitHub repository.
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Arrays" />
      <br />
      <TypographyTag>
        For data entries that are arrays the format rules apply to the individual elements of the array. For example, the format rule for a single text entry is the same format rule used for an array of the same text entries.
      </TypographyTag>
      <br />
      <TypographyTag>
        Overlays Capture Architecture does not specify the array separator that is required for arrays because different systems will have different representations for arrays. Our recommendation for Excel or .csv tabular data is to separate data with a semi-colon (;) symbol and to include text within double quotes (").
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default FormatTextHelp;;