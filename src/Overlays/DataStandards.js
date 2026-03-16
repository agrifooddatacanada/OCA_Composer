import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import DataStandardAutocompleteEditor from "./DataStandards/DataStandardAutocompleteEditor";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";
import { FIELD_DATA_STANDARDS_OVERLAY } from "../constants/constants";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { useOverlayGridOnGridReady } from "./gridUtils";

const DataStandards = () => {
  const {
    setCurrentPage,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    getSchema, 
    updateSchema,
    updateOverlaySelection
  } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_DATA_STANDARDS_OVERLAY);
  
  // Always get data from schema state - no fallback needed
  const dataStandardsRowData = useMemo(() => 
    schemaState?.dataStandardsData || []
  , [schemaState?.dataStandardsData]);
  
  const { t } = useTranslation();
  const gridRef = useRef();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);



  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const rowData = gridRef.current.api.getRenderedNodes()?.map((rowNode) => rowNode?.data);
    updateSchema({dataStandardsData: rowData});
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
        const rowData = gridRef.current.api.getRenderedNodes()?.map((rowNode) => rowNode?.data);
        if (rowData && rowData.length > 0) {
          updateSchema({dataStandardsData: rowData});
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const handleBack = () => {
    setShowDeleteConfirmation(true);
  };

  const onGridReady = useOverlayGridOnGridReady(setLoading);

  const columnDefs = useMemo(() => [
      {
        field: "Attribute",
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: () => <CellHeader headerText={t("Attributes")} helpText='This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language.' />,
      },
      {
        field: "DataStandard",
        headerComponent: () => <CellHeader headerText={t("Data Standard")} helpText='This is the data standard that the values of an attribute should follow' />,
        cellRenderer: DataStandardAutocompleteEditor,
        flex: 1
      }
    ], [t]);

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={handleBack} backText="Remove overlay">
      {loading && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box sx={{ mb: BETWEEN_SECTION_SPACING }}>
        <Box className='ag-theme-balham' sx={{ width: 430 }}>
          <style>{gridStyles}</style>
          <AgGridReact
          ref={gridRef}
          rowData={dataStandardsRowData} 
          columnDefs={columnDefs} 
          domLayout="autoHeight"
          stopEditingWhenCellsLoseFocus
          onGridReady={onGridReady}
          overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
          />
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default DataStandards;
