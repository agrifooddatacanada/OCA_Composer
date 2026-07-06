import React, { useContext, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import BackNextSkeleton from "../components/BackNextSkeleton";
import DeleteConfirmation from "./DeleteConfirmation";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { FIELD_EXAMPLE_OVERLAY } from "../constants/constants";

function getPlaceholderForType(type) {
  if (!type) return "sample value";
  const base = type.replace(/^Array\[(.+)\]$/, "$1").trim();
  switch (base) {
    case "Numeric":
      return "42";
    case "DateTime":
      return "2024-01-15";
    case "Boolean":
      return "true";
    case "Binary":
      return "data:image/png;base64,...";
    case "Text":
    default:
      return "sample text";
  }
}

const ExampleOverlay = () => {
  const { t } = useTranslation();
  const { setCurrentPage, setSelectedOverlay } = useContext(Context);
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_EXAMPLE_OVERLAY);

  const attributes = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );

  const languages = useMemo(() => {
    const langs = schemaState?.metadata?.languages;
    return Array.isArray(langs) && langs.length > 0 ? langs : ["English"];
  }, [schemaState?.metadata?.languages]);

  const exampleData = useMemo(
    () => schemaState?.exampleData || {},
    [schemaState?.exampleData]
  );

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleChange = (attributeName, language, value) => {
    const currentAttrData = exampleData[attributeName] || {};
    updateSchema({
      exampleData: {
        ...exampleData,
        [attributeName]: {
          ...currentAttrData,
          [language]: value
        }
      }
    });
  };

  const handleForward = () => {
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleBack = () => {
    setCurrentPage("Overlays");
  };

  const multiLang = languages.length > 1;

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={handleBack}
    >
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}

      <Box
        sx={{
          margin: "2rem",
          gap: "0.75rem",
          display: "flex",
          flexDirection: "column",
          maxWidth: multiLang ? 900 : 720
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h6">{t("Example Values")}</Typography>
              <Tooltip
                title={t(
                  "Provide a representative example value for each attribute. These examples help users understand the expected format and content of each field."
                )}
              >
                <HelpOutlineIcon sx={{ fontSize: 18, color: "#6b7280" }} />
              </Tooltip>
            </Box>
            <Divider sx={{ my: 1 }} />

            {attributes.length === 0 ? (
              <Box
                sx={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: 1,
                  px: 2,
                  py: 1.5,
                  mt: 2
                }}
              >
                <Typography variant="body2">
                  {t("There are no attributes defined in your schema yet.")}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}
              >
                {/* Column headers */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `1fr ${languages.map(() => "1.5fr").join(" ")}`,
                    gap: 2,
                    alignItems: "center"
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {t("Attribute")}
                  </Typography>
                  {languages.map((lang) => (
                    <Typography
                      key={lang}
                      variant="caption"
                      sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
                    >
                      {t("Example")} ({lang})
                    </Typography>
                  ))}
                </Box>

                <Divider />

                {attributes.map((row) => {
                  const attrName = row?.Attribute || "";
                  const attrType = row?.Type || "";
                  const attrExamples = exampleData[attrName] || {};
                  return (
                    <Box
                      key={attrName}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: `1fr ${languages.map(() => "1.5fr").join(" ")}`,
                        gap: 2,
                        alignItems: "center"
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, wordBreak: "break-word" }}
                        >
                          {attrName}
                        </Typography>
                        {attrType && (
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280" }}
                          >
                            {attrType}
                          </Typography>
                        )}
                      </Box>
                      {languages.map((lang) => {
                        const val = attrExamples[lang] ?? "";
                        return (
                          <TextField
                            key={lang}
                            size="small"
                            fullWidth
                            label={multiLang ? lang : t("Example value")}
                            value={val}
                            onChange={(e) => handleChange(attrName, lang, e.target.value)}
                            placeholder={t("e.g. {{placeholder}}", {
                              placeholder: getPlaceholderForType(attrType)
                            })}
                            InputProps={
                              val
                                ? undefined
                                : {
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <Tooltip
                                          title={t(
                                            "Enter a sample value that illustrates what valid data looks like for this attribute."
                                          )}
                                        >
                                          <HelpOutlineIcon
                                            sx={{ fontSize: 16, color: "#9ca3af" }}
                                          />
                                        </Tooltip>
                                      </InputAdornment>
                                    )
                                  }
                            }
                          />
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </BackNextSkeleton>
  );
};

export default ExampleOverlay;
