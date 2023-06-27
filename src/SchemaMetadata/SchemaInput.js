import React, { useContext, useState } from "react";
import { TextField, Typography, Box, Tooltip, Button } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { languageCodesObject } from "../constants/isoCodes";
import Classification from "./Classification";

export default function SchemaInput({
  language,
  setShowIsoInput,
  setEditingLanguage,
  index
}) {

  const {
    schemaDescription,
    setSchemaDescription,
    languages,
    setLanguages,
    customIsos,
  } = useContext(Context);
  const [deleteHover, setDeleteHover] = useState(false);
  const nameFieldId = `schema-name${language}`;
  const descriptionFieldId = `schema-description${language}`;

  const handleNameField = (e) => {
    e.preventDefault();

    let newSchema = JSON.parse(JSON.stringify(schemaDescription));
    let newText = e.target.value;
    newSchema = {
      ...newSchema,
      [language]: { ...newSchema[language], name: newText },
    };
    setSchemaDescription(newSchema);
  };

  const handleDescriptionField = (e) => {
    e.preventDefault();

    let newSchema = JSON.parse(JSON.stringify(schemaDescription));
    let newText = e.target.value;
    newSchema = {
      ...newSchema,
      [language]: { ...newSchema[language], description: newText },
    };
    setSchemaDescription(newSchema);
  };

  const handleDelete = () => {
    const languageIndex = languages.indexOf(language);
    let newLanguageArray = [...languages];
    newLanguageArray.splice(languageIndex, 1);
    setLanguages(newLanguageArray);
    const newSchemaDescription = JSON.parse(JSON.stringify(schemaDescription));
    delete newSchemaDescription[language];
    setSchemaDescription(newSchemaDescription);
  };

  return (
    <Box sx={{ mr: 4, width: "22rem" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          mt: 1,
          height: "10.5rem",
        }}
      >
        {index === 0 ? <Classification /> : (
          <Box sx={{ marginBottom: '1rem', height: '5rem' }} />
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "left",
              textTransform: "capitalize",
              maxWidth: "20rem",
              wordBreak: "break-word",
            }}
          >
            {language}
          </Typography>
          {languages.length > 1 && (
            <Box
              onMouseEnter={() => setDeleteHover(true)}
              onMouseLeave={() => setDeleteHover(false)}
            >
              {deleteHover === true ? (
                <DeleteForeverIcon
                  onClick={handleDelete}
                  sx={{
                    pr: 1,
                    color: CustomPalette.PRIMARY,
                    transform: "scale(1.2)",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ) : (
                <DeleteOutlineIcon
                  sx={{
                    pr: 1,
                    color: CustomPalette.GREY_600,
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              )}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",

          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              ISO Code:{" "}
              {languageCodesObject[language.toLowerCase()] ||
                customIsos[language.toLowerCase()]}
            </Typography>
          </Box>
          {!languageCodesObject[language.toLowerCase()] && (
            <Button
              variant="contained"
              color="button"
              sx={{ fontSize: 11, p: 0.5, width: "5rem" }}
              onClick={() => {
                setShowIsoInput(true);
                setEditingLanguage(language);
              }}
            >
              Update ISO
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: CustomPalette.GREY_600,
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: "bold",
              textAlign: "left",
              margin: "0.5rem 0 0.5rem 0",
              width: "8rem",
              color: CustomPalette.BLACK,
            }}
          >
            Name of Schema
          </Typography>
          {language === languages[0] && (
            <Tooltip
              title="The name of the schema. It is recommended to use a more general name rather than one that identifies a specific dataset or experiment."
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
        </Box>
        <TextField
          id={nameFieldId}
          type="text"
          onChange={handleNameField}
          inputProps={{
            style: {
              height: "0.2rem",
            },
          }}
          value={
            schemaDescription[language] && schemaDescription[language].name
          }
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            margin: "2rem 0 0.5rem 0",
            color: CustomPalette.GREY_600,
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: "bold",
              textAlign: "left",
              color: CustomPalette.BLACK,
              width: "6rem",
            }}
          >
            Description
          </Typography>
          {language === languages[0] && (
            <Tooltip
              title="The description of the schema that will help yourself and others determine what the schema describes. It is recommended to use a more general name rather than one that identifies a specific dataset or experiment."
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
        </Box>
        <TextField
          multiline={true}
          rows="5"
          id={descriptionFieldId}
          type="text"
          onChange={handleDescriptionField}
          value={
            schemaDescription[language] &&
            schemaDescription[language].description
          }
        />
      </Box>
    </Box>
  );
}
