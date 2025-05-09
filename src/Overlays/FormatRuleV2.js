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

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "auto"
};

const AttributeHeader = ({ t }) => (
  <CellHeader
    headerText={t("Attributes")}
    helpText={t("This is the name for the attribute and, for example...")}
  />
);

const TypeHeader = ({ t }) => (
  <CellHeader headerText={t("Type")} helpText={<TypeTooltip />} />
);

const FormatRuleHeader = ({ t }) => (
  <CellHeader
    headerText={t("Format Rule")}
    helpText={t("Select the formatting rule that applies to data for each attribute")}
  />
);

const FormatRulesV2 = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    formatRuleRowData,
    characterEncodingRowData,
    setCharacterEncodingRowData,
    setOverlay,
    setFormatRuleRowData
  } = useContext(Context);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Add format rule for data": {
        ...prev["Add format rule for data"],
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
    const attributeWithCharacterEncoding = gridRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data);
    setFormatRuleRowData(attributeWithCharacterEncoding);
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
        headerComponent: <AttributeHeader t={t} />
      },
      {
        field: "Type",
        editable: false,
        width: 150,
        autoHeight: true,
        cellStyle: () => greyCellStyle,
        headerComponent: <TypeHeader t={t} />
      },
      {
        field: "FormatRule",
        headerComponent: FormatRuleHeader,
        cellRendererFramework: <FormatRuleTypeRenderer t={t} />,
        width: 200,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        })
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
    [t]
  );

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

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
        <Box className="ag-theme-balham" sx={{ width: 590 }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={formatRuleRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll
            rowHeight={50}
            onGridReady={onGridReady}
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
