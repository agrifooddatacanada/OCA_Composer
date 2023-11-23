import { Box, Link } from '@mui/material';
import React, { useContext, useMemo, useRef, useState } from 'react';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-balham.css';
import BackNextSkeleton from '../components/BackNextSkeleton';
import CellHeader from '../components/CellHeader';
import { gridStyles, preWrapWordBreak } from '../constants/styles';
import { greyCellStyle } from '../constants/styles';
import TypeTooltip from '../AttributeDetails/TypeTooltip';
import useFormatTextType from './useFormatTextType';

const FormatRules = () => {
  const { attributeRowData, setCurrentPage, setSelectedOverlay, formatRuleRowData } =
    useContext(Context);

  const gridRef = useRef();
  const { handleSave, FormatRuleTypeRenderer, buttonArray } =
    useFormatTextType(gridRef);

  const columnDefs = useMemo(() => {
    return [
      {
        field: 'Attribute',
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: () => (
          <CellHeader
            headerText='Attribute'
            helpText='This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language.'
          />
        ),
      },
      {
        field: 'Type',
        editable: false,
        width: 150,
        autoHeight: true,
        cellStyle: () => greyCellStyle,
        headerComponent: () => (
          <CellHeader headerText='Type' helpText={<TypeTooltip />} />
        ),
      },
      {
        field: 'FormatRule',
        headerComponent: () => (
          <CellHeader headerText='Format Rule' helpText='Placeholder text' />
        ),
        cellRenderer: FormatRuleTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute,
        }),
        width: 200,
      },
    ];
  }, [formatRuleRowData]);

  const handleForward = () => {
    handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  return (
    <BackNextSkeleton isForward pageForward={handleForward}>
      <Box
        sx={{
          margin: '2rem',
          gap: '3rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box style={{ display: 'flex' }}>
          <Box className='ag-theme-balham' sx={{ width: 530 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={attributeRowData}
              columnDefs={columnDefs}
              domLayout='autoHeight'
            />
          </Box>
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              {buttonArray}
            </Box>
          </Box>
        </Box>
        <Box>
          Email {' '}
          <Link
            to='#'
            onClick={(e) => {
              window.location.href = `mailto:adc@uoguelph.ca`;
              e.preventDefault();
            }}
          >
            adc@uoguelph.ca
          </Link>{' '}
          to request a new format rule to be added to the list.
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default FormatRules;
