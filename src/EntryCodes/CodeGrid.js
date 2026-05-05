import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { Button, Tooltip, Box } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  TABLE_TO_BUTTON_GAP,
  ENTRY_CODE_DRAG_WIDTH,
  ENTRY_CODE_CODE_WIDTH,
  ENTRY_CODE_LANG_WIDTH,
  ENTRY_CODE_DELETE_WIDTH,
  AG_GRID_VIRTUALIZE_MIN_ROWS
} from "../constants/constants";
import { agGridEditableCellHoverCss, flexCenter, preWrapWordBreak } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import TextareaCellEditor from "../components/TextareaCellEditor";
import { LanguageConstants, langCodeOCAFromName } from "../utils/languageUtils";
import { useMultiSchema } from "../schema/schemaContext";
import { codeGridStyle } from "./codeGridStyles";
import { CustomPalette } from "../constants/customPalette";

const CodeHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="ag-cell-label-container">
      <Tooltip
        title={t(
          "The entry choices for the schema. These will be what is recorded in the dataset and so can be simple entry codes"
        )}
        placement="top"
        arrow
      >
        <HelpOutlineIcon sx={{ fontSize: 15 }} />
      </Tooltip>
      <div className="ag-header-cell-label">{t("Entry Code")}</div>
    </div>
  );
};

const LanguageHeader = ({ languageNames, languageName }) => {
  const { t } = useTranslation();
  return (
    <div className="ag-cell-label-container">
      {languageName === (languageNames?.[0] || LanguageConstants.DEFAULT_LANG_NAME) && (
        <Tooltip
          title={t(
            "A longer and more user-friendly language-specific label for each entry code. This label will not be recorded in the dataset but can be used at the time of data entry to help users enter codes"
          )}
          placement="top"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
      )}
      <div className="ag-header-cell-label" style={{ textTransform: "capitalize" }}>
        {t(languageName, { defaultValue: languageName })}
      </div>
    </div>
  );
};

export default function CodeGrid({ index, codeRefs, chosenTable, setChosenTable, onFirstDataRendered: onGridFirstDataRendered, entryCodeData = [], setEntryCodeData }) {
  const { t, i18n } = useTranslation();

  const { getLanguages } = useMultiSchema();
  const languageNames = getLanguages();

  const langSpecs = useMemo(
    () =>
      languageNames.map((name) => ({
        name,
        field: langCodeOCAFromName(name)
      })),
    [languageNames]
  );

  const refContainer = useRef(null);
  const frameRef = useRef(null);
  const buttonRef = useRef();
  const entryCodeDataRef = useRef(entryCodeData);
  entryCodeDataRef.current = entryCodeData;
  const entryRowIdByDataRef = useRef(new WeakMap());
  const entryRowIdSeqRef = useRef(0);

  const getRowId = useCallback((params) => {
    const d = params.data;
    if (d == null) return `ec-${++entryRowIdSeqRef.current}`;
    const map = entryRowIdByDataRef.current;
    let id = map.get(d);
    if (id == null) {
      id = `ec-${++entryRowIdSeqRef.current}`;
      map.set(d, id);
    }
    return id;
  }, []);

  const manyCodes = entryCodeData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;

  const minTablePx = useMemo(
    () =>
      ENTRY_CODE_DRAG_WIDTH +
      ENTRY_CODE_CODE_WIDTH +
      langSpecs.length * ENTRY_CODE_LANG_WIDTH +
      ENTRY_CODE_DELETE_WIDTH,
    [langSpecs.length]
  );

  const [wideTable, setWideTable] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      setWideTable(w < minTablePx);
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [minTablePx]);

  const gridFixedHeightMode = wideTable;
  const gridViewportHeight = wideTable
    ? manyCodes
      ? "min(70vh, 560px)"
      : "min(420px, min(70vh, 560px))"
    : "auto";

  const handleDeleteRow = useCallback(
    (elementIndex) => {
      codeRefs.current.forEach((grid) => {
        grid?.current?.api?.stopEditing();
      });

      const currentData = entryCodeDataRef.current;
      const newEntryCodeRowData = JSON.parse(JSON.stringify(currentData));
      newEntryCodeRowData.splice(elementIndex, 1);
      setEntryCodeData(newEntryCodeRowData);
    },
    [codeRefs, setEntryCodeData]
  );

  const handleAddRow = useCallback(() => {
    codeRefs.current.forEach((grid) => {
      grid?.current?.api?.stopEditing();
    });

    const newEntryCodeRow = { Code: "" };
    langSpecs.forEach(({ field }) => {
      newEntryCodeRow[field] = "";
    });

    const newRowData = [...entryCodeData, { ...newEntryCodeRow }];
    setEntryCodeData(newRowData);
  }, [codeRefs, entryCodeData, langSpecs, setEntryCodeData]);

  const onRowDragEnd = useCallback(
    (event) => {
      codeRefs.current.forEach((grid) => {
        grid?.current?.api?.stopEditing();
      });

      const data = event.node?.data;
      const oldEntryCodeIndex = entryCodeData.findIndex((item) => item === data);
      if (oldEntryCodeIndex < 0 || data == null) return;
      const newEntryCodeIndex = event.node.rowIndex;
      if (oldEntryCodeIndex === newEntryCodeIndex) return;

      const newEntryCodeRowData = [...entryCodeData];
      const [movedItem] = newEntryCodeRowData.splice(oldEntryCodeIndex, 1);
      newEntryCodeRowData.splice(newEntryCodeIndex, 0, movedItem);

      setEntryCodeData(newEntryCodeRowData);
    },
    [entryCodeData, codeRefs, setEntryCodeData]
  );

  const onRowDragLeave = useCallback(() => {
    codeRefs.current.forEach((grid) => {
      grid?.current?.api?.stopEditing();
    });
  }, [codeRefs]);

  const resolveLangCellText = useCallback(
    (data, field, name) => {
      if (!data) return "";
      const oca = data[field];
      if (oca != null && oca !== "") return oca;
      const named = data[name];
      return named != null ? named : "";
    },
    []
  );

  const columnDefs = useMemo(() => {
    const DeleteCell = (params) => {
      const idx = params?.node?.rowIndex ?? params?.rowIndex ?? -1;
      if (idx < 0) return null;
      return (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: "1fr",
            placeItems: "center",
            width: "100%",
            height: "100%",
            minHeight: 24
          }}
        >
          <DeleteOutlineIcon
            className="delete-icon-outline"
            sx={{ gridArea: "1 / 1", color: CustomPalette.GREY_600 }}
          />
          <DeleteForeverIcon
            className="delete-icon-solid"
            onClick={() => handleDeleteRow(idx)}
            sx={{ gridArea: "1 / 1", color: CustomPalette.PRIMARY, cursor: "pointer" }}
          />
        </Box>
      );
    };
    const languageHeaders = langSpecs.map(({ name, field }) => ({
      field,
      editable: true,
      valueGetter: (params) => resolveLangCellText(params.data, field, name),
      valueSetter: (params) => {
        const d = params.data;
        if (!d) return false;
        d[field] = params.newValue;
        d[name] = params.newValue;
        return true;
      },
      headerComponent: () =>
        LanguageHeader({ languageNames, languageName: name }),
      wrapText: true,
      cellEditor: TextareaCellEditor,
      cellStyle: () => ({ ...preWrapWordBreak, ...flexCenter }),
      width: ENTRY_CODE_LANG_WIDTH
    }));
    return [
      {
        field: "Drag",
        headerName: "",
        width: ENTRY_CODE_DRAG_WIDTH,
        pinned: "left",
        lockPinned: true,
        rowDrag: true
      },
      {
        field: "Code",
        editable: true,
        pinned: "left",
        lockPinned: true,
        headerComponent: CodeHeader,
        wrapText: true,
        cellEditor: TextareaCellEditor,
        cellStyle: () => ({ ...preWrapWordBreak, ...flexCenter }),
        width: ENTRY_CODE_CODE_WIDTH
      },
      ...languageHeaders,
      {
        field: "Delete",
        headerName: "",
        width: ENTRY_CODE_DELETE_WIDTH,
        pinned: "right",
        lockPinned: true,
        resizable: false,
        sortable: false,
        editable: false,
        cellClass: "entry-code-delete-cell",
        cellRenderer: DeleteCell
      }
    ];
  }, [langSpecs, languageNames, resolveLangCellText, handleDeleteRow]);

  const defaultColDef = useMemo(
    () => ({
      width: ENTRY_CODE_LANG_WIDTH,
      tabToNextCell: true,
      cellStyle: () => ({ backgroundColor: "white" })
    }),
    []
  );

  const ocaFields = useMemo(() => langSpecs.map((s) => s.field), [langSpecs]);

  const getRowHeight = useCallback(
    (params) => {
      const codeH = measureTextHeight(params.data?.Code || "", ENTRY_CODE_CODE_WIDTH, {});
      let maxH = codeH;
      langSpecs.forEach(({ field, name }) => {
        const text = resolveLangCellText(params.data, field, name);
        const langH = measureTextHeight(text, ENTRY_CODE_LANG_WIDTH, {});
        maxH = Math.max(maxH, langH);
      });
      return Math.max(56, maxH + 16);
    },
    [langSpecs, resolveLangCellText]
  );

  const prevRowCountRef = useRef(0);
  useEffect(() => {
    const rowCount = entryCodeData?.length ?? 0;
    if (prevRowCountRef.current === rowCount) return;
    prevRowCountRef.current = rowCount;
    const api = codeRefs.current?.[index]?.current?.api;
    if (!api) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => api.resetRowHeights());
    });
    return () => cancelAnimationFrame(raf);
  }, [entryCodeData?.length, codeRefs, index]);

  const handleFirstDataRendered = useCallback(() => {
    onGridFirstDataRendered?.(index);
  }, [index, onGridFirstDataRendered]);

  const onCellKeyDown = useCallback(
    (e) => {
      const keyPressed = e.event.code;

      const isLastRow = e.node.lastChild;
      const lastOca = ocaFields[ocaFields.length - 1];
      const isLastColumn = lastOca && e.column.colId === lastOca;
      if (keyPressed === "Tab") {
        if (isLastRow && isLastColumn) {
          buttonRef.current.click();
          setTimeout(() => {
            const { api } = e;
            const editingRowIndex = e.rowIndex;
            api.setFocusedCell(editingRowIndex + 1, "Code");
          }, 0);
        }
      }
    },
    [ocaFields]
  );

  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      const clickedGrid = event.target.closest(".ag-root-wrapper");

      if (
        !clickedGrid &&
        refContainer.current &&
        !refContainer.current.contains(event.target)
      ) {
        codeRefs.current.forEach((grid) => {
          grid.current?.api?.stopEditing();
        });
      }

      if (chosenTable) {
        codeRefs.current.forEach((grid, idx) => {
          if (idx !== chosenTable && grid.current?.api) {
            grid.current?.api?.stopEditing();
          }
        });
      }
    };

    document.addEventListener("click", handleClickOutsideGrid);

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [codeRefs, chosenTable]);

  return (
    <Box
      style={{ margin: "2rem 2rem 0 2rem", display: "flex", flexDirection: "column" }}
      sx={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}
    >
      <Box
        ref={frameRef}
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "hidden",
          overflowY: gridFixedHeightMode ? "hidden" : "visible"
        }}
      >
        <Box
          sx={{
            width: gridFixedHeightMode ? "100%" : `min(${minTablePx}px, 100%)`,
            maxWidth: "100%",
            boxSizing: "border-box",
            ...(manyCodes && !gridFixedHeightMode
              ? { maxHeight: "min(70vh, 560px)", overflowY: "auto" }
              : {})
          }}
        >
        <div
          className={`entry-codes-grid ag-theme-balham${gridFixedHeightMode ? " entry-codes-grid-fixed-viewport" : " ag-grid-compact"}`}
          style={{
            width: "100%",
            minWidth: 0,
            height: gridFixedHeightMode ? gridViewportHeight : "fit-content",
            display: gridFixedHeightMode ? "flex" : undefined,
            flexDirection: gridFixedHeightMode ? "column" : undefined
          }}
        >
        <style>{`${codeGridStyle}${agGridEditableCellHoverCss}`}</style>
        <div
          ref={refContainer}
          style={{
            flex: gridFixedHeightMode ? 1 : undefined,
            minHeight: gridFixedHeightMode ? 0 : undefined,
            width: "100%"
          }}
        >
          <AgGridReact
            key={`${i18n.language}-${gridFixedHeightMode ? "fx" : "ah"}`}
            ref={codeRefs.current[index]}
            rowData={entryCodeData}
            getRowId={getRowId}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout={gridFixedHeightMode ? undefined : "autoHeight"}
            style={{
              width: "100%",
              height: gridFixedHeightMode ? "100%" : "auto"
            }}
            suppressHorizontalScroll={!gridFixedHeightMode}
            getRowHeight={getRowHeight}
            onCellKeyDown={onCellKeyDown}
            onFirstDataRendered={handleFirstDataRendered}
            onCellClicked={() => setChosenTable(index)}
            onRowDragEnd={onRowDragEnd}
            onRowDragLeave={onRowDragLeave}
            onCellValueChanged={(e) => {
              if (e.column.colId === "Code" || ocaFields.includes(e.column.colId)) {
                e.api.refreshCells({ rowNodes: [e.node], force: true });
                requestAnimationFrame(() => e.api.resetRowHeights());
              }
            }}
            rowDragManaged
            suppressScrollOnNewData
          />
        </div>
        </div>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          mt: TABLE_TO_BUTTON_GAP,
          pr: "2rem",
          boxSizing: "border-box"
        }}
      >
        <Button
          onClick={handleAddRow}
          color="button"
          variant="contained"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5
          }}
          ref={buttonRef}
        >
        {t("Add Code", { defaultValue: "Add Code" })} <AddCircleIcon />
        </Button>
      </Box>
    </Box>
  );
}
