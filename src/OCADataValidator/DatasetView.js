import React, { forwardRef, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, IconButton, Typography } from '@mui/material';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import { greyCellStyle, gridStyles } from '../constants/styles';
import { CustomPalette } from '../constants/customPalette';
import { useTranslation } from 'react-i18next';
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export const TrashCanButton = memo(
  forwardRef((props, ref) => {
    const onClick = useCallback(() => {
      props.delete();
    }, [props]);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          display: props.node.data?.FormatText === "" ? "none" : "block",
        }}
        onClick={onClick}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );
  })
);

const DatasetView = () => {
  const { t } = useTranslation();
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

    schemaTitles.push(
      {
        headerName: '',
        field: 'Delete',
        cellRendererFramework: TrashCanButton,
        width: 50,
        cellRendererParams: (params) => ({
          delete: () => {
            schemaGridRef.current.api.applyTransaction({
              remove: [params.node.data],
            });
            schemaGridRef.current.api.redrawRows();
          }
        }),
        pinned: 'right',
        cellStyle: () => greyCellStyle,
      }
    );

    setSchemaTableLength(newSchemaTableLength);
    setSchemaColumnDefs(schemaTitles);
  }, [schemaDataConformantHeader]);

  return (
    <>
      <BackNextSkeleton isForward pageForward={() => {
        const result = [];
        schemaGridRef.current?.api.forEachNode(node => {
          const existingKeys = Object.keys(node?.data);
          const newData = { ...node?.data };
          schemaDataConformantHeader.forEach(header => {
            if (!existingKeys.includes(header)) {
              newData[header] = '';
            }
          });
          result.push(newData);
        });

        setSchemaDataConformantRowData(result);
        setCurrentDataValidatorPage('StartDataValidator');
      }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <Typography variant="h5" sx={{ mb: 2, color: CustomPalette.PRIMARY, fontWeight: 500 }}>{t('Schema Data')}</Typography>
        {schemaDataConformantHeader && schemaDataConformantHeader?.length > 0 ?
          <div className="ag-theme-balham" style={{ width: schemaTableLength, maxWidth: '90%', height: "45vh" }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={schemaGridRef}
              rowData={schemaDataConformantRowData}
              columnDefs={schemaColumnDefs}
              defaultColDef={defaultColDef}
              suppressFieldDotNotation={true}
            />
          </div>
          : <Typography>{t('No Schema Conformant Data')}</Typography>}
      </Box>
    </>
  );
};

export default DatasetView;