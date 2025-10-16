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
import { CustomPalette } from "../constants/customPalette";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";

const CharacterEncoding = () => {
  const { t } = useTranslation();
  const { setCurrentPage } = useContext(Context);

  // Use MultiSchema context with standard pattern
  const {
    currentSchemaId,
    getSchemaState,
    updateSchemaState,
    updateOverlaySelection,
    setSelectedOverlay
  } = useMultiSchema();
  const schemaState = getSchemaState(currentSchemaId);

  const updateCurrentSchema = useCallback(
    (updates) => {
      if (currentSchemaId) {
        updateSchemaState(currentSchemaId, updates);
      }
    },
    [currentSchemaId, updateSchemaState]
  );

  // Get character encoding data, initialize with attributes if empty
  const characterEncodingRowData = useMemo(() => {
    const characterEncodingOverlay = schemaState?.overlays?.character_encoding?.attribute_character_encoding || {};
    const attributes = schemaState?.attributes || [];
    
    // Convert overlay data to UI format or initialize with attributes if empty
    if (Object.keys(characterEncodingOverlay).length > 0) {
      return attributes.map((attr) => ({
        Attribute: attr.Attribute,
        "Character Encoding": characterEncodingOverlay[attr.Attribute] || "utf-8"
      }));
    }

    // Initialize with current schema attributes if no overlay data exists
    return attributes.map((attr) => ({
      Attribute: attr.Attribute,
      "Character Encoding": "utf-8" // default encoding
    }));
  }, [schemaState?.overlays?.character_encoding, schemaState?.attributes]);

  // Update the overlay data directly instead of duplicate array
  const setCharacterEncodingRowData = useCallback(
    (newData) => {
      // Transform UI data back to overlay format
      const attribute_character_encoding = {};
      newData.forEach(row => {
        if (row.Attribute && row["Character Encoding"]) {
          attribute_character_encoding[row.Attribute] = row["Character Encoding"];
        }
      });

      // Update the overlay directly
      const currentOverlays = schemaState?.overlays || {};
      const updatedOverlays = {
        ...currentOverlays,
        character_encoding: {
          ...currentOverlays.character_encoding,
          attribute_character_encoding
        }
      };

      updateCurrentSchema({ overlays: updatedOverlays });
    },
    [updateCurrentSchema, schemaState?.overlays]
  );

  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const gridRef = useRef();
  const { handleSave, applyAllFunc } = useCharacterEncodingType(
    gridRef,
    characterEncodingRowData,
    setCharacterEncodingRowData
  );

  // Define header components as functions, not JSX elements
  const AttributeHeaderComponent = () => (
    <CellHeader
      headerText={t("Attributes")}
      helpText="This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language."
    />
  );

  const CharacterEncodingHeaderComponent = () => (
    <CellHeader
      headerText={t("Character Encoding")}
      helpText="Character encoding of the data for each attribute. Sometimes data is encoded in a specific character encoding which can be recorded here."
    />
  );

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: AttributeHeaderComponent
      },
      {
        field: "Character Encoding",
        headerComponent: CharacterEncodingHeaderComponent,
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute
        }),
        width: 200
      }
    ],
    [t, AttributeHeaderComponent, CharacterEncodingHeaderComponent]
  );

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
