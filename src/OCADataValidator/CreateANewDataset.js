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
  const [schemaTableLength, setSchemaTableLength] = useState(0);

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
    let newSchemaTableLength = 0;
    setSchemaDataConformantHeader(attributesList);
    setColumnDefs(attributesList.map(attribute => {
      newSchemaTableLength += 150;
      return ({ headerName: attribute, field: attribute, width: 150 });
    }));
    setRowData(prev => {
      const newRow = {};
      if (schemaDataConformantRowData.length === 0) {
        attributesList.forEach(attribute => newRow[attribute] = '');
        return [newRow];
      }
      return schemaDataConformantRowData;
    });
    setSchemaTableLength(newSchemaTableLength);
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
        alignItems: 'center',
      }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'start',
            justifyContent: 'start',
            flex: 1,
          }}>
          <Box sx={{ margin: "2rem" }}>
            <div className="ag-theme-balham" style={{ width: schemaTableLength }}>
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

      </Box>
    </>
  );
};

export default CreateANewDataset;