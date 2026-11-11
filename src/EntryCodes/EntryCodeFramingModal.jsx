import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Modal, Paper, Typography } from "@mui/material";
import { AgGridReact } from "../components/AgGridReact";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import { ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS } from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";
import { getAllGridRowData } from "../Overlays/gridUtils";
import {
  DeleteButton,
  DropdownCellRenderer,
  FramingSourceMetadataPanel,
  FramingSourceTabs,
  makeBlankMetadata,
  makeBlankSource
} from "../Overlays/FramingComponents";

// gridStyles centers cell content, which shrinks the dropdown to its text and
// leaves the arrow right after the label; stretch it so the arrow sits at the
// cell's right edge, with room reserved so long values don't run under it.
const DROPDOWN_CELL_CLASS = "entry-code-framing-dropdown-cell";
const dropdownCellStyles = `
.${DROPDOWN_CELL_CLASS} .ag-cell-wrapper,
.${DROPDOWN_CELL_CLASS} .ag-cell-value {
  width: 100%;
}
.${DROPDOWN_CELL_CLASS} .MuiSelect-select.MuiSelect-select {
  padding-right: 24px;
}
`;

const makeBlankRow = (code) => ({
  Code: code,
  objectId: "",
  description: "",
  predicateId: "",
  mappingJustification: ""
});

const toStoredRow = ({ Code, objectId, description, predicateId, mappingJustification }) => ({
  Code,
  objectId: objectId || "",
  description: description || "",
  predicateId: predicateId || "",
  mappingJustification: mappingJustification || ""
});

const isFramedRow = (row) => String(row?.objectId ?? "").trim() !== "";

const hasContent = (source) => {
  const meta = source?.metadata || {};
  return (
    ["id", "label", "location", "version"].some((f) => String(meta[f] ?? "").trim()) ||
    Object.keys(meta.imports || {}).length > 0 ||
    (source?.rows || []).some(isFramedRow)
  );
};

// Framing stored for codes that are not currently displayed (e.g. temporarily
// removed from the list) is kept rather than dropped.
const mergeRows = (source, displayedRows) => {
  const displayedByCode = new Map(displayedRows.map((row) => [row.Code, toStoredRow(row)]));
  const kept = (source.rows || []).filter((row) => !displayedByCode.has(row.Code));
  return [...kept, ...displayedByCode.values()];
};

// Popup editor for framing one attribute's entry code list against one or more
// vocabularies. Edits are staged locally and only handed to onSave on Save.
const EntryCodeFramingModal = ({
  open,
  onClose,
  onSave,
  attributeName,
  codes,
  initialSources,
  sourceSuggestions = []
}) => {
  const { t, i18n } = useTranslation();
  const gridRef = useRef();
  const [sources, setSources] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSources(
      Array.isArray(initialSources) && initialSources.length > 0
        ? initialSources
        : [makeBlankSource()]
    );
    setActiveIndex(0);
    setError("");
  }, [open, initialSources]);

  const activeSource = sources[activeIndex] || sources[0] || null;
  const activeMetadata = activeSource?.metadata || makeBlankMetadata();

  // Every code currently in the list gets a row, framed or not.
  const activeRowData = useMemo(() => {
    const persisted = Array.isArray(activeSource?.rows) ? activeSource.rows : [];
    const persistedByCode = new Map(persisted.map((row) => [row.Code, row]));
    return codes.map(({ Code, label }) => ({
      ...(persistedByCode.get(Code) || makeBlankRow(Code)),
      Label: label
    }));
  }, [activeSource, codes]);

  const updateActiveSource = useCallback(
    (updater) => {
      setSources((prev) =>
        prev.map((source, index) =>
          index === activeIndex ? { ...source, ...updater(source) } : source
        )
      );
    },
    [activeIndex]
  );

  const setActiveRowData = useCallback(
    (displayedRows) => {
      updateActiveSource((source) => ({ rows: mergeRows(source, displayedRows) }));
    },
    [updateActiveSource]
  );

  const handleCellChanged = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    setActiveRowData(getAllGridRowData(api));
  }, [setActiveRowData]);

  const handleDelete = useCallback(
    (rowIndex) => {
      setActiveRowData(
        activeRowData.map((row, index) =>
          index === rowIndex ? { ...makeBlankRow(row.Code), Label: row.Label } : row
        )
      );
    },
    [activeRowData, setActiveRowData]
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

  const availableSuggestions = useMemo(() => {
    const idsInOtherTabs = new Set(
      sources
        .filter((_, index) => index !== activeIndex)
        .map((source) => String(source.metadata?.id ?? "").trim())
        .filter(Boolean)
    );
    return sourceSuggestions.filter(
      (suggestion) => !idsInOtherTabs.has(String(suggestion.metadata.id).trim())
    );
  }, [sourceSuggestions, sources, activeIndex]);

  const handleApplySuggestion = useCallback(
    (metadata) => {
      updateActiveSource(() => ({
        metadata: {
          id: metadata.id || "",
          label: metadata.label || "",
          location: metadata.location || "",
          version: metadata.version || "",
          ...(metadata.imports ? { imports: JSON.parse(JSON.stringify(metadata.imports)) } : {})
        }
      }));
    },
    [updateActiveSource]
  );

  const handleAddSource = () => {
    setSources((prev) => [...prev, makeBlankSource()]);
    setActiveIndex(sources.length);
  };

  const handleRemoveSource = (index) => {
    if (sources.length <= 1) return;
    const next = sources.filter((_, i) => i !== index);
    setSources(next);
    setActiveIndex((current) => {
      if (index < current) return current - 1;
      if (index === current) return Math.min(current, next.length - 1);
      return current;
    });
  };

  const handleSave = () => {
    // The last edit may still be in the grid rather than in `sources`.
    let finalSources = sources;
    const api = gridRef.current?.api;
    if (api && activeSource) {
      api.stopEditing();
      const displayedRows = getAllGridRowData(api);
      finalSources = sources.map((source, index) =>
        index === activeIndex ? { ...source, rows: mergeRows(source, displayedRows) } : source
      );
    }

    const kept = finalSources.filter(hasContent);
    const seenIds = new Set();
    for (const source of kept) {
      const id = String(source.metadata?.id ?? "").trim();
      if (!id) {
        setError(t("Each framing source needs an ID."));
        return;
      }
      if (seenIds.has(id)) {
        setError(t("Each framing source needs a unique ID."));
        return;
      }
      seenIds.add(id);
    }

    onSave(kept);
    onClose();
  };

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
        field: "Code",
        width: 130,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Subject"),
          helpText: t("The entry code being framed")
        }
      },
      {
        field: "Label",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Label"),
          helpText: t("The label of the entry code in the first schema language")
        }
      },
      {
        field: "predicateId",
        width: 180,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        cellClass: DROPDOWN_CELL_CLASS,
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
          helpText: t("Relationship between the entry code and the vocabulary term")
        }
      },
      {
        field: "objectId",
        width: 180,
        autoHeight: true,
        editable: true,
        singleClickEdit: true,
        cellStyle: preWrapWordBreak,
        onCellValueChanged: handleCellChanged,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t("Vocabulary term identifier for this entry code, entered manually (e.g. SNOMEDCT:119361006)")
        }
      },
      {
        field: "description",
        width: 260,
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
        width: 240,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        cellClass: DROPDOWN_CELL_CLASS,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="entry-code-framing-modal"
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
          width: "95vw",
          maxWidth: "1260px",
          maxHeight: "90vh",
          overflow: "auto",
          p: { xs: 2.5, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Typography
            id="entry-code-framing-modal"
            variant="h5"
            sx={{ color: CustomPalette.PRIMARY, mb: 0.75 }}
          >
            {t("Entry code framing")}: {attributeName}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {t(
              "Frame the entry codes of this list to terms from an ontology or controlled vocabulary. Not every code must be framed."
            )}
          </Typography>
        </Box>

        <FramingSourceTabs
          sources={sources}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={handleAddSource}
          onRemove={handleRemoveSource}
          maxWidth="100%"
        />

        <FramingSourceMetadataPanel
          metadata={activeMetadata}
          description={t(
            "Describe the ontology or vocabulary these entry codes are framed against. This is stored as the overlay's framing metadata."
          )}
          onMetadataChange={handleMetadataChange}
          onImportsSave={handleImportsSave}
          suggestions={availableSuggestions}
          onApplySuggestion={handleApplySuggestion}
          maxWidth="100%"
        />

        <Box
          className="ag-theme-balham"
          sx={{
            width: "100%",
            overflowX: "auto",
            border: "1px solid #ddd",
            borderRadius: "4px"
          }}
        >
          <style>{gridStyles}</style>
          <style>{dropdownCellStyles}</style>
          <AgGridReact
            key={`${activeSource?.key}-${i18n.language}`}
            ref={gridRef}
            rowData={activeRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressRowHoverHighlight
            stopEditingWhenCellsLoseFocus
            suppressHorizontalScroll={false}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("Add entry codes to this list before framing them.")}</span>`}
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2
          }}
        >
          {error && (
            <Typography variant="body2" sx={{ color: "error.main", mr: "auto" }}>
              {error}
            </Typography>
          )}
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

export default EntryCodeFramingModal;
