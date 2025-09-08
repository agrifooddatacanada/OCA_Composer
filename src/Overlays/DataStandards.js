import React, { useContext, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import CellHeader from "../components/CellHeader";
import DataStandardAutocompleteEditor from "./DataStandards/DataStandardAutocompleteEditor";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";

const DataStandards = () => {
  const {
    setCurrentPage,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);
  
  // Use simplified schema data hook
  // Use MultiSchema context with standard pattern
  const { activeSchemaId, editingSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId || editingSchemaId;
  const schemaState = getSchemaState(currentSchemaId);
  
  const updateCurrentSchema = useCallback((updates) => {
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, updates);
    }
  }, [currentSchemaId, updateSchemaState]);
  
  // Always get data from schema state - no fallback needed
  const dataStandardsRowData = useMemo(() => 
    schemaState?.dataStandardsData || []
  , [schemaState?.dataStandardsData]);
  
  const setDataStandardsRowData = useCallback((newData) => {
    updateCurrentSchema({
      dataStandardsData: newData
    });
  }, [updateCurrentSchema]);
  
  const { t } = useTranslation();
  const gridRef = useRef();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Data Standards": {
        ...prev["Data Standards"],
        selected: false,
      },
    }));

    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const rowData = gridRef.current.api.getRenderedNodes()?.map((rowNode) => rowNode?.data);
    setDataStandardsRowData(rowData);
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleBack = () => {
    setShowDeleteConfirmation(true);
  };

  const onGridReady = () => {
    setLoading(false);
  };

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
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box>
        <Box className='ag-theme-balham' sx={{ width: 430 }}>
          <style>{gridStyles}</style>
          <AgGridReact
          ref={gridRef}
          rowData={dataStandardsRowData} 
          columnDefs={columnDefs} 
          domLayout="autoHeight"
          stopEditingWhenCellsLoseFocus
          onGridReady={onGridReady}
          />
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default DataStandards;
