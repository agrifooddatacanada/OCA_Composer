import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  MenuItem,
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
import { getMapValueForAttributeName } from "../utils/stringUtils";
import { getFormatRuleDescription } from "../utils/helpers";
import { validateExampleValuesAgainstOverlays } from "../utils/exampleValidation";

// Builds the selectable example options for a list attribute from its entry codes,
// using the label defined for the given language (falling back to the code itself
// when no translation exists), and de-duplicating repeated values.
function getEntryCodeOptions(entryCodeRows, language) {
  if (!Array.isArray(entryCodeRows)) return [];
  const seen = new Set();
  const options = [];
  entryCodeRows.forEach((row) => {
    const code = row?.Code;
    if (!code) return;
    const value = String(code);
    if (seen.has(value)) return;
    seen.add(value);
    const translatedLabel = row?.[language];
    options.push({
      value,
      label: translatedLabel ? `${value}: ${translatedLabel}` : value
    });
  });
  return options;
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

  const entryCodes = useMemo(
    () => schemaState?.entryCodes || {},
    [schemaState?.entryCodes]
  );

  const attributeFormats = useMemo(
    () => schemaState?.attributeFormats || {},
    [schemaState?.attributeFormats]
  );

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [needsReverify, setNeedsReverify] = useState(false);
  const [exampleValueIssues, setExampleValueIssues] = useState([]);

  // Lookup of "attribute||language" pairs that failed verification, used to
  // highlight the offending fields.
  const erroredFields = useMemo(() => {
    const set = new Set();
    exampleValueIssues.forEach((issue) => {
      set.add(`${issue.attribute}||${issue.language}`);
    });
    return set;
  }, [exampleValueIssues]);

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
    // Any edit invalidates the last verification result.
    if (hasVerified) {
      setNeedsReverify(true);
    }
  };

  const handleVerify = () => {
    const issues = validateExampleValuesAgainstOverlays({
      attributes: schemaState?.attributes || [],
      attributeFormats: schemaState?.attributeFormats || {},
      attributeRanges: schemaState?.attributeRanges || {},
      exampleData: schemaState?.exampleData || {},
      languages,
      decimalSeparator: schemaState?.decimalSeparator || ".",
      enableDecimal: !!schemaState?.enableDecimalSeparator,
      arrayDelimiterData: schemaState?.arrayDelimiterData || {},
      enableArrayDelimiter: !!schemaState?.enableArrayDelimiter
    });
    setExampleValueIssues(issues);
    setHasVerified(true);
    setNeedsReverify(false);
  };

  const handleForward = () => {
    console.log(schemaState);
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button
                    color="button"
                    variant="contained"
                    onClick={handleVerify}
                    sx={{ width: "120px", height: "40px" }}
                  >
                    {t("Verify")}
                  </Button>
                  <Tooltip
                    title={t(
                      "Check example values against the format, range, decimal, and array delimiter overlays."
                    )}
                  >
                    <HelpOutlineIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                  </Tooltip>
                  {needsReverify && (
                    <Typography sx={{ color: "red", fontWeight: "bold" }}>
                      {t("Please re-verify the data!")}
                    </Typography>
                  )}
                </Box>

                {hasVerified && !needsReverify && exampleValueIssues.length === 0 && (
                  <Alert severity="success">
                    {t("All example values agree with the schema's overlays.")}
                  </Alert>
                )}

                {hasVerified && exampleValueIssues.length > 0 && (
                  <Alert severity="warning">
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                      {t(
                        "Some example values do not agree with the range, format, decimal, or array delimiter overlays:"
                      )}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 3, textAlign: "left" }}>
                      {exampleValueIssues.map((issue) => {
                        const problemParams = { ...issue.params };
                        // The format description is itself a translation key —
                        // translate it before interpolating into the sentence.
                        if (problemParams.formatIsDescription && problemParams.format) {
                          problemParams.format = t(problemParams.format, {
                            defaultValue: problemParams.format
                          });
                        }
                        return (
                          <li key={`${issue.attribute}-${issue.language}-${issue.type}`}>
                            {t("{{attribute}} (example \"{{value}}\") {{problem}}.", {
                              attribute: issue.attribute,
                              value: issue.value,
                              problem: t(issue.messageKey, {
                                ...problemParams,
                                defaultValue: issue.messageKey
                              })
                            })}
                            {multiLang ? ` [${issue.language}]` : ""}
                          </li>
                        );
                      })}
                    </Box>
                  </Alert>
                )}

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
                    <Box
                      key={lang}
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        {t("Example")} ({lang})
                      </Typography>
                      <Tooltip
                        title={t(
                          "Enter a sample value that illustrates what valid data looks like for this attribute. Hover over each field to see its expected format rule."
                        )}
                      >
                        <HelpOutlineIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                      </Tooltip>
                    </Box>
                  ))}
                </Box>

                <Divider />

                {attributes.map((row) => {
                  const attrName = row?.Attribute || "";
                  const attrType = row?.Type || "";
                  const attrExamples = exampleData[attrName] || {};
                  // Only use the entry-code dropdown for non-array list attributes.
                  // Array-typed attributes may still be lists, but they hold multiple
                  // values, so we keep them as free-text inputs.
                  const isArrayType = /^Array\[/.test(attrType.trim());
                  const isListAttribute = row?.List === true && !isArrayType;
                  const entryCodeRows = isListAttribute
                    ? getMapValueForAttributeName(entryCodes, attrName) || []
                    : [];
                  const hasEntryCodeOptions = entryCodeRows.some((r) => r?.Code);
                  const formatRule =
                    getMapValueForAttributeName(attributeFormats, attrName) || "";
                  // Show the same human-readable description as the Format Rule
                  // overlay page rather than the raw regex. Built-in rules resolve
                  // to a description; custom regex rules have no description.
                  const formatRuleDescription = getFormatRuleDescription(
                    attrType || "Text",
                    formatRule,
                    t
                  );
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
                            {isListAttribute && ` \u2022 ${t("List")}`}
                          </Typography>
                        )}
                      </Box>
                      {languages.map((lang) => {
                        const val = attrExamples[lang] ?? "";
                        const isErrored = erroredFields.has(`${attrName}||${lang}`);

                        if (isListAttribute && hasEntryCodeOptions) {
                          const options = getEntryCodeOptions(entryCodeRows, lang);
                          return (
                            <TextField
                              key={lang}
                              select
                              size="small"
                              fullWidth
                              error={isErrored}
                              label={multiLang ? lang : t("Example value")}
                              value={options.some((opt) => opt.value === val) ? val : ""}
                              onChange={(e) => handleChange(attrName, lang, e.target.value)}
                              SelectProps={{ displayEmpty: true }}
                              helperText={
                                val
                                  ? undefined
                                  : t("Choose one of this attribute's entry codes.")
                              }
                            >
                              <MenuItem value="">
                                <em>{t("Select a value")}</em>
                              </MenuItem>
                              {options.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          );
                        }

                        return (
                          <TextField
                            key={lang}
                            size="small"
                            fullWidth
                            error={isErrored}
                            label={multiLang ? lang : t("Example value")}
                            value={val}
                            onChange={(e) => handleChange(attrName, lang, e.target.value)}
                            disabled={isListAttribute && !hasEntryCodeOptions}
                            helperText={
                              isListAttribute && !hasEntryCodeOptions
                                ? t(
                                    "Add entry codes for this attribute first to select an example value."
                                  )
                                : undefined
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip
                                    title={
                                      formatRuleDescription
                                        ? t("Format rule: {{rule}}", {
                                            rule: formatRuleDescription
                                          })
                                        : t(
                                            "No format rule has been defined for this attribute."
                                          )
                                    }
                                  >
                                    <HelpOutlineIcon
                                      sx={{ fontSize: 16, color: "#9ca3af" }}
                                    />
                                  </Tooltip>
                                </InputAdornment>
                              )
                            }}
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
