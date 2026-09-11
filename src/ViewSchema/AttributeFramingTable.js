import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AgGridReact } from "../components/AgGridReact";
import CellHeader from "../components/CellHeader";
import usePrimaryColor from "../hooks/usePrimaryColor";
import { CustomPalette } from "../constants/customPalette";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import { BETWEEN_SECTION_SPACING, HEADER_TO_CONTENT_GAP_PX } from "../constants/constants";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";

// A row is considered "framed" (and therefore worth displaying) if any of its
// attribute-specific fields collected on the Attribute Framing overlay page
// have been filled in.
const hasFramingData = (row) =>
  Boolean(
    row?.objectId || row?.description || row?.predicateId || row?.mappingJustification
  );

const defaultColDef = {
  width: 150,
  editable: false,
  cellStyle: preWrapWordBreak
};

// Read-only, per-source view of the data collected on the Attribute Framing
// overlay page (see src/Overlays/AttributeFraming.jsx), rendered directly
// below the Schema Details table on the View Schema page. Since users can
// define more than one framing source (e.g. FOODON and ENVO), sources with
// data are shown as tabs, mirroring the tab pattern used on the overlay page.
export default function AttributeFramingTable({ sources = [] }) {
  const { t } = useTranslation();
  const primaryColor = usePrimaryColor();

  const sourcesWithData = useMemo(
    () =>
      (Array.isArray(sources) ? sources : [])
        .map((source) => ({
          ...source,
          rows: (Array.isArray(source?.rows) ? source.rows : []).filter(hasFramingData)
        }))
        .filter((source) => source.rows.length > 0),
    [sources]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = activeIndex < sourcesWithData.length ? activeIndex : 0;
  const activeSource = sourcesWithData[safeActiveIndex];

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 150,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute")
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
            "Ontology term identifier for this attribute, entered manually (e.g. FOODON:00002403)"
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
            "Mapping vocabulary to reasonate the relationship between the attribute and ontologies terms"
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

  if (sourcesWithData.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          marginTop: BETWEEN_SECTION_SPACING,
          marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
        }}
      >
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
          {t("Attribute Framing")}
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
              "Ontology terms and mapping details framed against each attribute, per framing source"
            )}
            placement="right"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
      </Box>

      {sourcesWithData.length > 1 && (
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
          {sourcesWithData.map((source, index) => {
            const selected = index === safeActiveIndex;
            const label =
              source.metadata?.label || source.metadata?.id || `${t("Source")} ${index + 1}`;
            return (
              <Button
                key={source.key || index}
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
