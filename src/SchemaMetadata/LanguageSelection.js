import { Box } from "@mui/system";
import { Button, Alert } from "@mui/material";
import React, { useContext, useState } from "react";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { removeSpacesFromString } from "../constants/removeSpaces";
import { allLanguagesWithCodesArray } from "../constants/isoCodes";

const languageList = [
  "English",
  "French",
  "Spanish",
  "Mandarin",
  "German",
  "Japanese",
  "Italian",
  "Cree",
  "Ojibway",
  "Inupiaq",
  "Inuktitut"
];

const languageEntryErrors = {
  alreadySelected: "Language already selected",
  tooLong: "Language name cannot be more than 50 characters",
  blankLanguage: "Language name cannot be blank",
  quotesMisuse: "Language name cannot start or end with quotes",
  backslashMisuse: "Language name cannot include the character \\",
  codeInjection: "Language name cannot include HTML",
};

export default function LanguageSelection({
  setShowLanguages,
  setEditingLanguage,
  setShowIsoInput,
}) {
  const { languages, setLanguages, schemaDescription, setSchemaDescription } =
    useContext(Context);
  // const [newLanguage, setNewLanguage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const toTitleCase = (str) => {
    return str.toLowerCase().replace(/^(.)|\s(.)/g, function(match) {
      return match.toUpperCase();
    });
  };

  const addLanguage = (newLanguage) => {
    let languageToAdd = toTitleCase(removeSpacesFromString(newLanguage));

    if (languageToAdd.length > 50) {
      setErrorMessage(languageEntryErrors.tooLong);
      setTimeout(() => {
        setErrorMessage("");
      }, [1000]);
      return;
    }

    if (!languageToAdd) {
      setErrorMessage(languageEntryErrors.blankLanguage);
      setTimeout(() => {
        setErrorMessage("");
      }, [1000]);
      return;
    }

    //backslash in language name can create export errors
    if (languageToAdd.includes("\\")) {
      setErrorMessage(languageEntryErrors.backslashMisuse);
      setTimeout(() => {
        setErrorMessage("");
      }, [1000]);
      return;
    }

    if (
      languageToAdd.includes("/>") ||
      languageToAdd.includes("</") ||
      languageToAdd.includes("<svg") ||
      languageToAdd.includes("<script")
    ) {
      setErrorMessage(languageEntryErrors.codeInjection);
      setTimeout(() => {
        setErrorMessage("");
      }, [1000]);
      return;
    }

    //quotes at start or end of language name can create export errors
    if (
      languageToAdd.startsWith('"') ||
      languageToAdd.endsWith('"') ||
      languageToAdd.startsWith("'") ||
      languageToAdd.endsWith("'") ||
      languageToAdd.startsWith("`") ||
      languageToAdd.endsWith("`")
    ) {
      setErrorMessage(languageEntryErrors.quotesMisuse);
      setTimeout(() => {
        setErrorMessage("");
      }, [1500]);
      return;
    }

    if (!languages.includes(languageToAdd)) {
      setLanguages([...languages, languageToAdd]);
      const newSchemaDescription = JSON.parse(
        JSON.stringify(schemaDescription)
      );
      newSchemaDescription[languageToAdd] = { name: "", description: "" };
      setSchemaDescription(newSchemaDescription);
      setShowLanguages(false);
      if (!allLanguagesWithCodesArray.includes(languageToAdd.toLowerCase())) {
        setShowIsoInput(true);
        setEditingLanguage(languageToAdd);
      }
    } else {
      setErrorMessage(languageEntryErrors.alreadySelected);
      setTimeout(() => {
        setErrorMessage("");
      }, [1000]);
    }
  };

  // const handleLanguageField = (e) => {
  //   e.preventDefault();
  //   setNewLanguage(e.target.value);
  // };


  const languageDisplay = languageList.map((item) => {
    return (
      <Button
        key={item}
        onClick={() => addLanguage(item)}
        color="button"
        sx={{
          borderRadius: 0,
          textTransform: "capitalize",
          boxShadow: `0px 0px 1px ${CustomPalette.GREY_300}`,
          "&:hover": {
            backgroundColor: CustomPalette.PRIMARY,
            color: CustomPalette.WHITE,
          },
          "&:nth-of-type(7)": {
            boxShadow: 0,
          },
        }}
      >
        {item}
      </Button>
    );
  });
  return (
    <Box
      sx={{
        justifySelf: "flex-end",
        backgroundColor: CustomPalette.WHITE,
        display: "flex",
        flexDirection: "column",
        boxShadow: 10,
      }}
    >
      {errorMessage.length > 0 && (
        <Alert
          severity="warning"
          style={{
            position: "absolute",
            zIndex: 9999,
            bottom: -60,
            right: 220,
            width: `calc(${errorMessage.length}ch + 1rem)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {languageDisplay}
      {/* <Button
        sx={{
          color: CustomPalette.DARK,
          borderRadius: 0,
          mr: -2,
        }}
      >
        <TextField
          id="customLanguageField"
          type="text"
          onChange={handleLanguageField}
          placeholder="Other"
          size="small"
          variant="standard"
          inputProps={{
            style: {
              color: CustomPalette.PRIMARY,
              fontWeight: "bold",
              paddingLeft: "0.8rem",
            },
          }}
          sx={{
            width: "9rem",
            "& .MuiInput-underline:before": {
              borderBottomColor: CustomPalette.GREY_300,
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: CustomPalette.PRIMARY,
            },
          }}
        />
        <AddIcon
          onClick={() => addLanguage(newLanguage)}
          sx={{
            color: CustomPalette.SECONDARY,
            "&:hover": {
              color: CustomPalette.PRIMARY,
              transform: "scale(1.1)",
            },
          }}
        />
      </Button> */}
    </Box>
  );
}
