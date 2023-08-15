import { Box, Button, List, ListItemButton, ListItemText } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useState } from 'react';

const items = {
  "Attribute type-CB": { feature: "Attribute type-CB", selected: false },
  "Attributes-CB": { feature: "Attributes-CB", selected: false },
  "Classification-CB": { feature: "Classification-CB", selected: false },
  "Flagged-CB": { feature: "Flagged-CB", selected: false },
  "entry": { feature: "entry", selected: false },
  "entry code": { feature: "entry code", selected: false },
  "cardinality": { feature: "cardinality", selected: false },
  "character encoding": { feature: "character encoding", selected: false },
  "conformance": { feature: "conformance", selected: false },
  "format": { feature: "format", selected: false },
  "information": { feature: "information", selected: false },
  "label": { feature: "label", selected: false },
  "meta": { feature: "meta", selected: false },
  "unit": { feature: "unit", selected: false }
};

const Overlays = ({
  pageBack,
  pageForward,
}) => {
  const [categories, setCategories] = useState(items);
  const [categoriesInfo, setCategoriesInfo] = useState({});

  const addToSelected = (item) => {
    setCategories(prev => ({ ...prev, [item]: { ...prev[item], selected: true } }));
    setCategoriesInfo(prev => {

      //  TODO: Add default values according to attribute list for each feature
      // {"cardinality": {...attributes}}
      return { ...prev, [item]: {} };
    });
  };

  const removeFromSelected = (item) => {
    setCategories(prev => ({ ...prev, [item]: { ...prev[item], selected: false } }));

    const newCategoriesInfo = { ...categoriesInfo };
    delete newCategoriesInfo[item];
    setCategoriesInfo(newCategoriesInfo);
  };

  // Convert categories into a list of features
  const selectedFeatures = [];
  const unselectedFeatures = [];

  Object.values(categories).forEach(item => {
    if (item.selected) {
      selectedFeatures.push(item.feature);
    } else {
      unselectedFeatures.push(item.feature);
    }
  });

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
                    <Button sx={{ color: CustomPalette.PRIMARY }}>
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