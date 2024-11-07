import { Box, Button, List, ListItemButton, ListItemText } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useContext, useState } from 'react';
import { Context } from '../App';
import { getListOfSelectedOverlays } from '../constants/getListOfSelectedOverlays';
import BackNextSkeleton from '../components/BackNextSkeleton';
import DeleteConfirmation from './DeleteConfirmation';
import { useTranslation } from 'react-i18next';

const Overlays = ({ pageBack, pageForward }) => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    characterEncodingRowData,
    setCharacterEncodingRowData,
    overlay,
    setOverlay,
    setSelectedOverlay,
  } = useContext(Context);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState('');

  const addToSelected = (item) => {
    setOverlay((prev) => ({
      ...prev,
      [item]: { ...prev[item], selected: true },
    }));
    setSelectedOverlay(item);
    if (item === 'Character Encoding') {
      setCurrentPage('CharacterEncoding');
    } else if (item === 'Make selected entries required') {
      setCurrentPage('RequiredEntries');
    } else if (item === 'Cardinality') {
      setCurrentPage('Cardinality');
    } else if (item === 'Data Standards') {
      setCurrentPage('DataStandards');
    } else {
      setCurrentPage('FormatRules');
    }
  };

  // Convert overlay into a list of features
  const { selectedFeatures, unselectedFeatures } =
    getListOfSelectedOverlays(overlay);

  const removeFromSelected = () => {
    setOverlay((prev) => ({
      ...prev,
      [selectedItemToDelete]: {
        ...prev[selectedItemToDelete],
        selected: false,
      },
    }));

    // Delete attribute from characterEncodingRowData
    const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
      delete row[selectedItemToDelete];
      return row;
    });
    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setShowDeleteConfirmation(false);
  };

  const handleEditOverlay = (overlayName) => {
    setSelectedOverlay(overlayName);
    if (overlayName === 'Character Encoding') {
      setCurrentPage('CharacterEncoding');
    } else if (overlayName === 'Make selected entries required') {
      setCurrentPage('RequiredEntries');
    } else if (overlayName === 'Cardinality') {
      setCurrentPage('Cardinality');
    } else if (overlayName === 'Data Standards') {
      setCurrentPage('DataStandards');
    } else {
      setCurrentPage('FormatRules');
    }
  };

  return (
    <BackNextSkeleton
      isBack
      pageBack={pageBack}
      isForward
      pageForward={pageForward}
    >
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={removeFromSelected}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: '2rem',
          gap: '3rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          {t('Add schema feature')}
          <Box
            style={{
              width: '350px',
              height: '300px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <List>
              {unselectedFeatures.map((text, _) => (
                <ListItemButton key={text} onClick={() => addToSelected(text)}>
                  <AddCircleIcon sx={{ color: CustomPalette.PRIMARY }} />
                  <ListItemText primary={t(text)} sx={{ marginLeft: 2 }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          {t('Added schema feature')}
          <Box
            style={{
              width: '350px',
              height: '300px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <List >
              {selectedFeatures.map((text, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <ListItemText
                    primary={t(text)}
                    sx={{ display: 'flex', paddingLeft: '1rem', textAlign: 'left', width: "240px", paddingRight: "1rem" }}

                  />
                  <DeleteForeverIcon
                    sx={{ cursor: 'pointer', color: CustomPalette.PRIMARY }}
                    onClick={() => {
                      setSelectedItemToDelete(text);
                      setShowDeleteConfirmation(true);
                    }}
                  />
                  <Button
                    sx={{ color: CustomPalette.PRIMARY }}
                    onClick={() => handleEditOverlay(text)}
                  >
                    {t('Edit')}
                  </Button>
                </Box>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default Overlays;
