import React, { useContext } from "react";
import { Typography } from "@mui/material";
import { Context } from "../App";
import ErrorPopup from "../ViewSchema/ErrorPopup";

export default function SchemaUploadWarningPopup() {
  const { jsonDropMessage, setJsonDropMessage } = useContext(Context);

  if (jsonDropMessage?.type !== "warning" || !jsonDropMessage?.message) {
    return null;
  }

  return (
    <ErrorPopup onClose={() => setJsonDropMessage({ message: "", type: "" })}>
      <Typography variant="h6" sx={{ p: 2, textAlign: "center" }}>
        {jsonDropMessage.message}
      </Typography>
    </ErrorPopup>
  );
}
