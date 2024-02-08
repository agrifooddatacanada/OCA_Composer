import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box } from '@mui/material';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import { gridStyles } from '../constants/styles';


const DatasetView = () => {
  const gridRef = useRef(null);
  const {
    setCurrentDataValidatorPage,
    datasetRowData,
    datasetHeaders,
    setDatasetRowData
  } = useContext(Context);

  const [columnDefs, setColumnDefs] = useState([]);
  const [tableLength, setTableLength] = useState(0);

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      cellDataType: false,
    };
  }, []);

  useEffect(() => {
    const titles = [];
    let newTableLength = 0;
    datasetHeaders.forEach((header) => {
      titles.push({
        headerName: header,
        field: header,
        width: 100,
        resizable: true,
        editable: true,
      });
      newTableLength += 100;
    });
    setTableLength(newTableLength);
    setColumnDefs(titles);
  }, [datasetHeaders]);

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => {
        setDatasetRowData(gridRef.current.api.getRenderedNodes()?.map(node => node?.data));
        setCurrentDataValidatorPage('StartDataValidator');
      }} />
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
            domLayout="autoHeight"
            defaultColDef={defaultColDef}
          />
        </div>
      </Box>
    </>
  );
};

export default DatasetView;