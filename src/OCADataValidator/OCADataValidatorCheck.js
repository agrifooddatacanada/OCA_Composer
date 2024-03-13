import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Button, Typography } from '@mui/material';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
import '../App.css';
import { Context } from '../App';
import ExcelJS from 'exceljs';

const CustomTooltip = (props) => {
  // const data = useMemo(
  //   () => props.api.getDisplayedRowAtIndex(props.rowIndex).data,
  //   []
  // );

  const error = props.data?.error?.[props.colDef.field] || [];
  return (
    <>
      {error.length > 0 ?
        (<div className="custom-tooltip" style={{ backgroundColor: props.color || '#999', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <p style={{ marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold' }}>Error(s)</span>
          </p>
          {error.map((err, index) => {
            return (
              <p key={index + err} style={{ marginBottom: '5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>Error {index + 1}: </span><span>{err}</span>
              </p>
            );

          })}
        </div>)
        : <p></p>}
    </>
  );
};

const OCADataValidatorCheck = () => {
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const {
    dataSchemaRowData,
    dataSchemaHeaders,
    setCurrentDataValidatorPage,
    ogWorkbook
  } = useContext(Context);
  console.log('dataSchemaRowData', dataSchemaRowData);
  console.log('dataSchemaHeaders', dataSchemaHeaders);
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


  useEffect(() => {
    const columns = [];

    dataSchemaHeaders.forEach((header) => {
      columns.push(
        {
          headerName: header,
          field: header,
          minWidth: 150,
          tooltipField: header,
          tooltipComponentParams: { color: '#F88379' },
          cellStyle: (params) => {
            const error = params.data?.error?.[params.colDef.field] || [];
            if (error.length > 0) {
              return { backgroundColor: "#ffd7e9" };
            }
          }
        }
      );
    });

    const tempError = [
      { [dataSchemaHeaders[0]]: ['Format Error 1', 'Entry Error 2'], [dataSchemaHeaders[1]]: ['AAA Error 1', 'EEEE Error 4', 'BBBB Error 5'], [dataSchemaHeaders[2]]: ['Error 1', ' Format Error 2'], [dataSchemaHeaders[3]]: ['Error 123'] },
      { [dataSchemaHeaders[2]]: ['Error 1', ' Format Error 2'], [dataSchemaHeaders[3]]: ['Error 1', 'Format Error 4', 'AAA Error 5'] },
    ];

    const newDataSetRowData = [];
    dataSchemaRowData.forEach((row, index) => {
      newDataSetRowData.push({
        ...row,
        error: tempError?.[index] || {},
      });
    });

    setColumnDefs(columns);
    setRowData(newDataSetRowData);
  }, []);

  const handleSave = () => {
    console.log('gridRef.current.api.getRenderedNodes()?.map(node => node?.data)', gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
  };

  const handleValidate = () => {
    setRevalidateData(false);
    generateDataEntryExcel();
  };

  const generateDataEntryExcel = async () => {
    const newWorkbook = await copyFirstWorksheet(ogWorkbook);


  };

  const copyFirstWorksheet = async (workbook) => {
    const firstSheetName = "Schema Description";
    const worksheet = workbook?.Sheets?.[firstSheetName];
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet(firstSheetName);

    // Copy all cells from the original worksheet to the new worksheet
    Object.keys(worksheet).forEach((cell) => {
      if (!worksheet[cell]?.v || cell === '!ref') return;
      newWorksheet.getCell(cell).value = worksheet[cell]?.v;
    });

    return newWorkbook;
  };

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => { setCurrentDataValidatorPage('StartDataValidator'); }} isForward pageForward={() => handleSave()} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
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



// ----------------------------------------------------------

// import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
// import BackNextSkeleton from '../components/BackNextSkeleton';
// import { Box, Button, Typography } from '@mui/material';
// import { gridStyles } from '../constants/styles';
// import { AgGridReact } from 'ag-grid-react';
// import '../App.css';
// import { Context } from '../App';

// const CustomTooltip = (props) => {
//   // const data = useMemo(
//   //   () => props.api.getDisplayedRowAtIndex(props.rowIndex).data,
//   //   []
//   // );

//   return (
//     <div className="custom-tooltip" style={{ backgroundColor: props.color || '#999', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
//       <p style={{ marginBottom: '5px' }}>
//         <span style={{ fontWeight: 'bold' }}>Error(s)</span>
//       </p>
//       <p style={{ marginBottom: '5px', textAlign: 'left' }}>
//         <span style={{ fontWeight: 'bold' }}>Error 1: </span><span>...details</span>
//       </p>
//       <p style={{ textAlign: 'left' }}>
//         <span style={{ fontWeight: 'bold' }}>Error 2: </span><span>..details</span>
//       </p>
//     </div>
//   );
// };

// const DataCellRenderer = (props) => {

//   const handleChange = (e) => {
//     props.node.updateData({
//       ...props.node.data,
//       // FormatText: e.target.value,
//     });
//   };

//   return (
//     <Box onChange={handleChange}>{props.value.slice(1)}</Box>
//   );
// };


// const OCADataValidatorCheck = () => {
//   const [rowData, setRowData] = useState([]);
//   const [columnDefs, setColumnDefs] = useState([]);
//   const { matchingRowData, datasetRowData, setCurrentDataValidatorPage } = useContext(Context);
//   const [revalidateData, setRevalidateData] = useState(false);
//   const gridRef = useRef();

//   // const columnDefs = useMemo(() => {
//   //   return [
//   //     {
//   //       field: 'athlete',
//   //       minWidth: 150,
//   //       tooltipField: 'athlete',
//   //       tooltipComponentParams: { color: '#F88379' },
//   //       cellStyle: (params) => {
//   //         if (params.data.country !== "United States") {
//   //           return { backgroundColor: "#ffd7e9" };
//   //         }
//   //       }
//   //     },
//   //     {
//   //       field: 'age',
//   //       cellStyle: (params) => {
//   //         if (params.data.age > 23) {
//   //           return { backgroundColor: "#ffd7e9" };
//   //         }
//   //       }
//   //     },
//   //     { field: 'country', minWidth: 130, tooltipField: 'country' },
//   //     { field: 'year' },
//   //     { field: 'date' },
//   //     { field: 'sport' },
//   //     { field: 'gold' },
//   //     { field: 'silver' },
//   //     { field: 'bronze' },
//   //     { field: 'total' },
//   //   ];
//   // }, []);

//   const defaultColDef = useMemo(() => {
//     return {
//       editable: true,
//       flex: 1,
//       minWidth: 100,
//       // filter: true,
//       tooltipComponent: CustomTooltip,
//     };
//   }, []);

//   // const onGridReady = useCallback((params) => {
//   //   fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
//   //     .then((resp) => resp.json())
//   //     .then((data) => {
//   //       setRowData(data.slice(0, 10));
//   //     });
//   // }, []);

//   useEffect(() => {
//     const columns = [];
//     matchingRowData.forEach((row, index) => {
//       columns.push(
//         {
//           headerName: row.Attribute,
//           field: row.Dataset,
//           minWidth: 150,
//           tooltipField: row.Attribute === "d" ? row.Dataset : '',
//           tooltipComponentParams: { color: '#F88379' },
//           cellRenderer: DataCellRenderer,
//           cellStyle: (params) => {
//             if (params.data?.["animal_id"] === "3140" && row.Attribute === "d") {
//               return { backgroundColor: "#ffd7e9" };
//             }
//           }
//         }
//       );

//     });
//     setColumnDefs(columns);
//     setRowData(datasetRowData);
//   }, []);

//   const handleSave = () => {
//     console.log('gridRef.current.api.getRenderedNodes()?.map(node => node?.data)', gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
//   };

//   return (
//     <>
//       <BackNextSkeleton isBack pageBack={() => { setCurrentDataValidatorPage('AttributeMatchDataValidator'); }} isForward pageForward={() => handleSave()} />
//       <Box sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         flex: 1,
//       }}>
//         <Box
//           sx={{
//             display: 'flex',
//             flexDirection: 'row',
//           }}
//         >
//           <Button
//             color='button'
//             variant='contained'
//             target='_blank'
//             style={{ marginLeft: "2rem", marginTop: "2rem", width: '120px', }}

//             onClick={() => { setRevalidateData(false); }}
//           >
//             Validate
//           </Button>
//           {revalidateData &&
//             <Typography sx={{
//               marginLeft: "2rem",
//               marginTop: "2.3rem",
//               color: 'red',
//               fontWeight: 'bold',
//             }}>Please re-validate the data!</Typography>}
//         </Box>

//         <div style={{ margin: "2rem" }}>
//           <div
//             className="ag-theme-balham"
//           >
//             <style>{gridStyles}</style>
//             <AgGridReact
//               ref={gridRef}
//               rowData={rowData}
//               columnDefs={columnDefs}
//               defaultColDef={defaultColDef}
//               tooltipShowDelay={0}
//               tooltipHideDelay={2000}
//               onCellValueChanged={(e) => {
//                 console.log('e', e.node.updateData(
//                   {
//                     ...e.data,
//                     [e.colDef.field]: e.newValue,
//                   }
//                 ));
//                 console.log('e.data', e.data);
//                 console.log('e.colDef.field', e.colDef.field);
//                 console.log('e.newValue', e.newValue);
//                 setRevalidateData(true);
//               }}
//               domLayout="autoHeight"
//             // onGridReady={onGridReady}
//             />
//           </div>
//         </div>
//       </Box >
//     </>
//   );
// };

// export default OCADataValidatorCheck;