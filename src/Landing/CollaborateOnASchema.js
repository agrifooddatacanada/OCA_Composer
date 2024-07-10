import React from 'react';
import { useTranslation } from 'react-i18next';
import AccordionItemWrapper from './AccordionItemWrapper';
import { AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import CustomAnchorLink from '../components/CustomAnchorLink';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CollaborateOnASchema = () => {
  const { t } = useTranslation();

  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>{t('Collaborate on a Schema')}</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          {t('You can support multiple contributors to your schema and merge the final results together in:')}
        </Typography>
        <Typography sx={{ marginTop: '20px', marginBottom: '20px' }}>
          <CustomAnchorLink link='oca-merge' text={t('OCA Merge')} />
        </Typography>
        <Typography>
          {t('To merge schemas you must have the same capture base. The suggested process is to create a basic schema with all attributes and then distribute this schema bundle to your collaborators. Everyone can work on their own features of the schema and at the end everything can be combined in a single schema using the OCA merge tool.')}
        </Typography>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default CollaborateOnASchema;