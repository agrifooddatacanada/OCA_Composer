import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
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

const CustomTooltip = (props) => {
  const error = props.data?.error?.[props.colDef.field] || "";

  return (
    <>
      {error.length > 0 ?
        (<Box className="custom-tooltip" style={{ backgroundColor: props.color || '#999', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <Typography sx={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '18px' }}>
            Error:
          </Typography>
          <Typography>
            {error}
          </Typography>
        </Box>)
        : <p></p>}
    </>
  );
};

const flaggedHeader = (props, labelDescription) => {
  const value = labelDescription.find((item) => item?.Attribute === props?.displayName);

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
            <Typography sx={{ fontWeight: 'bold' }}>Label:</Typography>
            <Typography>
              {value?.Label || ''}
            </Typography>
            <br />
            <Typography sx={{ fontWeight: 'bold' }}>Description:</Typography>
            <Typography>
              {value?.Description || ''}
            </Typography>
          </Box>) : ''
      } />
  );
};

const OCADataValidatorCheck = () => {
  const {
    schemaDataConformantRowData,
    setSchemaDataConformantRowData,
    schemaDataConformantHeader,
    setCurrentDataValidatorPage,
    ogWorkbook,
    jsonParsedFile,
    languages,
    lanAttributeRowData
  } = useContext(Context);

  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [revalidateData, setRevalidateData] = useState(false);
  const [type, setType] = useState(languages[0] || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorName, setErrorNameList] = useState([]);
  const [firstValidate, setFirstValidate] = useState(false);
  const gridRef = useRef();

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      flex: 1,
      minWidth: 100,
      tooltipComponent: CustomTooltip,
      headerComponent: (params) => flaggedHeader(params, lanAttributeRowData[type]),
    };
  }, [lanAttributeRowData, type]);

  const handleSave = async () => {
    const workbook = await generateDataEntryExcel();
    if (workbook !== null) {
      downloadExcelFile(workbook, 'DataEntryExcel.xlsx');
    }
  };

  const handleValidate = async () => {
    gridRef.current.api.showLoadingOverlay();
    setRevalidateData(false);
    setFirstValidate(true);
    const bundle = new OCABundle();
    await bundle.loadedBundle(jsonParsedFile);
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
            return {
              ...row,
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
        //set Timeout at least 1.5 seconds
        setTimeout(() => {
          gridRef.current.api.hideOverlay();
        }, 800);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const generateDataEntryExcel = async () => {
    try {
      const newWorkbook = await copyFirstTwoWorksheets(ogWorkbook);

      const schemaConformantDataNameWorksheet = newWorkbook.addWorksheet("Schema conformant data");
      makeHeaderRow(schemaDataConformantHeader, schemaConformantDataNameWorksheet, 20);
      const newData = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
      newData.forEach((row, index) => {
        schemaDataConformantHeader.forEach((header, headerIndex) => {
          schemaConformantDataNameWorksheet.getCell(index + 2, headerIndex + 1).value = isNaN(row[header]) ? row[header] : Number(row[header]);
        });
      });

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
    setType(e.target.value);
    setIsDropdownOpen(false);
  }, []);

  const handleAddRow = () => {
    const newRow = {};
    schemaDataConformantHeader.forEach((header) => {
      newRow[header] = "";
    });

    setRowData((prev) => [...prev, newRow]);
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

  useEffect(() => {
    const columns = [];

    if (schemaDataConformantHeader && schemaDataConformantHeader?.length > 0) {
      schemaDataConformantHeader.forEach((header) => {
        columns.push(
          {
            headerName: header,
            field: header,
            minWidth: 150,
            tooltipComponentParams: { color: '#F88379' },
            tooltipValueGetter: (params) => ({ value: params.value }),
          }
        );
      });
    }

    setColumnDefs(columns);
    setRowData(schemaDataConformantRowData);
  }, []);

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
              onClick={() => {
                setSchemaDataConformantRowData(gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
                setCurrentDataValidatorPage('StartDataValidator');
              }}
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
                  }}>Please re-validate the data!</Typography>}
                <Button
                  color='button'
                  variant='contained'
                  target='_blank'
                  style={{ width: '120px', height: '40px' }}
                  onClick={handleValidate}
                >
                  Validate
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
              <Languages type={type} handleChange={handleChange} handleClick={() => { }} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} languages={languages} />
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
    </>

  );
};

export default OCADataValidatorCheck;