import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  IconButton,
  Modal,
  Popover,
  TextField,
  Grid,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { v4 as uuidv4 } from "uuid";
import { CustomPalette } from "../constants/customPalette";

export const makeBlankMetadata = () => ({ id: "", label: "", location: "", version: "" });
export const makeBlankSource = () => ({
  key: uuidv4(),
  metadata: makeBlankMetadata(),
  rows: []
});

export const DropdownCellRenderer = ({
  value,
  node,
  fieldName,
  options,
  maxTextLength = 25,
  onValueChanged
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || options[0]?.value);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);
    node?.setDataValue(fieldName, newValue);
    setIsDropdownOpen(false);
    if (onValueChanged) onValueChanged();
  };

  useEffect(() => {
    setSelectedValue(value || options[0]?.value);
  }, [value, options]);

  const getDisplayText = (value) => {
    const option = options.find((opt) => opt.value === value);
    const text = option ? option.label : value;
    return text.length > maxTextLength ? `${text.substring(0, maxTextLength)}...` : text;
  };

  const getFullText = (value) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <Box sx={{ height: "100%", display: "flex", alignItems: "center", width: "100%" }}>
      <FormControl fullWidth variant="standard" sx={{ height: "100%" }}>
        <Select
          value={selectedValue}
          onChange={handleChange}
          variant="standard"
          disableUnderline
          title={getFullText(selectedValue)}
          sx={{
            height: "100%",
            fontSize: "small",
            "& .MuiSelect-select": {
              padding: "4px 8px",
              fontSize: "12px",
              color: CustomPalette.GREY_800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.2",
              minHeight: "auto"
            }
          }}
          open={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          onOpen={() => setIsDropdownOpen(true)}
          renderValue={(value) => getDisplayText(value)}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export const DeleteButton = ({ node, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <IconButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onDelete(node.rowIndex)}
      sx={{
        color: isHovered ? CustomPalette.PRIMARY : CustomPalette.GREY_600,
        transition: "all 0.2s ease-in-out",
        padding: "4px",
        "&:hover": {
          backgroundColor: `${CustomPalette.PRIMARY}10`,
          transform: "scale(1.05)"
        }
      }}
    >
      {isHovered ? (
        <DeleteForeverIcon fontSize="small" />
      ) : (
        <DeleteOutlineIcon fontSize="small" />
      )}
    </IconButton>
  );
};

// Modal for manually adding/editing/removing the supporting vocabularies
// referenced by the active tab's primary framing source (e.g. dcterms, foaf
// alongside dcat). Edits are staged locally and only committed on Save, so a
// canceled edit never leaves partial rows behind.
export const ImportsEditorModal = ({ open, onClose, onSave, initialImports }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const nextKeyRef = useRef(0);
  const makeEmptyRow = () => ({
    key: nextKeyRef.current++,
    id: "",
    label: "",
    location: "",
    version: ""
  });

  useEffect(() => {
    if (!open) return;
    nextKeyRef.current = 0;
    const seeded = Object.entries(initialImports || {}).map(([id, imp]) => ({
      key: nextKeyRef.current++,
      id,
      label: imp?.label || "",
      location: imp?.location || "",
      version: imp?.version || ""
    }));
    setRows(seeded.length > 0 ? seeded : [makeEmptyRow()]);
  }, [open, initialImports]);

  const handleFieldChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  };

  const handleRemoveRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const importsObj = {};
    rows.forEach((row) => {
      const id = row.id.trim();
      if (!id) return;
      importsObj[id] = {
        ...(row.label.trim() ? { label: row.label.trim() } : {}),
        ...(row.location.trim() ? { location: row.location.trim() } : {}),
        ...(row.version.trim() ? { version: row.version.trim() } : {})
      };
    });
    onSave(importsObj);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="imports-editor-modal"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(0, 0, 0, 0.3)"
      }}
    >
      <Paper
        sx={{
          width: { xs: "95vw", sm: "90vw", md: "950px" },
          maxWidth: "950px",
          maxHeight: "90vh",
          overflow: "auto",
          p: { xs: 2.5, sm: 4 }
        }}
      >
        <Typography variant="h5" sx={{ color: CustomPalette.PRIMARY, mb: 0.75 }}>
          {t("Manage imported vocabularies")}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
          {t(
            "Add supporting vocabularies referenced by the primary framing source above (for example, dcterms or foaf alongside dcat)."
          )}
        </Typography>

        {rows.map((row, index) => (
          <Grid
            container
            spacing={2.5}
            key={row.key}
            sx={{ mb: 2.5, alignItems: "center" }}
          >
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                label={t("ID")}
                placeholder="dcterms"
                value={row.id}
                onChange={(e) => handleFieldChange(index, "id", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t("Label")}
                placeholder="DCMI Metadata Terms"
                value={row.label}
                onChange={(e) => handleFieldChange(index, "label", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label={t("Location")}
                placeholder="https://..."
                value={row.location}
                onChange={(e) => handleFieldChange(index, "location", e.target.value)}
              />
            </Grid>
            <Grid item xs={9} sm={5} md={2}>
              <TextField
                fullWidth
                label={t("Version")}
                placeholder="1.1"
                value={row.version}
                onChange={(e) => handleFieldChange(index, "version", e.target.value)}
              />
            </Grid>
            <Grid item xs={3} sm={1} md={0.5} sx={{ display: "flex", justifyContent: "center" }}>
              <IconButton
                onClick={() => handleRemoveRow(index)}
                sx={{
                  color: CustomPalette.GREY_600,
                  "&:hover": { color: CustomPalette.PRIMARY }
                }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button
          variant="text"
          onClick={handleAddRow}
          sx={{ color: CustomPalette.PRIMARY, mt: 1, fontSize: "1rem" }}
        >
          + {t("Add import")}
        </Button>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={onClose}
            sx={{
              borderColor: CustomPalette.PRIMARY,
              color: CustomPalette.PRIMARY,
              "&:hover": {
                borderColor: CustomPalette.SECONDARY,
                backgroundColor: CustomPalette.PINK_200
              }
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            sx={{
              backgroundColor: CustomPalette.PRIMARY,
              "&:hover": { backgroundColor: CustomPalette.SECONDARY }
            }}
          >
            {t("Save")}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

// Tab strip for switching between, adding and removing framing sources.
// Removing a source asks for confirmation since it discards that source's rows.
export const FramingSourceTabs = ({
  sources,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  maxWidth = "900px"
}) => {
  const { t } = useTranslation();
  const [removeSourceAnchor, setRemoveSourceAnchor] = useState(null);

  return (
    <>
      <Popover
        open={Boolean(removeSourceAnchor)}
        anchorEl={removeSourceAnchor?.el}
        onClose={() => setRemoveSourceAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, maxWidth: 280 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {t("Remove this framing source and its data? This cannot be undone.")}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button size="small" onClick={() => setRemoveSourceAnchor(null)}>
              {t("Cancel")}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => {
                onRemove(removeSourceAnchor.index);
                setRemoveSourceAnchor(null);
              }}
            >
              {t("Remove")}
            </Button>
          </Box>
        </Box>
      </Popover>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          flexWrap: "wrap",
          width: "100%",
          maxWidth,
          borderBottom: `1px solid ${CustomPalette.GREY_300}`
        }}
      >
        {sources.map((source, index) => {
          const selected = index === activeIndex;
          const label =
            source.metadata?.label || source.metadata?.id || `${t("Source")} ${index + 1}`;
          return (
            <Box
              key={source.key}
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom: "2px solid",
                borderBottomColor: selected ? CustomPalette.PRIMARY : "transparent",
                mb: "-1px"
              }}
            >
              <Button
                onClick={() => onSelect(index)}
                variant="text"
                color="inherit"
                sx={{
                  textTransform: "none",
                  fontWeight: selected ? 600 : 400,
                  borderRadius: 0,
                  px: 1.5,
                  py: 1,
                  minWidth: "auto",
                  color: selected ? CustomPalette.PRIMARY : CustomPalette.GREY_600,
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    color: CustomPalette.PRIMARY
                  }
                }}
              >
                <Typography
                  noWrap
                  variant="body2"
                  sx={{ fontWeight: "inherit", maxWidth: "180px" }}
                >
                  {label}
                </Typography>
              </Button>
              {sources.length > 1 && (
                <IconButton
                  size="small"
                  onClick={(e) => setRemoveSourceAnchor({ el: e.currentTarget, index })}
                  sx={{
                    color: CustomPalette.GREY_600,
                    mr: 0.5,
                    "&:hover": { color: CustomPalette.PRIMARY }
                  }}
                >
                  <CloseIcon sx={{ fontSize: "16px" }} />
                </IconButton>
              )}
            </Box>
          );
        })}
        <Button
          startIcon={<AddIcon />}
          onClick={onAdd}
          variant="text"
          sx={{
            textTransform: "none",
            color: CustomPalette.PRIMARY,
            ml: 1,
            mb: 0.5,
            whiteSpace: "nowrap"
          }}
        >
          {t("Add source")}
        </Button>
      </Box>
    </>
  );
};

// Framing metadata (primary vocabulary) form plus the imported sub-vocabularies
// summary for the active framing source.
export const FramingSourceMetadataPanel = ({
  metadata,
  description,
  onMetadataChange,
  onImportsSave,
  maxWidth = "900px"
}) => {
  const { t } = useTranslation();
  const [showImportsModal, setShowImportsModal] = useState(false);
  const importEntries = Object.entries(metadata.imports || {});

  return (
    <>
      <ImportsEditorModal
        open={showImportsModal}
        onClose={() => setShowImportsModal(false)}
        onSave={onImportsSave}
        initialImports={metadata.imports}
      />
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth,
          p: { xs: 2, sm: 3 },
          borderColor: CustomPalette.GREY_300
        }}
      >
        <Typography variant="h6" sx={{ color: CustomPalette.PRIMARY, mb: 0.5 }}>
          {t("Framing source")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {description}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label={t("ID")}
              placeholder="FOODON"
              value={metadata.id || ""}
              onChange={(e) => onMetadataChange("id", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label={t("Label")}
              placeholder="Food Ontology"
              value={metadata.label || ""}
              onChange={(e) => onMetadataChange("label", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              label={t("Location")}
              placeholder="https://..."
              value={metadata.location || ""}
              onChange={(e) => onMetadataChange("location", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label={t("Version")}
              placeholder="1.0"
              value={metadata.version || ""}
              onChange={(e) => onMetadataChange("version", e.target.value)}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${CustomPalette.GREY_300}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {importEntries.length > 0
              ? `${t("Imported vocabularies")}: ${importEntries
                  .map(([id, imp]) => (imp?.label ? `${id} (${imp.label})` : id))
                  .join(", ")}`
              : t("No supporting vocabularies imported yet")}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowImportsModal(true)}
            sx={{
              borderColor: CustomPalette.PRIMARY,
              color: CustomPalette.PRIMARY,
              whiteSpace: "nowrap",
              "&:hover": {
                borderColor: CustomPalette.SECONDARY,
                backgroundColor: CustomPalette.PINK_200
              }
            }}
          >
            {t("Add import")}
          </Button>
        </Box>
      </Paper>
    </>
  );
};
