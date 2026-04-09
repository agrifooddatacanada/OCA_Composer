import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import JSZip from "jszip";
import Papa from "papaparse";
import { MenuItem } from "@mui/material";
import { messages } from "../constants/messages";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { getCurrentData } from "../utils/helpers";
import {
  ADC,
  AG_GRID_VIRTUALIZE_MIN_ROWS,
  ENTRY_CODE_UPLOAD_PREVIEW_MAX_WIDTH_PX
} from "../constants/constants";
import {
  coerceIfLegacyTopLevelBundle,
  getRootCaptureBaseId
} from "../utils/packageUtils";
import { languageNameToAlpha3Codes } from "../constants/isoCodes";
import {
  langNameFromCodeOCA,
  langNameFromTwoLetters,
  LanguageConstants
} from "../utils/languageUtils";

const ENTRY_CODE_PREVIEW_MIN_COL = 88;
const ENTRY_CODE_PREVIEW_MAX_COL = 260;
const ENTRY_CODE_PREVIEW_LANG_MAX_COL = 168;
const ENTRY_CODE_PREVIEW_CHAR_PX = 7;
const ENTRY_CODE_PREVIEW_COL_GUTTER = 40;

function isEntryCodePreviewLanguageColumn(header) {
  const h = String(header ?? "").trim();
  if (/^header_empty_placeholder_\d+$/.test(h)) return false;
  return !/^code$/i.test(h);
}

function getUploadedFilePathLabel(file) {
  if (!file) return "";
  return String(file.path ?? file.name ?? "").toLowerCase();
}

function schemaBundleHasEntryCodes(summary, list) {
  if (Array.isArray(list) && list.length > 0) return true;
  if (summary == null || typeof summary !== "object") return false;
  for (const key of Object.keys(summary)) {
    const v = summary[key];
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length > 0) return true;
    } else if (typeof v === "object") {
      if (Object.keys(v).length > 0) return true;
    } else if (String(v).trim() !== "") {
      return true;
    }
  }
  return false;
}

const userSelectionDropdown = ["Copy from other entry codes", "Upload"];

function translateEntryCodePreviewColumnHeader(rawHeader, t, schemaLanguageNames) {
  const h = String(rawHeader ?? "").trim();
  if (/^header_empty_placeholder_\d+$/.test(h)) {
    return h;
  }
  if (/^code$/i.test(h)) {
    return t("Entry Code");
  }
  const fromOca = langNameFromCodeOCA(h);
  if (fromOca) {
    return t(fromOca);
  }
  const fromTwo = langNameFromTwoLetters(h);
  if (fromTwo) {
    return t(fromTwo);
  }
  const lower = h.toLowerCase();
  for (const name of schemaLanguageNames) {
    if (name.toLowerCase() === lower) {
      return t(name);
    }
  }
  for (const key of Object.keys(languageNameToAlpha3Codes)) {
    if (key.toLowerCase() === lower) {
      const cap = key.charAt(0).toUpperCase() + key.slice(1);
      return t(cap);
    }
  }
  return h;
}

function getPersistedEntryCodeUploadUi(rowData, headers, summary, list) {
  const hasCsv =
    Array.isArray(rowData) &&
    rowData.length > 0 &&
    Array.isArray(headers) &&
    headers.length > 0;
  if (hasCsv) {
    return { dropDisabled: true, fileType: "csvORxls" };
  }
  const hasBundle =
    (summary != null &&
      typeof summary === "object" &&
      Object.keys(summary).length > 0) ||
    (Array.isArray(list) && list.length > 0);
  if (hasBundle) {
    return { dropDisabled: true, fileType: "json" };
  }
  return { dropDisabled: false, fileType: "" };
}

const useHandleEntryCodeDrop = () => {
  const { t, i18n } = useTranslation();
  const {
    tempEntryCodeRowData,
    setTempEntryCodeRowData,
    entryCodeHeaders,
    setEntryCodeHeaders,
    setCurrentPage,
    setChosenEntryCodeIndex,
    tempEntryCodeSummary,
    setTempEntryCodeSummary,
    tempEntryList,
    setTempEntryList,
    chosenEntryCodeIndex
  } = useContext(Context);

  const persistedOnMount = getPersistedEntryCodeUploadUi(
    tempEntryCodeRowData,
    entryCodeHeaders,
    tempEntryCodeSummary,
    tempEntryList
  );
  
  // Use MultiSchemaContext for schema-specific data
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();

  const schemaLanguageNames = useMemo(() => {
    const langs = schemaState?.metadata?.languages;
    return Array.isArray(langs) && langs.length
      ? langs
      : [...LanguageConstants.FALLBACK_LANG_NAMES];
  }, [schemaState?.metadata?.languages]);
  
  // Get attribute and entry code data from schema state
  const attributeRowData = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );
  const entryCodeRowData = useMemo(
    () => schemaState?.entryCodes || {},
    [schemaState?.entryCodes]
  );
  
  // Update entry codes in schema state
  const setEntryCodeRowData = useCallback((updater) => {
    const currentEntryCodes = schemaState?.entryCodes || {};
    const newEntryCodes = typeof updater === 'function' ? updater(currentEntryCodes) : updater;
    updateSchema({ entryCodes: newEntryCodes });
  }, [schemaState?.entryCodes, updateSchema]);
  const [rawFile, setRawFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropDisabled, setDropDisabled] = useState(persistedOnMount.dropDisabled);
  const [dropMessage, setDropMessage] = useState({ message: "", type: "" });
  const [tableLength, setTableLength] = useState(0);
  const [columnDefs, setColumnDefs] = useState([]);
  const [fileType, setFileType] = useState(persistedOnMount.fileType);
  const [selectionValue, setSelectionValue] = useState("Upload");
  const [selectedAttributesList, setSelectedAttributesList] = useState([]);
  const [selectedAttrToCopy, setSelectedAttrToCopy] = useState("");
  const gridRef = useRef(null);
  const unfilteredAttrRef = useRef([]);

  const setLoadingState = () => {
    setLoading(true);
  };

  const handleClearUpload = useCallback(() => {
    setDropDisabled(false);
    setRawFile([]);
    setEntryCodeHeaders([]);
    setTempEntryCodeRowData([]);
    setTempEntryCodeSummary(undefined);
    setTempEntryList([]);
    setFileType("");
  }, [
    setEntryCodeHeaders,
    setTempEntryCodeRowData,
    setTempEntryCodeSummary,
    setTempEntryList
  ]);

  const processCSVFile = useCallback((file) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header, index) => {
          if (header !== "") {
            return header;
          }
          // without this, papaparse will save blank headers as "", "_1", "_2", etc.
          return `header_empty_placeholder_${index}`;
        },
        complete: (results) => {
          setTempEntryCodeSummary(undefined);
          setTempEntryList([]);
          setTempEntryCodeRowData(results.data);
          setEntryCodeHeaders(results.meta.fields);
          setFileType("csvORxls");
          setLoading(false);
          setDropDisabled(true);
        }
      });
    } catch {
      setDropMessage({ message: messages.parseUploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [
    setEntryCodeHeaders,
    setTempEntryCodeRowData,
    setTempEntryCodeSummary,
    setTempEntryList
  ]);

  const handleBundleJSONDrop = useCallback((jsonFile, ocaPackageData = null) => {
    const entryList = [];
    let entryCodeSummary = {};
    // Check if entry code ordering can be retrieved from oca package
    // For now, use ADC extension overlays for the top-level/main schema bundle
    const orderingOverlay =
      ocaPackageData?.extensions?.[ADC]?.[
        getRootCaptureBaseId(ocaPackageData)
      ]?.overlays?.ordering;
    const hasEntryCodeOrdering =
      Object.keys(orderingOverlay?.entry_code_ordering || {}).length > 0;

    if (jsonFile?.overlays?.entry_code) {
      entryCodeSummary = { ...jsonFile.overlays.entry_code };
      if (hasEntryCodeOrdering) {
        entryCodeSummary.attribute_entry_codes = orderingOverlay.entry_code_ordering;
      }
    }

    if (jsonFile?.overlays?.entry) {
      entryList.push(...jsonFile.overlays.entry);
    }

    setTempEntryCodeSummary(entryCodeSummary);
    setTempEntryList(entryList);
  }, []);

  const processJSONFile = useCallback(
    (acceptedFiles) => {
      try {
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const jsonFile = coerceIfLegacyTopLevelBundle(JSON.parse(e.target.result));

          if (jsonFile?.oca_bundle?.bundle) {
            handleBundleJSONDrop(jsonFile?.oca_bundle?.bundle, jsonFile);
          } else if (jsonFile?.schema?.[0]) {
            handleBundleJSONDrop(jsonFile?.schema?.[0]);
          } else {
            handleBundleJSONDrop(jsonFile);
          }
        };

        reader.readAsText(acceptedFiles);

        setTimeout(() => {
          setDropDisabled(true);
          setDropMessage({ message: "", type: "" });
          setLoading(false);
        }, 900);
      } catch (error) {
        setDropMessage({ message: messages.uploadFail, type: "error" });
        setLoading(false);
        setTimeout(() => {
          setDropMessage({ message: "", type: "" });
        }, [2500]);
      }
    },
    [handleBundleJSONDrop]
  );

  const processZipFile = useCallback((acceptedFiles) => {
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const zip = await JSZip.loadAsync(e.target.result);

        const entryList = [];
        let entryCodeSummary = {};

        // load up metadata file in OCA bundle
        const loadMetadataFile = await zip.files["meta.json"].async("text");
        const metadataJson = JSON.parse(loadMetadataFile);
        const { root } = metadataJson;

        // loop through all files in OCA bundle
        for (const [key, file] of Object.entries(metadataJson.files[root])) {
          // eslint-disable-next-line no-await-in-loop
          const content = await zip.files[`${file}.json`].async("text");

          if (key.includes("entry (")) {
            entryList.push(JSON.parse(content));
          }

          if (key.includes("entry_code")) {
            entryCodeSummary = JSON.parse(content);
          }
        }

        setTempEntryCodeSummary(entryCodeSummary);
        setTempEntryList(entryList);
      };

      reader.readAsArrayBuffer(acceptedFiles);

      setTimeout(() => {
        setDropDisabled(true);
        setDropMessage({ message: "", type: "" });
        setLoading(false);
      }, 900);
    } catch (error) {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, []);

  const handleSave = () => {
    if (selectionValue === "Upload") {
      if (fileType === "csvORxls") {
        const currentData = getCurrentData(gridRef.current.api, true);
        setTempEntryCodeRowData(currentData);
        setCurrentPage("MatchingEntryCodes");
      } else if (fileType === "json" || fileType === "zip") {
        setCurrentPage("MatchingJSONEntryCodes");
      }
    } else {
      // Copy entry codes from one attribute to another (using attribute names as keys)
      const targetAttr = unfilteredAttrRef.current[chosenEntryCodeIndex];
      const sourceEntryCodes = entryCodeRowData[selectedAttrToCopy];
      if (targetAttr && Array.isArray(sourceEntryCodes)) {
        setEntryCodeRowData((prev) => ({
          ...prev,
          [targetAttr]: sourceEntryCodes.map((obj) => ({ ...obj }))
        }));
      }
      setCurrentPage("Codes");
    }
  };

  const userSelectionListDropdown = useMemo(
    () =>
      userSelectionDropdown.map((division) => (
        <MenuItem sx={{ height: "38px" }} key={division} value={division}>
          {t(division)}
        </MenuItem>
      )),
    [t]
  );

  const attributeListDropdown = useMemo(
    () =>
      selectedAttributesList.map((division) => (
        <MenuItem sx={{ height: "38px" }} key={division} value={division}>
          {division}
        </MenuItem>
      )),
    [selectedAttributesList]
  );

  useEffect(() => {
    if (!rawFile || rawFile.length === 0) return;
    const label = getUploadedFilePathLabel(rawFile[0]);
    if (/\.(csv|xls|xlsx)$/i.test(label)) {
      setFileType("csvORxls");
      processCSVFile(rawFile[0]);
    } else if (/\.json$/i.test(label)) {
      setFileType("json");
      processJSONFile(rawFile[0]);
    } else if (/\.zip$/i.test(label)) {
      setFileType("zip");
      processZipFile(rawFile[0]);
    } else {
      setDropMessage({ message: messages.uploadFail, type: "error" });
      setLoading(false);
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [processCSVFile, processJSONFile, processZipFile, rawFile]);

  useEffect(() => {
    const rows = Array.isArray(tempEntryCodeRowData) ? tempEntryCodeRowData : [];
    const widths = entryCodeHeaders.map((header) => {
      const field = header;
      const displayHeader = translateEntryCodePreviewColumnHeader(
        header,
        t,
        schemaLanguageNames
      );
      let maxChars = Math.max(String(field).length, String(displayHeader).length);
      for (let i = 0; i < rows.length; i += 1) {
        const val = rows[i]?.[field];
        if (val != null && val !== "") {
          maxChars = Math.max(maxChars, String(val).length);
        }
      }
      let colW = Math.min(
        ENTRY_CODE_PREVIEW_MAX_COL,
        Math.max(
          ENTRY_CODE_PREVIEW_MIN_COL,
          Math.ceil(maxChars * ENTRY_CODE_PREVIEW_CHAR_PX + ENTRY_CODE_PREVIEW_COL_GUTTER)
        )
      );
      if (isEntryCodePreviewLanguageColumn(header)) {
        colW = Math.min(colW, ENTRY_CODE_PREVIEW_LANG_MAX_COL);
      }
      return colW;
    });
    const rawSum = widths.reduce((a, b) => a + b, 0);
    const scale =
      rawSum > ENTRY_CODE_UPLOAD_PREVIEW_MAX_WIDTH_PX && rawSum > 0
        ? ENTRY_CODE_UPLOAD_PREVIEW_MAX_WIDTH_PX / rawSum
        : 1;
    const titles = [];
    let newTableLength = 0;
    entryCodeHeaders.forEach((header, idx) => {
      const w = Math.max(
        ENTRY_CODE_PREVIEW_MIN_COL,
        Math.floor(widths[idx] * scale)
      );
      titles.push({
        headerName: translateEntryCodePreviewColumnHeader(
          header,
          t,
          schemaLanguageNames
        ),
        field: header,
        width: w,
        minWidth: ENTRY_CODE_PREVIEW_MIN_COL,
        wrapText: true,
        autoHeight: true,
        resizable: true,
        editable: true
      });
      newTableLength += w;
    });
    setTableLength(newTableLength);
    setColumnDefs(titles);
  }, [entryCodeHeaders, tempEntryCodeRowData, t, i18n.language, schemaLanguageNames]);

  const entryCodePreviewFixedViewport = useMemo(
    () => (tempEntryCodeRowData?.length || 0) >= AG_GRID_VIRTUALIZE_MIN_ROWS,
    [tempEntryCodeRowData]
  );

  useEffect(() => {
    const unfilteredAttributes = attributeRowData.filter((item) => item.List === true);
    // Filter to only show attributes that have entry codes and aren't the currently selected one
    const filteredAttributes = unfilteredAttributes.filter(
      (item, index) => {
        const attrEntryCodes = entryCodeRowData[item.Attribute];
        return index !== chosenEntryCodeIndex && 
               Array.isArray(attrEntryCodes) && 
               attrEntryCodes.length > 0 && 
               attrEntryCodes[0]?.Code !== "";
      }
    );
    const attributeArray = filteredAttributes.map((item) => item.Attribute);
    unfilteredAttrRef.current = unfilteredAttributes.map((item) => item.Attribute);
    setSelectedAttributesList(attributeArray);
  }, [attributeRowData, entryCodeRowData, chosenEntryCodeIndex]);

  const hasActiveEntryCodeUpload = useMemo(() => {
    const csvReady =
      Array.isArray(tempEntryCodeRowData) &&
      tempEntryCodeRowData.length > 0 &&
      Array.isArray(entryCodeHeaders) &&
      entryCodeHeaders.length > 0;
    const bundleReady =
      (tempEntryCodeSummary != null &&
        typeof tempEntryCodeSummary === "object" &&
        Object.keys(tempEntryCodeSummary).length > 0) ||
      (Array.isArray(tempEntryList) && tempEntryList.length > 0);
    return Boolean(rawFile?.length || csvReady || bundleReady);
  }, [
    rawFile,
    tempEntryCodeRowData,
    entryCodeHeaders,
    tempEntryCodeSummary,
    tempEntryList
  ]);

  const bundleHasEntryCodes = useMemo(
    () => schemaBundleHasEntryCodes(tempEntryCodeSummary, tempEntryList),
    [tempEntryCodeSummary, tempEntryList]
  );

  const entryCodeUploadForwardEnabled = useMemo(() => {
    if (fileType === "csvORxls") {
      return (
        Array.isArray(tempEntryCodeRowData) &&
        tempEntryCodeRowData.length > 0 &&
        Array.isArray(entryCodeHeaders) &&
        entryCodeHeaders.length > 0
      );
    }
    if (fileType === "json" || fileType === "zip") {
      return bundleHasEntryCodes;
    }
    return false;
  }, [
    fileType,
    tempEntryCodeRowData,
    entryCodeHeaders,
    bundleHasEntryCodes
  ]);

  return {
    rawFile,
    setRawFile,
    loading,
    setLoadingState,
    dropDisabled,
    dropMessage,
    setDropMessage,
    handleClearUpload,
    tempEntryCodeRowData,
    tableLength,
    columnDefs,
    handleSave,
    gridRef,
    setCurrentPage,
    setChosenEntryCodeIndex,
    fileType,
    selectionValue,
    setSelectionValue,
    userSelectionListDropdown,
    attributeListDropdown,
    selectedAttrToCopy,
    setSelectedAttrToCopy,
    entryCodeHeaders,
    hasActiveEntryCodeUpload,
    bundleHasEntryCodes,
    entryCodeUploadForwardEnabled,
    entryCodePreviewFixedViewport
  };
};

export default useHandleEntryCodeDrop;
