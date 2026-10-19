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
import { Box, Button, Grid, IconButton, Modal, Paper, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
import {
  DeleteButton,
  DropdownCellRenderer,
  FramingSourceMetadataPanel,
  FramingSourceTabs,
  makeBlankMetadata,
  makeBlankSource
} from "./FramingComponents";
import { CustomPalette } from "../constants/customPalette";

const MAX_TEXT_WIDTH = "600px";

const FRAMING_DROPDOWN_CELL_CLASS = "framing-dropdown-cell";

// autoHeight wraps the renderer in shrink-to-fit wrappers; stretch them so the
// Select (and its arrow) spans the full cell width.
const framingDropdownCellCss = `
.ag-cell.${FRAMING_DROPDOWN_CELL_CLASS} .ag-cell-wrapper,
.ag-cell.${FRAMING_DROPDOWN_CELL_CLASS} .ag-cell-value {
  width: 100%;
  min-width: 0;
}
`;

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
  const [gridReady, setGridReady] = useState(false);

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
        cellClass: FRAMING_DROPDOWN_CELL_CLASS,
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
        cellClass: FRAMING_DROPDOWN_CELL_CLASS,
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
          <FramingSourceTabs
            sources={sources}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={handleAddSource}
            onRemove={handleRemoveSource}
          />

          <FramingSourceMetadataPanel
            metadata={activeMetadata}
            description={t(
              "Describe the ontology or vocabulary these attributes are framed against. This is stored as the overlay's framing metadata."
            )}
            onMetadataChange={handleMetadataChange}
            onImportsSave={handleImportsSave}
          />

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
            <style>{framingDropdownCellCss}</style>
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
