import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import TypographyTag from '../components/TypographyTag';
import CustomAnchorLink from '../components/CustomAnchorLink';
import HelpPageH3Title from '../components/HelpPageH3Title';

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
        The Semantic Engine and underlying OCA schema standard support the ISO standard for DateTime datatypes. <CustomAnchorLink link='https://www.iso.org/standard/40874.html' text="ISO 8601" /> specifies an international format of date and time data. You could find a summary of the standard by Markus Kuhn <CustomAnchorLink link='https://www.cl.cam.ac.uk/~mgk25/iso-time.html' text="here" />.
      </TypographyTag>
      <br />
      <TypographyTag>
        By ISO 8601, you could use the following representations:
      </TypographyTag>

      <TypographyTag type="li">YYYY for years, MM for months (in two digits, 01 through 12), and DD for days. Separated by a single dash (-) or nothing. </TypographyTag>
      <TypographyTag type="li">Www, the literal W and two-digit week number ww, could be used after the year instead. An optional following D represents the weekday number, from 1 through 7, beginning with Monday. Separated by a single dash (-) or nothing.</TypographyTag>
      <TypographyTag type="li">DDD, the ordinal date, could be used after the year instead. It is a three-digit number of days in a year from 001 through 365 or 366.</TypographyTag>
      <TypographyTag type="li">hh for hours, mm for minutes, and ss (or ss.sss for a certain number of decimal places) for seconds. The time is led by a literal T and separated by a single colon (:) or nothing.</TypographyTag>
      <TypographyTag type="li">Z for the time in UTC, or ±hh:mm ±hhmm ±hh for other time zones after the time representation.</TypographyTag>
      <TypographyTag type="li">PnYnMnDTnHnMnS, PnW, or P&#60;date&#62;T&#62;time&#62;, with all capital letters being literals and all n's being numbers, could be used to represent durations.</TypographyTag>
      <TypographyTag type="li">&#60;start&#62;/&#60;end&#62;, &#60;start&#62;/&#60;duration&#62;, &#60;duration&#62;/&#60;end&#62;, or &#60;duration&#62; could be used to represent time intervals.</TypographyTag>
      <TypographyTag type="li">Rn/&#60;interval&#62; or R/&#60;interval&#62;, with n for the number of repetitions, could be used to represent repeated intervals.</TypographyTag>

      <br />
      <TypographyTag>
        The following are some ISO 8601 DateTime examples
      </TypographyTag>
      <br></br>
      <table border='1'>
        <thead>
          <tr>
            <th>Type</th>
            <th>ISO 8601 Format</th>
            <th>Example of a DateTime Allowed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>date (year, month, and day)</td>
            <td>YYYY-MM-DD</td>
            <td>2001-02-03</td>
          </tr>
          <tr>
            <td>date (year and month)</td>
            <td>YYYY-MM</td>
            <td>2001-02</td>
          </tr>
          <tr>
            <td>date (year, month, and day), basic format</td>
            <td>YYYYMMDD</td>
            <td>20010203</td>
          </tr>
          <tr>
            <td>date (year, month, and day) and time</td>
            <td>YYYY-MM-DDThh:mm:ss.sss</td>
            <td>2001-02-03T04:00:00</td>
          </tr>
          <tr>
            <td>date (year, month, and day) and time, in UTC</td>
            <td>YYYY-MM-DDThh:mm:ss.sssZ</td>
            <td>2001-02-03T04:00:00Z</td>
          </tr>
          <tr>
            <td>time, with time zone offset (in hours)</td>
            <td>Thh:mm:ss.sss±hh</td>
            <td>T04:00:00-05</td>
          </tr>
          <tr>
            <td>durations (in years, months, days, and hours)</td>
            <td>PnYnMnDTnH</td>
            <td>P1Y2M3DT4H</td>
          </tr>
        </tbody>
      </table>
      <br />
      <HelpPageH3Title text="Numeric" />
      <br />
      <TypographyTag>
        The format rules for numbers are expressed in the language of RegEx (regular expression). A regular expression, or shortened as "RegEx", is a powerful way to search and filter strings. You could build a search pattern using character literals, operators, or constructs to match specific types of characters in a string. The OCA uses the Rust regex flavour, with the full documentation that could be found <CustomAnchorLink link='https://www.cl.cam.ac.uk/~mgk25/iso-time.html' text="here" />.
      </TypographyTag>
      <br />
      <TypographyTag>
        It is not necessary for schema creators to understand RegEx as the Semantic Engine provides a list of common RegEx rules to select from. If you want to add a rule to the list contact us at adc@uoguelph.ca
      </TypographyTag>
      <br />
      <HelpPageH3Title text="Text" />
      <br />
      <TypographyTag>
        Similar to the Numeric datatype, the format rules for text are expressed as regular expressions. And similar to Numeric, the Semantic Engine provides a list of common RegEx rules to select from.
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