import React, { forwardRef, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, MenuItem, Typography } from '@mui/material';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
import '../App.css';
import { Context } from '../App';
import ExcelJS from 'exceljs';
import OCABundle from './validator';
import OCADataSet from './utils/files';
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import Languages from "./Languages";
import MultipleSelectPlaceholder from './MultiSelectErrors';
import CellHeader from '../components/CellHeader';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ExportButton from './ExportButton';
import { formatCodeBinaryDescription, formatCodeDateDescription, formatCodeNumericDescription, formatCodeTextDescription } from '../constants/constants';
import { DropdownMenuList } from '../components/DropdownMenuCell';
import WarningPopup from './WarningPopup';

const convertToCSV = (data) => {
  const csv = data.map(row => Object.values(row).join(',')).join('\n');
  return csv;
};

const CustomTooltip = (props) => {
  const error = props.data?.error?.[props.colDef.field] || "";

  return (
    <>
      {error.length > 0 ?
        (<Box className="custom-tooltip" style={{ backgroundColor: props.color || '#999', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', width: '100%', minWidth: '200px', maxWidth: '600px', maxHeight: '200px', overflow: 'hidden' }}>
          <Typography sx={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Error:
          </Typography>
          <Typography style={{ wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {error.toString()}
          </Typography>
        </Box>)
        : <p></p>}
    </>
  );
};

const flaggedHeader = (props, labelDescription, formatRuleRowData, characterEncodingRowData, cardinalityData) => {
  const value = labelDescription.find((item) => item?.Attribute === props?.displayName);
  const formatRule = formatRuleRowData.find((item) => item?.Attribute === props?.displayName);
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

  const characterEncoding = characterEncodingRowData.find((item) => item?.Attribute === props?.displayName);
  const cardinality = cardinalityData.find((item) => item?.Attribute === props?.displayName);

  return (
    <CellHeader
      headerText={
        <Box sx={{ display: 'flex', direction: 'row', alignItems: 'center' }}>
          {props?.displayName || ''} {' '}
        </Box>
      }
      helpText={
        value ?
          (<Box sx={{
            padding: '10px',
          }}>
            {value &&
              <>
                {"Label" in value && value?.Label && value?.Label !== "" &&
                  <>
                    <Typography sx={{ fontWeight: 'bold' }}>Label:</Typography>
                    <Typography>
                      {value?.Label}
                    </Typography>
                  </>}
                {"Description" in value && value?.Description && value?.Description !== "" &&
                  <>
                    <br />
                    <Typography sx={{ fontWeight: 'bold' }}>Description:</Typography>
                    <Typography>
                      {value?.Description}
                    </Typography>
                  </>}
              </>}
            {formatRule &&
              <>
                {"Type" in formatRule && formatRule?.Type && formatRule?.Type !== "" &&
                  <>
                    <br />
                    <Typography sx={{ fontWeight: 'bold' }}>Type:</Typography>
                    <Typography>
                      {formatRule?.Type}
                    </Typography>
                  </>}
                {"FormatText" in formatRule && formatRule?.FormatText && formatRule?.FormatText !== "" &&
                  <>
                    <br />
                    <Typography sx={{ fontWeight: 'bold' }}>Format:</Typography>
                    <Typography >
                      <span style={{
                        fontWeight: '500',
                      }}>- RegEx: </span> {formatRule?.FormatText || ''}
                    </Typography>
                    <Typography>
                      <>
                        {formatRule?.FormatText in selectedOption &&
                          <>
                            <span style={{
                              fontWeight: '500',
                            }}>- Description: </span>
                            {selectedOption[formatRule?.FormatText]}
                          </>
                        }
                      </>
                    </Typography>
                  </>}
              </>}
            {characterEncoding &&
              <>
                {'Make selected entries required' in characterEncoding &&
                  <>
                    <br />
                    <Typography sx={{ fontWeight: 'bold' }}>Required:</Typography>
                    <Typography>
                      {characterEncoding?.['Make selected entries required']?.toString() || ''}
                    </Typography>
                  </>}
                {'Character Encoding' in characterEncoding && characterEncoding?.['Character Encoding'] && characterEncoding?.['Character Encoding'] !== "" &&
                  <>
                    <br />
                    <Typography sx={{ fontWeight: 'bold' }}>Character Encoding:</Typography>
                    <Typography>
                      {characterEncoding?.['Character Encoding']}
                    </Typography>
                  </>}

              </>}
            {cardinality && "EntryLimit" in cardinality && cardinality?.EntryLimit && cardinality?.EntryLimit !== "" &&
              <>
                <br />
                <Typography sx={{ fontWeight: 'bold' }}>Cardinality:</Typography>
                <Typography>
                  {cardinality?.EntryLimit}
                </Typography>
              </>}
          </Box>) : ''
      } />
  );
};

const EntryCodeDropdownSelector = memo(
  forwardRef((props, ref) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const columnHeader = props.colDef.field;
    const listItemObjectDisplay = props.dataHeaders?.[columnHeader].reduce((acc, item) => {
      acc[item['Code']] = item[props.lang];
      return acc;
    }, {});
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
          <strong>{value}</strong>: {listItemObjectDisplay[value] || ''}
        </MenuItem>
      );
    });

    return (
      <>
        {
          listItems.length > 0 ?
            <DropdownMenuList
              handleKeyDown={handleKeyDown}
              type={props.node.data?.[columnHeader]}
              handleChange={handleChange}
              handleClick={handleClick}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              typesDisplay={typesDisplay}
            /> :
            <></>
        }
      </>
    );
  })
);

const OCADataValidatorCheck = ({ showWarningCard, setShowWarningCard, firstTimeDisplayWarning }) => {
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
    attributeRowData
  } = useContext(Context);

  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [revalidateData, setRevalidateData] = useState(false);
  const langRef = useRef(languages[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorName, setErrorNameList] = useState([]);
  const [firstValidate, setFirstValidate] = useState(false);
  const [isValidateButtonEnabled, setIsValidateButtonEnabled] = useState(false);

  const gridRef = useRef();

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      flex: 1,
      minWidth: 100,
      tooltipComponent: CustomTooltip,
      headerComponent: (params) => flaggedHeader(params, lanAttributeRowData[langRef.current], formatRuleRowData, characterEncodingRowData, cardinalityData),
      cellRendererParams: (params) => ({
        dataHeaders: savedEntryCodes,
        lang: langRef.current,
        setRevalidateData,
        onRefresh: () => {
          gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
        },
      }),
    };
  }, [lanAttributeRowData, langRef.current]);

  const handleSave = async (ogHeader = false) => {
    if (ogWorkbook !== null) {
      const workbook = await generateDataEntryExcel(ogHeader);
      if (workbook !== null) {
        downloadExcelFile(workbook, 'DataEntryExcel.xlsx');
      }
    } else {
      const newCSV = await generateCSVFile(ogHeader);
      if (newCSV !== null) {
        downloadCSVFile(newCSV, 'DataEntryCSV.csv');
      }
    }
  };

  const generateCSVFile = async (ogHeader) => {
    const newData = gridRef.current.api.getRenderedNodes()?.map(node => {
      const newObject = { ...node?.data };
      delete newObject['error'];
      return newObject;
    });
    const newHeader = [];

    const mappingFromAttrToDataset = {};
    for (const node of matchingRowData) {
      mappingFromAttrToDataset[node['Attribute']] = node['Dataset'];
    }
    schemaDataConformantHeader.forEach((header) => {
      if (ogHeader) {
        newHeader.push(mappingFromAttrToDataset[header] || header);
      } else {
        newHeader.push(header);
      }
    });

    const headerToString = newHeader.join(',') + '\n';
    return headerToString + convertToCSV(newData);
  };

  const handleValidate = async () => {
    gridRef.current.api.stopEditing();
    gridRef.current.api.showLoadingOverlay();
    setRevalidateData(false);
    setFirstValidate(true);
    const bundle = new OCABundle();
    await bundle.loadedBundle(jsonParsedFile);
    const newData = gridRef.current?.api.getRenderedNodes()?.map(node => node?.data);

    if (ogWorkbook !== null) {
      const newWorkbook = await generateDataEntryExcel();
      newWorkbook.xlsx.writeBuffer().then((buffer) => {
        const file = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataset = await OCADataSet.readExcel(e.target.result);
          const validate = bundle.validate(dataset);

          setRowData((prev) => {
            return prev.map((row, index) => {
              const data = newData[index];
              return {
                ...data,
                error: validate?.errCollection?.[index] || {},
              };
            });
          });
          setColumnDefs((prev) => {
            const copy = [];

            if (validate?.unmachedAttrs?.size > 0) {
              prev.forEach((header) => {
                if (validate?.unmachedAttrs?.has(header.headerName)) {
                  copy.push({
                    ...header,
                    cellStyle: () => {
                      return { backgroundColor: "#ededed" };
                    }
                  });
                } else {
                  copy.push({
                    ...header,
                    cellStyle
                  });
                }
              });
            }
            return copy;
          });
          setTimeout(() => {
            gridRef.current.api.hideOverlay();
          }, 800);
        };
        reader.readAsArrayBuffer(file);
      });
    } else {
      const prepareInput = {};
      schemaDataConformantHeader.forEach((header) => {
        for (const row of newData) {
          if (header in row) {
            prepareInput[header] = header in prepareInput ? [...prepareInput[header], row[header]] : [row[header]];
          }
        }
      });

      const validate = bundle.validate(prepareInput);

      setRowData((prev) => {
        return prev.map((row, index) => {
          const data = newData[index];
          return {
            ...data,
            error: validate?.errCollection?.[index] || {},
          };
        });
      });

      setColumnDefs((prev) => {
        const copy = [];

        if (validate?.unmachedAttrs?.size > 0) {
          prev.forEach((header) => {
            if (validate?.unmachedAttrs?.has(header.headerName)) {
              copy.push({
                ...header,
                cellStyle: () => {
                  return { backgroundColor: "#ededed" };
                }
              });
            } else {
              copy.push({
                ...header,
                cellStyle
              });
            }
          });
        } else {
          prev.forEach((header) => {
            copy.push({
              ...header,
              cellStyle
            });
          });
        }
        return copy;
      });
    }

  };

  const generateDataEntryExcel = async (ogHeader = false) => {
    try {
      const newWorkbook = await copyFirstTwoWorksheets(ogWorkbook);

      const schemaConformantDataNameWorksheet = newWorkbook.addWorksheet("Schema Conformant Data");
      makeHeaderRow(schemaDataConformantHeader, schemaConformantDataNameWorksheet, 20);
      const newData = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
      newData.forEach((row, index) => {
        schemaDataConformantHeader.forEach((header, headerIndex) => {
          schemaConformantDataNameWorksheet.getCell(index + 2, headerIndex + 1).value = row[header] === '' || isNaN(row[header]) ? row[header] : Number(row[header]);
        });
      });

      if (ogHeader) {
        const mappingFromAttrToDataset = {};
        for (const node of matchingRowData) {
          mappingFromAttrToDataset[node['Attribute']] = node['Dataset'];
        }
        const newHeader = schemaDataConformantHeader.map((header) => mappingFromAttrToDataset[header] || header);
        makeHeaderRow(newHeader, schemaConformantDataNameWorksheet, 20);
      }

      return newWorkbook;
    } catch (error) {
      console.log('error', error);
      return null;
    }
  };

  const downloadExcelFile = (workbook, fileName) => {
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DataEntryExcel.xlsx";
      a.click();
    });
  };

  const downloadCSVFile = (csvData, fileName) => {
    const blob = new Blob([csvData], { type: 'text/csv' });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'export.csv'; // Default filename is 'export.csv'
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const makeHeaderRow = (rowHeadersArray, worksheetName, columnWidth) => {
    const defaultColumnStyle = {
      alignment: {
        wrapText: true,
      },
    };
    const allColumns = [];
    rowHeadersArray.forEach((item, index) => {
      allColumns.push({ width: columnWidth, style: defaultColumnStyle });
      worksheetName.getCell(1, index + 1).value = item;
      worksheetName.getCell(1, index + 1).style = {
        wrapText: true,
        ...defaultColumnStyle,
      };
    });
    return allColumns;
  };

  const copyFirstTwoWorksheets = async (workbook) => {
    const firstSheetName = "Schema Description";
    const secondSheetName = "Data Entry";
    const worksheet = workbook?.Sheets?.[firstSheetName];
    const dataEntryWorksheet = workbook?.Sheets?.[secondSheetName];
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet(firstSheetName);
    const newDataEntryWorksheet = newWorkbook.addWorksheet(secondSheetName);

    Object.keys(worksheet).forEach((cell) => {
      if (!worksheet[cell]?.v || cell === '!ref') return;
      newWorksheet.getCell(cell).value = worksheet[cell]?.v;
    });

    Object.keys(dataEntryWorksheet).forEach((cell) => {
      if (!dataEntryWorksheet[cell]?.v || cell === '!ref') return;
      newDataEntryWorksheet.getCell(cell).value = dataEntryWorksheet[cell]?.v;
    });

    return newWorkbook;
  };

  const cellStyle = (params) => {
    const error = params.data?.error?.[params.colDef.field];

    if (params.data?.error && error?.length > 0) {
      return { backgroundColor: "#ffd7e9" };
    } else if (params.data?.error) {
      return { backgroundColor: "#d2f8d2" };
    }
  };

  const handleChange = useCallback((e) => {
    langRef.current = e.target.value;
    setIsDropdownOpen(false);
  }, []);

  const handleAddRow = () => {
    if (isValidateButtonEnabled) {
      setIsValidateButtonEnabled(false);
    }
    const newRow = {};
    schemaDataConformantHeader.forEach((header) => {
      newRow[header] = "";
    });

    const currentData = gridRef.current.api.getRenderedNodes().map((node) => node.data);

    setRowData((prev) => [...currentData, newRow]);
  };

  const onCellValueChanged = (e) => {
    e.node.updateData(
      {
        ...e.data,
        [e.colDef.field]: e.newValue,
      }
    );

    if (e.oldValue !== e.newValue) {
      var column = e.column.colDef.field;
      e.column.colDef.cellStyle = { 'background-color': 'none' };
      e.api.refreshCells({
        force: true,
        columns: [column],
        rowNodes: [e.node]
      });
    }

    setRevalidateData(true);
  };

  const handleMoveBack = () => {
    const currentData = gridRef.current.api.getRenderedNodes()?.map((node) => node.data);

    if (datasetRawFile.length > 0) {
      const mappingFromAttrToDataset = {};
      for (const node of matchingRowData) {
        mappingFromAttrToDataset[node['Attribute']] = node['Dataset'];
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

      setSchemaDataConformantHeader(prev => prev.map((header) => mappingFromAttrToDataset[header] || header));
      setSchemaDataConformantRowData(newData);
      setCurrentDataValidatorPage('AttributeMatchDataValidator');
    } else {
      setSchemaDataConformantRowData(currentData);
      setCurrentDataValidatorPage('StartDataValidator');
    }
  };

  const handleDismissWarning = useCallback(() => {
    setShowWarningCard(false);
    firstTimeDisplayWarning.current = false;
  }, [firstTimeDisplayWarning, setShowWarningCard]);

  useEffect(() => {
    const columns = [];
    const variableToCheck = datasetRawFile.length === 0 ? attributesList : schemaDataConformantHeader;
    if (datasetRawFile.length === 0) {
      setSchemaDataConformantHeader(attributesList);
    }

    if (variableToCheck && variableToCheck?.length > 0) {
      variableToCheck.forEach((header) => {
        columns.push(
          {
            headerName: header,
            field: header,
            minWidth: 150,
            tooltipComponentParams: { color: '#F88379' },
            tooltipValueGetter: (params) => ({ value: params.value }),
            cellRendererFramework: header in savedEntryCodes ? EntryCodeDropdownSelector : undefined,
          }
        );
      });
    }

    setColumnDefs(columns);
    setRowData(schemaDataConformantRowData);
  }, []);

  useEffect(() => {
    if (rowData && rowData.length === 0) {
      setIsValidateButtonEnabled(true);
    } else if (isValidateButtonEnabled && rowData && rowData.length > 0) {
      setIsValidateButtonEnabled(false);
    }
  }, [rowData]);

  const rowDataFilter = errorName.length > 0 ? rowData.filter((row) => {
    for (const error of errorName) {
      if (row?.error) {
        const errorValues = Object.values(row?.error);
        for (const ind of errorValues) {
          if (ind.toLowerCase().includes(error.toLowerCase())) {
            return true;
          }
        }
      }
    }
    return false;
  }) : rowData;

  return (
    <>
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "auto",
            marginRight: '2rem',
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
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
            }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  paddingRight: "20px",
                  alignItems: 'center',
                }}
              >
                {revalidateData &&
                  <Typography sx={{
                    marginRight: "20px",
                    color: 'red',
                    fontWeight: 'bold',
                  }}>Please re-verify the data!</Typography>}
                <Button
                  color='button'
                  variant='contained'
                  target='_blank'
                  style={{ width: '120px', height: '40px' }}
                  onClick={handleValidate}
                  disabled={isValidateButtonEnabled}
                >
                  Verify
                </Button>
              </Box>
              <ExportButton handleSave={handleSave} />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignContent: 'space-between'
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: "2rem",
            gap: "10px",
            flex: 1,
          }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                paddingLeft: "2rem",
                gap: "10px",
              }}
            >
              <Languages type={langRef.current} handleChange={handleChange} handleClick={() => { }} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} languages={languages} />
              <MultipleSelectPlaceholder errorName={errorName} setErrorNameList={setErrorNameList} disabled={!firstValidate} />
            </Box>
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: "2rem",
            gap: "10px",
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: "2rem" }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: "#d2f8d2", marginRight: '15px' }}></div>
              <span>Pass Verification</span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: "2rem" }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: "#ffd7e9", marginRight: '15px' }}></div>
              <span>Fail Verification</span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: "2rem" }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: "#ededed", marginRight: '15px' }}></div>
              <span>Unmatched Attributes</span>
            </Box>
          </Box>
        </Box>

        <div style={{ margin: "2rem" }}>
          <div
            className="ag-theme-balham"
          >
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
              tooltipHideDelay={2000}
              onCellValueChanged={onCellValueChanged}
              domLayout="autoHeight"
              suppressRowHoverHighlight={true}
            />
          </div>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: '2rem',
          }}>
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
      </Box >
      {firstTimeDisplayWarning.current && showWarningCard && <WarningPopup action={handleDismissWarning} />}
    </>

  );
};

export default OCADataValidatorCheck;