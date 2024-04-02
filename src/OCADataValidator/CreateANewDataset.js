import React, { createRef, useContext, useEffect, useMemo, useState } from 'react';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import { Box, Button } from '@mui/material';
import { gridStyles } from '../constants/styles';
import BackNextSkeleton from '../components/BackNextSkeleton';
import AddCircleIcon from "@mui/icons-material/AddCircle";

const CreateANewDataset = () => {
  const { schemaDataConformantRowData, setSchemaDataConformantRowData, setSchemaDataConformantHeader, attributesList, setCurrentDataValidatorPage } = useContext(Context);
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = createRef();

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      cellDataType: false,
    };
  }, []);

  const onCellValueChanged = (e) => {
    e.node.updateData(
      {
        ...e.data,
        [e.colDef.field]: e.newValue,
      }
    );
  };

  const handleAddRow = () => {
    const newRow = {};
    attributesList.forEach((header) => {
      newRow[header] = "";
    });
    const currentData = gridRef.current.api.getRenderedNodes().map((node) => node.data);
    setRowData((prev) => {
      return [...currentData, newRow];
    });
  };

  useEffect(() => {
    setSchemaDataConformantHeader(attributesList);
    setColumnDefs(attributesList.map(attribute => ({ headerName: attribute, field: attribute })));
    setRowData(prev => {
      const newRow = {};
      if (schemaDataConformantRowData.length === 0) {
        attributesList.forEach(attribute => newRow[attribute] = '');
        return [newRow];
      }
      return schemaDataConformantRowData;
    });
  }, [attributesList]);

  return (
    <>
      <BackNextSkeleton isBack pageBack={() => {
        setCurrentDataValidatorPage('StartDataValidator');
        const newData = gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data);
        setSchemaDataConformantRowData(newData);
      }} isForward pageForward={() => {
        const newData = gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data);
        setSchemaDataConformantRowData(newData);
        setCurrentDataValidatorPage('OCADataValidatorCheck');
      }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <Box sx={{ margin: "2rem" }}>
          <div className="ag-theme-balham" style={{ width: '100%' }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              defaultColDef={defaultColDef}
              onCellValueChanged={onCellValueChanged}
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
        </Box>
      </Box>
    </>
  );
};

export default CreateANewDataset;