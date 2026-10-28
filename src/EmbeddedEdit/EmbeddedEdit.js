import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import yaml from "js-yaml";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { coerceIfLegacyTopLevelBundle } from "../utils/packageUtils";
import { mapLinkMLToOCABundle } from "../SchemaTranslator/mapLinkMLToOCABundle";
import { transformToPackage } from "../SchemaTranslator/linkMLToOCA";

/**
 * Entry point for editing a schema handed over by ContextHub.
 * ContextHub embeds this page in an iframe and, once it loads, posts
 * { type: "LOAD_SCHEMA", content, fileName }. This loads that content into
 * the same multi-schema editor state a native upload on /start would, then
 * jumps straight to the wizard (skipping the upload step).
 *
 * The apply-back message (SCHEMA_SAVED) comes in a follow-up commit.
 */
const EmbeddedEdit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isIframe = searchParams.get("iframe") === "true";

  const { setCurrentPage, setSummaryExportMode } = useContext(Context);
  const { clearAllSchemas, setOcaPackage, loadAllSchemasFromOcaPackage, switchToSchema } =
    useMultiSchema();

  const [status, setStatus] = useState("waiting"); // waiting | error
  const [errorMessage, setErrorMessage] = useState("");

  const loadSchema = useCallback(
    (content) => {
      try {
        let parsedJson = null;
        try {
          parsedJson = JSON.parse(content);
        } catch {
          parsedJson = null;
        }

        let pkg;
        if (parsedJson && (parsedJson.oca_bundle || parsedJson.capture_base)) {
          // Native OCA package.
          pkg = coerceIfLegacyTopLevelBundle(parsedJson);
        } else {
          // LinkML (YAML or JSON) - translate to an OCA package first.
          const linkmlSchema = parsedJson || yaml.load(content);
          if (!linkmlSchema || typeof linkmlSchema !== "object" || Array.isArray(linkmlSchema)) {
            throw new Error("Unrecognized schema format.");
          }
          const bundle = mapLinkMLToOCABundle(linkmlSchema);
          if (!Object.keys(bundle?.capture_base?.attributes || {}).length) {
            throw new Error("This schema doesn't contain any attribute definitions.");
          }
          pkg = transformToPackage(bundle);
        }

        if (!pkg?.oca_bundle?.bundle) {
          throw new Error("Could not read this schema.");
        }

        clearAllSchemas();
        setOcaPackage(pkg);
        loadAllSchemasFromOcaPackage(pkg);
        switchToSchema(pkg.oca_bundle.bundle.d, pkg);
        setSummaryExportMode(false);
        setCurrentPage("View");
        navigate("/start");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[EmbeddedEdit] failed to load schema:", err);
        setStatus("error");
        setErrorMessage(err?.message || "Could not load this schema.");
      }
    },
    [
      clearAllSchemas,
      setOcaPackage,
      loadAllSchemasFromOcaPackage,
      switchToSchema,
      setSummaryExportMode,
      setCurrentPage,
      navigate
    ]
  );

  useEffect(() => {
    const handleMessage = (event) => {
      const msg = event.data;
      if (
        msg &&
        typeof msg === "object" &&
        msg.type === "LOAD_SCHEMA" &&
        typeof msg.content === "string"
      ) {
        loadSchema(msg.content);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loadSchema]);

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
      {status === "error" ? (
        <Typography variant="h6" color="error">
          {errorMessage}
        </Typography>
      ) : (
        <>
          <CircularProgress size={28} sx={{ mb: 2 }} />
          <Typography variant="h6">Waiting for schema from ContextHub…</Typography>
          {!isIframe && (
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              This page is meant to be opened inside ContextHub.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default EmbeddedEdit;
