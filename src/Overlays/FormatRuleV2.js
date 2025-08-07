import { Box, Link } from "@mui/material";
import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import DeleteConfirmation from "./DeleteConfirmation";
import { FormatRuleTypeRenderer, TrashCanButton } from "./FormatRuleCellRender";
import Loading from "../components/Loading";
import {
  CUSTOM_FORMAT_RULE,
  FIELD_FORMAT_OVERLAY,
  FIELD_RANGE_OVERLAY
} from "../constants/constants";

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "auto"
};

const FormatRulesV2 = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    formatRuleRowData,
    characterEncodingRowData,
    setCharacterEncodingRowData,
    setOverlay,
    setFormatRuleRowData,
    rangeRowData,
    setRangeRowData
  } = useContext(Context);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      [FIELD_FORMAT_OVERLAY]: {
        ...prev[FIELD_FORMAT_OVERLAY],
        selected: false
      },
      [FIELD_RANGE_OVERLAY]: {
        ...prev[FIELD_RANGE_OVERLAY],
        selected: false
      }
    }));

    // Delete attribute from characterEncodingRowData
    const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
      delete row["Add format rule for data"];
      return row;
    });

    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const newFormatRuleRowData = gridRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data);
    setFormatRuleRowData(newFormatRuleRowData);

    const newRangeRowData = [];

    newFormatRuleRowData.forEach((row) => {
      if (
        (row.Type !== "Numeric" && row.Type !== "DateTime") ||
        (!row.FormatText && !row[CUSTOM_FORMAT_RULE])
      ) {
        return;
      }

      const existingRangeRow = rangeRowData.find(
        (rangeRow) => rangeRow.Attribute === row.Attribute
      );

      if (existingRangeRow) {
        newRangeRowData.push({
          ...existingRangeRow,
          FormatRule: row.FormatText || row[CUSTOM_FORMAT_RULE]
        });
      } else {
        newRangeRowData.push({
          Attribute: row.Attribute,
          Type: row.Type,
          FormatRule: row.FormatText || row[CUSTOM_FORMAT_RULE],
          LowerBound: "",
          LowerInclusive: false,
          UpperBound: "",
          UpperInclusive: false
        });
      }
    });

    setRangeRowData(newRangeRowData);

    if (newRangeRowData.length === 0) {
      setOverlay((prev) => ({
        ...prev,
        [FIELD_RANGE_OVERLAY]: {
          ...prev[FIELD_RANGE_OVERLAY],
          selected: false
        }
      }));
    }
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        cellStyle: () => allowOverflowStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attributes"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "Type",
        editable: false,
        width: 150,
        autoHeight: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Type"),
          helpText: <TypeTooltip />
        }
      },
      {
        field: "FormatRule",
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Format Rule"),
          helpText: t(
            "Select the formatting rule that applies to data for each attribute"
          )
        },
        cellRendererFramework: FormatRuleTypeRenderer,
        width: 200,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        })
      },
      {
        field: CUSTOM_FORMAT_RULE,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Custom Format Rule"),
          helpText: t("Enter a custom regular expression for the attribute's data")
        },
        // A custom format rule can be provided only if no built-in format rule is selected
        editable: (params) => !params.node.data.FormatText,
        autoHeight: true,
        width: 200,
        wrapText: true
      },
      {
        headerName: "",
        field: "Delete",
        cellRendererFramework: TrashCanButton,
        width: 60,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        })
      }
    ],
    []
  );

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const handleKeyPress = (params) => {
    if (params.colDef.field !== CUSTOM_FORMAT_RULE) return;

    params.node.updateData({
      ...params.node.data,
      [CUSTOM_FORMAT_RULE]: params.event.target.value
    });

    // Force refresh the format rule cell to update its disabled state
    const formatRuleColumn = params.columnApi.getColumn("FormatRule");
    if (formatRuleColumn) {
      params.api.refreshCells({
        force: true,
        rowNodes: [params.node],
        columns: [formatRuleColumn]
      });
    }
  };

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
    >
      {loading && formatRuleRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Box className="ag-theme-balham" sx={{ width: 790 }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={formatRuleRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll
            rowHeight={50}
            onGridReady={onGridReady}
            onCellKeyDown={handleKeyPress}
          />
        </Box>
        <Box
          sx={{
            width: "80%"
          }}
        >
          {t("All format rules are documented in the")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/format_options"
            target="_blank"
            rel="noreferrer"
          >
            {t("format GitHub repository")}
          </Link>
          . {t("Request a new format to be added by")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/format_options/issues"
            rel="noreferrer"
            target="_blank"
          >
            {t("raising an issue in the repository")}
          </Link>{" "}
          {t("or email us at")} <Link href="mailto:adc@uoguelph.ca">adc@uoguelph.ca</Link>
          .
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default FormatRulesV2;
