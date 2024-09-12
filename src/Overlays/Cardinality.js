import React, { useContext, useState, useEffect, useCallback, useMemo, useRef, memo, forwardRef } from 'react';
import { Context } from '../App';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Divider, TextField, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip } from '@mui/material'; // Import necessary components for the dialog/pop-up
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { gridStyles, preWrapWordBreak } from '../constants/styles';
import { CustomPalette } from "../constants/customPalette";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Loading from '../components/Loading';
import DeleteConfirmation from './DeleteConfirmation';
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CellHeader from '../components/CellHeader';
import '../App.css';
import { useTranslation } from 'react-i18next';

const gridOptions = {
  domLayout: 'autoHeight',
};

const TrashCanButton = memo(
  forwardRef((props, ref) => {
    return (
      <>
        {props.node.data?.Type.includes("Array") &&
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
        }</>
    );
  }));

const Cardinality = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    lanAttributeRowData,
    attributeRowData,
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
    if (params.data.Type.includes("Array")) {
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
    } else {
      setSelectedCellData(null);
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
          setDialogMessage(t('The minimum value must be less than the maximum value'));
          setOpenDialog(true);
          return;
        }

        if (exactValue < 0 || minValue < 0 || maxValue < 0) {
          setDialogMessage(t('All entries must be positive integers'));
          setOpenDialog(true);
          return;
        }

        if (isNotInteger(exactValue) === false || isNotInteger(minValue) === false || isNotInteger(maxValue) === false) {
          setDialogMessage(t('All entries must be positive integers'));
          setOpenDialog(true);
          return;
        }

      } catch (error) {
        setDialogMessage(t('All entries must be valid integers'));
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
  }, [exactValue, isNotInteger, maxValue, minValue, selectedCellData, t]);



  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const columnDefs = useMemo(() => [
    {
      field: 'Attribute',
      width: 160,
      autoHeight: true,
      cellStyle: () => preWrapWordBreak,
      headerComponent: () => <CellHeader headerText={t('Attributes')} helpText={t('This is the name for the attribute and, for example...')} />,
    },
    {
      field: 'Label',
      width: 200,
      autoHeight: true,
      cellStyle: () => preWrapWordBreak,
      headerComponent: () => <CellHeader headerText={t('Label')} helpText={t('This is the language specific label for an attribute')} />,
    },
    {
      headerName: t('Entry Limit'),
      field: 'EntryLimit',
      width: 140,
      autoHeight: true,
      headerComponent: () => <CellHeader headerText={t('Entry Limit')} helpText={t('Applies only to array DatatTypes. Describes the number of occurrences of an element')} />,
    },
    {
      headerName: 'Garbage',
      field: 'Delete',
      cellRendererFramework: TrashCanButton,
      cellRendererParams: (params) => ({
        handleDeleteRow: () => handleDeleteRow(params)
      }),
      width: 100,
      headerComponent: () => <CellHeader headerText={t('Garbage')} helpText={t('Remove the Entry Limit rule')} />,
    },
  ], [handleCellClick, handleDeleteRow, t]);

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
      const typeAttribute = attributeRowData?.find((row) => row.Attribute === item.Attribute);
      cardinalityDataCopy.push({
        Attribute: item?.Attribute,
        Label: item?.Label,
        EntryLimit: entity && entity?.Type === typeAttribute?.Type && entity?.Attribute === typeAttribute?.Attribute ? entity.EntryLimit : '',
        Type: typeAttribute?.Type,
      });
    }

    setCardinalityData(cardinalityDataCopy);
  }, [lanAttributeRowData, attributeRowData]);

  const rowClassRules = useMemo(() => {
    return {
      'rag-grey-outer': function(params) {
        return !params.data.Type.includes("Array");
      },
    };
  }, []);;

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={() => setShowDeleteConfirmation(true)} backText="Remove overlay">
      {loading && cardinalityData?.length > 40 && <Loading />}
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
        <Box className="ag-theme-balham" sx={{ width: '50%', height: '100%', maxWidth: '600px' }}>
          <Typography sx={{
            textAlign: 'start',
            marginBottom: '14px',
          }}>{t('Entry limits can only be created for attributes with an array DataType')}</Typography>
          <style>{gridStyles}</style>
          <AgGridReact ref={cardinalityRef} rowClassRules={rowClassRules} onCellClicked={handleCellClick} rowData={cardinalityData} columnDefs={columnDefs} gridOptions={gridOptions} onGridReady={onGridReady} />
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
              <Box>

                <TextField
                  label={t("Exact")}
                  variant="outlined"
                  value={exactValue}
                  onChange={(e) => handleValueChange(e.target.value, 'exact')}
                  style={{
                    marginBottom: '10px',
                    backgroundColor: minValue || maxValue ? '#f2f2f2' : 'white',
                  }}
                  disabled={minValue || maxValue}
                />
                <Tooltip
                  title={t("For each attribute you can specify the exact, minimum or maximum ...")}
                  placement="top"
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 18, color: "#ccc", marginLeft: '10px', marginTop: '5px' }} />
                </Tooltip>
              </Box>
              <Typography variant="h6" align="center" style={{ marginBottom: '10px' }}>
                or
              </Typography>
              <Box sx={{ display: 'flex', gap: '10px' }}>
                <TextField
                  label={t("Minimum")}
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
                  label={t("Maximum")}
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
                {t('Apply')}
              </Button>
              <Typography style={{ marginTop: '20px', color: 'red' }}>{t('NOTE: Please leave blank to not specify a min or max value')}</Typography>
            </>
          )}
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{t('Error')}</DialogTitle>
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