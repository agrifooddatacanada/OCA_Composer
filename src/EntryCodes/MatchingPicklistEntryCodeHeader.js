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
import { AgGridReact } from "ag-grid-react";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { gridStyles } from "../constants/styles";
import { languageCodesObject } from "../constants/isoCodes";
import { DataHeaderRenderer } from "./MatchingEntryCodeHeader";

/** Column names available from the picklist (row keys / headers). */
export function getPicklistCodeColumnOptions(picklist) {
  if (!picklist) return [];
  if (Array.isArray(picklist.headers) && picklist.headers.length > 0) {
    return [...new Set(picklist.headers.filter(Boolean))];
  }
  const keys = new Set();
  (picklist.rows || []).forEach((row) => {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((k) => keys.add(k));
    }
  });
  return [...keys];
}

function matchingFunction(pool, attr) {
  for (let i = 0; i < pool.length; i += 1) {
    if (pool[i].toLowerCase() === attr.toLowerCase()) {
      return i;
    }
  }
  for (let i = 0; i < pool.length; i += 1) {
    if (pool[i].toLowerCase().includes(attr.toLowerCase())) {
      return i;
    }
  }
  return -1;
}

function defaultPicklistColumnForField(fieldName, options, languageTo2Letter) {
  if (!options.length) return "";
  if (fieldName === "Code") {
    return options.includes("Code") ? "Code" : options[0];
  }
  const iso = languageTo2Letter[fieldName];
  if (iso && options.includes(iso)) return iso;
  const idx = matchingFunction(options, fieldName);
  return idx !== -1 ? options[idx] : "";
}

export default function MatchingPicklistEntryCodeHeader() {
  const { t } = useTranslation();
  const {
    pendingPicklist,
    setPendingPicklist,
    setCurrentPage,
    chosenEntryCodeIndex,
    languages,
    setEntryCodeRowData
  } = useContext(Context);

  const [matchingRows, setMatchingRows] = useState([]);
  const gridRef = useRef(null);

  const codeColumnOptions = useMemo(
    () => getPicklistCodeColumnOptions(pendingPicklist),
    [pendingPicklist]
  );

  const languageTo2Letter = useMemo(() => {
    const map = {};
    (languages || []).forEach((langName) => {
      const code = languageCodesObject?.[langName.toLowerCase()];
      if (code) map[langName] = code;
    });
    return map;
  }, [languages]);

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
        headerName: "Items",
        field: "lang",
        width: 200,
        editable: false
      },
      {
        headerName: "Data Header",
        field: "matchingDataHeader",
        width: 220,
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
    [codeColumnOptions, changeDataFromTable]
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

    setEntryCodeRowData((prev) => {
      const next = [...(prev || [])];
      next[chosenEntryCodeIndex] = newRows.length ? newRows : next[chosenEntryCodeIndex];
      return next;
    });
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
      <Box
        sx={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: "1rem"
        }}
      >
        {codeColumnOptions.length > 0 ? (
          <div className="ag-theme-balham" style={{ width: "422px", maxWidth: "100%" }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={matchingRows}
              columnDefs={columnDefs}
              domLayout="autoHeight"
            />
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
