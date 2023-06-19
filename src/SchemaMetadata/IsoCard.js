import React, { useContext, useState } from "react";
import { Box, Button, Typography, Input, Alert } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { removeSpacesFromString } from "../constants/removeSpaces";

export default function IsoCard({
  setShowIsoInput,
  language,
  defaultButton,
  addCustomButton,
}) {
  const [iso, setIso] = useState("");
  const [message, setMessage] = useState("");
  const { customIsos, setCustomIsos } = useContext(Context);
  const appearAnimation =
    "fade-in 0.5s ease forwards; @keyframes fade-in {0% {opacity: 0;transform: translate(-50%, 0%) scale(0.5);}100% {opacity: 1;transform: translate(-50%, 0%) scale(1);}}";

  const handleIsoField = (e) => {
    e.preventDefault();
    setIso(e.target.value);
  };

  let defaultCode = language
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 2)
    .toLowerCase();

  while (defaultCode.length < 2) {
    defaultCode = defaultCode + "a";
  }

  const handleSave = () => {
    let newIsos = JSON.parse(JSON.stringify(customIsos));
    let newText = removeSpacesFromString(iso);
    const invalidCharactersRegex = /[^a-zA-Z]/;

    if (newText.length > 1 && newText.length < 11) {
      const containsInvalidCharacter = invalidCharactersRegex.test(newText);
      if (containsInvalidCharacter) {
        setMessage(
          "ISO codes cannot contain special characters, numbers or spaces"
        );
        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        newIsos = {
          ...newIsos,
          [language.toLowerCase()]: newText,
        };
        setCustomIsos(newIsos);
        setShowIsoInput(false);
      }
    } else {
      setMessage("ISO codes must be between 2 and 10 characters long");
      setTimeout(() => {
        setMessage("");
      }, 2000);
    }
  };

  const handleSaveDefault = () => {
    let newIsos = JSON.parse(JSON.stringify(customIsos));
    newIsos = {
      ...newIsos,
      [language.toLowerCase()]: defaultCode,
    };
    setCustomIsos(newIsos);
    setShowIsoInput(false);
  };

  return (
    <Box
      style={{
        position: "absolute",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 50,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: 150,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          width: "40rem",
          minHeight: "25rem",
          p: 3,
          boxShadow: 20,
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE,
          border: "1px solid",
          borderColor: CustomPalette.RED_100,
          animation: appearAnimation,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            backgroundColor: CustomPalette.RED_100,
            mb: 2,
          }}
        >
          <ErrorOutlineIcon
            sx={{
              color: CustomPalette.SECONDARY,
              p: 1,
              pl: 0,
              fontSize: 35,
            }}
          />
        </Box>
        {message.length > 0 && (
          <Alert
            severity="error"
            sx={{
              position: "absolute",
              whiteSpace: "pre-line",
              display: "flex",
              alignItems: "center",
              bottom: 120,
            }}
          >
            {message}
          </Alert>
        )}
        <Typography
          variant="h5"
          sx={{ p: 1, width: "30rem", wordBreak: "break-word" }}
        >
          An ISO code for{" "}
          <Box>
            <em>{language}</em>{" "}
          </Box>
          is not included in our database
        </Typography>
        <Typography variant="h6" sx={{ p: 1 }}>
          <strong>Please enter it below or select the default</strong>
        </Typography>
        <Box
          sx={{
            display: "flex",
            height: "6rem",
            width: "30rem",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "13rem",
              borderRight: `2px solid ${CustomPalette.RED_100}`,
              paddingRight: 4.3,
              paddingTop: 2,
            }}
          >
            <Input
              id={language + "_ISO"}
              type="text"
              onChange={handleIsoField}
              inputProps={{ style: { textAlign: "center" } }}
              value={iso || ""}
              placeholder={customIsos[language.toLowerCase()]}
            />
            <Button
              variant="contained"
              color="navButton"
              ref={addCustomButton}
              onClick={() => {
                handleSave();
              }}
              sx={{
                width: "13rem",
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              save custom ISO
            </Button>
          </Box>
          <Button
            variant="outlined"
            ref={defaultButton}
            color="navButton"
            onClick={() => {
              handleSaveDefault();
            }}
            sx={{
              width: "13rem",
              height: "3rem",
              display: "flex",
              justifyContent: "space-around",
              alignSelf: "center",
            }}
          >
            Select default code: <em>{defaultCode}</em>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
