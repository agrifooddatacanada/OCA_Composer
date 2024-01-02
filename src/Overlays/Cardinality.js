import React, { useContext, useState, useEffect } from 'react';
import { Context } from '../App';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Divider, TextField, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'; // Import necessary components for the dialog/pop-up
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { gridStyles, preWrapWordBreak } from '../constants/styles';
import { CustomPalette } from "../constants/customPalette";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const Cardinality = () => {
  const {
    setCurrentPage,
    setSelectedOverlay,
    lanAttributeRowData,
    setCardinalityData,
    cardinalityData
  } = useContext(Context);

  const [selectedCellData, setSelectedCellData] = useState(null);
  const [exactValue, setExactValue] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [exact, setExact] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const handleForward = () => {
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  const handleCellClick = (params) => {
    if (params.colDef.field === 'EntryLimit' || params.colDef.field === 'Attribute' || params.colDef.field === 'Label') {
      const entryLimit = params?.data.EntryLimit;

      if (entryLimit !== null && entryLimit !== undefined) {
        if (entryLimit.includes('-')) {
          const [MIN, MAX] = entryLimit.split('-').map((value) => value.trim());
          setSelectedCellData(params?.data);
          setExactValue('');
          setMinValue(MIN);
          setMaxValue(MAX);
          setMin(MIN);
          setMax(MAX);
          setExact('');
          // setTest(true);

        } else {
          setSelectedCellData(params?.data);
          setExactValue(entryLimit);
          setMinValue('');
          setMaxValue('');
          setMin('');
          setMax('');
          setExact(entryLimit);
        }
      } else {
        setSelectedCellData(params?.data);
        setExactValue('');
        setMinValue('');
        setMaxValue('');
        setMin('');
        setMax('');
        setExact('');
      }
    }
  };

  const handleClearValues = (params) => {
    setCardinalityData((prevGridData) => {
      const updatedData = [...prevGridData];
      const index = updatedData.findIndex(
        (item) => item.Attribute === params?.data?.Attribute
      );
      if (index !== -1) {
        updatedData[index] = {
          ...updatedData[index],
          EntryLimit: '',
        };
      }
      return updatedData;
    });
    setExactValue('');
    setMinValue('');
    setMaxValue('');
    setMin('');
    setMax('');
    setExact('');
  };

  const trashCanButton = (params) => {

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
        }}
        onClick={() => {
          handleClearValues(params);
        }}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );

  };

  const handleValueChange = (value, type) => {
    switch (type) {
      case 'exact':
        setExactValue(value || '0');

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
  };

  const handleApplyValues = () => {
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


      setCardinalityData((prevGridData) => {
        const updatedData = [...prevGridData];
        const index = updatedData.findIndex(
          (item) => item.Attribute === selectedCellData.Attribute
        );
        if (index !== -1) {
          let entryLimitValue = '';
          if (minValue && maxValue) {
            entryLimitValue = `${minValue}-${maxValue}`;
          } else if (minValue) {
            entryLimitValue = `${minValue}-`;
          } else if (maxValue) {
            entryLimitValue = `-${maxValue}`;
          } else {
            entryLimitValue = exactValue || '0'; // Set '0' if all fields are empty
          }
          updatedData[index] = {
            ...updatedData[index],
            EntryLimit: entryLimitValue,
          };
        }
        return updatedData;
      });
      setMin(minValue);
      setMax(maxValue);
      setExact(exactValue);
      // setTest(true);


      if (minValue !== '' && maxValue !== '') {
        setExactValue('');
        setExact('');
      } else if (minValue === '' && maxValue === '' && exactValue === '') {
        setExactValue('0');
        setExact('0');
      } else if (minValue === '' && maxValue === '' && exactValue !== '') {
        setMinValue('');
        setMaxValue('');
        setMin('');
        setMax('');
      }

    }
  };

  const isNotInteger = (value) => {
    const stringValue = value;
    const num = +stringValue;
    return Number.isInteger(num);
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

    if (cardinalityData.length > 0) {
      for (const item of lanAttributeRowData?.[firstLanguage]) {
        const entity = cardinalityData?.find((row) => row.Attribute === item.Attribute);
        if (!entity) {
          cardinalityDataCopy.push({ ...item });
        } else {
          cardinalityDataCopy.push({ ...entity });
        }
      }
    } else {
      cardinalityDataCopy.push(...lanAttributeRowData?.[firstLanguage]);
    }
    setCardinalityData(cardinalityDataCopy);
  }, [lanAttributeRowData]);

  const gridOptions = {
    domLayout: 'autoHeight',
  };

  const columnDefs = [
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
      cellRendererFramework: trashCanButton,
      width: 100,
    },
  ];

  const onCellClick = (params) => {
    params.node.setSelected(true);
    handleCellClick(params);
  };

  return (
    <BackNextSkeleton isForward pageForward={handleForward}>
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
          <AgGridReact onCellClicked={onCellClick} rowData={cardinalityData} columnDefs={columnDefs} gridOptions={gridOptions} />
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box
          style={{
            width: '50%',
            maxWidth: '660px',
            height: '300px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            position: 'relative',
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
                  backgroundColor: min || max ? '#f2f2f2' : 'white',
                }}
                disabled={min || max}
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
                    backgroundColor: exact ? '#f2f2f2' : 'white',
                  }}
                  disabled={exact}
                />
                <TextField
                  label="Maximum"
                  variant="outlined"
                  fullWidth
                  value={maxValue}
                  onChange={(e) => handleValueChange(e.target.value, 'max')}
                  style={{
                    backgroundColor: exact ? '#f2f2f2' : 'white',
                  }}
                  disabled={exact}
                />
              </Box>

              {/* <Box sx={{ marginTop: '10px', position: 'relative' }}>
                <button onClick={handleApplyValues}>Apply</button>
              </Box> */}
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
          <Button onClick={() => { setOpenDialog(false); handleClearValues(); }}>OK</Button>
        </DialogActions>
      </Dialog>

    </BackNextSkeleton>
  );
};

export default Cardinality;