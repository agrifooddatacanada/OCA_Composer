import { Box, Button, List, ListItemButton, ListItemText } from '@mui/material';
import { CustomPalette } from '../constants/customPalette';
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useState } from 'react';

const items = ["Attribute type-CB", "Attributes-CB", "Classification-CB", "Flagged-CB", "entry", "entry code", "cardinality", "character encoding", "conformance", "format", "information", "label", "meta", "unit"];

const Overlays = ({
  pageBack,
  pageForward,
}) => {
  const [categories, setCategories] = useState(items);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const addToSelected = (item) => {
    setCategories(prev => prev.filter(cat => cat !== item));
    setSelectedCategories(prev => [...prev, item]);
  };

  const removeFromSelected = (item) => {
    setSelectedCategories(prev => prev.filter(cat => cat !== item));
    setCategories(prev => [...prev, item].sort());
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
                {categories.map((text, _) => (
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
                {selectedCategories.map((text, index) => (
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