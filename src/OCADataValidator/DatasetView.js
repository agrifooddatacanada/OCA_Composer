import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Typography } from '@mui/material';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import { gridStyles } from '../constants/styles';
import { CustomPalette } from '../constants/customPalette';


const DatasetView = () => {
  const schemaGridRef = useRef(null);
  const {
    setCurrentDataValidatorPage,
    schemaDataConformantHeader,
    schemaDataConformantRowData,
    setSchemaDataConformantRowData
  } = useContext(Context);

  const [schemaColumnDefs, setSchemaColumnDefs] = useState([]);
  const [schemaTableLength, setSchemaTableLength] = useState(0);

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      cellDataType: false,
    };
  }, []);

  useEffect(() => {
    const schemaTitles = [];
    let newSchemaTableLength = 0;

    if (schemaDataConformantHeader && schemaDataConformantHeader?.length > 0) {
      schemaDataConformantHeader.forEach((header) => {
        schemaTitles.push({
          headerName: header,
          field: header,
          width: 100,
          resizable: true,
          editable: true,
        });
        newSchemaTableLength += 100;
      });
    }

    setSchemaTableLength(newSchemaTableLength);
    setSchemaColumnDefs(schemaTitles);
  }, [schemaDataConformantHeader]);

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => {
        setSchemaDataConformantRowData(schemaGridRef.current?.api.getRenderedNodes()?.map(node => node?.data));
        setCurrentDataValidatorPage('StartDataValidator');
      }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <Typography variant="h5" sx={{ mb: 2, mt: 6, color: CustomPalette.PRIMARY, fontWeight: 500 }}>Schema Data</Typography>
        {schemaDataConformantHeader && schemaDataConformantHeader?.length > 0 ?
          <div className="ag-theme-balham" style={{ width: schemaTableLength, maxWidth: '90%' }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={schemaGridRef}
              rowData={schemaDataConformantRowData}
              columnDefs={schemaColumnDefs}
              domLayout="autoHeight"
              defaultColDef={defaultColDef}
            />
          </div>
          : <Typography>No Schema Conformant Data</Typography>}
      </Box>
    </>
  );
};

export default DatasetView;