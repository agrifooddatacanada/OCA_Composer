import { Box, Button } from "@mui/material";
import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import "ag-grid-community/styles/ag-theme-balham.css";
import useCharacterEncodingType, {
  CharacterEncodingTypeRenderer
} from "./useCharacterEncodingType";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import CustomPalette from "../constants/customPalette";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";

const CharacterEncoding = () => {
  const { t } = useTranslation();
  const { setCurrentPage } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    activeSchemaId, 
    editingSchemaId, 
    getSchemaState, 
    updateSchemaState,
    updateOverlaySelection,
    setSelectedOverlay
  } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId || editingSchemaId;
  const schemaState = getSchemaState(currentSchemaId);
  
  const updateCurrentSchema = useCallback((updates) => {
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, updates);
    }
  }, [currentSchemaId, updateSchemaState]);
  
  // Get character encoding data, initialize with attributes if empty
  const characterEncodingRowData = useMemo(() => {
    const existing = schemaState?.characterEncodingData;
    if (existing && existing.length > 0) {
      return existing;
    }
    
    // Initialize with current schema attributes if no data exists
    const attributes = schemaState?.attributes || [];
    return attributes.map((attr) => ({
      Attribute: attr.Attribute,
      "Character Encoding": "utf-8" // default encoding
    }));
  }, [schemaState?.characterEncodingData, schemaState?.attributes]);
  
  // Always update schema state - no dual logic needed
  const setCharacterEncodingRowData = useCallback((newData) => {
    updateCurrentSchema({
      characterEncodingData: newData
    });
  }, [updateCurrentSchema]);
  
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const gridRef = useRef();
  const { handleSave, applyAllFunc } = useCharacterEncodingType(gridRef, characterEncodingRowData, setCharacterEncodingRowData);

  const columnDefs = useMemo(() => [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: () => (
          <CellHeader
            headerText={t("Attributes")}
            helpText="This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language."
          />
        )
      },
      {
        field: "Character Encoding",
        headerComponent: () => (
          <CellHeader
            headerText={t("Character Encoding")}
            helpText="Character encoding of the data for each attribute. Sometimes data is encoded in a specific character encoding which can be recorded here."
          />
        ),
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute
        }),
        width: 200
      }
    ], [t]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay(currentSchemaId, "");
    setCurrentPage("Overlays");
  }, [handleSave, setCurrentPage, setSelectedOverlay, currentSchemaId]);

  const handleDeleteCurrentOverlay = useCallback(() => {
    updateOverlaySelection(currentSchemaId, "Character Encoding", { selected: false });
    setCurrentPage("Overlays");
  }, [updateOverlaySelection, currentSchemaId, setCurrentPage]);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
    >
      {loading && characterEncodingRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box style={{ display: "flex" }}>
          <Box className="ag-theme-balham" sx={{ width: 380 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={characterEncodingRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              onGridReady={onGridReady}
            />
          </Box>
          <Box
            sx={{
              width: 70,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start"
            }}
          >
            <Box sx={{ height: "2.2rem" }} key={0} />
            <Button
              color="navButton"
              sx={{
                ml: 1,
                width: "130px",
                height: "1.7rem",
                color: CustomPalette.PRIMARY
              }}
              onClick={applyAllFunc}
            >
              {t("Apply All")}
            </Button>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default CharacterEncoding;
