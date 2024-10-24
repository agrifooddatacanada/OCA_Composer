import React from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box, Button, FormControl, Select, Typography } from '@mui/material';
import Drop from '../StartSchema/Drop';
import useHandleEntryCodeDrop from './useHandleEntryCodeDrop';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
import { CustomPalette } from '../constants/customPalette';
import csvFileExample from '../assets/csv_example.png';
import { useTranslation } from 'react-i18next';

const UploadPage = () => {
  const { t } = useTranslation();
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
        <Typography>{t('Please choose the type:')} &nbsp;</Typography>
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
          paddingBottom: '3rem',
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
            description={t("Click here to select a .csv file or schema bundle, or drag and drop one here.")}
            noteDescription={t("Note: Your .csv file contains a list of entry codes. You can also include language labels for each entry code in adjacent columns")}
            version={5}
          />
          <Box display="flex">
            <Button
              variant="contained"
              color="button"
              onClick={handleClearUpload}
              sx={{ width: 230, mr: 2 }}
              disabled={!rawFile || rawFile?.length === 0}
            >
              {t('Clear Entry Code File')}
            </Button>
          </Box>
          {rawFile?.length > 0 && fileType === 'csvORxls' ? (
            <Typography variant="h4" style={{ marginTop: "60px", color: CustomPalette.PRIMARY }}>
              {t('Preview of the data')}
            </Typography>
          ) : fileType === 'json' ? (
            <Typography variant="h4" style={{ marginTop: "60px", color: "Gray", marginBottom: "4rem" }}>
              {t('Please continue to the next page')}
            </Typography>
          ) : (
            <>
              <Typography variant="h5" style={{ marginTop: "50px" }}>
                {t('CSV Example:')}
              </Typography>
              <img src={csvFileExample} alt="CSV example" style={{ marginTop: "10px", marginBottom: "30px", height: "300px" }} />
            </>
          )}
          {rawFile?.length > 0 && fileType === 'csvORxls' &&
            <div className="ag-theme-balham" style={{ width: tableLength, maxWidth: '90%', marginTop: "30px", height: "45vh" }}>
              <style>{gridStyles}</style>
              <AgGridReact
                ref={gridRef}
                rowData={tempEntryCodeRowData}
                columnDefs={columnDefs}
                defaultColDef={columnDefs}
                suppressFieldDotNotation={true}
              />
            </div>
          }
        </Box>)
        : (
          <FormControl variant="standard" sx={{
            minWidth: 120, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', pr: 10, pl: 11, marginTop: 2,
          }}>
            <Typography>{t('Copy entry codes from:')} &nbsp;</Typography>
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