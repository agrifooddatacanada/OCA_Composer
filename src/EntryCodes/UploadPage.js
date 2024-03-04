import React from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Button, FormControl, Select, Typography } from '@mui/material';
import Drop from '../StartSchema/Drop';
import useHandleEntryCodeDrop from './useHandleEntryCodeDrop';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
import { CustomPalette } from '../constants/customPalette';
import csvFileExample from '../assets/csv_example.png';

const UploadPage = () => {
  const {
    rawFile,
    setRawFile,
    loading,
    setLoadingState,
    dropDisabled,
    dropMessage,
    setDropMessage,
    handleClearUpload,
    tempEntryCodeRowData,
    tableLength,
    columnDefs,
    handleSave,
    gridRef,
    setCurrentPage,
    setChosenEntryCodeIndex,
    fileType,
    selectionValue,
    setSelectionValue,
    userSelectionListDropdown,
    attributeListDropdown,
    selectedAttrToCopy,
    setSelectedAttrToCopy
  } = useHandleEntryCodeDrop();

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={() => {
          setCurrentPage("Codes");
          setChosenEntryCodeIndex(-1);
        }}
        isForward={(selectionValue === "Copy from other entry codes" && selectedAttrToCopy !== "") || (selectionValue === "Upload" && rawFile?.length > 0)}
        pageForward={handleSave} />
      <FormControl variant="standard" sx={{
        minWidth: 120, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', pr: 10, pl: 11, marginTop: 2,
      }}>
        <Typography>Please choose the type: &nbsp;</Typography>
        <Select
          value={selectionValue}
          onChange={(e) => setSelectionValue(e.target.value)}
          displayEmpty
          sx={{
            minWidth: '100px'
          }}
        >
          {userSelectionListDropdown}
        </Select>
      </FormControl>
      {selectionValue === "Upload" ?
        (<Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
          <Drop
            setFile={setRawFile}
            setLoading={setLoadingState}
            loading={loading}
            dropDisabled={dropDisabled}
            dropMessage={dropMessage}
            setDropMessage={setDropMessage}
            tipDescription={null}
          />
          <Box display="flex">
            <Button
              variant="contained"
              color="button"
              onClick={handleClearUpload}
              sx={{ width: 230, mr: 2 }}
              disabled={!rawFile || rawFile?.length === 0}
            >
              Clear Entry Code File
            </Button>
          </Box>
          {rawFile?.length > 0 && fileType === 'csvORxls' ? (
            <Typography variant="h4" style={{ marginTop: "60px", color: CustomPalette.PRIMARY }}>
              Preview of the data
            </Typography>
          ) : fileType === 'json' ? (
            <Typography variant="h4" style={{ marginTop: "60px", color: "Gray", marginBottom: "4rem" }}>
              Please continue to the next page
            </Typography>
          ) : (
            <Typography variant="h4" style={{ marginTop: "60px", color: "Gray" }}>
              No table to display
            </Typography>
          )}
          {rawFile?.length > 0 && fileType === 'csvORxls' &&
            <div className="ag-theme-balham" style={{ width: tableLength, maxWidth: '90%', marginTop: "30px" }}>
              <style>{gridStyles}</style>
              <AgGridReact
                ref={gridRef}
                rowData={tempEntryCodeRowData}
                columnDefs={columnDefs}
                domLayout="autoHeight"
                defaultColDef={columnDefs}
              />
            </div>
          }
        </Box>)
        : (
          <FormControl variant="standard" sx={{
            minWidth: 120, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', pr: 10, pl: 11, marginTop: 2,
          }}>
            <Typography>Copy entry codes from: &nbsp;</Typography>
            <Select
              value={selectedAttrToCopy}
              onChange={(e) => setSelectedAttrToCopy(e.target.value)}
              displayEmpty
              sx={{
                minWidth: '100px'
              }}
            >
              {attributeListDropdown}
            </Select>
          </FormControl>)}
    </>
  );
};

export default UploadPage;