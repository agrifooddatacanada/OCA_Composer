import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Tooltip,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AgGridReact } from "../components/AgGridReact";
import CellHeader from "../components/CellHeader";
import AccordionItemWrapper from "../Landing/AccordionItemWrapper";
import usePrimaryColor from "../hooks/usePrimaryColor";
import { CustomPalette } from "../constants/customPalette";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import { BETWEEN_SECTION_SPACING, HEADER_TO_CONTENT_GAP_PX } from "../constants/constants";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

// A row is considered "framed" (and therefore worth displaying) if any of its
// fields collected on the Entry Code Framing modal have been filled in.
const hasFramingData = (row) =>
  Boolean(
    row?.objectId || row?.description || row?.predicateId || row?.mappingJustification
  );

const defaultColDef = {
  width: 150,
  editable: false,
  cellStyle: preWrapWordBreak
};

// Tabs used to switch between the framing sources of a single list.
function SourceTabs({ sources, activeIndex, onChange }) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        flexWrap: "wrap",
        width: "100%",
        borderBottom: `1px solid ${CustomPalette.GREY_300}`,
        marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
      }}
    >
      {sources.map((source, index) => {
        const selected = index === activeIndex;
        const label =
          source.metadata?.label || source.metadata?.id || `${t("Source")} ${index + 1}`;
        return (
          <Button
            key={source.key || index}
            onClick={() => onChange(index)}
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
              borderBottom: "2px solid",
              borderBottomColor: selected ? CustomPalette.PRIMARY : "transparent",
              mb: "-1px",
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
        );
      })}
    </Box>
  );
}

// The framing table(s) of one list. Lists can be framed against more than one
// source, in which case the sources are shown as tabs.
function ListFramingTable({ sources, columnDefs }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = activeIndex < sources.length ? activeIndex : 0;
  const activeSource = sources[safeActiveIndex];

  return (
    <Box sx={{ width: "100%" }}>
      {sources.length > 1 && (
        <SourceTabs
          sources={sources}
          activeIndex={safeActiveIndex}
          onChange={setActiveIndex}
        />
      )}
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
        <AgGridReact
          key={activeSource?.key}
          rowData={activeSource?.rows || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          suppressRowHoverHighlight
          overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
        />
      </Box>
    </Box>
  );
}

// Read-only view of the data collected on the Entry Codes page's framing modal
// (see src/EntryCodes/EntryCodeFramingModal.jsx), rendered below the Schema
// Details table on the View Schema page. A schema can have many lists, each
// with its own framing table(s), so the whole section is collapsible (like the
// accordions on the landing page) and each list is collapsible within it.
//
// entryCodeFramingSources: { "<List>": [{ key, metadata, rows }] }
// listOrder: list (attribute) names in display order; lists not in it follow.
export default function EntryCodeFramingTable({
  entryCodeFramingSources = {},
  listOrder = []
}) {
  const { t } = useTranslation();
  const primaryColor = usePrimaryColor();

  const lists = useMemo(() => {
    const sourcesByList = {};
    Object.entries(entryCodeFramingSources || {}).forEach(([list, sources]) => {
      const sourcesWithData = (Array.isArray(sources) ? sources : [])
        .map((source) => ({
          ...source,
          rows: (Array.isArray(source?.rows) ? source.rows : []).filter(hasFramingData)
        }))
        .filter((source) => source.rows.length > 0);
      if (sourcesWithData.length > 0) sourcesByList[list] = sourcesWithData;
    });

    const orderedNames = [
      ...listOrder.filter((name) => sourcesByList[name]),
      ...Object.keys(sourcesByList).filter((name) => !listOrder.includes(name))
    ];
    return orderedNames.map((name) => ({ name, sources: sourcesByList[name] }));
  }, [entryCodeFramingSources, listOrder]);

  const columnDefs = useMemo(
    () => [
      {
        field: "Code",
        width: 150,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Entry Code")
        }
      },
      {
        field: "objectId",
        width: 220,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t(
            "Ontology term identifier for this entry code, entered manually (e.g. FOODON:00002403)"
          )
        }
      },
      {
        field: "description",
        width: 380,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          helpText: t("Definition")
        }
      },
      {
        field: "predicateId",
        width: 190,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Predicate"),
          helpText: t(
            "Mapping vocabulary to reasonate the relationship between the entry code and ontologies terms"
          )
        }
      },
      {
        field: "mappingJustification",
        width: 260,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Framing Justification"),
          helpText: t("Framing Justification")
        }
      }
    ],
    [t]
  );

  if (lists.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", marginTop: BETWEEN_SECTION_SPACING }}>
      {/* Unmounting on collapse keeps the grids from rendering at zero width. */}
      <AccordionItemWrapper TransitionProps={{ unmountOnExit: true }} sx={{ marginTop: 0 }}>
        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 40 }} />
          }
          aria-controls="entry-code-framing-content"
          id="entry-code-framing-header"
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "left",
                margin: 0,
                lineHeight: 1.5,
                color: primaryColor
              }}
            >
              {t("Entry Code Framing")}
            </Typography>
            <Box
              sx={{
                marginLeft: "1rem",
                color: CustomPalette.GREY_600,
                display: "flex",
                alignItems: "center"
              }}
            >
              <Tooltip
                title={t(
                  "Ontology terms and mapping details framed against the entry codes of each list, per framing source"
                )}
                placement="right"
                arrow
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ textAlign: "start", padding: 0, paddingTop: 2 }}>
          {lists.map(({ name, sources }) => (
            <AccordionItemWrapper
              key={name}
              TransitionProps={{ unmountOnExit: true }}
              defaultExpanded={lists.length === 1}
              sx={{ marginTop: 1 }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 30 }} />
                }
                aria-controls={`entry-code-framing-${name}-content`}
                id={`entry-code-framing-${name}-header`}
              >
                <Typography sx={{ fontSize: "17px", fontWeight: "500" }}>{name}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0, paddingTop: 1 }}>
                <ListFramingTable sources={sources} columnDefs={columnDefs} />
              </AccordionDetails>
            </AccordionItemWrapper>
          ))}
        </AccordionDetails>
      </AccordionItemWrapper>
    </Box>
  );
}
