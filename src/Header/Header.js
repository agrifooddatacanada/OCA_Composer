import React, { useState, useEffect } from 'react';
import { Typography, Tooltip, Button, Box, MenuItem, Menu, Fade } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import logo from '../assets/agri-logo.png';
import logoWhite from '../assets/agri-logo-white.png';
import { Link, useLocation } from 'react-router-dom';
import HeaderWrapper from './HeaderWrapper';
import { useMediaQuery } from '@mui/material';
import i18next from 'i18next';

export default function Header({ currentPage }) {
  const [header, setHeader] = useState(currentPage);
  const [toolTipText, setToolTipText] = useState('');
  const [helpLink, setHelpLink] = useState('');
  const location = useLocation();
  // Detecting mobile screens with 'isMobile'
  const isMobile = useMediaQuery('(max-width:736px)');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    setSelectedLanguage(i18next.language);
  }, []);

  const changeLanguage = (event) => {
    const lng = event.target.value;
    setSelectedLanguage(lng);
    i18next.changeLanguage(lng);
  };

  //Sets headers and tooltip Text based on current page
  useEffect(() => {
    switch (currentPage) {
      case 'Start':
        setHeader('Start Creating an OCA Schema');
        setToolTipText('');
        setHelpLink('https://agrifooddatacanada.ca/semantic-engine/');
        break;
      case 'Metadata':
        setHeader('Schema Metadata');
        setToolTipText(
          'This page is where you can write the metadata describing the schema you are writing. Metadata helps people find, understand, and use your schema. If you name and describe your schema descriptions in general terms, it will be easier for you and others to reuse the schema for different datasets. This will help with ensuring your data is more interoperable.'
        );
        setHelpLink('/schema_metadata_help');
        break;
      case 'Details':
        setHeader('Attribute Details');
        setToolTipText(
          'Each column of your dataset is an attribute in your schema. Here you can add more details about each attribute to help people understand and use your dataset.'
        );
        setHelpLink('/attribute_details_help');
        break;
      case 'Codes':
        setHeader('Add Entry Codes');
        setToolTipText(
          'Entry codes are options you want available to users as a list of choices for a specific attribute. For example, to limit gender entry to one of three choices you can use entry codes M, F, and X. Then for the English entries you can enter Male, Female and Other. If you have another language such as French, you could use Masculin, Féminin, and Autre as labels for the entry code.'
        );
        setHelpLink('/add_entry_codes_help');
        break;
      case 'LanguageDetails':
        setHeader('Language Dependent Attribute Details');
        setToolTipText(
          'You can add details in each language to help users of your schema. By having languages separate from the underlying structure it means you can share your schema in multiple languages.'
        );
        setHelpLink('/language_attribute_help');
        break;
      case 'View':
        setHeader('Review Schema');
        setToolTipText(
          'Before finishing your schema you can preview the final contents on this page.'
        );
        setHelpLink('/view_schema_help');
        break;
      case 'Overlays':
        setHeader('Add Additional Optional Information');
        // TODO: Add help tooltips
        setToolTipText('');
        setHelpLink('/overlays_help');
        break;
      case 'CharacterEncoding':
        setHeader('Add Character Encoding');
        setToolTipText(
          'Character encoding of the data source (for each attribute). If you don’t know what the data source uses you can leave this blank. If you are creating a schema for new data a good choice would be UTF-8.'
        );
        setHelpLink('/character_encoding_help');
        break;
      case 'RequiredEntries':
        setHeader('Add Required Entries');
        setToolTipText(
          'Specify if the underlying data must have an entry for the specific attribute.'
        );
        setHelpLink('/required_entry_help');
        break;
      case 'FormatRules':
        setHeader('Add Format Rules for Data Entry');
        setToolTipText('Placeholder text');
        setHelpLink('/format_text_help');
        break;
      case 'Cardinality':
        setHeader('Add Entry Limit Rules for Data Entry');
        setToolTipText(
          ''
        );
        setHelpLink('');
        break;
      case 'StartDataValidator':
        setHeader('Upload Schema and Dataset');
        setToolTipText(
          ''
        );
        setHelpLink('');
        break;
      case 'SchemaViewDataValidator':
        setHeader('Preview Schema');
        setToolTipText(
          ''
        );
        setHelpLink('');
        break;
      case 'DatasetViewDataValidator':
        setHeader('Preview Dataset');
        setToolTipText(
          ''
        );
        setHelpLink('');
        break;
      case 'AttributeMatchDataValidator':
        setHeader('Matching Attributes');
        setToolTipText(
          ''
        );
        setHelpLink('');
        break;
      case 'OCADataValidatorCheck':
        setHeader('Data Verifier');
        setToolTipText(
          ''
        );
        setHelpLink('/cardinality_help');
        break;
      default:
        setHeader('');
        setHelpLink('');
    }
  }, [currentPage]);

  return (
    <HeaderWrapper
      isMobile={isMobile}
      headerColor={(currentPage === 'Landing' || currentPage === "StartDataValidator") && CustomPalette.PRIMARY}
      leftItem={
        <>
          {(currentPage === 'Landing' || currentPage === "StartDataValidator") ? (
            <Box sx={{ flex: 'column' }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Typography
                  sx={{
                    fontSize: isMobile ? 18 : 40,
                    fontWeight: 'bold',
                    color: 'white',
                    alignSelf: 'start',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  Semantic Engine
                </Typography>
              </Link>
              {currentPage === "StartDataValidator" && <Typography variant="h5" sx={{ textAlign: 'left', color: "white", marginTop: '-5px' }}>Data entry and verification</Typography>}
            </Box>
          ) : (
            <>
              <img
                src={logo}
                style={{
                  width: isMobile ? '100px' : '150px',
                  marginRight: '20px',
                  cursor: 'pointer'
                }}
                alt='Logo'
                onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')}
              />
              <Typography
                sx={{
                  fontSize: 25,
                  fontWeight: 'bold',
                  color: CustomPalette.PRIMARY,
                  alignSelf: 'center',
                }}
              >
                {header}
              </Typography>
              {toolTipText.length > 0 && (
                <Box sx={{ marginLeft: 2, color: CustomPalette.GREY_600 }}>
                  <Tooltip
                    title={toolTipText}
                    placement={
                      header === 'Attribute Details' || header === 'View Schema'
                        ? 'right'
                        : 'right-start'
                    }
                    arrow
                  >
                    <HelpOutlineIcon sx={{ fontSize: 15 }} />
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </>
      }
      rightItem={
        <>
          {(currentPage === 'Landing' || currentPage === "StartDataValidator") ? (
            <img
              src={logoWhite}
              style={{
                width: isMobile ? 'auto' : '250px',
                height: isMobile ? '70px' : 'auto',
                marginRight: isMobile ? 'unset' : '20px',
                cursor: 'pointer' // Add cursor pointer to indicate it's clickable
              }}
              alt='Logo'
              onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')}
            />
          ) : (
            <>
              {!location.pathname.includes('_help') && helpLink !== '' && (
                <Button
                  color='button'
                  variant='contained'
                  target='_blank'
                  sx={{
                    m: 2,
                    mr: 2,
                    p: 1,
                    width: '15rem',
                  }}
                  onClick={() =>
                    window.open(
                      `${helpLink}`,
                      '_blank',
                      'rel=noopener noreferrer'
                    )
                  }
                >
                  Help with this page
                </Button>
              )}
              {/* <Box sx={{ color: CustomPalette.PRIMARY }}>En</Box> */}
              <div>
                <select id="language-select" style={{ border: 'none', fontSize: '20px', color: CustomPalette.PRIMARY }} value={selectedLanguage} onChange={changeLanguage}>
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                </select>
              </div>
            </>
          )}
        </>
      }
    />
  );
}
