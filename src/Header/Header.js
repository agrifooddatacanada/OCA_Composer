import React, { useState, useEffect } from 'react';
import { Typography, Tooltip, Button, Box } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import logo from '../assets/agri-logo.png';
import logoWhite from '../assets/agri-logo-white.png';
import { useLocation } from 'react-router-dom';
import HeaderWrapper from './HeaderWrapper';
import { useMediaQuery } from '@mui/material';

export default function Header({ currentPage }) {
  const [header, setHeader] = useState(currentPage);
  const [toolTipText, setToolTipText] = useState('');
  const [helpLink, setHelpLink] = useState('');
  const location = useLocation();
  // Detecting mobile screens with 'isMobile'
  const isMobile = useMediaQuery('(max-width:736px)');

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
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/SchemaMetadata/');
        break;
      case 'Details':
        setHeader('Attribute Details');
        setToolTipText(
          'Each column of your dataset is an attribute in your schema. Here you can add more details about each attribute to help people understand and use your dataset.'
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/AttributeDetails/');
        break;
      case 'Codes':
        setHeader('Add Entry Codes');
        setToolTipText(
          'Entry codes are options you want available to users as a list of choices for a specific attribute. For example, to limit gender entry to one of three choices you can use entry codes M, F, and X. Then for the English entries you can enter Male, Female and Other. If you have another language such as French, you could use Masculin, Féminin, and Autre as labels for the entry code.'
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/AddEntryCode/');
        break;
      case 'LanguageDetails':
        setHeader('Language Dependent Attribute Details');
        setToolTipText(
          'You can add details in each language to help users of your schema. By having languages separate from the underlying structure it means you can share your schema in multiple languages.'
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/LanguageAttribute/');
        break;
      case 'View':
        setHeader('Review Schema');
        setToolTipText(
          'Before finishing your schema you can preview the final contents on this page.'
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/ViewSchema/');
        break;
      case 'Overlays':
        setHeader('Add Additional Optional Information');
        // TODO: Add help tooltips
        setToolTipText('');
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/Overlays/');
        break;
      case 'CharacterEncoding':
        setHeader('Add Character Encoding');
        setToolTipText(
          'Character encoding of the data source (for each attribute). If you don’t know what the data source uses you can leave this blank. If you are creating a schema for new data a good choice would be UTF-8.'
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/CharacterEncoding/');
        break;
      case 'RequiredEntries':
        setHeader('Add Required Entries');
        setToolTipText(
          'Specify if the underlying data must have an entry for the specific attribute.'
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/RequiredEntry/');
        break;
      case 'FormatRules':
        setHeader('Add Format Rules for Data Entry');
        setToolTipText('Placeholder text');
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/FormatText/');
        break;
      case 'Cardinality':
        setHeader('Add Entry Limit Rules for Data Entry');
        setToolTipText(
          ''
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/Cardinality/');
        break;
      default:
        setHeader('');
        setHelpLink('');
    }
  }, [currentPage]);

  return (
    <HeaderWrapper
      isMobile={isMobile}
      headerColor={currentPage === 'Landing' && CustomPalette.PRIMARY}
      leftItem={
        <>
          {currentPage === 'Landing' ? (
            <Typography
              sx={{
                fontSize: isMobile ? 18 : 40,
                fontWeight: 'bold',
                color: 'white',
                alignSelf: 'center',
                cursor: 'pointer',
              }}
              onClick={() => (window.location.href = '/')}
            >
              Semantic Engine
            </Typography>
          ) : (
            <>
              <img
                src={logo}
                style={{
                  width: isMobile ? '100px' : '150px',
                  marginRight: '20px',
                  cursor: 'pointer',
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
          {currentPage === 'Landing' ? (
            <img
              src={logoWhite}
              style={{
                width: isMobile ? 'auto' : '250px',
                height: isMobile ? '70px' : 'auto',
                marginRight: isMobile ? 'unset' : '20px',
                cursor: 'pointer',
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
                    mr: 5,
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
              <Box sx={{ color: CustomPalette.PRIMARY }}>En</Box>
            </>
          )}
        </>
      }
    />
  );
}
