// TODO: change to framing_justification instead of mapping_justification.
// !Important: in generating extension input object if the term_id is empty we don't include it.

import React, {
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
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
import { AgGridReact } from "../components/AgGridReact";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import { getAllGridRowData } from "./gridUtils";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import {
  BETWEEN_SECTION_SPACING,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS
} from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";

// Shared with DropdownCellRenderer so its onChange handler can reach the
// currently mounted AttributeFraming grid's API to commit edits.
let globalGridRef = null;

const MAX_TEXT_WIDTH = "600px";

const makeBlankMetadata = () => ({ id: "", label: "", location: "", version: "" });
const makeBlankSource = () => ({
  key: uuidv4(),
  metadata: makeBlankMetadata(),
  rows: []
});

const DropdownCellRenderer = ({
  value,
  rowIndex,
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

    if (globalGridRef && globalGridRef.current && globalGridRef.current.api) {
      const node = globalGridRef.current.api.getRowNode(rowIndex);
      if (node) {
        node.setDataValue(fieldName, newValue);
      }
    }
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

const DeleteButton = ({ node, onDelete }) => {
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
// alongside dcat). Edits are staged locally and only committed to schema
// state on Save, so a canceled edit never leaves partial rows behind.
const ImportsEditorModal = ({ open, onClose, onSave, initialImports }) => {
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

const AttributeFraming = forwardRef((_props, ref) => {
  const {
    setCurrentPage
  } = useContext(Context);

  const {
    getSchema,
    getCurrentSchemaId,
    updateSchema,
    setSelectedOverlay
  } = useMultiSchema();

  const schemaState = getSchema();
  const currentSchemaId = getCurrentSchemaId();
  const attributes = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );

  // Each attribute can be framed against several independent vocabularies at
  // once (e.g. FOODON and ENVO), so framing sources live in local state as a
  // tabbed list, mirrored into schema state on every edit - same pattern used
  // by FormBuilder for its per-schema "pages" list. There is always at least
  // one source once this overlay's page is open (an empty tab list would
  // leave the user with nothing to edit); the "Add source" button is for the
  // 2nd and later sources.
  const [sources, setSourcesLocal] = useState(() => {
    const persisted = schemaState?.attributeFramingSources;
    return Array.isArray(persisted) && persisted.length > 0
      ? persisted
      : [makeBlankSource()];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const lastSyncedSchemaIdRef = useRef(currentSchemaId);

  // Re-seed the local tab list whenever the active schema changes (multi-schema
  // packages), mirroring FormBuilder's schema-switch re-seed effect.
  useEffect(() => {
    if (lastSyncedSchemaIdRef.current === currentSchemaId) return;
    lastSyncedSchemaIdRef.current = currentSchemaId;
    const persisted = schemaState?.attributeFramingSources;
    setSourcesLocal(
      Array.isArray(persisted) && persisted.length > 0
        ? persisted
        : [makeBlankSource()]
    );
    setActiveIndex(0);
    // schemaState intentionally not in deps: this effect is strictly a
    // schema-switch hook, not a "keep sources mirrored to schemaState" loop
    // (applySources owns that direction).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchemaId]);

  // Mutates local tab list AND mirrors it into global schemaState in the same tick.
  const applySources = useCallback(
    (updaterOrValue) => {
      setSourcesLocal((prev) => {
        const next =
          typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        updateSchema({ attributeFramingSources: next });
        return next;
      });
    },
    [updateSchema]
  );

  const updateActiveSource = useCallback(
    (updater) => {
      applySources((prev) =>
        prev.map((source, index) =>
          index === activeIndex ? { ...source, ...updater(source) } : source
        )
      );
    },
    [applySources, activeIndex]
  );

  const activeSource = sources[activeIndex] || sources[0] || null;
  const activeMetadata = activeSource?.metadata || makeBlankMetadata();

  // Reconcile the active source's persisted rows with the current attribute
  // list so every schema attribute always has a row here - framed or not.
  // Without this, attributes that have no framing yet (e.g. because the
  // imported OCA package's attribute_framing overlay only lists attributes
  // that ARE framed) would simply be missing from the grid, and "all
  // attributes are framed" would be computed over that incomplete subset.
  const activeRowData = useMemo(() => {
    const persisted = Array.isArray(activeSource?.rows) ? activeSource.rows : [];
    const persistedByAttribute = new Map(persisted.map((row) => [row.Attribute, row]));
    return attributes
      .filter((attr) => attr?.Attribute && String(attr.Attribute).trim() !== "")
      .map((attr) => {
        const existing = persistedByAttribute.get(attr.Attribute);
        return (
          existing || {
            Attribute: attr.Attribute,
            objectId: "",
            description: "",
            predicateId: "",
            mappingJustification: ""
          }
        );
      });
  }, [activeSource, attributes]);

  const setActiveRowData = useCallback(
    (rows) => {
      updateActiveSource(() => ({ rows }));
    },
    [updateActiveSource]
  );

  const handleMetadataChange = useCallback(
    (field, value) => {
      updateActiveSource((source) => ({
        metadata: { ...(source.metadata || makeBlankMetadata()), [field]: value }
      }));
    },
    [updateActiveSource]
  );

  const handleImportsSave = useCallback(
    (importsObj) => {
      updateActiveSource((source) => ({
        metadata: { ...(source.metadata || makeBlankMetadata()), imports: importsObj }
      }));
    },
    [updateActiveSource]
  );

  const handleAddSource = useCallback(() => {
    const next = [...sources, makeBlankSource()];
    applySources(next);
    setActiveIndex(next.length - 1);
  }, [sources, applySources]);

  const handleRemoveSource = useCallback(
    (index) => {
      if (sources.length <= 1) return;
      const next = sources.filter((_, i) => i !== index);
      applySources(next);
      setActiveIndex((current) => {
        if (index < current) return current - 1;
        if (index === current) return Math.min(current, next.length - 1);
        return current;
      });
    },
    [sources, applySources]
  );

  const { t, i18n } = useTranslation();
  const gridRef = useRef();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showImportsModal, setShowImportsModal] = useState(false);
  const [gridReady, setGridReady] = useState(false);
  const [removeSourceAnchor, setRemoveSourceAnchor] = useState(null);

  // Use centralized delete handler
  const deleteHandler = useDeleteOverlayHandler(FIELD_ATTRIBUTE_FRAMING_OVERLAY);

  // Unframed-attributes status is purely derived from the active tab's rows -
  // no need to persist it in schema state.
  const { frameAllAttributes, unframedAttributeList } = useMemo(() => {
    if (activeRowData.length === 0) {
      return { frameAllAttributes: false, unframedAttributeList: [] };
    }
    const unframed = activeRowData
      .filter((row) => !row.objectId || row.objectId.trim() === "")
      .map((row) => row.Attribute);
    const allFramed = activeRowData.every(
      (row) => row.objectId && row.objectId.trim() !== ""
    );
    return { frameAllAttributes: allFramed, unframedAttributeList: unframed };
  }, [activeRowData]);

  const hasUnframedAttributes = unframedAttributeList.length > 0;

  // Commit whatever is currently displayed in the grid back into schema state.
  // Wired to every editable/selectable column so manual edits are persisted
  // as the user works, not just on navigation.
  const handleCellChanged = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const displayedRows = getAllGridRowData(api);
    if (displayedRows.length === 0) return;
    setActiveRowData(displayedRows);
  }, [setActiveRowData]);

  // Every schema attribute always has a row (see activeRowData above), so
  // "delete" clears this attribute's framing rather than removing the row -
  // otherwise it would just reappear blank on the next render.
  const handleDelete = useCallback(
    (rowIndex) => {
      const updatedRowData = activeRowData.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              objectId: "",
              description: "",
              predicateId: "",
              mappingJustification: ""
            }
          : row
      );
      setActiveRowData(updatedRowData);
    },
    [activeRowData, setActiveRowData]
  );

  const predicateOptions = useMemo(
    () => [
      { value: "", label: t("Select a predicate...") },
      ...ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch
    ],
    [t]
  );

  const justificationOptions = useMemo(
    () => [
      { value: "", label: t("Select a justification...") },
      ...ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification
    ],
    [t]
  );

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Subject"),
          helpText: t("Name for the attribute and, for example, the column header in every tabular data set no matter what language")
        }
      },
      {
        field: "predicateId",
        width: 190,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        cellRenderer: DropdownCellRenderer,
        cellRendererParams: {
          fieldName: "predicateId",
          options: predicateOptions,
          maxTextLength: 30,
          onValueChanged: handleCellChanged
        },
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Predicate"),
          helpText: t("Mapping vocabulary to reasonate the relationship between the attribute and ontologies terms")
        }
      },
      {
        field: "objectId",
        width: 220,
        autoHeight: true,
        editable: true,
        singleClickEdit: true,
        cellStyle: preWrapWordBreak,
        onCellValueChanged: handleCellChanged,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t("Ontology term identifier for this attribute, entered manually (e.g. FOODON:00002403)")
        }
      },
      {
        field: "description",
        width: 380,
        autoHeight: true,
        editable: true,
        singleClickEdit: true,
        cellStyle: preWrapWordBreak,
        onCellValueChanged: handleCellChanged,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          helpText: t("Definition")
        }
      },
      {
        field: "mappingJustification",
        width: 260,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        cellRenderer: DropdownCellRenderer,
        cellRendererParams: {
          fieldName: "mappingJustification",
          options: justificationOptions,
          maxTextLength: 35,
          onValueChanged: handleCellChanged
        },
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Framing Justification"),
          helpText: t("Framing Justification")
        }
      },
      {
        headerName: t("Delete"),
        field: "delete",
        width: 70,
        cellRendererFramework: DeleteButton,
        cellRendererParams: {
          onDelete: handleDelete
        },
        cellStyle: () => ({
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        })
      }
    ],
    [t, handleDelete, predicateOptions, justificationOptions, handleCellChanged]
  );

  const importEntries = useMemo(
    () => Object.entries(activeMetadata.imports || {}),
    [activeMetadata.imports]
  );

  const unframedAttributesText = frameAllAttributes
    ? t("All attributes are framed")
    : hasUnframedAttributes
      ? `${t("Unframed attributes")}: [${unframedAttributeList.join(", ")}]`
      : t("No attributes to frame");

  const handleSave = useCallback(() => {
    if (!gridReady || !gridRef.current?.api) {
      console.warn("Grid not ready for save operation");
      return;
    }

    try {
      gridRef.current.api.stopEditing();
      const rowData = getAllGridRowData(gridRef.current.api);
      if (rowData.length > 0) {
        setActiveRowData(rowData);
      }
    } catch (error) {
      console.error("Error saving grid data:", error);
    }
  }, [gridReady, setActiveRowData]);

  useImperativeHandle(
    ref,
    () => ({
      save: handleSave
    }),
    [handleSave]
  );

  const handleLeaveToOverlays = useCallback(() => {
    handleSave();
    setCurrentPage("Overlays");
  }, [handleSave, setCurrentPage]);

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const onGridReady = useCallback(() => {
    globalGridRef = gridRef;
    setGridReady(true);
  }, []);

  return (
    <BackNextSkeleton
      isForward
      isBack
      pageForward={handleForward}
      pageBack={handleLeaveToOverlays}
    >
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <ImportsEditorModal
        open={showImportsModal}
        onClose={() => setShowImportsModal(false)}
        onSave={handleImportsSave}
        initialImports={activeMetadata.imports}
      />
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
                handleRemoveSource(removeSourceAnchor.index);
                setRemoveSourceAnchor(null);
              }}
            >
              {t("Remove")}
            </Button>
          </Box>
        </Box>
      </Popover>
      <Box sx={{ my: "2rem", mb: BETWEEN_SECTION_SPACING }}>
        <Box
          sx={{
            margin: { xs: "1rem", sm: "2rem" },
            gap: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            overflow: "visible"
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              flexWrap: "wrap",
              width: "100%",
              maxWidth: "900px",
              borderBottom: `1px solid ${CustomPalette.GREY_300}`
            }}
          >
            {sources.map((source, index) => {
              const selected = index === activeIndex;
              const label =
                source.metadata?.label ||
                source.metadata?.id ||
                `${t("Source")} ${index + 1}`;
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
                    onClick={() => setActiveIndex(index)}
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
                      onClick={(e) =>
                        setRemoveSourceAnchor({ el: e.currentTarget, index })
                      }
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
              onClick={handleAddSource}
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

          <Paper
            variant="outlined"
            sx={{
              width: "100%",
              maxWidth: "900px",
              p: { xs: 2, sm: 3 },
              borderColor: CustomPalette.GREY_300
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: CustomPalette.PRIMARY, mb: 0.5 }}
            >
              {t("Framing source")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mb: 2 }}
            >
              {t(
                "Describe the ontology or vocabulary these attributes are framed against. This is stored as the overlay's framing metadata."
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("ID")}
                  placeholder="FOODON"
                  value={activeMetadata.id || ""}
                  onChange={(e) => handleMetadataChange("id", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Label")}
                  placeholder="Food Ontology"
                  value={activeMetadata.label || ""}
                  onChange={(e) => handleMetadataChange("label", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Location")}
                  placeholder="https://..."
                  value={activeMetadata.location || ""}
                  onChange={(e) => handleMetadataChange("location", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Version")}
                  placeholder="1.0"
                  value={activeMetadata.version || ""}
                  onChange={(e) => handleMetadataChange("version", e.target.value)}
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

          {/* <Box
            sx={{
              textAlign: "center",
              fontSize: "0.9rem",
              color: "text.secondary",
              maxWidth: MAX_TEXT_WIDTH,
              wordWrap: "break-word"
            }}
          >
            {unframedAttributesText}
          </Box> */}

          <Box
            className="ag-theme-balham"
            sx={{
              width: "100%",
              minWidth: "1230px",
              overflowX: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <style>{gridStyles}</style>
            <AgGridReact
              key={`${activeSource?.key}-${i18n.language}`}
              ref={gridRef}
              rowData={activeRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressRowHoverHighlight
              stopEditingWhenCellsLoseFocus
              suppressHorizontalScroll={false}
              onGridReady={onGridReady}
              overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            />
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
});

AttributeFraming.displayName = "AttributeFraming";

export default AttributeFraming;
