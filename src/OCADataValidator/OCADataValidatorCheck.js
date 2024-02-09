import React, { useCallback, useMemo, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Button } from '@mui/material';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
import '../App.css';

const CustomTooltip = (props) => {
  const data = useMemo(
    () => props.api.getDisplayedRowAtIndex(props.rowIndex).data,
    []
  );

  return (
    <div className="custom-tooltip" style={{ backgroundColor: props.color || '#999', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
      <p style={{ marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>{data.athlete}</span>
      </p>
      <p style={{ marginBottom: '5px', textAlign: 'left' }}>
        <span style={{ fontWeight: 'bold' }}>Country: </span><span>{data.country}</span>
      </p>
      <p style={{ textAlign: 'left' }}>
        <span style={{ fontWeight: 'bold' }}>Total: </span><span>{data.total}</span>
      </p>
    </div>
  );
};


const OCADataValidatorCheck = () => {
  const [rowData, setRowData] = useState();

  const columnDefs = useMemo(() => {
    return [
      {
        field: 'athlete',
        minWidth: 150,
        tooltipField: 'athlete',
        tooltipComponentParams: { color: '#F88379' },
        cellStyle: (params) => {
          console.log('params', params.data);
          if (params.data.country !== "United States") {
            return { backgroundColor: "#ffd7e9" };
          }
        }
      },
      {
        field: 'age',
        cellStyle: (params) => {
          console.log('params', params.data);
          if (params.data.age > 23) {
            return { backgroundColor: "#ffd7e9" };
          }
        }
      },
      { field: 'country', minWidth: 130, tooltipField: 'country' },
      { field: 'year' },
      { field: 'date' },
      { field: 'sport' },
      { field: 'gold' },
      { field: 'silver' },
      { field: 'bronze' },
      { field: 'total' },
    ];
  }, []);

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      flex: 1,
      minWidth: 100,
      // filter: true,
      tooltipComponent: CustomTooltip,
    };
  }, []);

  const onGridReady = useCallback((params) => {
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
      .then((resp) => resp.json())
      .then((data) => {
        setRowData(data.slice(0, 10));
      });
  }, []);
  return (
    <>
      <BackNextSkeleton isBack pageBack={() => { }} isForward pageForward={() => { }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <Button
          color='button'
          variant='contained'
          target='_blank'
          style={{ marginLeft: "2rem", marginTop: "2rem", width: '120px', }}

          onClick={() => { }
          }
        >
          Validate
        </Button>
        <div style={{ margin: "2rem" }}>
          <div
            className="ag-theme-balham"
          >
            <style>{gridStyles}</style>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              tooltipShowDelay={0}
              tooltipHideDelay={2000}
              domLayout="autoHeight"
              onGridReady={onGridReady}
            />
          </div>
        </div>
      </Box >
    </>
  );
};

export default OCADataValidatorCheck;