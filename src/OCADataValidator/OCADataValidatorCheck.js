import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
import '../App.css';
import { Context } from '../App';
import ExcelJS from 'exceljs';
import OCABundle from './validator';
import OCADataSet from './utils/files';
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

const CustomTooltip = (props) => {
  const error = props.data?.error?.[props.colDef.field] || "";

  return (
    <>
      {error.length > 0 ?
        (<div className="custom-tooltip" style={{ backgroundColor: props.color || '#999', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <p style={{ marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold' }}>Error</span>
          </p>
          <p style={{ marginBottom: '5px', textAlign: 'left' }}>
            {error}
          </p>
        </div>)
        : <p></p>}
    </>
  );
};

const OCADataValidatorCheck = () => {
  const {
    schemaDataConformantRowData,
    schemaDataConformantHeader,
    setCurrentDataValidatorPage,
    ogWorkbook,
    jsonParsedFile
  } = useContext(Context);
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [revalidateData, setRevalidateData] = useState(false);
  const gridRef = useRef();

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      flex: 1,
      minWidth: 100,
      tooltipComponent: CustomTooltip,
    };
  }, []);

  const cellStyle = (params) => {
    const error = params.data?.error?.[params.colDef.field] || [];
    if (error.length > 0) {
      return { backgroundColor: "#ffd7e9" };
    }
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
            tooltipField: header,
            tooltipComponentParams: { color: '#F88379' },
            cellStyle
          }
        );
      });
    }

    setColumnDefs(columns);
    setRowData(schemaDataConformantRowData);
  }, []);

  const handleSave = async () => {
    console.log('gridRef.current.api.getRenderedNodes()?.map(node => node?.data)', gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
    const workbook = await generateDataEntryExcel();
    if (workbook !== null) {
      downloadExcelFile(workbook, 'DataEntryExcel.xlsx');
    }
  };

  const handleValidate = async () => {
    gridRef.current.api.showLoadingOverlay();
    setRevalidateData(false);
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
                copy.push(header);
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

  return (
    <>
      {/* <BackNextSkeleton isBack pageBack={() => { setCurrentDataValidatorPage('StartDataValidator'); }} isForward pageForward={handleSave} /> */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "auto",
            pr: 10,
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
              onClick={() => setCurrentDataValidatorPage('StartDataValidator')}
            >
              <ArrowBackIosIcon /> Back
            </Button>
            <Button
              color="button"
              variant='contained'
              onClick={handleSave}
              sx={{
                alignSelf: "flex-end",
                display: "flex",
                justifyContent: "space-around",
                padding: "0.5rem 1rem",
              }}
            // disabled={exportDisabled}
            >
              Export Validate Data
            </Button>
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
            }}
          >
            <Button
              color='button'
              variant='contained'
              target='_blank'
              style={{ marginLeft: "2rem", marginTop: "2rem", width: '120px' }}
              onClick={handleValidate}
            >
              Validate
            </Button>
            {revalidateData &&
              <Typography sx={{
                marginLeft: "2rem",
                marginTop: "2.3rem",
                color: 'red',
                fontWeight: 'bold',
              }}>Please re-validate the data!</Typography>}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: "2.3rem", marginRight: "2rem" }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: "#ededed", marginRight: '15px' }}></div>
            <span>Unmatched Attributes</span>
          </Box>

        </Box>


        <div style={{ margin: "2rem" }}>
          <div
            className="ag-theme-balham"
          >
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              overlayLoadingTemplate={
                '<div aria-live="polite" aria-atomic="true" style="height:100px; width:100px; background: url(https://ag-grid.com/images/ag-grid-loading-spinner.svg) center / contain no-repeat; margin: 0 auto;" aria-label="loading"></div>'
              }
              tooltipShowDelay={0}
              tooltipHideDelay={2000}
              onCellValueChanged={(e) => {
                e.node.updateData(
                  {
                    ...e.data,
                    [e.colDef.field]: e.newValue,
                  }
                );
                setRevalidateData(true);
              }}
              domLayout="autoHeight"
              suppressRowHoverHighlight={true}
            />
          </div>
        </div>
      </Box >
    </>

  );
};

export default OCADataValidatorCheck;