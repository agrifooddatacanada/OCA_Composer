import { Box, Button, List, ListItemButton, ListItemText } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useContext } from 'react';
import { Context } from '../App';
import { getListOfSelectedOverlays } from '../constants/getListOfSelectedOverlays';


const Overlays = ({
  pageBack,
  pageForward,
}) => {
  const { setCurrentPage, characterEncodingRowData, setCharacterEncodingRowData, overlay, setOverlay, setSelectedOverlay } = useContext(Context);

  const addToSelected = (item) => {
    setOverlay(prev => ({ ...prev, [item]: { ...prev[item], selected: true } }));
    setSelectedOverlay(item);
    setCurrentPage('CharacterEncoding');
  };

  // Convert overlay into a list of features
  const { selectedFeatures, unselectedFeatures } = getListOfSelectedOverlays(overlay);

  const removeFromSelected = (item) => {
    setOverlay(prev => ({ ...prev, [item]: { ...prev[item], selected: false } }));

    // Delete attribute from characterEncodingRowData
    const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
      delete row[item];
      return row;
    });
    setCharacterEncodingRowData(newCharacterEncodingRowData);
  };

  const handleEditOverlay = (overlayName) => {
    setSelectedOverlay(overlayName);
    setCurrentPage('CharacterEncoding');
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "auto",
          pr: 10,
          pl: 10,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            color="navButton"
            sx={{ textAlign: "left", alignSelf: "flex-start" }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> Back
          </Button>
          <Button
            color="navButton"
            onClick={pageForward}
            sx={{ alignSelf: "flex-end", color: CustomPalette.PRIMARY }}
          >
            Next <ArrowForwardIosIcon />
          </Button>
        </Box>
        <Box
          sx={{
            margin: "2rem",
            gap: "3rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            Add schema feature
            <Box style={{
              width: '350px',
              height: '300px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}>
              <List>
                {unselectedFeatures.map((text, _) => (
                  <ListItemButton key={text} onClick={() => addToSelected(text)}>
                    <AddCircleIcon sx={{ color: CustomPalette.PRIMARY }} />
                    <ListItemText primary={text} sx={{ marginLeft: 2 }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            Added schema feature
            <Box style={{
              width: '350px',
              height: '300px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}>
              <List>
                {selectedFeatures.map((text, index) => (
                  <Box key={index} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <ListItemText primary={text} sx={{ display: 'flex', paddingLeft: '1rem' }} />
                    <DeleteForeverIcon sx={{ cursor: 'pointer', color: CustomPalette.PRIMARY }} onClick={() => removeFromSelected(text)} />
                    <Button sx={{ color: CustomPalette.PRIMARY }} onClick={() => handleEditOverlay(text)}>
                      Edit
                    </Button>
                  </Box>
                ))}
              </List>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Overlays;