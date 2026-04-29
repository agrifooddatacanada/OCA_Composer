import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import { AgGridReact } from "../components/AgGridReact";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import {
  AG_GRID_DROPDOWN_CELL_CLASS,
  gridStyles,
  greyCellStyle,
  matchingEntryCodeGridStyles,
  matchingEntryCodePageBoxSx
} from "../constants/styles";
import { DataHeaderRenderer } from "./MatchingEntryCodeHeader";
import { useMultiSchema } from "../schema/schemaContext";
import {
  buildLanguageTo2Letter,
  defaultPicklistColumnForField,
  getPicklistCodeColumnOptions
} from "./picklistMatchingUtils";

export default function MatchingPicklistEntryCodeHeader() {
  const { t } = useTranslation();
  const {
    pendingPicklist,
    setPendingPicklist,
    setCurrentPage,
    chosenEntryCodeIndex
  } = useContext(Context);
  const { getSchema, updateSchema, getLanguages } = useMultiSchema();
  const languages = getLanguages();

  const [matchingRows, setMatchingRows] = useState([]);
  const [gridLayoutReady, setGridLayoutReady] = useState(false);
  const gridRef = useRef(null);

  const codeColumnOptions = useMemo(
    () => getPicklistCodeColumnOptions(pendingPicklist),
    [pendingPicklist]
  );

  const languageTo2Letter = useMemo(() => buildLanguageTo2Letter(languages), [languages]);

  useEffect(() => {
    if (!pendingPicklist) {
      setCurrentPage("PicklistEntryCodes");
      return;
    }
    const opts = getPicklistCodeColumnOptions(pendingPicklist);
    const schemaFields = ["Code", ...(languages || [])];
    const newRows = schemaFields.map((fieldName) => ({
      lang: fieldName,
      matchingDataHeader: defaultPicklistColumnForField(
        fieldName,
        opts,
        languageTo2Letter
      )
    }));
    setMatchingRows(newRows);
  }, [pendingPicklist, languages, languageTo2Letter, setCurrentPage]);

  useEffect(() => {
    setGridLayoutReady(false);
  }, [codeColumnOptions, languages, pendingPicklist]);

  const changeDataFromTable = useCallback((e, params) => {
    const { value } = e.target;
    const langKey = params.node?.data?.lang;
    if (langKey === undefined) return;
    setMatchingRows((prev) =>
      prev.map((r) => (r.lang === langKey ? { ...r, matchingDataHeader: value } : r))
    );
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        headerName: t("Assigned Column Name"),
        field: "lang",
        width: 240,
        suppressSizeToFit: true,
        editable: false,
        cellClass: "matching-entry-code-assigned-cell",
        cellStyle: () => greyCellStyle
      },
      {
        headerName: t("Imported Column Name"),
        field: "matchingDataHeader",
        width: 240,
        suppressSizeToFit: true,
        cellClass: `matching-entry-code-data-header-cell ${AG_GRID_DROPDOWN_CELL_CLASS}`,
        cellRendererFramework: DataHeaderRenderer,
        cellRendererParams: (params) => ({
          dataHeaders: ["", ...codeColumnOptions],
          onRefresh: () => {
            gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
          },
          changeDataFromTable: (e) => changeDataFromTable(e, params)
        })
      }
    ],
    [codeColumnOptions, changeDataFromTable, t]
  );

  const handleBack = () => {
    setPendingPicklist(null);
    setCurrentPage("PicklistEntryCodes");
  };

  const handleSave = () => {
    if (!pendingPicklist) return;
    const pickByLang = {};
    matchingRows.forEach((row) => {
      if (row?.lang && row?.matchingDataHeader) {
        pickByLang[row.lang] = row.matchingDataHeader;
      }
    });

    const schemaFields = ["Code", ...(languages || [])];
    const rows = Array.isArray(pendingPicklist.rows) ? pendingPicklist.rows : [];
    const newRows = rows.map((row) => {
      const newObj = {};
      schemaFields.forEach((fieldName) => {
        const pickCol = pickByLang[fieldName];
        const raw = pickCol ? row?.[pickCol] : undefined;
        newObj[fieldName] = raw != null && raw !== "" ? String(raw) : "";
      });
      return newObj;
    });

    const schema = getSchema() || {};
    const attrsWithList = (schema.attributes || [])
      .filter((a) => a.List)
      .map((a) => a.Attribute);
    const attrName = attrsWithList[chosenEntryCodeIndex];
    if (attrName && newRows.length > 0) {
      const prevEntryCodes = schema.entryCodes || {};
      updateSchema({
        entryCodes: {
          ...prevEntryCodes,
          [attrName]: newRows
        }
      });
    }
    setPendingPicklist(null);
    setCurrentPage("Codes");
  };

  const canForward = useMemo(() => {
    const schemaFields = ["Code", ...(languages || [])];
    return schemaFields.every((field) =>
      matchingRows.some((r) => r.lang === field && r.matchingDataHeader)
    );
  }, [matchingRows, languages]);

  if (!pendingPicklist) {
    return null;
  }

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={handleBack}
        isForward={canForward && codeColumnOptions.length > 0}
        pageForward={handleSave}
      />
      <Box sx={matchingEntryCodePageBoxSx}>
        {codeColumnOptions.length > 0 ? (
          <div className="matching-entry-code-grid matching-entry-code-grid-root ag-theme-balham overlay-grid-suppress-hscroll">
            <style>{`${gridStyles}${matchingEntryCodeGridStyles}`}</style>
            <div
              className={`matching-entry-code-grid--inner${
                gridLayoutReady ? "" : " matching-entry-code-grid--pending"
              }`}
            >
            <AgGridReact
              ref={gridRef}
              style={{ width: "100%" }}
              rowData={matchingRows}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressHorizontalScroll
              onFirstDataRendered={() => setGridLayoutReady(true)}
            />
            </div>
          </div>
        ) : (
          <Typography color="text.secondary">
            {t("No columns found in this picklist.")}
          </Typography>
        )}
      </Box>
    </>
  );
}
