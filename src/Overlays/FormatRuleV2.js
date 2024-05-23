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
import { useTranslation } from 'react-i18next';

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: 'auto',
};

const FormatRulesV2 = () => {
  const { t } = useTranslation();
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
            headerText={t('Attributes')}
            helpText={t('This is the name for the attribute and, for example...')}
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
          <CellHeader headerText={t('Type')} helpText={<TypeTooltip />} />
        ),
      },
      {
        field: 'FormatRule',
        headerComponent: () => (
          <CellHeader headerText={t('Format Rule')} helpText={t('Select the formatting rule that applies to data for each attribute')} />
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
          alignItems: 'center',
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
        <Box sx={{
          width: '80%',
        }}>
          {t('All format rules are documented in the')} {' '}
          <Link
            to='#'
            onClick={(e) => {
              window.location.href = `https://github.com/agrifooddatacanada/format_options`;
              e.preventDefault();
            }}
          >
            {t('format GitHub repository')}
          </Link>.{' '}{t('Request a new format to be added by')} {' '}
          <Link
            to='#'
            onClick={(e) => {
              window.location.href = `https://github.com/agrifooddatacanada/format_options/issues`;
              e.preventDefault();
            }}
          >
            {t('raising an issue in the repository')}
          </Link>
          {' '} {t('or email us at')} {' '}
          <Link
            to='#'
            onClick={(e) => {
              window.location.href = `mailto:adc@uoguelph.ca`;
              e.preventDefault();
            }}
          >
            adc@uoguelph.ca
          </Link>.
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default FormatRulesV2;