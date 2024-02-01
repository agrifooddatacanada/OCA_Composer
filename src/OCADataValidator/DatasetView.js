import React, { useContext, useEffect, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box } from '@mui/material';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import { gridStyles, preWrapWordBreak } from '../constants/styles';

const DatasetView = () => {
  const gridRef = useRef(null);
  const {
    setCurrentDataValidatorPage,
    datasetRowData,
    datasetHeaders,
  } = useContext(Context);
  const [columnDefs, setColumnDefs] = useState([]);
  const [tableLength, setTableLength] = useState(0);

  useEffect(() => {
    const titles = [];
    let newTableLength = 0;
    datasetHeaders.forEach((header) => {
      titles.push({
        headerName: header,
        field: header,
        cellStyle: preWrapWordBreak,
        width: 100,
        resizable: true,
      });
      newTableLength += 100;
    });
    setTableLength(newTableLength);
    setColumnDefs(titles);
  }, [datasetHeaders]);

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => setCurrentDataValidatorPage('StartDataValidator')} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <div className="ag-theme-balham" style={{ width: tableLength, maxWidth: '90%' }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={datasetRowData}
            columnDefs={columnDefs}
            // defaultColDef={defaultColDef}
            domLayout="autoHeight"
          // onCellKeyDown={onCellKeyDown}
          // onCellClicked={() => setChosenTable(index)}
          />
        </div>

      </Box>
    </>
  );
};

export default DatasetView;