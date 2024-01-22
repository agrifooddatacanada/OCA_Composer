import { Box, Link } from '@mui/material';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Context } from '../App';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-balham.css';
import BackNextSkeleton from '../components/BackNextSkeleton';
import CellHeader from '../components/CellHeader';
import { gridStyles, preWrapWordBreak } from '../constants/styles';
import { greyCellStyle } from '../constants/styles';
import TypeTooltip from '../AttributeDetails/TypeTooltip';
import DeleteConfirmation from './DeleteConfirmation';
import { FormatRuleTypeRenderer, TrashCanButton } from './FormatRuleCellRender';
import Loading from '../components/Loading';

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: 'auto',
};

const FormatRulesV2 = () => {
  const {
    setCurrentPage,
    setSelectedOverlay,
    formatRuleRowData,
    characterEncodingRowData,
    setCharacterEncodingRowData,
    setOverlay,
    setFormatRuleRowData
  } = useContext(Context);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Add format rule for data": {
        ...prev["Add format rule for data"],
        selected: false,
      },
    }));

    // Delete attribute from characterEncodingRowData
    const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
      delete row['Add format rule for data'];
      return row;
    });

    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const attributeWithCharacterEncoding = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
    setFormatRuleRowData(attributeWithCharacterEncoding);
  };

  const columnDefs = useMemo(() => {
    return [
      {
        field: 'Attribute',
        editable: false,
        width: 180,
        cellStyle: () => allowOverflowStyle,
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
        cellRendererFramework: FormatRuleTypeRenderer,
        width: 200,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        }),
      },
      {
        headerName: '',
        field: 'Delete',
        cellRendererFramework: TrashCanButton,
        width: 60,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        }),
      }
    ];
  }, []);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={() => setShowDeleteConfirmation(true)} backText="Remove overlay">
      {loading && formatRuleRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: '2rem',
          gap: '3rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box className='ag-theme-balham' sx={{ width: 590 }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={formatRuleRowData}
            columnDefs={columnDefs}
            domLayout='autoHeight'
            suppressHorizontalScroll={true}
            rowHeight={50}
            onGridReady={onGridReady}
          />
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

export default FormatRulesV2;