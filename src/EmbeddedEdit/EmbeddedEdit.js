import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";

/**
 * Entry point for editing a schema handed over by ContextHub.
 * ContextHub embeds this page in an iframe and, once it loads, posts
 * { type: "LOAD_SCHEMA", content, fileName }. Once the edit is applied,
 * this page should post { type: "SCHEMA_SAVED", content, fileName } back.
 *
 * This first pass only wires up the message channel so the two sides can
 * be verified end-to-end before the schema is fed into the editor itself.
 */
const EmbeddedEdit = () => {
  const [searchParams] = useSearchParams();
  const isIframe = searchParams.get("iframe") === "true";
  const lang = searchParams.get("lang") || "eng";
  const buttonLabel = searchParams.get("buttonLabel") || "APPLY";

  const [receivedFileName, setReceivedFileName] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      const msg = event.data;
      if (msg && typeof msg === "object" && msg.type === "LOAD_SCHEMA") {
        // eslint-disable-next-line no-console
        console.log("[EmbeddedEdit] received LOAD_SCHEMA:", msg);
        setReceivedFileName(msg.fileName || "schema");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 4,
        textAlign: "center"
      }}
    >
      <Typography variant="h6">
        {receivedFileName
          ? `Received schema: ${receivedFileName}`
          : "Waiting for schema from ContextHub…"}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
        iframe={String(isIframe)} · lang={lang} · buttonLabel={buttonLabel}
      </Typography>
    </Box>
  );
};

export default EmbeddedEdit;
