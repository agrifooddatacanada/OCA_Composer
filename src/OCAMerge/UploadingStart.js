import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { useTranslation } from 'react-i18next';
import useHandleOCAFileUpload from './useHandleOCAFileUpload';
import Drop from '../StartSchema/Drop';
import { datasetUploadTooltip, jsonUploadTooltip, textUploadDescription } from '../constants/constants';

const UploadingStart = () => {
  const { t } = useTranslation();

  const {
    setCurrentOCAMergePage,
    setOCAFile1Raw,
    setOCAFile2Raw,
    OCAFile1Loading,
    setOCAFile1Loading,
    OCAFile2Loading,
    setOCAFile2Loading,
    ocaFile1DropDisabled,
    setOcaFile1DropMessage,
    ocaFile1DropMessage,
    ocaFile2DropDisabled,
    setOcaFile2DropMessage,
    ocaFile2DropMessage,
    OCAFile1Raw,
    handleClearOCAFile1,
    OCAFile2Raw,
    handleClearOCAFile2,
    parsedOCAFile1,
    parsedOCAFile2,
  } = useHandleOCAFileUpload();

  const filePath1 = OCAFile1Raw?.[0]?.path;
  const filePath2 = OCAFile2Raw?.[0]?.path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <BackNextSkeleton isForward={parsedOCAFile1 !== "" && parsedOCAFile2 !== ""} pageForward={() => {
        setCurrentOCAMergePage('UserSelection');
      }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <Box sx={{ height: '3rem' }} />
        <Box>
          <Typography variant="h6" sx={{ textAlign: 'start', color: "black", marginBottom: "-1rem" }}>{t('Required')}: {filePath1 ? filePath1.substring(0, filePath1.lastIndexOf('.')) : t('Schema Bundle 1')}</Typography>
          <Drop
            setFile={setOCAFile1Raw}
            setLoading={setOCAFile1Loading}
            loading={OCAFile1Loading}
            dropDisabled={ocaFile1DropDisabled}
            dropMessage={ocaFile1DropMessage}
            setDropMessage={setOcaFile1DropMessage}
            description={textUploadDescription}
            tipDescription={jsonUploadTooltip}
            version={1}
          />
        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearOCAFile1}
            sx={{ width: 190, mr: 2 }}
            disabled={OCAFile1Raw.length === 0}
          >
            {t('Clear OCA File')}
          </Button>
        </Box>
        <Box sx={{ height: '4rem' }} />
        <Box>
          <Typography variant="h6" sx={{ textAlign: 'start', color: "black", marginBottom: "-1rem" }}>{t('Required')}: {filePath2 ? filePath2.substring(0, filePath2.lastIndexOf('.')) : t('Schema bundle 2')}</Typography>
          <Drop
            setFile={setOCAFile2Raw}
            setLoading={setOCAFile2Loading}
            loading={OCAFile2Loading}
            dropDisabled={ocaFile2DropDisabled}
            dropMessage={ocaFile2DropMessage}
            setDropMessage={setOcaFile2DropMessage}
            description={textUploadDescription}
            tipDescription={datasetUploadTooltip}
            version={1}
          />
        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearOCAFile2}
            sx={{ width: 190, mr: 2 }}
            disabled={OCAFile2Raw.length === 0}
          >
            {t('Clear OCA File')}
          </Button>
        </Box>

        <Box sx={{ height: '3rem' }} />
      </Box>
    </Box>
  );
};

export default UploadingStart;