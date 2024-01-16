import React, { useContext, useState, useEffect, useCallback, useMemo, useRef, memo, forwardRef } from 'react';
import { Context } from '../App';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Divider, TextField, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'; // Import necessary components for the dialog/pop-up
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { gridStyles, preWrapWordBreak } from '../constants/styles';
import { CustomPalette } from "../constants/customPalette";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Loading from '../components/Loading';
import DeleteConfirmation from './DeleteConfirmation';

const gridOptions = {
  domLayout: 'autoHeight',
};

const TrashCanButton = memo(
  forwardRef((props, ref) => {
    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
        }}
        disabled={props.node.data?.EntryLimit === ''}
        onClick={() => props?.handleDeleteRow()}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );
  }));

const Cardinality = () => {
  const {
    setCurrentPage,
    setSelectedOverlay,
    lanAttributeRowData,
    setCardinalityData,
    cardinalityData,
    setOverlay
  } = useContext(Context);
  const cardinalityRef = useRef();
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [exactValue, setExactValue] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const handleSave = useCallback(() => {
    cardinalityRef.current.api.stopEditing();
    const newCardinalityData = cardinalityRef.current.api.getRenderedNodes()?.map(node => node?.data);
    setCardinalityData(newCardinalityData);
  }, [setCardinalityData]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  }, [handleSave, setCurrentPage, setSelectedOverlay]);

  const handleCellClick = useCallback((params) => {
    const entryLimit = params?.data.EntryLimit;
    const selectedDataToSave = { ...params?.data, rowIndex: params?.rowIndex };

    if (entryLimit !== null && entryLimit !== undefined && params.colDef.field !== 'Delete') {
      if (entryLimit.includes('-')) {
        const [MIN, MAX] = entryLimit.split('-').map((value) => value.trim());
        setSelectedCellData(selectedDataToSave);
        setExactValue('');
        setMinValue(MIN);
        setMaxValue(MAX);
      } else {
        setSelectedCellData(selectedDataToSave);
        setExactValue(entryLimit);
        setMinValue('');
        setMaxValue('');
      }
    } else {
      setSelectedCellData(selectedDataToSave);
      setExactValue('');
      setMinValue('');
      setMaxValue('');
    }
  }, []);

  const handleDeleteRow = useCallback((params) => {
    setSelectedCellData({ ...params?.data, rowIndex: params?.rowIndex });
    params.node.updateData({
      ...params.node.data,
      EntryLimit: '',
    });
    cardinalityRef.current.api.redrawRows({ rowNodes: [params.node] });
    setExactValue('');
    setMinValue('');
    setMaxValue('');
  }, []);

  const handleValueChange = useCallback((value, type) => {
    switch (type) {
      case 'exact':
        setExactValue(value || '');
        break;
      case 'min':
        setMinValue(value);
        break;
      case 'max':
        setMaxValue(value);
        break;
      default:
        break;
    }
  }, []);

  const isNotInteger = useCallback((value) => {
    const stringValue = value;
    const num = +stringValue;
    return Number.isInteger(num);
  }, []);

  const handleApplyValues = useCallback(() => {
    if (selectedCellData) {
      try {
        if (minValue !== '' && maxValue !== '' && parseFloat(minValue) >= parseFloat(maxValue)) {
          setDialogMessage('The minimum value must be less than the maximum value');
          setOpenDialog(true);
          return;
        }

        if (exactValue < 0 || minValue < 0 || maxValue < 0) {
          setDialogMessage('All entries must be positive integers');
          setOpenDialog(true);
          return;
        }

        if (isNotInteger(exactValue) === false || isNotInteger(minValue) === false || isNotInteger(maxValue) === false) {
          setDialogMessage('All entries must be positive integers');
          setOpenDialog(true);
          return;
        }

      } catch (error) {
        setDialogMessage('All entries must be valid integers');
        setOpenDialog(true);
        return;
      }

      const getRowToUpdate = cardinalityRef.current.api.getRowNode(selectedCellData.rowIndex);
      getRowToUpdate.setData({ ...selectedCellData, EntryLimit: exactValue || `${minValue}-${maxValue}` });
      if (minValue !== '' && maxValue !== '') {
        setExactValue('');
      } else if (minValue === '' && maxValue === '' && exactValue === '') {
        setExactValue('0');
      } else if (minValue === '' && maxValue === '' && exactValue !== '') {
        setMinValue('');
        setMaxValue('');
      }
    }
  }, [exactValue, isNotInteger, maxValue, minValue, selectedCellData]);

  const onCellClick = useCallback((params) => {
    params.node.setSelected(true);
    handleCellClick(params);
  }, [handleCellClick]);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const columnDefs = useMemo(() => [
    {
      headerName: 'Attribute',
      field: 'Attribute',
      width: 160,
      autoHeight: true,
      cellStyle: () => preWrapWordBreak,
    },
    {
      headerName: 'Label',
      field: 'Label',
      width: 200,
      autoHeight: true,
      cellStyle: () => preWrapWordBreak,
    },
    {
      headerName: 'Entry Limit',
      field: 'EntryLimit',
      width: 120,
      autoHeight: true,
      onCellClicked: handleCellClick,
    },
    {
      headerName: '',
      field: 'Delete',
      cellRendererFramework: TrashCanButton,
      cellRendererParams: (params) => ({
        handleDeleteRow: () => handleDeleteRow(params)
      }),
      width: 100,
    },
  ], [handleCellClick, handleDeleteRow]);

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Cardinality": {
        ...prev["Cardinality"],
        selected: false,
      },
    }));

    const newCardinalityData = cardinalityData.map((row) => ({
      ...row,
      EntryLimit: '',
    }));

    setCardinalityData(newCardinalityData);
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  useEffect(() => {
    // const flattenedData = Object.values(lanAttributeRowData).flatMap((languageData) =>
    //   languageData.map((row) => ({
    //     Attribute: row.Attribute,
    //     Label: row.Label,
    //     EntryLimit: row.EntryLimit,
    //   }))
    // );
    const firstLanguage = Object.keys(lanAttributeRowData)?.[0];
    const cardinalityDataCopy = [];

    for (const item of lanAttributeRowData?.[firstLanguage]) {
      const entity = cardinalityData?.find((row) => row.Attribute === item.Attribute);
      if (!entity) {
        cardinalityDataCopy.push({
          Attribute: item?.Attribute,
          Label: item?.Label,
          EntryLimit: '',
        });
      } else {
        cardinalityDataCopy.push({ ...entity });
      }
    }
    setCardinalityData(cardinalityDataCopy);
  }, [lanAttributeRowData]);

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={() => setShowDeleteConfirmation(true)} backText="Remove overlay">
      {loading && cardinalityData.length > 40 && <Loading />}
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
          flexDirection: 'row',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <Box className="ag-theme-balham" sx={{ width: '50%', height: '100%', maxWidth: '580px' }}>
          <style>{gridStyles}</style>
          <AgGridReact ref={cardinalityRef} onCellClicked={onCellClick} rowData={cardinalityData} columnDefs={columnDefs} gridOptions={gridOptions} onGridReady={onGridReady} />
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box
          sx={{
            width: '50%',
            maxWidth: '660px',
            height: '300px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            position: 'sticky',
            top: '2rem',
            alignSelf: 'flex-start',
          }}
        >
          {selectedCellData && (
            <>
              <TextField
                label="Exact"
                variant="outlined"
                value={exactValue}
                onChange={(e) => handleValueChange(e.target.value, 'exact')}
                style={{
                  marginBottom: '10px',
                  backgroundColor: minValue || maxValue ? '#f2f2f2' : 'white',
                }}
                disabled={minValue || maxValue}
              />
              <Typography variant="h6" align="center" style={{ marginBottom: '10px' }}>
                or
              </Typography>
              <Box sx={{ display: 'flex', gap: '10px' }}>
                <TextField
                  label="Minimum"
                  variant="outlined"
                  fullWidth
                  value={minValue}
                  onChange={(e) => handleValueChange(e.target.value, 'min')}
                  style={{
                    backgroundColor: exactValue ? '#f2f2f2' : 'white',
                  }}
                  disabled={exactValue}
                />
                <TextField
                  label="Maximum"
                  variant="outlined"
                  fullWidth
                  value={maxValue}
                  onChange={(e) => handleValueChange(e.target.value, 'max')}
                  style={{
                    backgroundColor: exactValue ? '#f2f2f2' : 'white',
                  }}
                  disabled={exactValue}
                />
              </Box>
              <Button
                variant='contained'
                color='navButton'
                onClick={handleApplyValues}
                sx={{
                  backgroundColor: CustomPalette.PRIMARY,
                  ':hover': { backgroundColor: CustomPalette.SECONDARY },
                  width: '100%',
                  maxWidth: '100px',
                  marginTop: '35px',
                }}
              >
                Apply
              </Button>
              <Typography style={{ marginTop: '20px', color: 'red' }}>NOTE: Please leave blank to not specify a min or max value</Typography>
            </>
          )}
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>

    </BackNextSkeleton>
  );
};

export default Cardinality;