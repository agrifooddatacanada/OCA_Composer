import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Divider
} from "@mui/material";
import { useTranslation } from "react-i18next";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BackNextSkeleton from "../components/BackNextSkeleton";
import DeleteConfirmation from "./DeleteConfirmation";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { FIELD_DATA_SEPARATOR_OVERLAY } from "../constants/constants";

const DEFAULT_FILE_DELIMITER_DATA = {
  fieldDelimiter: ",",
  quoteChar: "\"",
  escapeChar: "\\",
  lineTerminator: "lf",
  dataStartRow: 1
};

const SectionTitle = ({ checked, onChange, title, help }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={!!checked}
            onChange={(e) => {
              if (typeof onChange === "function") {
                onChange(e.target.checked);
              }
            }}
          />
        }
        label={<Typography variant="h6">{t(title)}</Typography>}
      />
      <Tooltip title={t(help || "")}>
        <HelpOutlineIcon sx={{ fontSize: 18, color: "#6b7280" }} />
      </Tooltip>
    </Box>
  );
};

const DataSeparator = () => {
  const { t } = useTranslation();
  const { setCurrentPage, setSelectedOverlay } = useContext(Context);
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_DATA_SEPARATOR_OVERLAY);

  const attributeRowData = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );
  const decimalSeparator = schemaState?.decimalSeparator || ".";
  const fileDelimiterData = useMemo(
    () => ({ ...DEFAULT_FILE_DELIMITER_DATA, ...(schemaState?.fileDelimiterData || {}) }),
    [schemaState?.fileDelimiterData]
  );
  const arrayDelimiterData = useMemo(() => {
    const data = schemaState?.arrayDelimiterData;
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      return data;
    }
    return {};
  }, [schemaState?.arrayDelimiterData]);

  const enableDecimalSeparator = !!schemaState?.enableDecimalSeparator;
  const enableFileDelimiter = !!schemaState?.enableFileDelimiter;
  const enableArrayDelimiter = !!schemaState?.enableArrayDelimiter;

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const hasArrayAttributes = useMemo(
    () => attributeRowData.some((row) => String(row?.Type || "").startsWith("Array[")),
    [attributeRowData]
  );
  const arrayAttributes = useMemo(
    () =>
      attributeRowData
        .filter((row) => String(row?.Type || "").startsWith("Array["))
        .map((row) => row.Attribute),
    [attributeRowData]
  );

  const [fieldDelimiter, setFieldDelimiter] = useState(fileDelimiterData.fieldDelimiter);
  const [quoteChar, setQuoteChar] = useState(fileDelimiterData.quoteChar);
  const [escapeChar, setEscapeChar] = useState(fileDelimiterData.escapeChar);
  const [lineTerminator, setLineTerminator] = useState(fileDelimiterData.lineTerminator);
  const [dataStartRow, setDataStartRow] = useState(fileDelimiterData.dataStartRow);

  const FIELD_DELIMITER_OPTIONS = useMemo(
    () => [
      { value: ",", labelKey: "Comma ( , )" },
      { value: "\t", labelKey: "Tab (\\t)" },
      { value: ";", labelKey: "Semicolon ( ; )" },
      { value: "|", labelKey: "Pipe ( | )" }
    ],
    []
  );

  const currentDecimal = decimalSeparator || ".";
  const availableFieldDelimiterOptions = useMemo(
    () => FIELD_DELIMITER_OPTIONS.filter((opt) => opt.value !== currentDecimal),
    [FIELD_DELIMITER_OPTIONS, currentDecimal]
  );

  useEffect(() => {
    const availableValues = availableFieldDelimiterOptions.map((o) => o.value);
    if (!availableValues.includes(fieldDelimiter)) {
      setFieldDelimiter(availableValues[0] ?? fieldDelimiter);
    }
  }, [currentDecimal, availableFieldDelimiterOptions, fieldDelimiter]);

  const setDecimalSeparator = (value) => {
    updateSchema({ decimalSeparator: value });
  };

  const setEnableDecimalSeparator = (value) => {
    updateSchema({ enableDecimalSeparator: value });
  };

  const setEnableFileDelimiter = (value) => {
    updateSchema({ enableFileDelimiter: value });
  };

  const setEnableArrayDelimiter = (value) => {
    updateSchema({ enableArrayDelimiter: value });
  };

  const setArrayDelimiterForAttribute = (attrName, value) => {
    updateSchema({
      arrayDelimiterData: {
        ...arrayDelimiterData,
        [attrName]: value
      }
    });
  };

  const persistFileDelimiterData = () => {
    updateSchema({
      fileDelimiterData: {
        fieldDelimiter,
        quoteChar,
        escapeChar,
        lineTerminator,
        dataStartRow
      }
    });
  };

  const handleForward = () => {
    persistFileDelimiterData();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleLeaveToOverlays = () => {
    persistFileDelimiterData();
    setCurrentPage("Overlays");
  };

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={handleLeaveToOverlays}
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
          maxWidth: 720
        }}
      >
        {/* Decimal Separator */}
        <Card variant="outlined">
          <CardContent>
            <SectionTitle
              checked={enableDecimalSeparator}
              onChange={setEnableDecimalSeparator}
              title="Decimal Separator"
              help="Select how decimals are represented in numeric values."
            />
            <Divider sx={{ my: 1 }} />
            <FormControl fullWidth disabled={!enableDecimalSeparator} sx={{ mt: 2 }}>
              <InputLabel id="decimal-separator-label">
                {t("Choose decimal separator")}
              </InputLabel>
              <Select
                labelId="decimal-separator-label"
                label={t("Choose decimal separator")}
                value={currentDecimal}
                onChange={(e) => setDecimalSeparator(e.target.value)}
              >
                <MenuItem value=".">{t("Dot ( . )")}</MenuItem>
                <MenuItem value=",">{t("Comma ( , )")}</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* File Delimiter */}
        <Card variant="outlined">
          <CardContent>
            <SectionTitle
              checked={enableFileDelimiter}
              onChange={setEnableFileDelimiter}
              title="File Delimiter (CSV / TSV)"
              help="Configure how fields and lines are delimited in flat files."
            />
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mt: 2
              }}
            >
              <FormControl fullWidth disabled={!enableFileDelimiter}>
                <InputLabel id="field-delimiter-label">{t("Field delimiter")}</InputLabel>
                <Select
                  labelId="field-delimiter-label"
                  label={t("Field delimiter")}
                  value={fieldDelimiter}
                  onChange={(e) => setFieldDelimiter(e.target.value)}
                >
                  {availableFieldDelimiterOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                disabled={!enableFileDelimiter}
                label={t("Quote character")}
                value={quoteChar}
                onChange={(e) => setQuoteChar(e.target.value)}
                inputProps={{ maxLength: 1 }}
                fullWidth
              />

              <TextField
                disabled={!enableFileDelimiter}
                label={t("Escape character")}
                value={escapeChar}
                onChange={(e) => setEscapeChar(e.target.value)}
                inputProps={{ maxLength: 1 }}
                fullWidth
              />

              <FormControl fullWidth disabled={!enableFileDelimiter}>
                <InputLabel id="line-terminator-label">{t("Line terminator")}</InputLabel>
                <Select
                  labelId="line-terminator-label"
                  label={t("Line terminator")}
                  value={lineTerminator}
                  onChange={(e) => setLineTerminator(e.target.value)}
                >
                  <MenuItem value="lf">{t("LF (\\n)")}</MenuItem>
                  <MenuItem value="crlf">{t("CRLF (\\r\\n)")}</MenuItem>
                </Select>
              </FormControl>

              <TextField
                disabled={!enableFileDelimiter}
                type="number"
                label={t("Data start row")}
                value={dataStartRow}
                onChange={(e) =>
                  setDataStartRow(Math.max(1, Number.parseInt(e.target.value || 1, 10)))
                }
                fullWidth
              />
            </Box>
          </CardContent>
        </Card>

        {/* Array Delimiter */}
        <Card variant="outlined">
          <CardContent>
            <SectionTitle
              checked={enableArrayDelimiter && hasArrayAttributes}
              onChange={setEnableArrayDelimiter}
              title="Array delimiter"
              help="Delimits values inside array attributes."
            />
            <Divider sx={{ my: 1 }} />
            {!hasArrayAttributes ? (
              <Box
                sx={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: 1,
                  px: 2,
                  py: 1
                }}
              >
                <Typography variant="body2">
                  {t("There are no array attributes in your dataset.")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {arrayAttributes.map((attrName) => (
                  <Box
                    key={attrName}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      alignItems: "center"
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {attrName}
                    </Typography>
                    <FormControl fullWidth disabled={!enableArrayDelimiter} size="small">
                      <InputLabel id={`array-delimiter-${attrName}`}>
                        {t("Delimiter")}
                      </InputLabel>
                      <Select
                        labelId={`array-delimiter-${attrName}`}
                        label={t("Delimiter")}
                        value={arrayDelimiterData[attrName] ?? ","}
                        onChange={(e) =>
                          setArrayDelimiterForAttribute(attrName, e.target.value)
                        }
                      >
                        {FIELD_DELIMITER_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </BackNextSkeleton>
  );
};

export default DataSeparator;
