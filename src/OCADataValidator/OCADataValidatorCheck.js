import React, {
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Button, Drawer, IconButton, MenuItem, Typography } from "@mui/material";
import { greyCellStyle, gridStyles } from "../constants/styles";
import { AgGridReact } from "ag-grid-react";
import "../App.css";
import { Context } from "../App";
import OCABundle from "./validator";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import Languages from "./Languages";
import MultipleSelectPlaceholder from "./MultiSelectErrors";
import CellHeader from "../components/CellHeader";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ExportButton from "./ExportButton";
import {
  errorCode,
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription,
} from "../constants/constants";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import WarningPopup from "./WarningPopup";
import { CustomPalette } from "../constants/customPalette";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getCurrentData } from "../constants/utils";
import { CreateDataEntryExcel } from "../Landing/CreateDataEntryExcel";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CustomAnchorLink from "../components/CustomAnchorLink";
import ViewSchema from "../ViewSchema/ViewSchema";
import CloseIcon from '../assets/icon-close.png';

export const TrashCanButton = memo(
  forwardRef((props, _ref) => {
    const onClick = useCallback(() => {
      props.delete();
    }, [props]);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          display: props.node.data?.FormatText === "" ? "none" : "block",
        }}
        onClick={onClick}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );
  })
);

const convertToCSV = (data, newHeader) => {
  const csv = data
    .map((row) => {
      return newHeader
        .map((headerKey) => {
          let value = row[headerKey] !== undefined ? row[headerKey] : "";
          if (/,|"/.test(value)) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    })
    .join("\n");
  return csv;
};

const CustomTooltip = (props) => {
  const error = props.data?.error?.[props.colDef.field] || [];
  const dataLength = props.api.getRenderedNodes().length;

  return (
    <>
      {dataLength > 4 && error.length > 0 ? (
        <Box
          className="custom-tooltip"
          style={{
            backgroundColor: props.color || "#999",
            borderRadius: "8px",
            padding: "15px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            width: "100%",
            minWidth: "200px",
            maxWidth: "600px",
            maxHeight: "200px",
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              marginBottom: "5px",
              fontWeight: "bold",
              fontSize: "18px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Error ({error.length}):
          </Typography>
          {error.map((err, index) => (
            <Typography
              key={index}
              style={{
                wordWrap: "break-word",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "left",
              }}
            >
              {index + 1}. {err.detail}
            </Typography>
          ))}
        </Box>
      ) : dataLength > 0 && error.length > 0 ? (
        <Box
          className="custom-tooltip"
          style={{
            backgroundColor: props.color || "#999",
            borderRadius: "8px",
            padding: "5px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            width: "100%",
            minWidth: "200px",
            maxWidth: "600px",
            maxHeight: "200px",
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              marginBottom: "5px",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: "14px",
            }}
          >
            Error ({error.length}):{" "}
            <span
              style={{
                wordWrap: "break-word",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: "normal",
              }}
            >
              {error[0].detail}
            </span>
          </Typography>
        </Box>
      ) : (
        <p></p>
      )}
    </>
  );
};

const flaggedHeader = (
  props,
  labelDescription,
  formatRuleRowData,
  characterEncodingRowData,
  cardinalityData
) => {
  const value = labelDescription.find(
    (item) => item?.Attribute === props?.displayName
  );
  const formatRule = formatRuleRowData.find(
    (item) => item?.Attribute === props?.displayName
  );
  const attributeType = formatRule?.Type;
  let selectedOption = [];
  if (attributeType?.includes("Date")) {
    selectedOption = formatCodeDateDescription;
  } else if (attributeType?.includes("Numeric")) {
    selectedOption = formatCodeNumericDescription;
  } else if (attributeType?.includes("Binary")) {
    selectedOption = formatCodeBinaryDescription;
  } else if (attributeType?.includes("Text")) {
    selectedOption = formatCodeTextDescription;
  }

  const characterEncoding = characterEncodingRowData.find(
    (item) => item?.Attribute === props?.displayName
  );
  const cardinality = cardinalityData.find(
    (item) => item?.Attribute === props?.displayName
  );

  return (
    <CellHeader
      headerText={
        <Box sx={{ display: "flex", direction: "row", alignItems: "center" }}>
          {props?.displayName || ""}{" "}
        </Box>
      }
      helpText={
        value ? (
          <Box
            sx={{
              padding: "10px",
            }}
          >
            {value && (
              <>
                {"Label" in value && value?.Label && value?.Label !== "" && (
                  <>
                    <Typography sx={{ fontWeight: "bold" }}>Label:</Typography>
                    <Typography>{value?.Label}</Typography>
                  </>
                )}
                {"Description" in value &&
                  value?.Description &&
                  value?.Description !== "" && (
                    <>
                      <br />
                      <Typography sx={{ fontWeight: "bold" }}>
                        Description:
                      </Typography>
                      <Typography>{value?.Description}</Typography>
                    </>
                  )}
              </>
            )}
            {formatRule && (
              <>
                {"Type" in formatRule &&
                  formatRule?.Type &&
                  formatRule?.Type !== "" && (
                    <>
                      <br />
                      <Typography sx={{ fontWeight: "bold" }}>Type:</Typography>
                      <Typography>{formatRule?.Type}</Typography>
                    </>
                  )}
                {"FormatText" in formatRule &&
                  formatRule?.FormatText &&
                  formatRule?.FormatText !== "" && (
                    <>
                      <br />
                      <Typography sx={{ fontWeight: "bold" }}>
                        Format:
                      </Typography>
                      <Typography>
                        <span
                          style={{
                            fontWeight: "500",
                          }}
                        >
                          - RegEx:{" "}
                        </span>{" "}
                        {formatRule?.FormatText || ""}
                      </Typography>
                      <Typography>
                        <>
                          {formatRule?.FormatText in selectedOption && (
                            <>
                              <span
                                style={{
                                  fontWeight: "500",
                                }}
                              >
                                - Description:{" "}
                              </span>
                              {selectedOption[formatRule?.FormatText]}
                            </>
                          )}
                        </>
                      </Typography>
                    </>
                  )}
              </>
            )}
            {characterEncoding && (
              <>
                {"Make selected entries required" in characterEncoding && (
                  <>
                    <br />
                    <Typography sx={{ fontWeight: "bold" }}>
                      Required:
                    </Typography>
                    <Typography>
                      {characterEncoding?.[
                        "Make selected entries required"
                      ]?.toString() || ""}
                    </Typography>
                  </>
                )}
                {"Character Encoding" in characterEncoding &&
                  characterEncoding?.["Character Encoding"] &&
                  characterEncoding?.["Character Encoding"] !== "" && (
                    <>
                      <br />
                      <Typography sx={{ fontWeight: "bold" }}>
                        Character Encoding:
                      </Typography>
                      <Typography>
                        {characterEncoding?.["Character Encoding"]}
                      </Typography>
                    </>
                  )}
              </>
            )}
            {cardinality &&
              "EntryLimit" in cardinality &&
              cardinality?.EntryLimit &&
              cardinality?.EntryLimit !== "" && (
                <>
                  <br />
                  <Typography sx={{ fontWeight: "bold" }}>
                    Cardinality:
                  </Typography>
                  <Typography>{cardinality?.EntryLimit}</Typography>
                </>
              )}
          </Box>
        ) : (
          ""
        )
      }
    />
  );
};

const EntryCodeDropdownSelector = memo(
  forwardRef((props, _ref) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const columnHeader = props.colDef.field;
    const listItemObjectDisplay = props.dataHeaders?.[columnHeader].reduce(
      (acc, item) => {
        acc[item["Code"]] = item[props.lang];
        return acc;
      },
      {}
    );
    const listItems = Object.keys(listItemObjectDisplay);

    const handleChange = (e) => {
      props.node.updateData({
        ...props.data,
        [columnHeader]: e.target.value,
      });
      props.onRefresh();
      props.setRevalidateData(true);
      setIsDropdownOpen(false);
    };

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
      }
    };

    const typesDisplay = listItems.map((value, index) => {
      return (
        <MenuItem
          key={index + "_" + value}
          value={value}
          sx={{ border: "none", height: "2rem", fontSize: "small" }}
        >
          <strong>{value}</strong>: {listItemObjectDisplay[value] || ""}
        </MenuItem>
      );
    });

    return (
      <>
        {listItems.length > 0 ? (
          <DropdownMenuList
            handleKeyDown={handleKeyDown}
            type={props.node.data?.[columnHeader]}
            handleChange={handleChange}
            handleClick={handleClick}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            typesDisplay={typesDisplay}
          />
        ) : (
          <></>
        )}
      </>
    );
  })
);

const OCADataValidatorCheck = ({
  showWarningCard,
  setShowWarningCard,
  firstTimeDisplayWarning,
}) => {
  const {
    schemaDataConformantRowData,
    setSchemaDataConformantRowData,
    schemaDataConformantHeader,
    setCurrentDataValidatorPage,
    ogWorkbook,
    jsonParsedFile,
    languages,
    lanAttributeRowData,
    matchingRowData,
    datasetRawFile,
    formatRuleRowData,
    cardinalityData,
    characterEncodingRowData,
    attributesList,
    setSchemaDataConformantHeader,
    savedEntryCodes,
    targetResult,
  } = useContext(Context);

  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [revalidateData, setRevalidateData] = useState(false);
  const langRef = useRef(languages[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorName, setErrorNameList] = useState([]);
  const [firstValidate, setFirstValidate] = useState(false);
  const [isValidateButtonEnabled, setIsValidateButtonEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const DrawerList = (
    <Box
      sx={{ width: "100%" }}
      role="presentation"
      onClick={toggleDrawer(false)}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 16px",
          position: "relative"
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: CustomPalette.PRIMARY,
          }}
        >
          Schema Preview
        </h1>
        <Box
          edge="end"
          sx={{
            position: "absolute",
            right: 0,
            marginRight: "3rem",
            cursor: "pointer",
          }}
        >
          <img style={{ height: "25px" }} src={CloseIcon} alt="Close" />
        </Box>
      </Box>

      <ViewSchema isPageForward={false} />

    </Box>
  );

  const SavedEntryCodesWithNoArrayType = Object.keys(savedEntryCodes).filter((key) => {
    const attribute = jsonParsedFile.capture_base.attributes[key];
    return !Array.isArray(attribute) && !attribute.includes('Array');

  }).reduce((acc, key) => {
    acc[key] = savedEntryCodes[key];
    return acc;
  }, {});

  const gridRef = useRef();
  const validateBeforeOnChangeRef = useRef(false);

  const datasetRawFileType = datasetRawFile[0]?.name.split(".").pop();

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      flex: 1,
      minWidth: 100,
      tooltipComponent: CustomTooltip,
      headerComponent: (params) =>
        flaggedHeader(
          params,
          lanAttributeRowData[langRef.current],
          formatRuleRowData,
          characterEncodingRowData,
          cardinalityData
        ),
      cellRendererParams: (params) => ({
        dataHeaders: savedEntryCodes,
        lang: langRef.current,
        setRevalidateData,
        onRefresh: () => {
          gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
        },
      }),
    };
  }, [
    lanAttributeRowData,
    cardinalityData,
    characterEncodingRowData,
    formatRuleRowData,
    savedEntryCodes,
  ]);

  const handleSave = async (ogHeader = false, exportFormat) => {
    if (ogWorkbook !== null && exportFormat === "excel") {
      await handleExcelSave();
    } else if (ogWorkbook !== null && exportFormat === "csv") {
      await handleCSVSave(ogHeader);
    } else if (ogWorkbook === null && exportFormat === "csv") {
      await handleCSVSave(ogHeader);
    } else {
      await handleExcelSave();
    }
  };

  const handleExcelSave = async () => {
    try {
      const workbook = await generateDataEntryExcel(
        targetResult,
        langRef.current
      );
      if (workbook !== null) {
        downloadExcelFile(workbook, "DataEntryExcel.xlsx");
      } else {
        throw new Error("Error while generating Excel file");
      }
    } catch (error) {
      console.error("Error while generating Excel file", error);
    }
  };

  const handleCSVSave = async (ogHeader) => {
    try {
      const newCSV = await generateCSVFile(ogHeader);
      if (newCSV !== null) {
        downloadCSVFile(newCSV, "DataEntryCSV.csv");
      } else {
        throw new Error("Error while generating CSV file");
      }
    } catch (error) {
      console.error("Error while generating CSV file", error);
    }
  };

  const generateCSVFile = async (ogHeader) => {
    const newData = [];
    gridRef.current.api.forEachNode((node) => {
      let newObject = {};
      if (ogHeader) {
        for (const [key, value] of Object.entries(node?.data)) {
          newObject[
            matchingRowData.find((item) => item["Attribute"] === key)
              ?.Dataset || key
          ] = value;
        }
      } else {
        newObject = { ...node?.data };
      }
      newData.push(newObject);
    });

    const newHeader = [];

    const mappingFromAttrToDataset = {};
    for (const node of matchingRowData) {
      mappingFromAttrToDataset[node["Attribute"]] = node["Dataset"];
    }

    schemaDataConformantHeader.forEach((header) => {
      if (ogHeader) {
        newHeader.push(mappingFromAttrToDataset[header] || header);
      } else {
        newHeader.push(header);
      }
    });

    const headerToString = newHeader.join(",") + "\n";
    return headerToString + convertToCSV(newData, newHeader);
  };

  const handleValidate = async () => {
    validateBeforeOnChangeRef.current = true;
    gridRef.current.api.stopEditing();
    gridRef.current.api.showLoadingOverlay();
    setRevalidateData(false);
    setFirstValidate(true);
    const bundle = new OCABundle();
    await bundle.loadedBundle(jsonParsedFile);
    const newData = getCurrentData(gridRef.current.api, true);

    const prepareInput = {};
    schemaDataConformantHeader.forEach((header) => {
      for (const row of newData) {
        if (header in row) {
          prepareInput[header] =
            header in prepareInput
              ? [...prepareInput[header], row[header]]
              : [row[header]];
        }
      }
    });

    const validate = bundle.validate(prepareInput);

    setRowData(() => {
      return newData.map((data, index) => {
        return {
          ...data,
          error: validate?.errCollection?.[index] || {},
        };
      });
    });

    setColumnDefs((prev) => {
      const copy = [];

      prev.forEach((header) => {
        if (
          validate?.unmachedAttrs?.has(header.headerName) &&
          header.headerName !== ""
        ) {
          copy.push({
            ...header,
            cellStyle: () => {
              return { backgroundColor: "#ededed" };
            },
          });
        } else {
          copy.push({
            ...header,
            cellStyle,
          });
        }
      });

      return copy;
    });
  };

  const generateDataEntryExcel = async (e, selectedLang) => {
    try {
      const workbook = await CreateDataEntryExcel(e, selectedLang);
      const newData = getCurrentData(gridRef.current.api, false);
      const schemaConformantDataHeaders = Array.from(
        new Set(newData.flatMap(Object.keys))
      );

      workbook.removeWorksheet("Data"); // Delete as you can't add without removing data validation.
      workbook.addWorksheet("Data");

      const schemaConformantDataSheet = workbook.getWorksheet("Data");
      schemaConformantDataSheet.addRow(schemaConformantDataHeaders);
      const headerRow = schemaConformantDataSheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        if (colNumber <= schemaConformantDataHeaders.length) {
          schemaConformantDataSheet.getColumn(colNumber).width = 17;
          formatHeader(cell);
        }
      });

      newData.forEach((data) => {
        const row = schemaConformantDataHeaders.map(
          (header) => data[header] || ""
        );
        const addedRow = schemaConformantDataSheet.addRow(row);
        addedRow.eachCell((cell) => {
          formatAttr(cell);
        });
      });
      return workbook;
    } catch (error) {
      console.error("Error generating DataEntryExcel file:", error);
    }
  };

  function formatHeader(cell) {
    cell.font = { size: 10, bold: true };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E7E6E6" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  function formatAttr(cell) {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "top", wrapText: true };
  }

  const downloadExcelFile = (workbook, fileName) => {
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "DataEntryExcel.xlsx";
      a.click();
    });
  };

  const downloadCSVFile = (csvData, fileName) => {
    const blob = new Blob([csvData], { type: "text/csv" });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "export.csv"; // Default filename is 'export.csv'
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cellStyle = (params) => {
    const error = params.data?.error?.[params.colDef.field];
    if (params.colDef.field === "Delete") {
      return greyCellStyle;
    } else if (params.data?.error && error?.length > 0) {
      return { backgroundColor: "#ffd7e9" };
    } else if (params.data?.error) {
      return { backgroundColor: "#d2f8d2" };
    }
  };

  const handleChange = useCallback((e) => {
    langRef.current = e.target.value;
    setIsDropdownOpen(false);
  }, []);

  const handleAddRow = useCallback(() => {
    if (isValidateButtonEnabled) {
      setIsValidateButtonEnabled(false);
    }
    const newRow = {};
    schemaDataConformantHeader.forEach((header) => {
      newRow[header] = "";
    });

    const currentData = getCurrentData(gridRef.current.api, true);

    setRowData((prev) => [...currentData, newRow]);
  }, [
    isValidateButtonEnabled,
    schemaDataConformantHeader,
    gridRef,
    setRowData,
  ]);

  const onCellValueChanged = (e) => {
    if (validateBeforeOnChangeRef.current) {
      validateBeforeOnChangeRef.current = false;
      return;
    }

    e.node.updateData({
      ...e.data,
      [e.colDef.field]: e.newValue,
    });

    if (e.oldValue !== e.newValue) {
      var column = e.column.colDef.field;
      e.column.colDef.cellStyle = { "background-color": "none" };
      e.api.refreshCells({
        force: true,
        columns: [column],
        rowNodes: [e.node],
      });
    }

    setRevalidateData(true);
  };

  const handleMoveBack = () => {
    const currentData = getCurrentData(gridRef.current.api, true);

    if (datasetRawFile.length > 0) {
      const mappingFromAttrToDataset = {};
      for (const node of matchingRowData) {
        mappingFromAttrToDataset[node["Attribute"]] = node["Dataset"];
      }

      const newData = [];
      for (const node of currentData) {
        const newRow = {};
        for (const [key, value] of Object.entries(node)) {
          if (key in mappingFromAttrToDataset) {
            newRow[mappingFromAttrToDataset[key]] = value;
          } else {
            newRow[key] = value;
          }
        }
        newData.push(newRow);
      }

      setSchemaDataConformantHeader((prev) =>
        prev.map((header) => mappingFromAttrToDataset[header] || header)
      );
      setSchemaDataConformantRowData(newData);
      setCurrentDataValidatorPage("AttributeMatchDataValidator");
    } else {
      setSchemaDataConformantRowData(currentData);
      setCurrentDataValidatorPage("StartDataValidator");
    }
  };

  const handleDismissWarning = useCallback(() => {
    setShowWarningCard(false);
    firstTimeDisplayWarning.current = false;
  }, [firstTimeDisplayWarning, setShowWarningCard]);

  const onCellKeyDown = useCallback(
    (e) => {
      validateBeforeOnChangeRef.current = false;
      const keyPressed = e.event.code;

      const isLastRow = e.node.lastChild;
      if (keyPressed === "Enter") {
        if (isLastRow) {
          handleAddRow();
        }
        setTimeout(() => {
          const api = e.api;
          const editingRowIndex = e.rowIndex;
          api.setFocusedCell(editingRowIndex + 1, e.column);
        }, 0);
      }

      if (keyPressed === "Tab") {
        const allColumns = e.columnApi.getAllColumns();
        const isLastColumn = e.column === allColumns.slice(-1)[0];
        if (isLastColumn && isLastRow) {
          handleAddRow();
          setTimeout(() => {
            const api = e.api;
            const editingRowIndex = e.rowIndex;
            api.setFocusedCell(editingRowIndex + 1, allColumns[0]);
          }, 0);
        }
      }
    },
    [handleAddRow]
  );

  useEffect(() => {
    const columns = [];
    const variableToCheck =
      datasetRawFile.length === 0 ? attributesList : schemaDataConformantHeader;
    if (datasetRawFile.length === 0) {
      setSchemaDataConformantHeader(attributesList);
    }

    if (variableToCheck && variableToCheck?.length > 0) {
      variableToCheck.forEach((header) => {
        columns.push({
          headerName: header,
          field: header,
          minWidth: 150,
          tooltipComponentParams: { color: "#F88379" },
          tooltipValueGetter: (params) => ({ value: params.value }),
          cellRendererFramework:
            header in SavedEntryCodesWithNoArrayType ? EntryCodeDropdownSelector : undefined,
        });
      });
    }

    columns.push(
      {
        headerName: 'Del.',
        field: 'Delete',
        cellRendererFramework: TrashCanButton,
        width: 50,
        cellRendererParams: (params) => ({
          delete: () => {
            gridRef.current.api.applyTransaction({
              remove: [params.node.data],
            });
            gridRef.current.api.redrawRows();
          }
        }),
        pinned: 'right',
        cellStyle: () => greyCellStyle,
      }
    );

    setColumnDefs(columns);
    setRowData(schemaDataConformantRowData);
  }, [
    datasetRawFile.length,
    attributesList,
    schemaDataConformantHeader,
    schemaDataConformantRowData,
    setSchemaDataConformantHeader,
    savedEntryCodes,
  ]);

  useEffect(() => {
    if (rowData && rowData.length === 0) {
      setIsValidateButtonEnabled(true);
    } else if (isValidateButtonEnabled && rowData && rowData.length > 0) {
      setIsValidateButtonEnabled(false);
    }
  }, [rowData, isValidateButtonEnabled]);

  const rowDataFilter =
    errorName.length > 0
      ? rowData.filter((row) => {
        for (const error of errorName) {
          if (row?.error) {
            const errCode = errorCode?.[error];
            const errorValues = Object.values(row?.error);
            for (const err of errorValues) {
              const errs = err.map((item) => item?.type);
              if (errs?.includes(errCode)) {
                return true;
              }
            }
          }
        }
        return false;
      })
      : rowData;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{
        minWidth: '900px',
      }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "auto",
            marginRight: "2rem",
            pl: 10,
            marginTop: 2,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              color="navButton"
              sx={{ textAlign: "left", alignSelf: "flex-start" }}
              onClick={handleMoveBack}
            >
              <ArrowBackIosIcon /> Back
            </Button>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: CustomPalette.RED_100,
                width: "400px",
                marginLeft: "1rem",
                marginRight: "1rem",
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  color: CustomPalette.SECONDARY,
                  p: 0.5,
                  pl: 0,
                  fontSize: 25,
                }}
              />
              <p>No data is saved without exporting!</p>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  paddingRight: "20px",
                  alignItems: "center",
                }}
              >
                {revalidateData && (
                  <Typography
                    sx={{
                      marginRight: "20px",
                      color: "red",
                      fontWeight: "bold",
                    }}
                  >
                    Please re-verify the data!
                  </Typography>
                )}
                <Button
                  color="button"
                  variant="contained"
                  target="_blank"
                  style={{ width: "120px", height: "40px", marginTop: "15px" }}
                  onClick={handleValidate}
                  disabled={isValidateButtonEnabled}
                >
                  Verify
                </Button>
              </Box>
              <ExportButton
                handleSave={handleSave}
                inputDataType={datasetRawFileType}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: '900px',
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              marginTop: "2rem",
              gap: "10px",
              flex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                paddingLeft: "2rem",
                gap: "10px",
              }}
            >
              <Languages
                type={langRef.current}
                handleChange={handleChange}
                handleClick={() => { }}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                languages={languages}
              />
              <MultipleSelectPlaceholder
                errorName={errorName}
                setErrorNameList={setErrorNameList}
                disabled={!firstValidate}
                placeHolder="Select Errors"
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              marginTop: "2rem",
              gap: "10px",
            }}
          >
            <CustomAnchorLink text="Verification Rules" onClick={toggleDrawer(true)} overrideStyle={{ textAlign: "right", marginRight: "2rem" }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginRight: "2rem",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#d2f8d2",
                  marginRight: "15px",
                }}
              ></div>
              <span>Pass Verification</span>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginRight: "2rem",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#ffd7e9",
                  marginRight: "15px",
                }}
              ></div>
              <span>Fail Verification</span>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginRight: "2rem",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#ededed",
                  marginRight: "15px",
                }}
              ></div>
              <span>Unmatched Attributes</span>
              
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginRight: "2rem",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#ffffff",
                  marginRight: "15px",
                  border: "1px solid #ededed",
                }}
              ></div>
              <span>Unverified Data</span>
              
            </Box>
          </Box>
        </Box>

        <div style={{ margin: "2rem" }}>
          <div className="ag-theme-balham" style={{ height: "45vh" }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={rowDataFilter}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              overlayLoadingTemplate={
                '<div aria-live="polite" aria-atomic="true" style="height:100px; width:100px; background: url(https://ag-grid.com/images/ag-grid-loading-spinner.svg) center / contain no-repeat; margin: 0 auto;" aria-label="loading"></div>'
              }
              tooltipShowDelay={0}
              tooltipHideDelay={5000}
              tooltipMouseTrack={true}
              onCellValueChanged={onCellValueChanged}
              suppressRowHoverHighlight={true}
              onCellKeyDown={onCellKeyDown}
              suppressFieldDotNotation
            />
          </div>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: "2rem",
            }}
          >
            <Button
              onClick={handleAddRow}
              color="button"
              variant="contained"
              sx={{
                alignSelf: "flex-end",
                width: "9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              Add row <AddCircleIcon />
            </Button>
          </Box>
        </div>
      </Box>
      {firstTimeDisplayWarning.current && showWarningCard && (
        <WarningPopup action={handleDismissWarning} />
      )}
      <Drawer open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
      </Drawer>
    </Box>
  );
};


export default OCADataValidatorCheck;
