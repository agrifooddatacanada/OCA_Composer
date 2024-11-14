import React, { useState, useEffect } from 'react';
import { Typography, Tooltip, Button, Box } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import logo from '../assets/agri-logo.png';
import logoWhite from '../assets/agri-logo-white.png';
import { Link, useLocation } from 'react-router-dom';
import HeaderWrapper from './HeaderWrapper';
import { useMediaQuery } from '@mui/material';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

export default function Header({ currentPage }) {
  const { t } = useTranslation();
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
        setHeader(t('Start Creating an OCA Schema'));
        setToolTipText('');
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/CreatingOCASchema/');
        break;
      case 'Metadata':
        setHeader(t('Schema Metadata'));
        setToolTipText(
          t('This page is where you can write the metadata describing...')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/SchemaMetadata/');
        break;
      case 'Details':
        setHeader(t('Attribute Details'));
        setToolTipText(
          t('Each column of your dataset is an attribute in your schema...')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/AttributeDetails/');
        break;
      case 'Codes':
        setHeader(t('Add Entry Codes'));
        setToolTipText(
          t('Entry codes are options you want available to users as a...')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/AddEntryCode/');
        break;
      case 'LanguageDetails':
        setHeader(t('Language Dependent Attribute Details'));
        setToolTipText(
          t('You can add details in each language to help users...')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/LanguageAttribute/');
        break;
      case 'View':
        setHeader(t('Review Schema'));
        setToolTipText(
          t('Before finishing your schema you can preview the final contents on this page')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/ViewSchema/');
        break;
      case 'Overlays':
        setHeader(t('Add Additional Optional Information'));
        // TODO: Add help tooltips
        setToolTipText('');
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/Overlays/');
        break;
      case 'CharacterEncoding':
        setHeader(t('Add Character Encoding'));
        setToolTipText(
          t('Character encoding of the data source (for each attribute)...')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/CharacterEncoding/');
        break;
      case 'RequiredEntries':
        setHeader(t('Add Required Entries'));
        setToolTipText(
          t('Specify if the underlying data must have an entry for the specific attribute')
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/RequiredEntry/');
        break;
      case 'FormatRules':
        setHeader(t('Add Format Rules for Data Entry'));
        setToolTipText('');
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/FormatText/');
        break;
      case 'Cardinality':
        setHeader(t('Add Entry Limit Rules for Data Entry'));
        setToolTipText(
          ''
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/Cardinality/');
        break;
      case 'DataStandards':
        setHeader(t('Add Data Standards'));
        setToolTipText('');
        setHelpLink('https://agrifooddatacanada.github.io/OCA_Composer_help_pages/en/DataStandards/');
        break;
      case 'StartDataValidator':
        setHeader(t('Upload Data (optional)'));
        setToolTipText(
          ''
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/en/DataEntryVerificationStart');
        break;
      case 'SchemaViewDataValidator':
        setHeader(t('Preview Schema'));
        setToolTipText(
          ''
        );
        setHelpLink('');
        break;
      case 'DatasetViewDataValidator':
        setHeader(t('Preview Dataset'));
        setToolTipText(
          ''
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/en/PreviewSchema');
        break;
      case 'AttributeMatchDataValidator':
        setHeader(t('Matching Attributes'));
        setToolTipText(
          ''
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/en/MatchAttributes/');
        break;
      case 'OCADataValidatorCheck':
        setHeader(t('Data Entry and Verification'));
        setToolTipText(
          ''
        );
        setHelpLink('https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/en/DataVerification/');
        break;
      default:
        setHeader('');
        setHelpLink('');
    }
  }, [currentPage, t]);

  return (
    <HeaderWrapper
      isMobile={isMobile}
      headerColor={(currentPage === 'Landing' || currentPage === "StartOCAMerge") && CustomPalette.PRIMARY}
      leftItem={
        <>
          {(currentPage === 'Landing' || currentPage === "StartOCAMerge") ? (
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
          {(currentPage === 'Landing') ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',

            }}>
              <div>
                <select id="language-select" style={{ border: 'none', fontSize: '25px', color: "white", background: CustomPalette.PRIMARY, marginRight: "2.5rem" }} value={selectedLanguage} onChange={changeLanguage}>
                  <option value="en">EN</option>
                  {/* <option value="fr">FR</option> */}
                </select>
              </div>
              <img
                src={logoWhite}
                style={{
                  width: isMobile ? 'auto' : '250px',
                  height: isMobile ? '70px' : 'auto',
                  marginRight: isMobile ? 'unset' : '20px',
                  cursor: 'pointer'
                }}
                alt='Logo'
                onClick={() => (window.location.href = 'https://agrifooddatacanada.ca/')}
              />
            </Box>

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
                  {t('Help with this page')}
                </Button>
              )}
              <div>
                <select id="language-select" style={{ border: 'none', fontSize: '20px', color: CustomPalette.PRIMARY }} value={selectedLanguage} onChange={changeLanguage}>
                  <option value="en">EN</option>
                  {/* <option value="fr">FR</option> */}
                </select>
              </div>
            </>
          )}
        </>
      }
    />
  );
}
