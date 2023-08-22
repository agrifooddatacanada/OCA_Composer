import React, { useContext } from 'react';
import { Context } from '../App';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Box } from '@mui/material';
import { gridStyles } from '../constants/styles';

const RequiredEntries = () => {
  const { characterEncodingRowData, setCurrentPage, setSelectedOverlay } = useContext(Context);

  const handleBackward = () => {
    // handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  return (
    <BackNextSkeleton isForward pageForward={handleBackward}>
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="ag-theme-balham" style={{ width: 380 }}>
          <style>{gridStyles}</style>
          {/* <AgGridReact
            ref={gridRef}
            rowData={characterEncodingRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
          /> */}
        </div>
      </Box>
    </BackNextSkeleton>
  );
};

export default RequiredEntries;