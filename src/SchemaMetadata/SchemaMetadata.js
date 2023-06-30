import { Box, Button, Typography, Tooltip } from "@mui/material";
import React, { useState, useContext, useEffect, useRef } from "react";
import Attributes from "./Attributes";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import Description from "./Description";
import LanguageSelection from "./LanguageSelection";
import NavigationCard from "../constants/NavigationCard";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { removeSpacesFromObjectOfObjects } from "../constants/removeSpaces";
import IntroCard from "./IntroCard";
import IsoCard from "./IsoCard";

export default function SchemaMetadata({
  pageBack,
  pageForward,
  showIntroCard,
  setShowIntroCard,
}) {
  const [showLanguages, setShowLanguages] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [fieldArray, setFieldArray] = useState([]);
  const [showIsoInput, setShowIsoInput] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState("");
  const { schemaDescription, setSchemaDescription, languages } =
    useContext(Context);

  const toTitleCase = (str) => {
    return str.toLowerCase().replace(/^(.)|\s(.)/g, function(match) {
      return match.toUpperCase();
    });
  };

  const handleForward = () => {
    const noSpacesObject = removeSpacesFromObjectOfObjects(schemaDescription);
    setSchemaDescription(noSpacesObject);
    const spacesArray = [];

    languages.forEach((language) => {
      const allValues = Object.values(noSpacesObject[language]);
      allValues.forEach((value) => {
        if (!value && !spacesArray.includes(toTitleCase(language))) {
          spacesArray.push(toTitleCase(language));
        }
      });
    });
    if (spacesArray.length >= 1) {
      setFieldArray(spacesArray);
      setShowCard(true);
    } else {
      pageForward();
    }
  };

  //When showIsoInput component is visible, prevents user from clicking other buttons on the screen
  const defaultButton = useRef();
  const addCustomButton = useRef();

  useEffect(() => {
    const handleDisableClick = (event) => {
      if (showIsoInput) {
        const target = event.target;
        if (
          target !== defaultButton.current &&
          target !== addCustomButton.current
        ) {
          event.stopPropagation();
        }
      }
    };

    if (showIsoInput) {
      document.addEventListener("click", handleDisableClick, true);
    }

    return () => {
      document.removeEventListener("click", handleDisableClick, true);
    };
  }, [showIsoInput]);

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
            sx={{ textAlign: "left", alignSelf: "flex-start", color: CustomPalette.PRIMARY }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> Back
          </Button>
          <Button
            color="navButton"
            onClick={handleForward}
            sx={{ alignSelf: "flex-end", color: CustomPalette.PRIMARY }}
          >
            Next <ArrowForwardIosIcon />
          </Button>
        </Box>
        {showCard && (
          <NavigationCard
            fieldArray={fieldArray}
            setShowCard={setShowCard}
            handleForward={pageForward}
          />
        )}
        {showIntroCard && <IntroCard setShowIntroCard={setShowIntroCard} />}
        {showIsoInput && (
          <IsoCard
            setShowIsoInput={setShowIsoInput}
            language={editingLanguage}
            defaultButton={defaultButton}
            addCustomButton={addCustomButton}
          />
        )}
        <Box
          sx={{
            mt: 2,
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: CustomPalette.GREY_600,
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "left",
                margin: "1rem 0 1rem 0",
                color: CustomPalette.PRIMARY,
                width: "7rem",
              }}
            >
              Attributes
            </Typography>
            <Tooltip
              title="The list of attributes that were read from the column headers of the data file you selected at the beginning of schema creation."
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
          <Attributes />
          <Box sx={{ display: "flex", justifyContent: 'space-between' }}>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "left",
                margin: "1rem 0 1rem 0",
                color: CustomPalette.PRIMARY,
              }}
            >
              Schema Description
            </Typography>
            <Box sx={{ position: "relative", alignSelf: "flex-end" }}>
              <Box
                sx={{
                  alignSelf: "flex-end",
                  position: "absolute",
                  zIndex: "1000",
                  // top: -300,
                  top: 70,
                  width: "100%",
                }}
              >
                {showLanguages && (
                  <LanguageSelection
                    setShowLanguages={setShowLanguages}
                    setEditingLanguage={setEditingLanguage}
                    setShowIsoInput={setShowIsoInput}
                  />
                )}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: CustomPalette.GREY_600,
                }}
              >
                <Tooltip
                  title="Add another language to your schema. Without changing the basic structure of your schema, you can ensure it can be shared and used in different languages."
                  placement="left"
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 15 }} />
                </Tooltip>
                <Button
                  color="button"
                  onClick={() => setShowLanguages(!showLanguages)}
                  variant="contained"
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "11rem",
                    m: 2,
                  }}
                >
                  Add Language
                  {showLanguages === true ? (
                    <RemoveCircleIcon />
                  ) : (
                    <AddCircleIcon />
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
          <Description
            setShowIsoInput={setShowIsoInput}
            setEditingLanguage={setEditingLanguage}
          />
        </Box>

      </Box>
    </Box>
  );
}
