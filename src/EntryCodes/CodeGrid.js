import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { Button, Tooltip, Box } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { CustomPalette } from "../constants/customPalette";
import {
  TABLE_TO_BUTTON_GAP,
  ENTRY_CODE_DRAG_WIDTH,
  ENTRY_CODE_CODE_WIDTH,
  ENTRY_CODE_LANG_WIDTH,
  ENTRY_CODE_DELETE_WIDTH
} from "../constants/constants";
import { preWrapWordBreak, flexCenter } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import TextareaCellEditor from "../components/TextareaCellEditor";
import { LanguageConstants } from "../utils/languageUtils";
import { useMultiSchema } from "../schema/schemaContext";

const codeGridStyle = `
  .entry-codes-grid .ag-cell {
    border-right: 1px solid ${CustomPalette.GREY_300};
  }
  .entry-codes-grid .ag-header-cell-label {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell {
    line-height: 1.5;
  }
  .ag-select-list {
    height: 90px;
    overflow-y: auto;
  }
  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%;
  }
  .ag-header-cell:last-child,
  .ag-header-cell[col-id="Delete"] {
    border-right: none !important;
    --ag-header-column-separator-display: none !important;
  }
  .ag-header-cell:last-child *,
  .ag-header-cell[col-id="Delete"] * {
    border-right: none !important;
    box-shadow: none !important;
  }
  .ag-header-viewport .ag-header-cell:last-child {
    border-right: none !important;
  }
  .ag-header-container {
    border-right: none !important;
  }
  .entry-codes-grid .ag-cell:last-child {
    border-right: none !important;
  }
  .ag-header-row .ag-header-cell:last-child::after {
    display: none !important;
  }
  .ag-header-viewport {
    overflow-x: hidden;
  }
  .entry-codes-grid .ag-body-horizontal-scroll {
    display: none !important;
  }
  .entry-codes-grid .ag-center-cols-clipper {
    min-height: unset !important;
  }
  .entry-codes-grid .ag-root-wrapper-body.ag-layout-auto-height {
    min-height: unset !important;
  }
  .entry-codes-grid .ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) .ag-root-wrapper-body {
    min-height: 88px !important;
  }
  .ag-row .delete-icon-solid {
    display: none;
  }
  .ag-row:hover .delete-icon-outline {
    display: none;
  }
  .ag-row:hover .delete-icon-solid {
    display: inline-flex;
  }
  .ag-row:hover .ag-cell {
    background-color: ${CustomPalette.PINK_200} !important;
  }
  .ag-cell-value {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell, .ag-full-width-row .ag-cell-wrapper.ag-row-group {
    line-height: 1.5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ag-cell .ag-drag-handle {
    margin-right: 0;
  }
`;

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

const LanguageHeader = ({ languages, language }) => {
  const { t } = useTranslation();
  return (
    <div className="ag-cell-label-container">
      {language === (languages?.[0] || LanguageConstants.DEFAULT_LANG_NAME) && (
        <Tooltip
          title={t(
            "A longer and more user-friendly language specific label for each entry code. This label will not be recorded in the dataset but can be used at the time of data entry to help users enter codes"
          )}
          placement="top"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
      )}
      <div className="ag-header-cell-label" style={{ textTransform: "capitalize" }}>
        {t(language, { defaultValue: language })}
      </div>
    </div>
  );
};

export default function CodeGrid({ index, codeRefs, chosenTable, setChosenTable, entryCodeData = [], setEntryCodeData }) {
  const { t } = useTranslation();
  
  // Get schema-specific languages (not global)
  const { getSchema } = useMultiSchema();
  const schemaState = getSchema();
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];
  
  const gridWidth = useMemo(
    () =>
      ENTRY_CODE_DRAG_WIDTH +
      ENTRY_CODE_CODE_WIDTH +
      languages.length * ENTRY_CODE_LANG_WIDTH +
      ENTRY_CODE_DELETE_WIDTH,
    [languages.length]
  );
  const refContainer = useRef(null);
  const buttonRef = useRef();
  const entryCodeDataRef = useRef(entryCodeData);
  entryCodeDataRef.current = entryCodeData;

  const handleDeleteRow = useCallback(
    (elementIndex) => {
      codeRefs.current.forEach((grid) => {
        grid.current.api.stopEditing();
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
      grid.current.api.stopEditing();
    });

    const newEntryCodeRow = { Code: "" };
    // Use language names as field keys (normalized at source)
    languages.forEach((lang) => {
      newEntryCodeRow[lang] = "";
    });

    const newRowData = [...entryCodeData, { ...newEntryCodeRow }];
    setEntryCodeData(newRowData);
  }, [codeRefs, entryCodeData, languages, setEntryCodeData]);

  // Saves elements in proper order after dragging
  const onRowDragEnd = (event) => {
    codeRefs.current.forEach((grid) => {
      grid.current.api.stopEditing();
    });

    const oldEntryCodeIndex = entryCodeData.findIndex(
      (item) => item.Code === event.node.data.Code
    );
    const newEntryCodeIndex = event.node.rowIndex;

    const newEntryCodeRowData = [...entryCodeData];

    const [movedItem] = newEntryCodeRowData.splice(oldEntryCodeIndex, 1);
    newEntryCodeRowData.splice(newEntryCodeIndex, 0, movedItem);

    setEntryCodeData(newEntryCodeRowData);
  };

  const onRowDragLeave = () => {
    codeRefs.current.forEach((grid) => {
      grid.current.api.stopEditing();
    });
  };

  const DeleteCell = (params) => {
    const idx = params?.node?.rowIndex ?? params?.rowIndex ?? -1;
    if (idx < 0) return null;
    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <DeleteOutlineIcon sx={{ color: CustomPalette.GREY_600 }} className="delete-icon-outline" />
        <DeleteForeverIcon
          onClick={() => handleDeleteRow(idx)}
          sx={{ color: CustomPalette.PRIMARY, cursor: "pointer" }}
          className="delete-icon-solid"
        />
      </Box>
    );
  };

  const columnDefs = useMemo(() => {
    const languageHeaders = languages.map((lang) => ({
      field: lang,
      editable: true,
      headerComponent: () => LanguageHeader({ languages, language: lang }),
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
        rowDrag: true
      },
      {
        field: "Code",
        editable: true,
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
        sortable: false,
        editable: false,
        cellRenderer: DeleteCell
      }
    ];
  }, [languages]);

  const defaultColDef = useMemo(
    () => ({
      width: ENTRY_CODE_LANG_WIDTH,
      tabToNextCell: true,
      cellStyle: () => ({ backgroundColor: "white" })
    }),
    []
  );

  const getRowHeight = useCallback((params) => {
    const codeH = measureTextHeight(params.data?.Code || "", ENTRY_CODE_CODE_WIDTH, {});
    let maxH = codeH;
    languages.forEach((lang) => {
      const langH = measureTextHeight(params.data?.[lang] || "", ENTRY_CODE_LANG_WIDTH, {});
      maxH = Math.max(maxH, langH);
    });
    return Math.max(56, maxH + 16);
  }, [languages]);

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

  const onCellKeyDown = useCallback(
    (e) => {
      const keyPressed = e.event.code;

      const isLastRow = e.node.lastChild;
      const isLastColumn = e.column.colId === languages[languages.length - 1];
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
    [languages]
  );

  // Stops grid editing on all other grid components - not just current grid
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
    <Box style={{ margin: "2rem 2rem 0 2rem", display: "flex", flexDirection: "column" }}>
      <Box sx={{ maxWidth: "100%", overflowX: "auto" }}>
        <div className="entry-codes-grid ag-theme-balham" style={{ width: gridWidth, overflowX: "hidden" }}>
        <style>{codeGridStyle}</style>
        <div ref={refContainer}>
          <AgGridReact
            ref={codeRefs.current[index]}
            rowData={entryCodeData}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            getRowHeight={getRowHeight}
            suppressHorizontalScroll
            onCellKeyDown={onCellKeyDown}
            onCellClicked={() => setChosenTable(index)}
            onRowDragEnd={onRowDragEnd}
            onRowDragLeave={onRowDragLeave}
            onCellValueChanged={(e) => {
              if (e.column.colId === "Code" || languages.includes(e.column.colId)) {
                e.api.refreshCells({ rowNodes: [e.node], force: true });
                requestAnimationFrame(() => e.api.resetRowHeights());
              }
            }}
            rowDragManaged
          />
        </div>
        </div>
      </Box>

      <Box sx={{ width: gridWidth, display: "flex", flexDirection: "column", alignItems: "flex-end", mt: TABLE_TO_BUTTON_GAP, mr: "2rem" }}>
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
