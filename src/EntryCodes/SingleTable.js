import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import CodeGrid from "./CodeGrid";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Context } from "../App";

export default function SingleTable({ attribute, index, codeRefs, chosenTable, setChosenTable, setShowCard }) {
  const { setChosenEntryCodeIndex } = useContext(Context);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "left",
            margin: "1rem 0 1rem 0",
            color: CustomPalette.PRIMARY,
          }}
        >
          {attribute.Attribute}
        </Typography>
        <UploadFileIcon
          sx={{
            color: "gray",
            margin: "1.1rem 0 1rem 1rem",
            ":hover": {
              color: CustomPalette.PRIMARY,
              cursor: "pointer",
            }
          }}
          // onClick={handleUpload}
          onClick={() => {
            setChosenEntryCodeIndex(index);
            setShowCard(true);
          }}
        />
      </Box>
      <CodeGrid index={index} codeRefs={codeRefs} chosenTable={chosenTable} setChosenTable={setChosenTable} />
    </Box>
  );
}
