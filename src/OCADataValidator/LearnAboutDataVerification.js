import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { Box } from '@mui/material';
import HelpPageH3Title from '../components/HelpPageH3Title';
import TypographyTag from '../components/TypographyTag';
import CustomAnchorLink from '../components/CustomAnchorLink';

const LearnAboutDataVerification = () => {
  return (
    <>
      <Header currentPage="Landing" />
      <Box sx={{ fontFamily: 'roboto', fontWeight: ' 400', fontSize: '1rem', textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
        <HelpPageH3Title text="Data Verification" />
        <br />
        <TypographyTag>
          Data verification asks, “Did we collect the data right”. This is different from data validation which asks, “Did we collect the right data”. Data validation is beyond the scope of the Semantic Engine and depends on the researcher evaluating if the data they have collected is sufficient to address their research question.
        </TypographyTag>
        <br />
        <TypographyTag>
          For data verification, we are asking if the data that we collected is consistent with the rules for the form the data should take. For example, if we insist that all the dates must be in the format YYYY-MM-DD, then we can verify the dataset and check that all the dates are indeed in that format. We might also insist on checking that all p-values are between 0 and 1, or that we are using consistent names for all the farms in the dataset.
        </TypographyTag>
        <br />
        <TypographyTag>
          These rules for a dataset are documented within the data schema and are used by the Data Entry and Verification tool to verify your dataset. You can use the <CustomAnchorLink link='https://semanticengine.org' text="Semantic Engine" /> to write a data schema and add rules that your dataset should conform to.
        </TypographyTag>

      </Box>
      <Footer currentPage="Landing" />
    </>
  );
};

export default LearnAboutDataVerification;