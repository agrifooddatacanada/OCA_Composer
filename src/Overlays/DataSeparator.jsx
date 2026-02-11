import React, { useContext, useMemo, useState } from "react";
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
import { FIELD_DECIMAL_SEPARATOR_OVERLAY } from "../constants/constants";

const SectionTitle = ({ checked, onChange, title, help }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />}
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
  const { 
    setCurrentPage, 
    setOverlay, 
    setSelectedOverlay, 
    attributeRowData,
    decimalSeparator,
    setDecimalSeparator
  } = useContext(Context);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Section toggles
  const [enableDecimalSeparator, setEnableDecimalSeparator] = useState(true);
  const [enableFileDelimiter, setEnableFileDelimiter] = useState(true);
  const hasArrayAttributes = useMemo(
    () => attributeRowData?.some((row) => String(row?.Type || "").startsWith("Array[")),
    [attributeRowData]
  );
  const [enableArrayDelimiter, setEnableArrayDelimiter] = useState(hasArrayAttributes);

  // Values
  const [fieldDelimiter, setFieldDelimiter] = useState("comma"); // comma | tab | semicolon | pipe
  const [quoteChar, setQuoteChar] = useState("\"");
  const [escapeChar, setEscapeChar] = useState("\\");
  const [lineTerminator, setLineTerminator] = useState("lf"); // lf | crlf
  const [dataStartRow, setDataStartRow] = useState(1);
  const [arrayDelimiter, setArrayDelimiter] = useState(";");


  // const handleSave = () => {
  // };
  const handleForward = () => {
    // This code was copied from range overlay, might be used if we add validation to this overlay
    // const hasValidationError = Object.values(errors).some((attrErrors) =>
    //   Object.values(attrErrors).some((isError) => isError)
    // );

    // if (hasValidationError) {
    //   setShowValidationError(true);
    //   setTimeout(() => {
    //     setShowValidationError(false);
    //   }, 3000);
    //   return;
    // }

    // handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };
  const handleBack = () => {
    setShowDeleteConfirmation(true);
  };

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      [FIELD_DECIMAL_SEPARATOR_OVERLAY]: {
        ...prev[FIELD_DECIMAL_SEPARATOR_OVERLAY],
        selected: false
      }
    }));
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={handleBack}
      backText={t("Remove overlay")}
    >
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
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
                value={decimalSeparator || "."}
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
                  <MenuItem value="comma">{t("Comma (,)")}</MenuItem>
                  <MenuItem value="tab">{t("Tab (\\t)")}</MenuItem>
                  <MenuItem value="semicolon">{t("Semicolon (;)")}</MenuItem>
                  <MenuItem value="pipe">{t("Pipe (|)")}</MenuItem>
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
                inputProps={{ min: 1 }}
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
              title="Array Delimiter"
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
              <Box sx={{ mt: 2 }}>
                <TextField
                  disabled={!enableArrayDelimiter}
                  label={t("Array delimiter")}
                  value={arrayDelimiter}
                  onChange={(e) => setArrayDelimiter(e.target.value)}
                  helperText={t("Single character, e.g., ; or |")}
                  inputProps={{ maxLength: 1 }}
                  fullWidth
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </BackNextSkeleton>
  );
};

export default DataSeparator;